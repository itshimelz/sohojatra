type ScoringInput = {
  text?: string
  upvotes?: number
  downvotes?: number
  awards?: number
  trust?: number
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function scoreUrgency(text = "") {
  const lengthScore = clamp(wordCount(text) * 4, 0, 40)
  const keywords = ["danger", "unsafe", "fire", "water", "flood", "corruption", "urgent"]
  const keywordScore = keywords.some((keyword) => text.toLowerCase().includes(keyword)) ? 35 : 10
  const punctuationScore = /!/.test(text) ? 10 : 0

  return clamp(lengthScore + keywordScore + punctuationScore, 0, 100)
}

export function scoreComment(input: ScoringInput) {
  const text = input.text ?? ""
  const specificity = clamp(wordCount(text) / 3, 0, 25)
  const evidence = /http|www|source|report|data/i.test(text) ? 20 : 6
  const tone = /please|suggest|should|recommend/i.test(text) ? 20 : 8
  const actionability = /do|fix|install|repair|publish|verify/i.test(text) ? 20 : 8
  const trust = clamp((input.trust ?? 50) / 5, 0, 20)
  const communityMultiplier = clamp(1 + ((input.upvotes ?? 0) - (input.downvotes ?? 0)) * 0.05 + (input.awards ?? 0) * 0.1, 1, 3)

  return Math.round(clamp((specificity + evidence + tone + actionability + trust) * communityMultiplier, 0, 100))
}

export function detectMob(signal = "") {
  const lower = signal.toLowerCase()
  if (/(burst|cluster|coordinated|spam)/.test(lower)) {
    return { trustScore: 28, tier: "shadow-ban" as const }
  }

  if (/(new account|fast votes|timed|copy)/.test(lower)) {
    return { trustScore: 62, tier: "watchlist" as const }
  }

  return { trustScore: 92, tier: "normal" as const }
}

export function ragQuery(question = "") {
  const answer = question
    ? `Answering: ${question}. This is a grounded civic guidance stub that cites the Constitution, public process, and issue tracking rules.`
    : "Ask a question about rights, process, or concern submission."

  return {
    answer,
    citations: ["Bangladesh Constitution", "Platform policy draft", "Concern workflow guide"],
  }
}

export function classifyCrime(text = "") {
  const lower = text.toLowerCase()
  const flags = [] as string[]

  if (/(bribe|ঘুষ|money demanded)/.test(lower)) flags.push("bribery-signal")
  if (/(hate|kill|attack|violence)/.test(lower)) flags.push("incitement-risk")
  if (/(phone|address|nid|doxx)/.test(lower)) flags.push("privacy-violation")
  if (/(spam|bot|ddos|automation)/.test(lower)) flags.push("platform-abuse")

  return flags.length > 0 ? flags : ["no-flag"]
}

export function sentiment(text = "") {
  const lower = text.toLowerCase()
  if (/(urgent|danger|help|angry|unsafe)/.test(lower)) return { label: "urgency", score: 0.85 }
  if (/(thanks|great|good|helpful)/.test(lower)) return { label: "positive", score: 0.78 }
  return { label: "neutral", score: 0.55 }
}

export function ner(text = "") {
  const matches = Array.from(text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)).map((match) => match[1])
  const locations = Array.from(text.matchAll(/\b(Mirpur|Dhanmondi|Banani|Dhaka|Chittagong|Sylhet)\b/gi)).map((match) => match[1])

  return {
    people: matches.slice(0, 5),
    locations: Array.from(new Set(locations)),
  }
}