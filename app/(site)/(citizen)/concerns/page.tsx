import { MOCK_CONCERNS } from "@/lib/concerns/mock"
import { getDictionary } from "@/lib/i18n/server"
import { ConcernsBrowser } from "@/components/concerns-browser"

export default async function ConcernsPage() {
  const dictionary = await getDictionary()

  return (
    <ConcernsBrowser
      dictionary={dictionary.concerns}
      initialConcerns={MOCK_CONCERNS}
    />
  )
}
