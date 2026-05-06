import { NextResponse } from "next/server"

const SUGGESTIONS: Record<string, { ministry: string; questions: string[] }> = {
  road: {
    ministry: "Ministry of Local Government, Rural Development and Co-operatives",
    questions: [
      "What is the budget allocated for road maintenance in [area] for this fiscal year?",
      "Which contractor was awarded the road repair contract and at what cost?",
      "When is the scheduled completion date for the road repair project in [area]?",
    ],
  },
  corruption: {
    ministry: "Anti-Corruption Commission (ACC)",
    questions: [
      "What investigations, if any, are underway into alleged corruption at [institution]?",
      "How many complaints were filed against [department] in the past 12 months?",
      "What disciplinary actions were taken against public servants for corruption in [year]?",
    ],
  },
  health: {
    ministry: "Ministry of Health and Family Welfare",
    questions: [
      "What is the doctor-to-patient ratio at [hospital/upazila health complex]?",
      "What medicines are currently in stock at [facility]?",
      "How many vacancies exist for health workers in [district]?",
    ],
  },
  education: {
    ministry: "Ministry of Education",
    questions: [
      "What is the student dropout rate in [upazila/district] for the past academic year?",
      "How many qualified teachers are currently posted at [school]?",
      "What is the budget allocation for school infrastructure in [area]?",
    ],
  },
  environment: {
    ministry: "Ministry of Environment, Forest and Climate Change",
    questions: [
      "What environmental impact assessment was done for [project]?",
      "What action has been taken against illegal dumping at [location]?",
      "What is the air quality index monitoring schedule for [area]?",
    ],
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get("q") ?? "").toLowerCase()

    const matched = Object.entries(SUGGESTIONS).find(([key]) => keyword.includes(key))

    if (matched) {
      return NextResponse.json({ suggestion: matched[1] })
    }

    return NextResponse.json({
      suggestion: {
        ministry: "Ministry of Local Government, Rural Development and Co-operatives",
        questions: [
          "What is the official policy/procedure regarding [topic]?",
          "What budget has been allocated for [issue] in [current year]?",
          "What actions have been taken to address [concern] in [location]?",
        ],
      },
    })
  } catch (error) {
    console.error("[RTI_SUGGEST_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
