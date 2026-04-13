import { ArrowFatUp, ChatCircle, Quotes, Star } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { forumProposals } from "@/lib/nagarik/mock"

const sorts = ["Hot", "Best", "Top", "New", "Controversial"] as const

export default function ForumPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Voice Forum
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Reddit-style civic proposals with quote replies
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Citizens, experts, and diaspora users can surface ideas, vote, and
            turn useful comments into action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sorts.map((sort) => (
            <Button key={sort} variant={sort === "Best" ? "secondary" : "outline"} className="rounded-full">
              {sort}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          {forumProposals.map((proposal) => (
            <Card key={proposal.id} className="rounded-3xl border-border/60">
              <CardHeader className="space-y-4 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="secondary" className="rounded-full">
                    {proposal.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="size-4" weight="fill" />
                    {proposal.sortLabel}
                  </div>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">{proposal.title}</h2>
                <p className="text-sm text-muted-foreground">by {proposal.author}</p>
                <p className="leading-relaxed text-foreground/90">{proposal.body}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="rounded-full">
                    <ArrowFatUp className="mr-2 size-4" />
                    {proposal.votes}
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    <Quotes className="mr-2 size-4" />
                    Quote Reply
                  </Button>
                  <Button variant="ghost" className="rounded-full text-muted-foreground">
                    <ChatCircle className="mr-2 size-4" />
                    {proposal.comments.length} comments
                  </Button>
                </div>

                <div className="space-y-3 border-t border-border/60 pt-4">
                  {proposal.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{comment.author}</p>
                        <p className="text-sm text-muted-foreground">{comment.points} AI points</p>
                      </div>
                      {comment.quoted ? (
                        <div className="mt-3 rounded-xl border-l-2 border-primary/40 bg-background p-3 text-sm text-muted-foreground">
                          {comment.quoted}
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{comment.body}</p>
                      {comment.awards?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {comment.awards.map((award) => (
                            <Badge key={award} variant="outline" className="rounded-full">
                              {award}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <h2 className="text-xl font-semibold">Participation rules</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1 vote per verified user.</p>
              <p>Comments can be quoted and nested up to 3 levels.</p>
              <p>AI scoring lifts constructive, evidenced replies.</p>
              <p>Moderators review flags before any action.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <h2 className="text-xl font-semibold">Community awards</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Badge variant="secondary" className="rounded-full">Expert Take</Badge>
              <Badge variant="secondary" className="rounded-full">Most Actionable</Badge>
              <Badge variant="secondary" className="rounded-full">Best Cited</Badge>
              <Badge variant="secondary" className="rounded-full">Local Voice</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}