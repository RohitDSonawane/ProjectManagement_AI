declare module "@/api/client" {
  export type GenerateResponseResult = {
    type?: string
    content?: unknown
    status?: string
  }

  export function generateResponse(query: string): Promise<GenerateResponseResult>
  export function getBackendHealth(): Promise<unknown>
  export function getPublicHistory(limit?: number): Promise<unknown>
  export function getAnonymousUserId(): string
}
