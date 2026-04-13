export type ForumComment = {
  id: string
  author: string
  body: string
  points: number
  awards?: string[]
  quoted?: string
}

export type ForumProposal = {
  id: string
  title: string
  body: string
  author: string
  votes: number
  downvotes: number
  sortLabel: string
  category: string
  comments: ForumComment[]
}

export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
  citation?: string
}

export type ResearchProblem = {
  id: string
  title: string
  ministry: string
  grant: string
  deadline: string
  summary: string
}

export type GovernanceKpi = {
  label: string
  value: string
  detail: string
}

export type ModerationItem = {
  id: string
  title: string
  reason: string
  severity: "Low" | "Medium" | "High"
  status: "Pending" | "Needs Review" | "Escalated"
}

export const forumProposals: ForumProposal[] = [
  {
    id: "p-101",
    title: "Create ward-level drainage status board",
    body:
      "Every ward should publish a live drainage map with blocked lines, cleaning status, and the next maintenance date.",
    author: "Dr. Rafiq Hasan",
    votes: 421,
    downvotes: 12,
    sortLabel: "Best",
    category: "Infrastructure",
    comments: [
      {
        id: "c-1",
        author: "Amina Noor",
        body:
          "This is actionable. Add photo proof and the ward engineer name so follow-up becomes measurable.",
        points: 92,
        awards: ["Best Cited"],
      },
      {
        id: "c-2",
        author: "Sohel Ahmed",
        body:
          "We should also show contractor IDs and budget burn. That will make the public record more useful.",
        points: 68,
      },
    ],
  },
  {
    id: "p-102",
    title: "Overseas voting support for diaspora citizens",
    body:
      "Add a diaspora mode with passport + NID verification so Bangladeshis abroad can co-sign issues and vote on proposals.",
    author: "Nafisa Rahman",
    votes: 388,
    downvotes: 9,
    sortLabel: "Top",
    category: "Governance",
    comments: [
      {
        id: "c-3",
        author: "M. Hasan",
        body:
          "The identity path should stay strong. Passport plus NID plus device trust is the right compromise.",
        points: 84,
        awards: ["Expert Take", "Most Actionable"],
        quoted: "Add a diaspora mode with passport + NID verification",
      },
    ],
  },
  {
    id: "p-103",
    title: "Public school water filter maintenance tracker",
    body:
      "Schools should publish filter replacements, test results, and the responsible contractor on one public page.",
    author: "Jannat Sultana",
    votes: 267,
    downvotes: 21,
    sortLabel: "Hot",
    category: "Education",
    comments: [
      {
        id: "c-4",
        author: "Fahim Karim",
        body:
          "This is exactly the kind of low-friction, high-trust accountability feature that scales well.",
        points: 57,
      },
    ],
  },
]

export const chatbotMessages: ChatMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    text:
      "You can submit a concern with text, photo, or voice. For urgent safety cases, use the location pin so it reaches the right ward team.",
    citation: "Article 32, Constitution of Bangladesh",
  },
  {
    id: "m-2",
    role: "user",
    text: "Can I report something anonymously?",
  },
  {
    id: "m-3",
    role: "assistant",
    text:
      "Yes. Anonymous verified mode can hide your identity publicly while still keeping backend verification intact to prevent abuse.",
    citation: "Platform policy draft v1",
  },
]

export const researchProblems: ResearchProblem[] = [
  {
    id: "rp-11",
    title: "Flood-prone intersection prediction in Dhaka South",
    ministry: "Ministry of Local Government",
    grant: "BDT 12,00,000",
    deadline: "15 May 2026",
    summary:
      "Build a model that predicts flood-prone intersections using rainfall, drainage status, and past complaint density.",
  },
  {
    id: "rp-12",
    title: "Bangla voice complaint triage for low-end Android phones",
    ministry: "ICT Division",
    grant: "BDT 8,50,000",
    deadline: "28 May 2026",
    summary:
      "Create an offline-first Bangla STT pipeline that can classify complaint urgency on low bandwidth networks.",
  },
]

export const governanceKpis: GovernanceKpi[] = [
  {
    label: "Avg. resolution time",
    value: "64h",
    detail: "Across active ministries this month",
  },
  {
    label: "Open vs resolved",
    value: "1 : 2.8",
    detail: "Public issue backlog improving",
  },
  {
    label: "Citizen satisfaction",
    value: "4.3/5",
    detail: "Post-resolution ratings from verified users",
  },
  {
    label: "Assembly events",
    value: "18",
    detail: "Town halls published with minutes",
  },
]

export const moderationQueue: ModerationItem[] = [
  {
    id: "mq-1",
    title: "Proposal: anti-dumping zone near school",
    reason: "Needs source citations and contractor references",
    severity: "Medium",
    status: "Pending",
  },
  {
    id: "mq-2",
    title: "Comment thread with repeated personal attacks",
    reason: "Possible harassment pattern detected by moderator tools",
    severity: "High",
    status: "Needs Review",
  },
  {
    id: "mq-3",
    title: "Potential vote manipulation cluster",
    reason: "Burst of votes from new accounts in a narrow time window",
    severity: "High",
    status: "Escalated",
  },
]