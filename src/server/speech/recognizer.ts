import { sdk, getSpeechConfig } from "./azure-config";
import { logger, timestamp } from "../logger";
import type { SessionState, SpeechWebSocket, ServerMessage } from "./types";

const DEFAULT_SAMPLE_RATE = 48000;

export function createSessionState(): SessionState {
  return {
    pushStream: null,
    recognizer: null,
    inputSource: "test-module",
    inputSampleRate: DEFAULT_SAMPLE_RATE,
    bytesReceived: 0,
    dataPackets: 0,
    lastBytesLogAt: Date.now(),
  };
}

export function createPushStream(sampleRate: number): sdk.PushAudioInputStream {
  const format = sdk.AudioStreamFormat.getWaveFormatPCM(sampleRate, 16, 1);
  return sdk.AudioInputStream.createPushStream(format);
}

export function createRecognizer(
  pushStream: sdk.PushAudioInputStream
): sdk.SpeechRecognizer {
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  return new sdk.SpeechRecognizer(getSpeechConfig(), audioConfig);
}

function send(ws: SpeechWebSocket, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg));
}

export function setupRecognizerEvents(
  recognizer: sdk.SpeechRecognizer,
  ws: SpeechWebSocket,
  state: SessionState
): void {
  recognizer.recognizing = (
    _s: sdk.Recognizer,
    e: sdk.SpeechRecognitionEventArgs
  ) => {
    logger.info(`${timestamp()}: ${e.result.text}`);
    emitSpeechResult(ws, state.inputSource, e.result.text);
    send(ws, {
      event: "azure_event",
      data: { type: "recognizing", text: e.result.text },
    });
  };

  recognizer.recognized = (
    _s: sdk.Recognizer,
    e: sdk.SpeechRecognitionEventArgs
  ) => {
    if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
      logger.info(`${timestamp()}: RECOGNIZED: Text=${e.result.text}`);
      console.log(`RECOGNIZED: Text=${e.result.text}`);
      emitSpeechResult(ws, state.inputSource, e.result.text);
      send(ws, {
        event: "azure_event",
        data: { type: "recognized", text: e.result.text },
      });
    } else if (e.result.reason === sdk.ResultReason.NoMatch) {
      logger.info(`${timestamp()}: NOMATCH: Speech could not be recognized.`);
      console.log("NOMATCH: Speech could not be recognized.");
      send(ws, { event: "azure_event", data: { type: "nomatch" } });
    }
  };

  recognizer.canceled = (
    _s: sdk.Recognizer,
    e: sdk.SpeechRecognitionCanceledEventArgs
  ) => {
    logger.error(`CANCELED: Reason=${e.reason}`);
    console.log(`CANCELED: Reason=${e.reason}`);

    if (e.reason === sdk.CancellationReason.Error) {
      logger.error(`CANCELED: ErrorCode=${e.errorCode}`);
      logger.error(`CANCELED: ErrorDetails=${e.errorDetails}`);
      logger.error(
        "CANCELED: Did you set the speech resource key and region values?"
      );
      console.log(`CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
    }

    send(ws, { event: "error", data: e.errorDetails });
    send(ws, {
      event: "azure_event",
      data: { type: "canceled", reason: e.reason, error: e.errorDetails },
    });
  };

  recognizer.sessionStopped = () => {
    logger.info("Session stopped event.");
    console.log("\n    Session stopped event.");
    send(ws, { event: "azure_event", data: { type: "sessionStopped" } });
  };
}

function emitSpeechResult(
  ws: SpeechWebSocket,
  inputSource: string,
  text: string
): void {
  if (inputSource === "inline-flashcard") {
    send(ws, { event: "inline_flashcard_data", data: text });
  } else {
    send(ws, { event: "speechData", data: text });
  }
}

export function startRecognition(
  state: SessionState,
  ws: SpeechWebSocket
): void {
  if (!state.pushStream) {
    state.pushStream = createPushStream(state.inputSampleRate);
  }

  if (!state.recognizer) {
    state.recognizer = createRecognizer(state.pushStream);
    setupRecognizerEvents(state.recognizer, ws, state);
  }

  state.recognizer.startContinuousRecognitionAsync();
}

export function stopRecognition(state: SessionState): void {
  if (state.recognizer) {
    state.recognizer.stopContinuousRecognitionAsync(
      () => {
        state.recognizer?.close();
        state.recognizer = null;
      },
      (err: string) => {
        logger.error(`Error stopping recognition: ${err}`);
        state.recognizer = null;
      }
    );
  }

  if (state.pushStream) {
    state.pushStream.close();
    state.pushStream = null;
  }
}

export function writeAudioChunk(
  state: SessionState,
  data: ArrayBuffer | Buffer | Uint8Array
): void {
  if (!state.pushStream) return;

  try {
    let chunk: Buffer;
    if (data instanceof ArrayBuffer) {
      chunk = Buffer.from(new Uint8Array(data));
    } else if (ArrayBuffer.isView(data)) {
      chunk = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    } else {
      chunk = data as Buffer;
    }
    state.pushStream.write(new Uint8Array(chunk).buffer as ArrayBuffer);
  } catch (err) {
    logger.error(`Error writing to pushStream: ${err}`);
  }
}
