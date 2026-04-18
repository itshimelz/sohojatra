type FeedbackChannel = "alert" | "toast"
type AuthPhase = "send" | "verify"

type AuthFeedback = {
  channel: FeedbackChannel
  message: string
}

export function mapAuthError(
  message: string,
  fallback: string,
  phase: AuthPhase = "verify"
): AuthFeedback {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("rate") ||
    normalized.includes("too many") ||
    normalized.includes("limit")
  ) {
    return {
      channel: "toast",
      message: "Too many attempts. Please wait a few minutes and try again.",
    }
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return {
      channel: "toast",
      message:
        "Network issue detected. Please check your connection and retry.",
    }
  }

  if (
    phase === "verify" &&
    (normalized.includes("invalid") || normalized.includes("otp"))
  ) {
    return {
      channel: "alert",
      message: "Invalid OTP. Please check the code and try again.",
    }
  }

  if (phase === "send" && normalized.includes("invalid")) {
    return {
      channel: "alert",
      message: "Could not send OTP. Please check your phone number.",
    }
  }

  return { channel: "toast", message: phase === "send" ? message : fallback }
}
