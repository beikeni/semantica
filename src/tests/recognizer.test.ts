import { describe, test, expect } from "bun:test";
import { createSessionState } from "../server/speech/recognizer";

describe("recognizer", () => {
  describe("createSessionState", () => {
    test("creates initial state with correct defaults", () => {
      const state = createSessionState();
      
      expect(state.pushStream).toBeNull();
      expect(state.recognizer).toBeNull();
      expect(state.inputSource).toBe("test-module");
      expect(state.inputSampleRate).toBe(48000);
      expect(state.bytesReceived).toBe(0);
      expect(state.dataPackets).toBe(0);
      expect(state.lastBytesLogAt).toBeGreaterThan(0);
    });

    test("creates unique state instances", () => {
      const state1 = createSessionState();
      const state2 = createSessionState();
      
      state1.inputSource = "modified";
      expect(state2.inputSource).toBe("test-module");
    });
  });
});

describe("audio chunk handling", () => {
  test("handles ArrayBuffer input", async () => {
    const { writeAudioChunk, createSessionState } = await import("../server/speech/recognizer");
    const state = createSessionState();
    
    // Mock push stream - the implementation now passes ArrayBuffer
    const writtenChunks: ArrayBuffer[] = [];
    state.pushStream = {
      write: (chunk: ArrayBuffer) => writtenChunks.push(chunk),
      close: () => {},
    } as any;
    
    const arrayBuffer = new ArrayBuffer(16);
    new Uint8Array(arrayBuffer).fill(42);
    
    writeAudioChunk(state, arrayBuffer);
    
    expect(writtenChunks.length).toBe(1);
    expect(new Uint8Array(writtenChunks[0]!)[0]).toBe(42);
  });

  test("handles Uint8Array input", async () => {
    const { writeAudioChunk, createSessionState } = await import("../server/speech/recognizer");
    const state = createSessionState();
    
    const writtenChunks: ArrayBuffer[] = [];
    state.pushStream = {
      write: (chunk: ArrayBuffer) => writtenChunks.push(chunk),
      close: () => {},
    } as any;
    
    const uint8Array = new Uint8Array([1, 2, 3, 4]);
    
    writeAudioChunk(state, uint8Array);
    
    expect(writtenChunks.length).toBe(1);
    const result = new Uint8Array(writtenChunks[0]!);
    expect(result[0]).toBe(1);
    expect(result[3]).toBe(4);
  });

  test("handles Buffer input", async () => {
    const { writeAudioChunk, createSessionState } = await import("../server/speech/recognizer");
    const state = createSessionState();
    
    const writtenChunks: ArrayBuffer[] = [];
    state.pushStream = {
      write: (chunk: ArrayBuffer) => writtenChunks.push(chunk),
      close: () => {},
    } as any;
    
    const buffer = Buffer.from([5, 6, 7, 8]);
    
    writeAudioChunk(state, buffer);
    
    expect(writtenChunks.length).toBe(1);
    expect(new Uint8Array(writtenChunks[0]!)[0]).toBe(5);
  });

  test("does nothing when pushStream is null", async () => {
    const { writeAudioChunk, createSessionState } = await import("../server/speech/recognizer");
    const state = createSessionState();
    state.pushStream = null;
    
    // Should not throw
    expect(() => writeAudioChunk(state, new ArrayBuffer(8))).not.toThrow();
  });
});
