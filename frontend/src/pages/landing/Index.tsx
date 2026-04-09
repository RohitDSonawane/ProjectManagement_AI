import { ArrowRight, Loader2 } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { generateResponse } from "@/api/client"

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4"
const CHAT_STORAGE_KEY = "pm_landing_chat_messages_v1"

type CaseStudyCard = {
  concept?: string
  story?: string
  problem?: string
  decision_point?: string
  concept_mapping?: string
  key_lessons?: string[]
  think_about_this?: string
}

type GenerateResult = {
  type?: string
  content?: unknown
  status?: string
}

type ChatMessage = {
  id: string
  role: "user" | "ai"
  mode: "text" | "card"
  text?: string
  card?: CaseStudyCard
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() || `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toText(value: unknown) {
  if (typeof value === "string") return value
  if (value === null || value === undefined) return ""

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function asCaseStudyCard(value: unknown): CaseStudyCard | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CaseStudyCard
  }

  return null
}

function toAiMessage(response: GenerateResult): ChatMessage {
  if (response.type === "case_study") {
    const card = asCaseStudyCard(response.content)
    if (card) {
      return {
        id: createMessageId(),
        role: "ai",
        mode: "card",
        card,
      }
    }
  }

  if (response.type === "chat") {
    return {
      id: createMessageId(),
      role: "ai",
      mode: "text",
      text: toText(response.content),
    }
  }

  return {
    id: createMessageId(),
    role: "ai",
    mode: "text",
    text: toText(response.content ?? response),
  }
}

export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const heroInputRef = useRef<HTMLInputElement | null>(null)
  const chatInputRef = useRef<HTMLInputElement | null>(null)
  const hasStartedChat = messages.length > 0 || isLoading

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return

      const restoredMessages: ChatMessage[] = parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const maybeText = typeof item.text === "string" ? item.text : undefined
          const maybeCard = asCaseStudyCard(item.card)

          return {
            id: typeof item.id === "string" ? item.id : createMessageId(),
            role: item.role === "user" ? "user" : "ai",
            mode: item.mode === "card" && maybeCard ? "card" : "text",
            text: maybeText,
            card: maybeCard || undefined,
          }
        })

      setMessages(restoredMessages)
    } catch {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-60)))
  }, [messages])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (isLoading) return

    const timer = window.setTimeout(() => {
      const target = hasStartedChat ? chatInputRef.current : heroInputRef.current
      if (!target) return

      const activeElement = document.activeElement as HTMLElement | null
      const isEditableElement =
        !!activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable)

      if (!isEditableElement || activeElement === target) {
        target.focus()
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hasStartedChat, isLoading, messages.length])

  const submitQuery = async (rawQuery: string) => {
    const trimmedQuery = rawQuery.trim()
    if (!trimmedQuery || isLoading) {
      return
    }

    setIsLoading(true)
    setError("")
    setQuery("")
    setMessages((previous) => [
      ...previous,
      {
        id: createMessageId(),
        role: "user",
        mode: "text",
        text: trimmedQuery,
      },
    ])

    try {
      const response = await generateResponse(trimmedQuery)
      setMessages((previous) => [...previous, toAiMessage(response)])
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to generate answer"
      setError(message)
      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: "ai",
          mode: "text",
          text: `Unable to generate a response right now. ${message}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskAi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitQuery(query)
  }

  return (
    <div className="bg-black">
      <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-black">
        <video
          src={HERO_VIDEO_URL}
          className="absolute inset-0 h-full w-full object-cover object-bottom"
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_18%,_rgba(158,206,255,0.3)_0%,_transparent_55%)]" />

        <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          {!hasStartedChat ? (
            <div className="mx-auto w-full max-w-4xl text-center">
              <h1 className="font-instrument text-4xl leading-[0.95] tracking-tight text-white [text-shadow:0_10px_40px_rgba(0,0,0,0.65)] sm:text-5xl md:text-7xl">
                PM Learning Agent
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90 [text-shadow:0_8px_30px_rgba(0,0,0,0.55)] md:text-base">
                Ask any project management concept and get a structured case study card with story,
                decision points, and key lessons.
              </p>

              <form className="mx-auto mt-7 w-full max-w-3xl" onSubmit={handleAskAi}>
                <div className="liquid-glass flex items-center gap-2 rounded-2xl border border-white/30 bg-black/30 py-2 pl-3 pr-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:gap-3 sm:py-3 sm:pl-5 sm:pr-3">
                  <input
                    ref={heroInputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder='Ask: "What is a Risk Register and how is it used in a real project?"'
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none md:text-base"
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-3"
                    aria-label="Ask AI"
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Asking...
                      </>
                    ) : (
                      <>
                        Ask AI
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-red-300/55 bg-red-900/30 px-4 py-3 text-left text-sm text-red-100">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto flex h-[calc(100svh-1.5rem)] w-full max-w-5xl flex-col py-2 sm:h-[calc(100svh-2rem)] sm:py-4">
              <div className="liquid-glass rounded-2xl border border-white/30 bg-black/30 px-4 py-3">
                <p className="text-sm font-semibold tracking-wide text-white">PM Learning Agent Chat</p>
                <p className="mt-1 text-xs text-white/70">Your conversation stays here while you ask follow-up questions.</p>
              </div>

              <div className="liquid-glass mt-3 flex-1 overflow-hidden rounded-2xl border border-white/30 bg-black/35">
                <div className="h-full overflow-y-auto p-3 text-left sm:p-5">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                      >
                        <div
                          className={
                            message.role === "user"
                              ? "max-w-[90%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm text-black sm:max-w-[85%] md:text-base"
                              : "max-w-[90%] rounded-2xl rounded-tl-md border border-white/25 bg-black/45 px-4 py-3 text-sm text-white/95 sm:max-w-[85%] md:text-base"
                          }
                        >
                          {message.mode === "text" && message.text && (
                            message.role === "ai" ? (
                              <div className="text-sm leading-relaxed text-white/95 md:text-base">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                    h1: ({ children }) => <h1 className="mb-2 text-xl font-semibold">{children}</h1>,
                                    h2: ({ children }) => <h2 className="mb-2 text-lg font-semibold">{children}</h2>,
                                    h3: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
                                    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                                    li: ({ children }) => <li>{children}</li>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="mb-3 border-l-2 border-white/25 pl-3 italic text-white/85 last:mb-0">
                                        {children}
                                      </blockquote>
                                    ),
                                    code: ({ children }) => (
                                      <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">{children}</code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className="mb-3 overflow-x-auto rounded-xl bg-black/45 p-3 text-sm last:mb-0">{children}</pre>
                                    ),
                                    table: ({ children }) => (
                                      <div className="mb-3 overflow-x-auto last:mb-0">
                                        <table className="w-full min-w-[480px] border-collapse text-left text-sm">{children}</table>
                                      </div>
                                    ),
                                    th: ({ children }) => (
                                      <th className="border border-white/20 bg-white/10 px-2 py-1.5 font-semibold">{children}</th>
                                    ),
                                    td: ({ children }) => (
                                      <td className="border border-white/20 px-2 py-1.5 align-top">{children}</td>
                                    ),
                                    hr: () => <hr className="my-3 border-white/20" />,
                                  }}
                                >
                                  {message.text}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                            )
                          )}

                          {message.mode === "card" && message.card && (
                            <div>
                              <h3 className="mb-3 text-base font-semibold tracking-tight text-white md:text-lg">
                                {message.card.concept || "Case Study Card"}
                              </h3>

                              {message.card.story && (
                                <div className="mb-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Story</p>
                                  <p className="leading-relaxed">{message.card.story}</p>
                                </div>
                              )}

                              {message.card.problem && (
                                <div className="mb-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Problem</p>
                                  <p className="leading-relaxed">{message.card.problem}</p>
                                </div>
                              )}

                              {message.card.decision_point && (
                                <div className="mb-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Decision Point</p>
                                  <p className="leading-relaxed">{message.card.decision_point}</p>
                                </div>
                              )}

                              {message.card.concept_mapping && (
                                <div className="mb-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Concept Mapping</p>
                                  <p className="leading-relaxed">{message.card.concept_mapping}</p>
                                </div>
                              )}

                              {Array.isArray(message.card.key_lessons) && message.card.key_lessons.length > 0 && (
                                <div className="mb-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Key Lessons</p>
                                  <ul className="list-disc space-y-1 pl-5">
                                    {message.card.key_lessons.map((lesson) => (
                                      <li key={`${message.id}-${lesson}`}>{lesson}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {message.card.think_about_this && (
                                <div>
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Think About This</p>
                                  <p className="leading-relaxed">{message.card.think_about_this}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/25 bg-black/45 px-4 py-3 text-sm text-white/90">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>
                </div>
              </div>

              <form
                className="liquid-glass mt-3 flex items-center gap-2 rounded-2xl border border-white/30 bg-black/30 py-2 pl-3 pr-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:gap-3 sm:py-3 sm:pl-5 sm:pr-3"
                onSubmit={handleAskAi}
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask a follow-up question"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none md:text-base"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-3"
                  aria-label="Send message"
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-3 rounded-2xl border border-red-300/55 bg-red-900/30 px-4 py-3 text-left text-sm text-red-100">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Disabled long-form landing sections to avoid stacking and keep chat-first UX. */}
      {/*
      <AboutSection />
      <FeaturedVideoSection />
      <PhilosophySection />
      <ServicesSection />
      */}
    </div>
  )
}
