"""
prepare_dataset.py — Convert Sohojatra_Survey_Responses_FULL.csv into
ChatML-format JSONL training pairs for Unsloth fine-tuning.

Generates four task types:
  1. urgency_classify  – text → critical / moderate / low
  2. emotion_detect    – text → emotion list
  3. category_classify – text → civic category list
  4. comment_quality   – comment text → high / low / spam

Output files:
  data/train.jsonl
  data/val.jsonl   (last 20 % of rows)

Usage:
  python prepare_dataset.py --csv ../../Sohojatra_Survey_Responses_FULL.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import re
import textwrap
from pathlib import Path

# ── Column indices (0-based after Timestamp col is index 0) ──────────────────
COL_CATEGORIES       = 6
COL_FAST_RESPONSE    = 7
COL_UNDERREPORTED    = 8
COL_INFRA_KEYWORDS   = 9
COL_CORRUPT_KEYWORDS = 10
COL_CRITICAL_FACTORS = 11
COL_MODERATE_FACTORS = 12
COL_LOW_FACTORS      = 13
COL_URGENCY_CUES     = 14   # Bangla language cues that signal urgency
COL_EMOTIONS         = 15
COL_CONSTRUCTIVE     = 16
COL_NON_CONSTRUCTIVE = 17
COL_ANGER_EXPR       = 18
COL_HIGH_QUALITY     = 19
COL_LOW_QUALITY      = 20

SYSTEM_PROMPT = (
    "You are an AI assistant for the Sohojatra civic platform. "
    "You classify Bangla and Bilingual civic concern texts. "
    "Always reply with valid JSON only — no extra text."
)

# ── Bangla urgency cue → urgency level templates ─────────────────────────────
URGENCY_TEMPLATES = [
    "আমাদের এলাকায় {problem}। {cue}। সরকারের কাছে অনুরোধ।",
    "{cue} — {problem} বিষয়ে অবিলম্বে পদক্ষেপ নেওয়া দরকার।",
    "অভিযোগ: {problem}। {cue}।",
    "{problem} সমস্যা {duration}। {cue}।",
]

PROBLEM_SNIPPETS = {
    "infrastructure": [
        "রাস্তা ভাঙা", "জলাবদ্ধতা", "ড্রেনেজ সমস্যা", "সেতু বিপজ্জনক",
        "ফুটপাথ নেই", "বিদ্যুৎ নেই",
    ],
    "health": [
        "হাসপাতালে অ্যাম্বুলেন্স নেই", "পানি দূষিত", "ক্লিনিক বন্ধ",
    ],
    "corruption": [
        "ঘুষ ছাড়া কাজ হয় না", "ফাইল আটকে রয়েছে", "সরকারি অর্থ আত্মসাৎ",
    ],
    "safety": [
        "ছিনতাই বাড়ছে", "সন্ত্রাসী কার্যকলাপ", "রোড অ্যাক্সিডেন্ট",
    ],
    "utility": [
        "গ্যাস নেই", "পানি সংকট", "বিদ্যুৎ বিভ্রাট",
    ],
}

DURATION_SNIPPETS = [
    "বহু বছর ধরে চলছে",
    "প্রতিদিনের সমস্যা",
    "গত ১ সপ্তাহ ধরে",
    "দীর্ঘদিন ধরে",
]

CATEGORY_MAP = {
    "Roads, bridges, drainage, footpaths": "infrastructure",
    "অবকাঠামো": "infrastructure",
    "Electricity, gas, water supply": "utility",
    "ইউটিলিটি": "utility",
    "Hospitals, clinics, ambulance access": "health",
    "স্বাস্থ্য": "health",
    "Schools, colleges, TVET, literacy": "education",
    "শিক্ষা": "education",
    "Air, water, solid waste, rivers": "environment",
    "পরিবেশ": "environment",
    "Bribery, embezzlement, service delay": "corruption",
    "দুর্নীতি": "corruption",
    "Crime, harassment, road safety, fire": "safety",
    "নিরাপত্তা": "safety",
    "Land rights, women's rights, disability access": "rights",
    "অধিকার": "rights",
    "Jobs, market prices, business permits": "economy",
    "অর্থনীতি": "economy",
}

EMOTION_MAP = {
    "Frustration / anger": "frustration",
    "রাগ / বিরক্তি": "frustration",
    "Helplessness / despair": "helplessness",
    "অসহায়ত্ব": "helplessness",
    "Fear / worry": "fear",
    "ভয় / উদ্বেগ": "fear",
    "Urgency / panic": "urgency",
    "তাড়না / আতঙ্ক": "urgency",
    "Sarcasm / dark humour": "sarcasm",
    "কটাক্ষ": "sarcasm",
    "Optimism / hope": "hope",
    "আশা": "hope",
    "Hope / optimism": "hope",
    "Resignation / acceptance": "resignation",
    "হতাশা": "resignation",
    "Grief / sadness": "grief",
    "দুঃখ": "grief",
    "Civic pride": "civic_pride",
    "নাগরিক গর্ব": "civic_pride",
}


def parse_multiselect(cell: str) -> list[str]:
    """Split a comma-separated multi-select cell into items."""
    if not cell or not cell.strip():
        return []
    return [item.strip() for item in cell.split(",") if item.strip()]


def map_categories(raw: list[str]) -> list[str]:
    cats: set[str] = set()
    for item in raw:
        for key, val in CATEGORY_MAP.items():
            if key.lower() in item.lower():
                cats.add(val)
    return sorted(cats)


def map_emotions(raw: list[str]) -> list[str]:
    emotions: set[str] = set()
    for item in raw:
        for key, val in EMOTION_MAP.items():
            if key.lower() in item.lower():
                emotions.add(val)
    return sorted(emotions)


def extract_clean_cues(cue_text: str) -> list[str]:
    """Extract the Bangla/English phrases from cue cells."""
    cues = []
    for item in parse_multiselect(cue_text):
        # Prefer Bangla part (before parentheses if present)
        bangla = re.sub(r"\s*\(.*?\)\s*", "", item).strip()
        if bangla:
            cues.append(bangla)
    return cues


def build_urgency_example(row: list[str]) -> list[dict]:
    """Generate urgency classification examples from one survey row."""
    examples = []

    critical_factors = parse_multiselect(row[COL_CRITICAL_FACTORS])
    moderate_factors = parse_multiselect(row[COL_MODERATE_FACTORS])
    low_factors      = parse_multiselect(row[COL_LOW_FACTORS])
    urgency_cues     = extract_clean_cues(row[COL_URGENCY_CUES])

    label_sets = [
        ("critical", critical_factors),
        ("moderate", moderate_factors),
        ("low",      low_factors),
    ]

    for label, factors in label_sets:
        if not factors:
            continue
        for domain, snippets in PROBLEM_SNIPPETS.items():
            problem = random.choice(snippets)
            cue     = random.choice(urgency_cues) if urgency_cues else "সমাধান দরকার"
            duration = random.choice(DURATION_SNIPPETS)
            template = random.choice(URGENCY_TEMPLATES)
            text = template.format(problem=problem, cue=cue, duration=duration)

            answer = json.dumps(
                {
                    "urgency_level": label,
                    "key_factors": factors[:3],
                    "detected_cues": [cue],
                },
                ensure_ascii=False,
            )
            examples.append(
                _make_example(
                    task="urgency_classify",
                    user_text=(
                        f"নিচের নাগরিক অভিযোগ বিশ্লেষণ করুন এবং urgency level নির্ধারণ করুন "
                        f"(critical / moderate / low):\n\n\"{text}\""
                    ),
                    assistant=answer,
                )
            )
    return examples


def build_emotion_example(row: list[str]) -> list[dict]:
    raw_emotions = parse_multiselect(row[COL_EMOTIONS])
    mapped = map_emotions(raw_emotions)
    anger_exprs = extract_clean_cues(row[COL_ANGER_EXPR])

    if not mapped:
        return []

    problem = random.choice(
        [s for snippets in PROBLEM_SNIPPETS.values() for s in snippets]
    )
    cue = random.choice(anger_exprs) if anger_exprs else "সমস্যা সমাধান হচ্ছে না"
    text = f"{cue} — {problem} নিয়ে মানুষ ক্লান্ত।"

    answer = json.dumps({"emotions": mapped}, ensure_ascii=False)
    return [
        _make_example(
            task="emotion_detect",
            user_text=(
                f"নিচের নাগরিক পোস্টে কোন কোন আবেগ (emotion) প্রকাশ পাচ্ছে?\n\n\"{text}\""
            ),
            assistant=answer,
        )
    ]


def build_category_example(row: list[str]) -> list[dict]:
    raw_cats = parse_multiselect(row[COL_CATEGORIES])
    categories = map_categories(raw_cats)
    infra_kw = extract_clean_cues(row[COL_INFRA_KEYWORDS])
    corrupt_kw = extract_clean_cues(row[COL_CORRUPT_KEYWORDS])

    if not categories:
        return []

    keywords = (infra_kw + corrupt_kw)[:4]
    kw_text = "، ".join(keywords) if keywords else "নাগরিক সমস্যা"
    text = f"আমাদের এলাকায় {kw_text} সংক্রান্ত সমস্যা রয়েছে।"

    answer = json.dumps({"categories": categories}, ensure_ascii=False)
    return [
        _make_example(
            task="category_classify",
            user_text=(
                f"নিচের নাগরিক অভিযোগটি কোন কোন বিভাগে পড়ে তা চিহ্নিত করুন:\n\n\"{text}\""
            ),
            assistant=answer,
        )
    ]


def build_quality_example(row: list[str]) -> list[dict]:
    constructive = parse_multiselect(row[COL_CONSTRUCTIVE])
    non_constructive = parse_multiselect(row[COL_NON_CONSTRUCTIVE])
    examples = []

    if constructive:
        feature = random.choice(constructive)
        text = f"মন্তব্য: এই প্রস্তাবে {feature} রয়েছে। স্থানীয় সরকারের উচিত বিষয়টি বিবেচনা করা।"
        answer = json.dumps(
            {"quality": "high", "reason": feature}, ensure_ascii=False
        )
        examples.append(
            _make_example(
                task="comment_quality",
                user_text=f"নিচের ফোরাম মন্তব্যটির মান মূল্যায়ন করুন (high / low / spam):\n\n\"{text}\"",
                assistant=answer,
            )
        )

    if non_constructive:
        feature = random.choice(non_constructive)
        text = f"মন্তব্য: {feature}। এই সরকার কিছুই করে না!"
        answer = json.dumps(
            {"quality": "low", "reason": feature}, ensure_ascii=False
        )
        examples.append(
            _make_example(
                task="comment_quality",
                user_text=f"নিচের ফোরাম মন্তব্যটির মান মূল্যায়ন করুন (high / low / spam):\n\n\"{text}\"",
                assistant=answer,
            )
        )

    return examples


def _make_example(task: str, user_text: str, assistant: str) -> dict:
    return {
        "task": task,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text},
            {"role": "assistant", "content": assistant},
        ],
    }


def load_csv(path: Path) -> list[list[str]]:
    rows = []
    with path.open(encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            rows.append(row)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        default="../../Sohojatra_Survey_Responses_FULL.csv",
        help="Path to the survey CSV file",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--val_split", type=float, default=0.2)
    args = parser.parse_args()

    random.seed(args.seed)
    csv_path = Path(args.csv).resolve()
    out_dir = Path(__file__).parent / "data"
    out_dir.mkdir(exist_ok=True)

    rows = load_csv(csv_path)
    print(f"Loaded {len(rows)} survey rows from {csv_path}")

    all_examples: list[dict] = []
    for row in rows:
        if len(row) < 21:
            continue
        all_examples.extend(build_urgency_example(row))
        all_examples.extend(build_emotion_example(row))
        all_examples.extend(build_category_example(row))
        all_examples.extend(build_quality_example(row))

    random.shuffle(all_examples)
    split = int(len(all_examples) * (1 - args.val_split))
    train_set = all_examples[:split]
    val_set   = all_examples[split:]

    def write_jsonl(examples: list[dict], path: Path):
        with path.open("w", encoding="utf-8") as f:
            for ex in examples:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        print(f"Wrote {len(examples)} examples → {path}")

    write_jsonl(train_set, out_dir / "train.jsonl")
    write_jsonl(val_set,   out_dir / "val.jsonl")

    print(
        textwrap.dedent(f"""
        Dataset summary
        ───────────────
        Total examples : {len(all_examples)}
        Train          : {len(train_set)}
        Val            : {len(val_set)}

        Task breakdown:
        """)
    )
    from collections import Counter
    counts = Counter(ex["task"] for ex in all_examples)
    for task, n in sorted(counts.items()):
        print(f"  {task:<25} {n}")


if __name__ == "__main__":
    main()
