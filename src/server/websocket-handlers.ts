import { logger, timestamp } from "./logger";
import { setLanguage } from "./speech/azure-config";
import {
  createSessionState,
  startRecognition,
  stopRecognition,
  writeAudioChunk,
} from "./speech/recognizer";
import type { SpeechWebSocket, SessionState, ClientMessage, ServerMessage } from "./speech/types";

function send(ws: SpeechWebSocket, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg));
}

export function handleOpen(ws: SpeechWebSocket): void {
  console.log("Connection received");
  ws.data.state = createSessionState();
}

export function handleClose(ws: SpeechWebSocket): void {
  logger.warn("WebSocket disconnected");
  stopRecognition(ws.data.state);
}

export function handleMessage(ws: SpeechWebSocket, message: string | Buffer): void {
  const state = ws.data.state;

  // Binary data = audio chunk
  if (message instanceof Buffer || message instanceof ArrayBuffer) {
    handleAudioData(ws, state, message);
    return;
  }

  // Text data = JSON event
  try {
    const msg = JSON.parse(message) as ClientMessage;
    handleEvent(ws, state, msg);
  } catch {
    logger.error(`Invalid message format: ${message}`);
  }
}

function handleEvent(ws: SpeechWebSocket, state: SessionState, msg: ClientMessage): void {
  switch (msg.event) {
    case "settings":
      logger.warn("This event is no longer needed as the Azure SDK will set the sample rate automatically.");
      logger.info(`${timestamp()} - Sample_rate: ${msg.data}`);
      if (msg.data && !isNaN(msg.data)) {
        state.inputSampleRate = Number(msg.data);
      }
      break;

    case "language_code":
      logger.info(`${timestamp()} - Language Code: ${msg.data}`);
      setLanguage(msg.data);
      break;

    case "session_info":
      logger.info(`${timestamp()} - Session Info: ${msg.data}`);
      break;

    case "startAzureStream":
      logger.info(`${timestamp()} - Start Azure Streaming`);
      console.log("Start Azure Streaming");
      resetMetrics(state);
      send(ws, { event: "stream_status", data: { status: "started" } });
      startRecognition(state, ws);
      break;

    case "endAzureStream":
      logger.info(`${timestamp()} - Stop Azure Streaming`);
      console.log("Stop Azure Streaming");
      stopRecognition(state);
      send(ws, { event: "stream_status", data: { status: "stopped" } });
      break;

    case "input_source":
      state.inputSource = msg.data;
      break;
  }
}

function handleAudioData(
  ws: SpeechWebSocket,
  state: SessionState,
  data: Buffer | ArrayBuffer
): void {
  // Auto-start if first audio chunk arrives before startAzureStream
  if (!state.pushStream) {
    startRecognition(state, ws);
  }
  writeAudioChunk(state, data);
  trackMetrics(state, data, ws);
}

function resetMetrics(state: SessionState): void {
  state.bytesReceived = 0;
  state.dataPackets = 0;
  state.lastBytesLogAt = Date.now();
}

function trackMetrics(
  state: SessionState,
  data: Buffer | ArrayBuffer,
  ws: SpeechWebSocket
): void {
  const len = data instanceof ArrayBuffer ? data.byteLength : data.length;
  state.bytesReceived += len;
  state.dataPackets += 1;

  const now = Date.now();
  if (now - state.lastBytesLogAt >= 1000) {
    const bps = state.bytesReceived;
    logger.info(`Audio ingress ~${bps} B/s, packets ${state.dataPackets}/s`);
    console.log(`Audio ingress ~${bps} B/s, packets ${state.dataPackets}/s`);
    send(ws, {
      event: "stream_metrics",
      data: { bytesPerSecond: bps, packetsPerSecond: state.dataPackets },
    });
    state.bytesReceived = 0;
    state.dataPackets = 0;
    state.lastBytesLogAt = now;
  }
}

