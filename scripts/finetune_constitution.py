"""
Fine-tune Llama-3.2-3B-Instruct on the Bangladesh Constitution (`data/bd-constitution.json`)
using Unsloth + LoRA. Produces a LoRA adapter + GGUF/Ollama modelfile suitable for
serving through an Ollama sidecar or through Groq-compatible OSS deployments.

The Groq Cloud API is used for low-latency *serving* (see `lib/sohojatra/groq.ts`);
this script produces the *fine-tuned weights* that encode the constitution so the
served model answers rights questions from parametric memory as well as RAG context.

Run on a Colab / Kaggle / RunPod GPU:

    pip install -q unsloth
    pip install -q --force-reinstall --no-cache-dir --no-deps \
        git+https://github.com/unslothai/unsloth.git
    python scripts/finetune_constitution.py \
        --constitution data/bd-constitution.json \
        --output outputs/sohojatra-rights-lora
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Iterable

import torch
from datasets import Dataset
from transformers import TrainingArguments
from trl import SFTTrainer
from unsloth import FastLanguageModel, is_bfloat16_supported
from unsloth.chat_templates import get_chat_template


# ---------------------------------------------------------------------------
# Data preparation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are the Sohojatra Rights Assistant, a Bangla-first civic advisor that "
    "grounds every answer in the Constitution of the People's Republic of "
    "Bangladesh. Always cite the article number and title. If the question is "
    "outside the Constitution, say so and point the citizen to the correct forum."
)


def load_articles(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    articles = payload.get("articles", payload)
    if not isinstance(articles, list):
        raise ValueError(f"Unexpected JSON shape in {path}")
    return articles


def synthetic_questions(article: dict) -> Iterable[str]:
    """Generate a small spread of instruction prompts per article."""
    title = article.get("title", "").strip()
    number = article.get("number", "").strip()
    yield f"What does Article {number} of the Bangladesh Constitution say?"
    yield f"Explain the right protected by Article {number} ({title})."
    yield f"In plain language, what does '{title}' mean for a Bangladeshi citizen?"
    yield f"Article {number} ke bolche? Banglay bujhiye din."  # Bangla transliteration
    yield f"Which Article of the Constitution covers '{title}'?"


def build_examples(articles: list[dict]) -> list[dict]:
    examples: list[dict] = []
    for article in articles:
        number = article.get("number", "").strip()
        title = article.get("title", "").strip()
        part = article.get("part", "").strip()
        text = article.get("text", "").strip()
        if not number or not text:
            continue
        response = (
            f"Article {number} — {title} ({part}):\n\n{text}\n\n"
            f"Citation: Article {number}, Constitution of Bangladesh."
        )
        for instruction in synthetic_questions(article):
            examples.append({"instruction": instruction, "response": response})
    return examples


# ---------------------------------------------------------------------------
# Chat-template formatting (Llama 3.1 template per the Unsloth sample)
# ---------------------------------------------------------------------------


def format_dataset(examples: list[dict], tokenizer) -> Dataset:
    def to_text(batch):
        texts = []
        for instruction, response in zip(batch["instruction"], batch["response"]):
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": instruction},
                {"role": "assistant", "content": response},
            ]
            texts.append(
                tokenizer.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=False
                )
                + tokenizer.eos_token
            )
        return {"text": texts}

    ds = Dataset.from_list(examples)
    return ds.map(to_text, batched=True, remove_columns=ds.column_names)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--constitution", type=Path, default=Path("data/bd-constitution.json"))
    parser.add_argument("--output", type=Path, default=Path("outputs/sohojatra-rights-lora"))
    parser.add_argument("--model", default="unsloth/Llama-3.2-3B-Instruct")
    parser.add_argument("--max-seq-length", type=int, default=2048)
    parser.add_argument("--max-steps", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--load-in-4bit", action="store_true", default=True)
    parser.add_argument("--push-to-hub", default=None, help="Optional HF repo id")
    parser.add_argument("--gguf", action="store_true", help="Also export GGUF + Ollama modelfile")
    args = parser.parse_args()

    print(f"Loading {args.model} (4-bit={args.load_in_4bit}) ...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq_length,
        dtype=None,  # auto: bf16 on Ampere+, fp16 otherwise
        load_in_4bit=args.load_in_4bit,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
        use_rslora=False,
        loftq_config=None,
    )

    tokenizer = get_chat_template(tokenizer, chat_template="llama-3.1")

    print(f"Loading constitution from {args.constitution} ...")
    articles = load_articles(args.constitution)
    examples = build_examples(articles)
    print(f"Built {len(examples)} instruction/response pairs from {len(articles)} articles.")

    train_ds = format_dataset(examples, tokenizer)

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_ds,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            warmup_steps=5,
            max_steps=args.max_steps,
            learning_rate=args.lr,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir=str(args.output / "checkpoints"),
            report_to="none",
        ),
    )

    trainer.train()

    args.output.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(args.output))
    tokenizer.save_pretrained(str(args.output))
    print(f"LoRA adapter saved to {args.output}")

    # Quick inference sanity-check
    FastLanguageModel.for_inference(model)
    sample = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "Can I be detained without being told the reason for my arrest?"},
    ]
    inputs = tokenizer.apply_chat_template(
        sample, tokenize=True, add_generation_prompt=True, return_tensors="pt"
    ).to("cuda" if torch.cuda.is_available() else "cpu")
    out = model.generate(input_ids=inputs, max_new_tokens=512, use_cache=True,
                        temperature=0.7, min_p=0.1)
    print("=== Sample ===")
    print(tokenizer.batch_decode(out)[0])

    if args.push_to_hub:
        model.push_to_hub(args.push_to_hub, private=True)
        tokenizer.push_to_hub(args.push_to_hub, private=True)

    if args.gguf:
        # Export merged GGUF for Ollama / llama.cpp serving
        model.save_pretrained_gguf(
            str(args.output / "gguf"),
            tokenizer,
            quantization_method="q4_k_m",
        )
        modelfile_path = args.output / "Modelfile"
        modelfile_path.write_text(getattr(tokenizer, "_ollama_modelfile", ""), encoding="utf-8")
        print(f"GGUF + Ollama Modelfile written to {args.output}")


if __name__ == "__main__":
    main()
