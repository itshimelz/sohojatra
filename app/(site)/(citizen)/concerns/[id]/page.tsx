import { MOCK_CONCERNS } from "@/lib/concerns/mock"
import { getDictionary } from "@/lib/i18n/server"
import { ConcernDetailView } from "@/components/concern-detail-view"

type DetailParams = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: DetailParams): Promise<Metadata> {
  const { id } = await params
  const concern = MOCK_CONCERNS.find((c) => c.id === id)

  if (!concern) {
    return { title: "Concern Not Found" }
  }

  const title = concern.title
  const description = `${concern.description.slice(0, 150)}…`
  const url = `${SITE_URL}/concerns/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Sohojatra`,
      description,
      url,
      type: "article",
    },
  }
}

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
