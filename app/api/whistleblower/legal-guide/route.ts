import { NextResponse } from "next/server"

const LEGAL_GUIDE = {
  act: "Whistleblower Protection Act, 2011 (Bangladesh)",
  rights: [
    "You have the right to report corruption, bribery, or misconduct to any designated authority.",
    "Your identity must be kept confidential by the receiving authority.",
    "You are protected against victimization, including dismissal, demotion, or harassment.",
    "False reports made in bad faith are not protected and may result in penalties.",
  ],
  reportingChannels: [
    { name: "Anti-Corruption Commission (ACC)", contact: "acc.gov.bd", type: "Primary" },
    { name: "National Human Rights Commission", contact: "nhrc.org.bd", type: "Rights Violations" },
    { name: "Ministry of Home Affairs", contact: "mha.gov.bd", type: "Law Enforcement Misconduct" },
    { name: "Bangladesh Financial Intelligence Unit (BFIU)", contact: "bfiu.org.bd", type: "Financial Crimes" },
  ],
  protections: [
    "Identity confidentiality by law",
    "Protection against workplace retaliation",
    "Legal standing to file complaints if retaliated against",
    "Right to withdraw report within 7 days if submitted in error",
  ],
  risks: [
    "The Whistleblower Protection Act is inconsistently enforced in Bangladesh.",
    "Physical safety cannot be guaranteed — if you fear for your safety, consult a lawyer first.",
    "Digital submissions may still carry metadata — use private browsing and avoid personal devices.",
    "Consider using the Tor Browser for maximum anonymity.",
  ],
  legalAid: {
    description: "Free legal aid is available through Bangladesh Legal Aid and Services Trust (BLAST) and Ain o Salish Kendra (ASK).",
    contacts: [
      { name: "BLAST (Bangladesh Legal Aid and Services Trust)", website: "blast.org.bd" },
      { name: "Ain o Salish Kendra (ASK)", website: "askbd.org" },
      { name: "Bangladesh Bar Council Legal Aid Committee", website: "bangladeshbarcouncil.org" },
    ],
  },
}

export async function GET() {
  return NextResponse.json(LEGAL_GUIDE)
}
