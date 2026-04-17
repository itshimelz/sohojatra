"use client"

import { motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useLayoutEffect, useRef, useState } from "react"

type Partner = {
  abbr: string
  name: string
  accentColor: string
  bgColor: string
  logo?: string
}

const partners: Partner[] = [
  {
    abbr: "DNCC",
    name: "Dhaka North City Corporation",
    accentColor: "#16a34a",
    bgColor: "#f0fdf4",
    logo: "/logos/dncc.png",
  },
  {
    abbr: "DSCC",
    name: "Dhaka South City Corporation",
    accentColor: "#2563eb",
    bgColor: "#eff6ff",
    logo: "/logos/dscc.png",
  },
  {
    abbr: "RAJUK",
    name: "Capital Development Authority",
    accentColor: "#ea580c",
    bgColor: "#fff7ed",
  },
  {
    abbr: "DWASA",
    name: "Water Supply & Sewerage Authority",
    accentColor: "#0891b2",
    bgColor: "#ecfeff",
    logo: "/logos/dwasa.png",
  },
  {
    abbr: "DMP",
    name: "Dhaka Metropolitan Police",
    accentColor: "#1d4ed8",
    bgColor: "#eff6ff",
    logo: "/logos/dmp.png",
  },
  {
    abbr: "DESCO",
    name: "Dhaka Electric Supply Co.",
    accentColor: "#b45309",
    bgColor: "#fffbeb",
    logo: "/logos/desco.png",
  },
  {
    abbr: "DPDC",
    name: "Dhaka Power Distribution Co.",
    accentColor: "#7c3aed",
    bgColor: "#f5f3ff",
    logo: "/logos/dpdc_logo.png",
  },
  {
    abbr: "MLGRD",
    name: "Ministry of Local Government",
    accentColor: "#be123c",
    bgColor: "#fff1f2",
  },
]

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border/50 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:gap-3.5 sm:px-5 sm:py-3.5">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl font-bold tracking-tight sm:size-12"
        style={{ backgroundColor: partner.bgColor, color: partner.accentColor }}
      >
        {partner.logo ? (
          <Image
            src={partner.logo}
            alt={partner.name}
            width={36}
            height={36}
            className="size-8 rounded-md object-contain sm:size-9"
          />
        ) : (
          <span
            className={
              partner.abbr.length > 4 ? "text-[9px] sm:text-[10px]" : "text-[11px] sm:text-xs"
            }
          >
            {partner.abbr}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="max-w-44 truncate text-sm font-medium leading-snug text-foreground sm:max-w-52 sm:text-base">
          {partner.name}
        </p>
        <p
          className="text-xs font-semibold leading-tight sm:text-sm"
          style={{ color: partner.accentColor }}
        >
          {partner.abbr}
        </p>
      </div>
    </div>
  )
}

type PartnersRailProps = {
  title: string
  subtitle: string
}

/** Seconds for one full loop (one row width); longer row after sizing up needs similar wall-clock feel. */
const LOOP_DURATION_SEC = 55

export function PartnersRail({ title, subtitle }: PartnersRailProps) {
  const reduceMotion = useReducedMotion()
  const rowRef = useRef<HTMLDivElement>(null)
  const [loopPx, setLoopPx] = useState(0)

  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return

    const measure = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setLoopPx(w)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shouldAnimate = !reduceMotion && loopPx > 0

  return (
    <section className="border-y border-border/40 bg-muted/10 py-16 sm:py-24">
      <div className="mx-auto mb-12 max-w-2xl px-4 text-center sm:mb-14 sm:px-6">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      </div>

      <div
        className="relative mx-auto max-w-6xl overflow-hidden px-4 mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] sm:px-6"
        aria-label={title}
      >
        <motion.div
          key={loopPx > 0 ? "marquee" : "pending"}
          className="flex w-max will-change-transform"
          initial={{ x: 0 }}
          animate={shouldAnimate ? { x: -loopPx } : { x: 0 }}
          transition={{
            x: {
              duration: LOOP_DURATION_SEC,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              repeatDelay: 0,
            },
          }}
        >
          <div ref={rowRef} className="flex shrink-0 gap-4">
            {partners.map((partner) => (
              <PartnerCard key={`a-${partner.abbr}`} partner={partner} />
            ))}
          </div>
          <div className="flex shrink-0 gap-4">
            {partners.map((partner) => (
              <PartnerCard key={`b-${partner.abbr}`} partner={partner} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
