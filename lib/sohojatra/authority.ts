export type AuthorityRecord = {
  id: string
  agency: string
  metric: string
  value: string
  updatedAt: string
}

const records: AuthorityRecord[] = [
  {
    id: "ar-1",
    agency: "Dhaka City Corporation",
    metric: "Resolved concerns (7d)",
    value: "312",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ar-2",
    agency: "LGD",
    metric: "Avg response time",
    value: "61h",
    updatedAt: new Date().toISOString(),
  },
]

export function listAuthorityRecords() {
  return records
}
