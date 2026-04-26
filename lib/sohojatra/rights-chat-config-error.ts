/** Missing or invalid LLM credentials for the constitutional chatbot. */
export class RightsChatConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RightsChatConfigError"
  }
}
