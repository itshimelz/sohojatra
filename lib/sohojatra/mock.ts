
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
