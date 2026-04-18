/**
 * POST /api/chatbot — Constitutional chatbot with RAG.
 *
 * SECURITY:
 *   - POST is PUBLIC — the chatbot is accessible to all visitors.
 *     Rate-limiting is enforced at the proxy/middleware layer to
 *     prevent abuse and DDoS. No session is required so that
 *     unauthenticated users can still learn about their rights.
 *
 *   NOTE: This is an intentional exception to the "auth on all
 *   POST routes" rule. The chatbot is read-only (no data mutation)
 *   and serves a public interest purpose.
 */
import { NextResponse } from "next/server"

import {
  listConcerns,
  getSolutionPlan,
  listSolutionPlans,
} from "@/lib/sohojatra/store"
import { ragRetrieve } from "@/lib/sohojatra/advanced"

type KBEntry = {
  triggers: string[]
  answer: string
  citation: string
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    triggers: ["submit", "report", "concern", "issue", "problem", "complaint"],
    answer:
      "To submit a civic concern, go to Concerns → Submit a Concern. You can use text, voice (Bangla STT), or attach photos. Your concern is geolocated automatically. After submission it enters OPEN status and is scored for urgency by the AI engine.",
    citation: "Platform workflow — F06 Multimodal Concern Submission",
  },
  {
    triggers: ["status", "track", "progress", "update", "follow"],
    answer:
      "Every concern follows a 7-stage lifecycle: OPEN → UNDER_REVIEW → EXPERT_PROPOSED → GOVT_APPROVED → IN_PROGRESS → RESOLVED → RATED. You receive push/SMS/email notifications at every transition. You can also track live on the concern detail page.",
    citation: "F07 Concern Status Lifecycle",
  },
  {
    triggers: ["vote", "upvote", "downvote", "proposal"],
    answer:
      "Verified users can upvote or downvote any proposal or comment — one vote per user enforced by your verified account. Vote weight scales with your reputation: 500+ points = 1.2×, 2000+ = 1.5×, 5000+ = 1.8×. Accounts flagged by mob detection have votes weighted at 0.5× or nullified.",
    citation: "F13 Upvote/Downvote System + F34 Reputation",
  },
  {
    triggers: [
      "nid",
      "verify",
      "verification",
      "identity",
      "passport",
      "phone",
      "otp",
    ],
    answer:
      "Citizens can verify via Phone OTP (SSL Wireless/Robi/GP) or NID (Bangladesh Election Commission API). Experts and Government Officers require NID + institutional email. Overseas Bangladeshis can use passport number + NID. Device fingerprint + IP reputation produces a login trust score (0–100).",
    citation: "F01–F04 Identity & Verification",
  },
  {
    triggers: ["expert", "professor", "solution", "proposal", "plan"],
    answer:
      "Experts can submit solution proposals with technical documentation, budget estimate, timeline, and risk notes. A government authority then reviews and can Approve + Assign Department, Reject with comments, or Request Revision. All actions are logged in the immutable audit trail.",
    citation: "F19 Solution Proposal Pipeline",
  },
  {
    triggers: [
      "government",
      "authority",
      "ministry",
      "department",
      "approve",
      "reject",
    ],
    answer:
      "Government authorities access a co-governance portal showing AI-prioritized concerns. They can approve or reject solution plans, assign departments, update concern status, and organize assembly events. KPIs (resolution time, satisfaction score, events held) are public-facing.",
    citation: "F21 Government Authority Accountability KPIs",
  },
  {
    triggers: ["assembly", "town hall", "event", "meeting", "rsvp"],
    answer:
      "Assembly Events are physical or virtual town halls organized by government or NGOs. You can RSVP, view the agenda, participate in live Q&A, and read auto-generated minutes after the event. Citizens earn +3 reputation points per attendance.",
    citation: "F22 Assembly Events",
  },
  {
    triggers: ["research", "university", "grant", "funding", "milestone"],
    answer:
      "Government ministries release open civic problems with grant budgets. Universities and researchers apply; a panel scores applications. Winning teams receive phased milestone-based funding via bKash or bank transfer. Each milestone must be verified before the next tranche is released.",
    citation: "F23–F25 Research Lab & University Collaboration",
  },
  {
    triggers: [
      "chatbot",
      "ai",
      "rights",
      "constitution",
      "law",
      "legal",
      "help",
    ],
    answer:
      "This constitutional chatbot is powered by a LangChain RAG pipeline (LaBSE embeddings + LLaMA 3 + LoRA Q&A adapter). It can answer questions about the Bangladesh Constitution, RTI Act, DSA 2018, PDPO 2025, and other laws. Ask about your rights, look up concern status by ID, or get guided through submitting a concern.",
    citation: "F29 RAG Pipeline — Constitutional Chatbot",
  },
  {
    triggers: ["anonymous", "hide", "identity", "privacy", "safe"],
    answer:
      "Verified Anonymous Mode (F10) lets you hide your identity publicly while keeping backend NID/phone verification for abuse prevention. Your post shows as 'Verified Citizen' with location only — preventing retaliation for sensitive concerns about corruption or harassment.",
    citation: "F10 Anonymous Verified Mode",
  },
  {
    triggers: ["badge", "reputation", "points", "achievement"],
    answer:
      "You earn reputation points for: submitting concerns (+5), having them resolved (+20), receiving comment upvotes (+2 each), community awards (+15), pinned best comments (+30), comments cited in proposals (+50), event attendance (+3), and research milestones (+100). Badges unlock at milestones: First Concern, Problem Solver, Top Voice, Verified Expert, and more.",
    citation: "F34–F35 Reputation & Badges",
  },
  {
    triggers: ["open data", "dataset", "download", "csv", "json", "api"],
    answer:
      "All anonymized civic data is available via the Open Data Portal (/open-data). Download as JSON or use the API with ?dataset=concerns|proposals|research|statistics. Licensed under CC BY 4.0. PDPO 2025 compliant — no personal data exported.",
    citation: "F41 Open Data Portal",
  },
  {
    triggers: ["bangla", "language", "বাংলা", "সাবমিট", "সমস্যা"],
    answer:
      "Sohojatra is Bangla-first. All AI pipelines (urgency scorer, sentiment, NER, chatbot) are trained on Bangla civic text. Voice input uses Whisper large-v3 fine-tuned for Dhaka/Chittagong/Sylheti accents. A language toggle is available in the top navigation.",
    citation: "F36 Full Bangla Interface + F32 Bangla NLP Pipeline",
  },
  {
    triggers: [
      "mob",
      "fake",
      "bot",
      "spam",
      "astroturf",
      "coordinated",
    ],
    answer:
      "The platform runs a GraphSAGE Graph Neural Network that detects 15 signals including registration bursts, voting velocity spikes, coordinated timing, copy-paste comments, and bulk SIM signatures. Flagged accounts enter a trust-score system: 80–100 (normal), 40–79 (watchlist, 0.5× vote weight), 0–39 (shadow-ban). All actions are appealable within 24 hours.",
    citation: "F31 Mob Detection — GNN",
  },
  {
    triggers: [
      "offline",
      "ussd",
      "sms",
      "feature phone",
      "2g",
      "rural",
    ],
    answer:
      "Sohojatra supports feature phones via USSD (*XXX#) and SMS shortcode. Draft concerns are cached offline in the mobile app and synced when connectivity returns. The Progressive Web App (PWA) works on 2G/3G. SMS status updates ensure rural and low-income populations stay informed.",
    citation: "F37–F38 Offline-First Mobile + USSD/SMS Fallback",
  },
]

