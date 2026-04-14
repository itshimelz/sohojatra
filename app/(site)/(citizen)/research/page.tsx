"use client"

import { Briefcase, CalendarCheck } from "@phosphor-icons/react"
import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { researchProblems } from "@/lib/sohojatra/mock"

export default function ResearchPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Research Lab
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Open civic problems with grant-backed applications
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Universities and experts can apply to solve civic problems, then verify
          milestones before the next tranche is released.
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        {researchProblems.map((problem) => (
          <div key={problem.id} className="rounded-3xl border border-border/50 bg-background/50 p-6 sm:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm">
            <div className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <Badge variant="outline" className="rounded-full bg-background/50 font-normal">
                  {problem.ministry}
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{problem.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <p>Grant: <span className="font-medium text-foreground/80">{problem.grant}</span></p>
                <span className="hidden sm:inline">•</span>
                <p>Deadline: <span className="font-medium text-foreground/80">{problem.deadline}</span></p>
              </div>
            </div>
            
            <div className="pt-1">
              <p className="leading-relaxed text-foreground/90">{problem.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button className="rounded-full">
                    <Briefcase className="mr-2 size-4" />
                    Apply
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="rounded-full">
                    <CalendarCheck className="mr-2 size-4" />
                    Milestone Plan
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}