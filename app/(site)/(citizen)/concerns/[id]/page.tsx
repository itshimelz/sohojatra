import { MOCK_CONCERNS } from "@/lib/concerns/mock"
import { getDictionary } from "@/lib/i18n/server"
import { ConcernDetailView } from "@/components/concern-detail-view"

export default async function ConcernDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const dictionary = await getDictionary()
  const { id } = await params
  const concern = MOCK_CONCERNS.find((item) => item.id === id) ?? null

  return (
    <ConcernDetailView
      concernId={id}
      initialConcern={concern}
      dictionary={dictionary.concerns}
      tracking={dictionary.tracking}
    />
  )
}
