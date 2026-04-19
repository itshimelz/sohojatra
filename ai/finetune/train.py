"""
train.py — Fine-tune Qwen2.5-3B-Instruct on Sohojatra civic classification data.

Requirements  : GPU with ≥ 15 GB VRAM (e.g. Google Colab T4 / A100, RunPod T4)
Base model    : unsloth/Qwen2.5-3B-Instruct-bnb-4bit  (4-bit quantised, fits on T4)
Method        : LoRA (r=16, alpha=32) via Unsloth + TRL SFTTrainer
Output        : finetune/output/  (LoRA adapter + tokenizer)

Steps before running:
  1. pip install -r requirements_finetune.txt
  2. python prepare_dataset.py --csv ../../Sohojatra_Survey_Responses_FULL.csv
  3. python train.py [--epochs 3] [--output output/]
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

# ── CLI args ──────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--base_model", default="unsloth/Qwen2.5-3B-Instruct-bnb-4bit")
parser.add_argument("--train_file",  default="data/train.jsonl")
parser.add_argument("--val_file",    default="data/val.jsonl")
parser.add_argument("--output",      default="output/")
parser.add_argument("--epochs",      type=int,   default=3)
parser.add_argument("--batch_size",  type=int,   default=2)
parser.add_argument("--grad_accum",  type=int,   default=4)
parser.add_argument("--lr",          type=float, default=2e-4)
parser.add_argument("--max_seq_len", type=int,   default=1024)
parser.add_argument("--lora_r",      type=int,   default=16)
parser.add_argument("--lora_alpha",  type=int,   default=32)
args = parser.parse_args()

# ── Imports (GPU required beyond this point) ──────────────────────────────────
print("Loading Unsloth…")
from unsloth import FastLanguageModel
from datasets import Dataset
from trl import SFTTrainer, SFTConfig
import torch

# ── Model + LoRA ──────────────────────────────────────────────────────────────
print(f"Loading base model: {args.base_model}")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name     = args.base_model,
    max_seq_length = args.max_seq_len,
    dtype          = None,          # auto-detect (bf16 on Ampere+, fp16 on T4)
    load_in_4bit   = True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r              = args.lora_r,
    lora_alpha     = args.lora_alpha,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_dropout   = 0.05,
    bias           = "none",
    use_gradient_checkpointing = "unsloth",
    random_state   = 42,
)

# ── Dataset ───────────────────────────────────────────────────────────────────
def load_jsonl(path: str) -> list[dict]:
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                examples.append(json.loads(line))
    return examples


def format_chat(example: dict) -> dict:
    """Convert messages list → single 'text' string in ChatML format."""
    text = tokenizer.apply_chat_template(
        example["messages"],
        tokenize         = False,
        add_generation_prompt = False,
    )
    return {"text": text}


print("Loading dataset…")
train_raw = load_jsonl(args.train_file)
val_raw   = load_jsonl(args.val_file)

train_ds = Dataset.from_list(train_raw).map(format_chat, remove_columns=["task", "messages"])
val_ds   = Dataset.from_list(val_raw).map(format_chat,   remove_columns=["task", "messages"])

print(f"Train: {len(train_ds)} examples | Val: {len(val_ds)} examples")

# ── Trainer ───────────────────────────────────────────────────────────────────
output_dir = Path(args.output)
output_dir.mkdir(parents=True, exist_ok=True)

sft_config = SFTConfig(
    output_dir              = str(output_dir),
    num_train_epochs        = args.epochs,
    per_device_train_batch_size = args.batch_size,
    gradient_accumulation_steps = args.grad_accum,
    learning_rate           = args.lr,
    lr_scheduler_type       = "cosine",
    warmup_ratio            = 0.05,
    fp16                    = not torch.cuda.is_bf16_supported(),
    bf16                    = torch.cuda.is_bf16_supported(),
    logging_steps           = 10,
    eval_strategy           = "epoch",
    save_strategy           = "epoch",
    load_best_model_at_end  = True,
    metric_for_best_model   = "eval_loss",
    save_total_limit        = 2,
    max_seq_length          = args.max_seq_len,
    dataset_text_field      = "text",
    packing                 = True,       # pack short sequences → faster training
    report_to               = "none",
)

trainer = SFTTrainer(
    model        = model,
    tokenizer    = tokenizer,
    train_dataset = train_ds,
    eval_dataset  = val_ds,
    args          = sft_config,
)

# ── Train ─────────────────────────────────────────────────────────────────────
print("Starting training…")
trainer_stats = trainer.train()
print(f"\nTraining done. Loss: {trainer_stats.training_loss:.4f}")

# ── Save adapter ──────────────────────────────────────────────────────────────
adapter_path = output_dir / "lora_adapter"
model.save_pretrained(str(adapter_path))
tokenizer.save_pretrained(str(adapter_path))
print(f"\nLoRA adapter saved → {adapter_path}")

# ── Optional: merge + save as GGUF for Ollama ─────────────────────────────────
merge_path = output_dir / "merged_gguf"
print(f"\nMerging weights and saving GGUF → {merge_path}")
model.save_pretrained_gguf(
    str(merge_path),
    tokenizer,
    quantization_method = "q4_k_m",   # 4-bit K-means quantisation — ~1.8 GB
)
print("Done! Run with: ollama run ./merged_gguf/model-q4_k_m.gguf")
