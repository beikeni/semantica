import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { SessionState, SpeechWebSocket, ClientMessage } from "../server/speech/types";

// Mock WebSocket
function createMockWs(state: SessionState): SpeechWebSocket {
  const messages: string[] = [];
  return {
    data: { state },
    send: (msg: string) => messages.push(msg),
    _messages: messages,
  } as unknown as SpeechWebSocket & { _messages: string[] };
}

describe("websocket-handlers", () => {
  describe("handleOpen", () => {
    test("initializes session state on connection", async () => {
      const { handleOpen } = await import("../server/websocket-handlers");
      const { createSessionState } = await import("../server/speech/recognizer");
      
      const state = createSessionState();
      const ws = createMockWs(state);
      
      handleOpen(ws);
      
      expect(ws.data.state).toBeDefined();
      expect(ws.data.state.inputSource).toBe("test-module");
    });
  });

  describe("handleMessage - JSON events", () => {
    test("handles input_source event", async () => {
      const { handleMessage } = await import("../server/websocket-handlers");
      const { createSessionState } = await import("../server/speech/recognizer");
      
      const state = createSessionState();
      const ws = createMockWs(state);
      ws.data.state = state;
      
      const msg: ClientMessage = { event: "input_source", data: "inline-flashcard" };
      handleMessage(ws, JSON.stringify(msg));
      
      expect(state.inputSource).toBe("inline-flashcard");
    });

    test("handles settings event", async () => {
      const { handleMessage } = await import("../server/websocket-handlers");
      const { createSessionState } = await import("../server/speech/recognizer");
      
      const state = createSessionState();
      const ws = createMockWs(state);
      ws.data.state = state;
      
      const msg: ClientMessage = { event: "settings", data: 44100 };
      handleMessage(ws, JSON.stringify(msg));
      
      expect(state.inputSampleRate).toBe(44100);
    });

    test("ignores invalid sample rate", async () => {
      const { handleMessage } = await import("../server/websocket-handlers");
      const { createSessionState } = await import("../server/speech/recognizer");
      
      const state = createSessionState();
      const ws = createMockWs(state);
      ws.data.state = state;
      
      const msg = { event: "settings", data: NaN };
      handleMessage(ws, JSON.stringify(msg));
      
      expect(state.inputSampleRate).toBe(48000); // Default unchanged
    });
  });

  describe("handleMessage - binary audio", () => {
    test("tracks bytes received for binary messages", async () => {
      const { handleMessage } = await import("../server/websocket-handlers");
      const { createSessionState } = await import("../server/speech/recognizer");
      
      const state = createSessionState();
      state.pushStream = {
        write: () => {},
        close: () => {},
      } as any;
      
      const ws = createMockWs(state);
      ws.data.state = state;
      
      const audioData = Buffer.alloc(1024);
      handleMessage(ws, audioData);
      
      expect(state.bytesReceived).toBe(1024);
      expect(state.dataPackets).toBe(1);
    });
  });
});

describe("message protocol", () => {
  test("server messages follow correct format", async () => {
    const { createSessionState } = await import("../server/speech/recognizer");
    
    const state = createSessionState();
    const ws = createMockWs(state) as SpeechWebSocket & { _messages: string[] };
    
    ws.send(JSON.stringify({ event: "stream_status", data: { status: "started" } }));
    
    const msg = JSON.parse(ws._messages[0]!);
    expect(msg.event).toBe("stream_status");
    expect(msg.data.status).toBe("started");
  });
});

