/**
 * Client-side TypeScript types for the STA AI Agent
 */

// ============================================================================
// Chat & Conversation Types
// ============================================================================

export interface ChatMessage {
  id: string;
  text: string;
  isAgent: boolean;
  timestamp: Date;
}

export interface ThreadData {
  threadId: string;
  level: string;
  story: string;
  chapter: string;
  mode: string;
  createdAt: Date;
}

// ============================================================================
// Form & Lesson Types
// ============================================================================

export type Level = "level-1" | "level-2" | "level-3";

export interface LessonSelection {
  level: string;
  story: string;
  chapter: string;
  mode: string;
  section: string;
  learnerId: string;
  lastClientStatus: string;
}

// ============================================================================
// WebSocket Protocol Types (matches server/speech/types.ts)
// ============================================================================

export interface StreamMetrics {
  bytesPerSecond: number;
  packetsPerSecond: number;
}

export interface AzureEvent {
  type:
    | "recognizing"
    | "recognized"
    | "nomatch"
    | "canceled"
    | "sessionStopped";
  text?: string;
  reason?: number;
  error?: string;
}

// Messages sent FROM client TO server
export type ClientMessage =
  | { event: "settings"; data: number }
  | { event: "language_code"; data: string }
  | { event: "session_info"; data: string }
  | { event: "startAzureStream"; data?: unknown }
  | { event: "endAzureStream"; data?: unknown }
  | { event: "input_source"; data: string };

// Messages sent FROM server TO client
export type ServerMessage =
  | { event: "speechData"; data: string }
  | { event: "inline_flashcard_data"; data: string }
  | { event: "stream_status"; data: { status: "started" | "stopped" } }
  | { event: "stream_metrics"; data: StreamMetrics }
  | { event: "azure_event"; data: AzureEvent }
  | { event: "error"; data: string };

// ============================================================================
// Audio Types
// ============================================================================

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WorkletMessage {
  eventType: "data" | "stop" | "silence_timeout" | "speech_detected" | "config";
  buffer?: ArrayBuffer;
  rms?: number;
  silenceThreshold?: number;
  silenceDurationMs?: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface APIRequest {
  agent: string;
  level: string;
  story: string;
  chapter: string;
  section: string;
  mode: string;
  query: string;
  last_client_status: string;
  thread_id: string;
  learner_id: string;
}

export interface APIResponse {
  answer_to_display?: string;
  learner_message?: string;
  thread_id?: string;
  threadId?: string;
  [key: string]: unknown;
}

// ============================================================================
// Debug Types
// ============================================================================

export interface DebugEntry {
  id: string;
  type: "REQUEST" | "RESPONSE" | "ERROR" | "INFO";
  title: string;
  timestamp: Date;
  payload: unknown;
  meta?: Record<string, unknown>;
}
