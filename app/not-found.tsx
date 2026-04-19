"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

// ─── Locale hook — reads NEXT_LOCALE cookie outside the site layout ───────────
const nf404 = {
  en: { error: "Error", oops: "Oops!", subtitle: "Page Not Found", description: "The page you're looking for has wandered off. Let's get you back on track.", goHome: "Go Home", goBack: "Go Back" },
  bn: { error: "ত্রুটি", oops: "ওহ!", subtitle: "পৃষ্ঠা পাওয়া যায়নি", description: "আপনি যে পৃষ্ঠাটি খুঁজছেন তা হারিয়ে গেছে। চলুন আপনাকে সঠিক পথে ফিরিয়ে দিই।", goHome: "হোমে যান", goBack: "পিছনে যান" },
} as const

function useNotFoundT() {
  const [t] = useState(() => {
    if (typeof document === "undefined") return nf404.en
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    return match?.[1] === "bn" ? nf404.bn : nf404.en
  })
  return t
}

// ─── Dark-mode hook (watches html.dark class — works with Tailwind class strategy) ──
function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.classList.contains("dark"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])
  return dark
}

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({
  delay,
  x,
  size,
  duration,
}: {
  delay: number
  x: number
  size: number
  duration: number
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-[#76c025]/20 dark:bg-[#76c025]/30 pointer-events-none"
      style={{ width: size, height: size, left: `${x}%`, bottom: "-10%" }}
      animate={{ y: [0, -600], opacity: [0, 0.6, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
    />
  )
}

// Pre-computed at module level — Math.random() must never be called during render.
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  delay: i * 0.5,
  x: 5 + i * 8,
  size: 6 + (i % 4) * 4,
  duration: 6 + Math.random() * 4,
}))

// ─── Glitch digit ─────────────────────────────────────────────────────────────
function GlitchDigit({ char }: { char: string }) {
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(
      () => {
        setGlitching(true)
        setTimeout(() => setGlitching(false), 180)
      },
      2800 + Math.random() * 2000,
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="relative inline-block select-none">
      {char}
      {glitching && (
        <>
          <span
            className="absolute inset-0 text-[#ff3b3b] opacity-70"
            style={{
              clipPath: "polygon(0 30%,100% 30%,100% 55%,0 55%)",
              transform: "translate(-3px,0)",
            }}
          >
            {char}
          </span>
          <span
            className="absolute inset-0 text-[#00eaff] opacity-70"
            style={{
              clipPath: "polygon(0 55%,100% 55%,100% 80%,0 80%)",
              transform: "translate(3px,0)",
            }}
          >
            {char}
          </span>
        </>
      )}
    </span>
  )
}

// ─── Swaying lightbulb (broken) ───────────────────────────────────────────────
function BrokenBulb() {
  const dark = useDarkMode()
  const [flickerOn, setFlickerOn] = useState(true)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    function flicker() {
      setFlickerOn((v) => !v)
      t = setTimeout(flicker, 80 + Math.random() * 400)
    }
    t = setTimeout(flicker, 1200)
    return () => clearTimeout(t)
  }, [])

  // Color tokens that differ between light/dark
  const bulbFill   = flickerOn ? (dark ? "#3f3f46" : "#fef9c3") : (dark ? "#27272a" : "#e5e7eb")
  const bulbStroke = dark ? "#52525b" : "#d1d5db"
  const crackColor = dark ? "#71717a" : "#9ca3af"
  const filament   = flickerOn ? "#f59e0b" : (dark ? "#52525b" : "#9ca3af")
  const ring1      = dark ? "#52525b" : "#9ca3af"
  const ring2      = dark ? "#3f3f46" : "#6b7280"
  const ring3      = dark ? "#27272a" : "#4b5563"
  const wireColor  = dark ? "#71717a" : "#a1a1aa"
  const shadowClass = dark ? "bg-white/10" : "bg-black/10"

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ rotate: -6 }}
      animate={{ rotate: 6 }}
      transition={{ repeat: Infinity, duration: 3.2, repeatType: "mirror", ease: "easeInOut" }}
      style={{ transformOrigin: "top center" }}
    >
      {/* Wire from top */}
      <div className="w-0.5 h-14" style={{ backgroundColor: wireColor }} />

      <svg width="90" height="110" viewBox="0 0 90 110">
        {/* Glow when on */}
        {flickerOn && (
          <ellipse cx="45" cy="40" rx="30" ry="30" fill="#fef08a" opacity={dark ? "0.18" : "0.35"}>
            <animate attributeName="opacity" values={dark ? "0.18;0.08;0.18" : "0.35;0.15;0.35"} dur="0.2s" repeatCount="indefinite" />
          </ellipse>
        )}
        {/* Glass bulb */}
        <path
          d="M45 8 C 22 8, 10 24, 10 42 C 10 58, 20 72, 35 76 L 35 86 L 55 86 L 55 76 C 70 72, 80 58, 80 42 C 80 24, 68 8, 45 8 Z"
          fill={bulbFill}
          stroke={bulbStroke}
          strokeWidth="1.5"
        />
        {/* Crack */}
        <path d="M42 20 L 38 38 L 46 44 L 41 62" stroke={crackColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Filament */}
        <path
          d="M38 70 Q 35 60, 38 50 Q 45 44, 52 50 Q 55 60, 52 70"
          stroke={filament}
          strokeWidth="1.5"
          fill="none"
        />
        {/* Base rings */}
        <rect x="32" y="86" width="26" height="7" rx="2" fill={ring1} />
        <rect x="34" y="93" width="22" height="7" rx="2" fill={ring2} />
        <rect x="36" y="100" width="18" height="7" rx="2" fill={ring3} />
      </svg>

      {/* Shadow */}
      <div className={`w-16 h-2 rounded-full blur-sm mt-1 ${shadowClass}`} />
    </motion.div>
  )
}

