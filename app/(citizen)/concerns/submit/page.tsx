import { getDictionary } from "@/lib/i18n/server"
import { SubmitConcernForm } from "./submit-form"

export default async function SubmitConcernPage() {
  const d = await getDictionary()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{d.submit.title}</h1>
        <p className="mt-1 text-muted-foreground">{d.submit.description}</p>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <SubmitConcernForm dictionary={d.submit} />
      </div>
    </div>
  )
}