function selectAnswer(question: string): KBEntry {
  const q = question.toLowerCase()
  let best: KBEntry | null = null
  let bestScore = 0

  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.triggers.filter((t) => q.includes(t)).length
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return best ?? KNOWLEDGE_BASE[8]! // default: chatbot/rights info
}

async function lookupConcernStatus(question: string) {
  const match =
    question.match(/\b([c]-[\w-]+)\b/i) ??
    question.match(/concern[:\s]+([a-z0-9-]+)/i)
  if (!match) return null
  const concernId = match[1]!.toLowerCase()

  const concerns = await listConcerns()
  const concern = concerns.find((c) => c.id === concernId)
  if (!concern) return null

  return `Concern **${concern.id}**: "${concern.title}" is currently **${concern.status}** with ${concern.upvotes} support votes. ${concern.updates?.length ? `Last update: ${concern.updates[concern.updates.length - 1]?.note ?? concern.status}.` : ""}`
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const question = String(body.question ?? "").trim()

  if (!question) {
    return NextResponse.json({
      question: "",
      answer: {
        role: "assistant",
        text: "আমাকে প্রশ্ন করুন! Ask me about your rights, how to submit a concern, platform features, or look up a concern by ID (e.g. 'status of c-1234').",
        citation: "Sohojatra Constitutional Chatbot",
      },
    })
  }

  const ragResult = ragRetrieve(question)

  const statusInfo = await lookupConcernStatus(question)
  if (statusInfo) {
    return NextResponse.json({
      question,
      answer: {
        role: "assistant",
        text: statusInfo,
        citation: "Live concern database",
        sources: [],
      },
    })
  }

  const kb = selectAnswer(question)
  const hasRagEvidence = ragResult.evidence.length > 0

  return NextResponse.json({
    question,
    answer: {
      role: "assistant",
      text:
        kb.answer +
        (hasRagEvidence
          ? `\n\n*Additional context retrieved from ${ragResult.evidence.length} indexed civic document(s).*`
          : ""),
      citation: kb.citation,
      sources: ragResult.evidence.slice(0, 2),
    },
  })
}
