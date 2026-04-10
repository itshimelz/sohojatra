"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

export function FaqAccordion({
  items,
}: {
  items: { q: string; a: string }[]
}) {
  return (
    <Accordion className="rounded-2xl border-border/50">
      {items.map((faq, i) => (
        <AccordionItem key={i} className="border-border/50">
          <AccordionTrigger className="px-6 py-4 text-[15px] hover:no-underline">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="px-6 text-muted-foreground">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