// ─── Withered plant ───────────────────────────────────────────────────────────
function WitheredPlant() {
  const dark = useDarkMode()

  const potFill    = "#76c025"
  const potRim     = "#65a321"
  const soilFill   = dark ? "#2d3a0e" : "#4b5d16"
  const stemColor  = dark ? "#6b7a1e" : "#4b5d16"
  const leafFill   = dark ? "#5a6b28" : "#6d7d32"
  const flowerFill = dark ? "#8aab38" : "#a3be48"
  const shadowClass = dark ? "bg-white/10" : "bg-black/10"

  const leaves = [
    { y: 38, side: -1, angle: -30 },
    { y: 38, side: 1,  angle:  30 },
    { y: 65, side: -1, angle: -40 },
    { y: 65, side: 1,  angle:  40 },
    { y: 92, side: -1, angle: -50 },
    { y: 92, side: 1,  angle:  50 },
  ]

  return (
    <motion.div
      className="relative"
      animate={{ skewX: [0, 0.8, -0.8, 0] }}
      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
    >
      <svg width="110" height="220" viewBox="0 0 110 220">
        {/* Pot */}
        <path d="M25 158 L 85 158 L 80 200 L 30 200 Z" fill={potFill} />
        <rect x="22" y="150" width="66" height="12" rx="3" fill={potRim} />
        {/* Soil */}
        <ellipse cx="55" cy="157" rx="28" ry="5" fill={soilFill} opacity="0.6" />
        {/* Main stem */}
        <motion.path
          d="M55 150 Q 52 110 55 18"
          stroke={stemColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Leaves */}
        {leaves.map((leaf, i) => (
          <motion.g
            key={i}
            animate={{ rotate: [0, leaf.side * 3, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: "easeInOut" }}
            style={{ transformOrigin: `55px ${leaf.y}px` }}
          >
            <path
              d={`M55 ${leaf.y} Q ${55 + leaf.side * 18} ${leaf.y + 10} ${55 + leaf.side * 28} ${leaf.y + 28}`}
              stroke={stemColor}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx={55 + leaf.side * 30}
              cy={leaf.y + 36}
              rx="6"
              ry="14"
              fill={leafFill}
              opacity="0.85"
              transform={`rotate(${leaf.angle} ${55 + leaf.side * 30} ${leaf.y + 36})`}
            />
          </motion.g>
        ))}
        {/* Wilted top flower */}
        <motion.g
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={{ transformOrigin: "55px 18px" }}
        >
          <circle cx="55" cy="14" r="6" fill={flowerFill} opacity="0.6" />
          <circle cx="48" cy="10" r="4" fill={flowerFill} opacity="0.5" />
          <circle cx="62" cy="10" r="4" fill={flowerFill} opacity="0.5" />
        </motion.g>
      </svg>

      {/* Shadow */}
      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full blur-sm ${shadowClass}`} />
    </motion.div>
  )
}

// ─── Tumbleweed ───────────────────────────────────────────────────────────────
function Tumbleweed() {
  const dark = useDarkMode()
  const color = dark ? "#86a82e" : "#a3be48"

  return (
    <motion.div
      className="absolute bottom-24 pointer-events-none"
      initial={{ x: "-8vw", opacity: 0 }}
      animate={{ x: "108vw", opacity: [0, 1, 1, 0], rotate: 720 }}
      transition={{ duration: 9, repeat: Infinity, repeatDelay: 6, ease: "linear" }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
        <line x1="4"  y1="20" x2="36" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="20" y1="4"  x2="20" y2="36" stroke={color} strokeWidth="1.5" />
        <line x1="8"  y1="8"  x2="32" y2="32" stroke={color} strokeWidth="1" />
        <line x1="32" y1="8"  x2="8"  y2="32" stroke={color} strokeWidth="1" />
      </svg>
    </motion.div>
  )
}

// ─── Main 404 page ────────────────────────────────────────────────────────────
export default function NotFound() {
  const t = useNotFoundT()
  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-zinc-950 flex flex-col items-center justify-center font-sans overflow-hidden relative transition-colors duration-300">

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Decorative hanging wire — left */}
      <svg
        className="absolute top-0 left-10 w-24 h-full pointer-events-none opacity-40 text-zinc-500 dark:text-zinc-500"
        viewBox="0 0 100 800"
        preserveAspectRatio="none"
      >
        <path d="M50 0 Q 50 400 10 500 T 50 780" stroke="currentColor" fill="transparent" strokeWidth="3" />
      </svg>

      {/* Decorative hanging wire — right */}
      <svg
        className="absolute top-0 right-10 w-24 h-full pointer-events-none opacity-40 text-zinc-500 dark:text-zinc-500"
        viewBox="0 0 100 800"
        preserveAspectRatio="none"
      >
        <path d="M50 0 Q 50 400 90 500 T 50 780" stroke="currentColor" fill="transparent" strokeWidth="3" />
      </svg>

      {/* Main content */}
      <div className="text-center z-10 flex flex-col items-center px-4">

        {/* Label */}
        <motion.p
          className="text-[#4b8a08] dark:text-green-400 text-sm font-bold tracking-[0.3em] uppercase mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t.error}
        </motion.p>

        {/* 404 glitch number */}
        <motion.h1
          className="text-[#76c025] dark:text-lime-400 text-[140px] sm:text-[180px] leading-none font-black drop-shadow-[5px_5px_0px_rgba(0,0,0,0.85)] dark:drop-shadow-[5px_5px_0px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.35 }}
        >
          <GlitchDigit char="4" />
          <GlitchDigit char="0" />
          <GlitchDigit char="4" />
        </motion.h1>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-2"
        >
          <h2 className="text-[#4b8a08] dark:text-green-400 text-2xl sm:text-3xl font-black tracking-widest uppercase">
            {t.oops}
          </h2>
          <h3 className="text-[#4b8a08] dark:text-green-400 text-lg sm:text-xl font-semibold uppercase tracking-tight mt-1">
            {t.subtitle}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-xs mx-auto">
            {t.description}
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/"
              className="bg-[#76c025] dark:bg-lime-500 text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:bg-[#65a321] dark:hover:bg-lime-600 transition-colors inline-block"
            >
              {t.goHome}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={() => window.history.back()}
              className="bg-white dark:bg-zinc-800 text-[#4b8a08] dark:text-green-400 border-2 border-[#76c025] dark:border-lime-500 px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-[#f0fce8] dark:hover:bg-zinc-700 transition-colors"
            >
              {t.goBack}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Illustrations */}
      <motion.div
        className="flex items-end justify-center gap-12 sm:gap-24 mt-10 w-full max-w-xl px-4 relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
      >
        <BrokenBulb />
        <WitheredPlant />
      </motion.div>

      {/* Rolling tumbleweed */}
      <Tumbleweed />

      {/* Ground line */}
      <div className="absolute bottom-20 left-0 right-0 h-px bg-zinc-300/60 dark:bg-zinc-700/60 pointer-events-none" />
    </div>
  )
}
