import type * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { ServerWebSocket } from "bun";

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
  reason?: sdk.CancellationReason;
  error?: string;
}

export interface SessionState {
  pushStream: sdk.PushAudioInputStream | null;
  recognizer: sdk.SpeechRecognizer | null;
  inputSource: string;
  inputSampleRate: number;
  bytesReceived: number;
  dataPackets: number;
  lastBytesLogAt: number;
}

export type SpeechWebSocket = ServerWebSocket<{ state: SessionState }>;

// WebSocket message protocol (replaces Socket.IO events)
export type ClientMessage =
  | { event: "settings"; data: number }
  | { event: "language_code"; data: string }
  | { event: "session_info"; data: string }
  | { event: "startAzureStream"; data?: unknown }
  | { event: "endAzureStream"; data?: unknown }
  | { event: "input_source"; data: string };

export type ServerMessage =
  | { event: "speechData"; data: string }
  | { event: "inline_flashcard_data"; data: string }
  | { event: "stream_status"; data: { status: "started" | "stopped" } }
  | { event: "stream_metrics"; data: StreamMetrics }
  | { event: "azure_event"; data: AzureEvent }
  | { event: "error"; data: string };
