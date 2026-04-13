import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Sohojatra — Civic Reporting for Dhaka"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Dynamic Open Graph image rendered at the edge.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Primary accent glow */}
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,.15), transparent 70%)",
            top: "10%",
            left: "15%",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(34,197,94,.1)",
            border: "1px solid rgba(34,197,94,.25)",
            borderRadius: 999,
            padding: "8px 20px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "#22c55e", fontSize: 18, fontWeight: 600 }}>
            For the citizens of Dhaka
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#f8fafc", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            Sohojatra
          </span>
          <span style={{ color: "#94a3b8", fontSize: 28, fontWeight: 400 }}>
            Report · Track · Resolve
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "#64748b",
            fontSize: 20,
            maxWidth: 600,
            textAlign: "center",
            marginTop: 28,
            lineHeight: 1.5,
          }}
        >
          A transparent civic platform where verified citizens report urban issues and track real-time resolutions.
        </div>

        {/* Bottom brand bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 48px",
            borderTop: "1px solid rgba(255,255,255,.06)",
          }}
        >
          <span style={{ color: "#475569", fontSize: 16 }}>sohojatra.app</span>
          <span style={{ color: "#475569", fontSize: 16 }}>🇧🇩 Built for Dhaka</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
