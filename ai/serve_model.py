"""
Modal serverless GPU endpoint — Sohojatra fine-tuned analyzer.

Deploy (from repo root):
    modal deploy ai/serve_model.py

After deploying, Modal prints the public URL. Copy it to MODAL_API_URL in .env:
    MODAL_API_URL=https://<app>--sohojatra-analyzer-predict.modal.run

Secrets needed in Modal dashboard (modal.com → Secrets):
    Create a secret named "huggingface-secret" with key HF_TOKEN=<your_hf_token>

Request format (POST to the URL above):
    {"text": "<civic concern text>", "task": "urgency"}   → {"urgency_level": "critical"}
    {"text": "<civic concern text>", "task": "emotion"}   → {"emotions": ["frustration", "fear"]}
"""

from __future__ import annotations

import json
import modal

# ── Config ────────────────────────────────────────────────────────────────────
# Replace with your HuggingFace username after pushing the adapter from Kaggle
HF_REPO_ID  = "Emon3412/sohojatra-lora"
# Use the standard (non-pre-quantized) base — we apply BitsAndBytesConfig ourselves
BASE_MODEL  = "Qwen/Qwen2.5-3B-Instruct"

SYSTEM_PROMPT = (
    "You are an AI assistant for the Sohojatra civic platform. "
    "You classify Bangla and Bilingual civic concern texts. "
    "Always reply with valid JSON only — no extra text."
)

# ── Modal image ───────────────────────────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "torch==2.5.1",
        "transformers>=4.46.0",
        "peft>=0.13.0",
        "accelerate>=1.3.0",
        "bitsandbytes>=0.44.0",
        "sentencepiece",
        "huggingface_hub>=0.26.0",
    )
)

app = modal.App("sohojatra-analyzer")

# ── Inference class (model loaded once per container, reused across requests) ─
@app.cls(
    image=image,
    gpu="T4",
    secrets=[modal.Secret.from_name("huggingface-secret")],
    scaledown_window=300,
)
@modal.concurrent(max_inputs=8)
class SohojatraAnalyzer:
    @modal.enter()
    def load_model(self):
        import os
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        from peft import PeftModel
        from huggingface_hub import login

        from transformers import BitsAndBytesConfig

        login(token=os.environ["HF_TOKEN"])

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.bfloat16,
        )

        self.tokenizer = AutoTokenizer.from_pretrained(HF_REPO_ID)
        base = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=bnb_config,
            device_map="auto",
        )
        self.model = PeftModel.from_pretrained(base, HF_REPO_ID)
        self.model.eval()
        self._torch = torch

    def _generate(self, messages: list[dict]) -> str:
        torch = self._torch
        inputs = self.tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
            return_dict=True,
        ).to("cuda")

        with torch.no_grad():
            out = self.model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_new_tokens=128,
                do_sample=False,
            )
        return self.tokenizer.decode(
            out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True
        )

    @modal.fastapi_endpoint(method="POST")
    def predict(self, item: dict) -> dict:
        text = item.get("text", "")
        task = item.get("task", "urgency")

        if not text:
            return {"error": "text field is required"}

        if task == "urgency":
            user_content = (
                f"নিচের নাগরিক অভিযোগ বিশ্লেষণ করুন এবং urgency level নির্ধারণ করুন "
                f"(critical / moderate / low):\n\n\"{text}\""
            )
        else:
            user_content = (
                f"নিচের নাগরিক পোস্টে কোন কোন আবেগ (emotion) প্রকাশ পাচ্ছে?\n\n\"{text}\""
            )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_content},
        ]

        try:
            raw = self._generate(messages)
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw": raw, "error": "model output was not valid JSON"}
        except Exception as exc:
            return {"error": str(exc)}
