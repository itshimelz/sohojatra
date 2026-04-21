import { notFound } from "next/navigation"
import Link from "next/link"
import { CaretLeft, ArrowFatUp, ArrowFatDown, ChatCircle, Tag, User, Clock } from "@phosphor-icons/react/dist/ssr"
import { formatDistanceToNow } from "date-fns"

import { listProposals } from "@/lib/sohojatra/store"
import type { ProposalRecord } from "@/lib/sohojatra/store"
import { getServerSession } from "@/lib/auth-session"
import { buttonVariants } from "@/components/ui/button-variants"
import { Badge } from "@/components/ui/badge"
import { CommentSection } from "@/components/comments/CommentSection"
import { AiInsightPanel } from "@/components/ai/AiInsightPanel"

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const proposals = await listProposals()
  const proposal = proposals.find((p: ProposalRecord) => p.id === id)
  if (!proposal) return { title: "Proposal Not Found" }
  return {
    title: proposal.title,
    description: proposal.body.slice(0, 150),
  }
}

export default async function ForumProposalPage({ params }: PageProps) {
  const { id } = await params
  const proposals = await listProposals()
  const proposal = proposals.find((p: ProposalRecord) => p.id === id)

  if (!proposal) notFound()

  const session = await getServerSession()
  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name ?? "Anonymous" }
    : null

  const score = proposal.votes - proposal.downvotes

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back */}
      <Link
        href="/forum"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
        })}
      >
        <CaretLeft className="size-4" />
        Back to Forum
      </Link>

      {/* Proposal card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        {/* Category badge */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Tag className="size-3" />
            {proposal.category}
          </Badge>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            #{proposal.id.slice(0, 8)}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {proposal.title}
        </h1>

        {/* Body */}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
          {proposal.body}
        </p>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/50 pt-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="size-4" weight="duotone" />
            <span className="font-medium text-foreground">{proposal.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" weight="duotone" />
            <time>{formatDistanceToNow(new Date(proposal.createdAt))} ago</time>
          </div>
        </div>

        {/* Vote display */}
        <div className="mt-5 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <ArrowFatUp className="size-4 text-emerald-500" weight="fill" />
            <span className="font-semibold">{proposal.votes}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <ArrowFatDown className="size-4 text-rose-500" weight="fill" />
            <span className="font-semibold">{proposal.downvotes}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Net score: <strong>{score > 0 ? `+${score}` : score}</strong>
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <ChatCircle className="size-4" weight="duotone" />
            <span className="text-xs">{proposal.comments.length} comment{proposal.comments.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {proposal.body.length >= 10 && (
        <AiInsightPanel text={proposal.body} className="mt-4" />
      )}

      {/* Comments */}
      <div className="mt-8">
        <CommentSection
          apiPath={`/api/forum/proposals/${proposal.id}/comments`}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
