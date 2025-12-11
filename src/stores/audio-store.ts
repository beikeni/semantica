import { create } from "zustand";
import type {
  ConnectionStatus,
  ServerMessage,
  ClientMessage,
  WorkletMessage,
} from "@/types";

interface AudioState {
  // Connection state
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Recording state
  isRecording: boolean;
  interimTranscript: string; // Real-time "recognizing" text

  // Settings
  language: string;
  autoSubmitEnabled: boolean;

  // Metrics
  bytesPerSecond: number;
  packetsPerSecond: number;

  // Internal refs (not reactive, stored via actions)
  _ws: WebSocket | null;
  _audioContext: AudioContext | null;
  _mediaStream: MediaStream | null;
  _recorder: AudioWorkletNode | null;
  _source: MediaStreamAudioSourceNode | null;

  // Actions - Connection
  connect: () => void;
  disconnect: () => void;

  // Actions - Recording
  startRecording: () => Promise<void>;
  stopRecording: () => void;

  // Actions - Settings
  setLanguage: (lang: string) => void;
  setAutoSubmit: (enabled: boolean) => void;

  // Actions - Internal
  _setConnectionStatus: (status: ConnectionStatus) => void;
  _setIsRecording: (recording: boolean) => void;
  _setInterimTranscript: (text: string) => void;
  _setMetrics: (bytes: number, packets: number) => void;
  _handleServerMessage: (msg: ServerMessage) => void;
  _sendMessage: (msg: ClientMessage) => void;
  _sendAudioData: (buffer: ArrayBuffer) => void;
  _cleanup: () => void;
}

// Callbacks that need to be wired to conversation store
let onFinalTranscript: ((text: string) => void) | null = null;
let onSilenceTimeout: (() => void) | null = null;

export function setAudioCallbacks(callbacks: {
  onFinalTranscript: (text: string) => void;
  onSilenceTimeout: () => void;
}) {
  onFinalTranscript = callbacks.onFinalTranscript;
  onSilenceTimeout = callbacks.onSilenceTimeout;
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  // Initial state
  connectionStatus: "disconnected",
  isConnected: false,
  isRecording: false,
  interimTranscript: "",
  language: "pt-BR",
  autoSubmitEnabled: false,
  bytesPerSecond: 0,
  packetsPerSecond: 0,

  // Internal refs
  _ws: null,
  _audioContext: null,
  _mediaStream: null,
  _recorder: null,
  _source: null,

  // Connection actions
  connect: () => {
    const state = get();
    if (state._ws && state._ws.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected");
      return;
    }

    set({ connectionStatus: "connecting" });

    // Determine WebSocket URL
    // In development, WebSocket server runs on port 1337
    // In production, it runs on the same host
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const isDev = hostname === "localhost" || hostname === "127.0.0.1";
    const wsPort = isDev ? "1337" : window.location.port;
    const wsUrl = `${protocol}//${hostname}:${wsPort}`;

    console.log("[WS] Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WS] Connected");
      set({
        connectionStatus: "connected",
        isConnected: true,
        _ws: ws,
      });
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      set({
        connectionStatus: "disconnected",
        isConnected: false,
        _ws: null,
      });
    };

    ws.onerror = (error) => {
      console.error("[WS] Error:", error);
      set({ connectionStatus: "error" });
    };

    ws.onmessage = (event) => {
      // Handle binary data (shouldn't receive any, but just in case)
      if (event.data instanceof Blob) {
        console.log("[WS] Received binary data (unexpected)");
        return;
      }

      // Handle JSON messages
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        get()._handleServerMessage(msg);
      } catch (e) {
        console.error("[WS] Failed to parse message:", event.data);
      }
    };

    set({ _ws: ws });
  },

  disconnect: () => {
    const state = get();
    state._cleanup();

    if (state._ws) {
      state._ws.close();
      set({ _ws: null });
    }

    set({
      connectionStatus: "disconnected",
      isConnected: false,
      isRecording: false,
    });
  },

  // Recording actions
  startRecording: async () => {
    const state = get();

    // Ensure connected
    if (!state.isConnected) {
      state.connect();
      // Wait for connection
      await new Promise<void>((resolve) => {
        const checkConnection = setInterval(() => {
          if (get().isConnected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          resolve();
        }, 5000);
      });
    }

    if (!get().isConnected) {
      console.error("[Audio] Failed to connect");
      return;
    }

    console.log("[Audio] Starting recording...");

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Create AudioContext
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();

      // Send sample rate to server
      get()._sendMessage({ event: "settings", data: audioContext.sampleRate });
      console.log("[Audio] Sample rate:", audioContext.sampleRate);

      // Send language
      get()._sendMessage({ event: "language_code", data: state.language });

      // Send session info (minimal for React app)
      get()._sendMessage({ event: "session_info", data: "React STA Demo" });

      // Start Azure stream
      get()._sendMessage({ event: "startAzureStream" });

      // Load AudioWorklet
      await audioContext.audioWorklet.addModule("/recorder.worklet.js");
      console.log("[Audio] Worklet loaded");

      // Create audio graph
      const source = audioContext.createMediaStreamSource(stream);
      const recorder = new AudioWorkletNode(audioContext, "recorder.worklet");

      // Connect: source -> recorder -> destination
      source.connect(recorder);
      recorder.connect(audioContext.destination);

      // Handle worklet messages
      recorder.port.onmessage = (e: MessageEvent<WorkletMessage>) => {
        const msg = e.data;

        switch (msg.eventType) {
          case "data":
            if (msg.buffer) {
              get()._sendAudioData(msg.buffer);
            }
            break;

          case "silence_timeout":
            console.log("[Audio] Silence timeout");
            if (onSilenceTimeout) {
              onSilenceTimeout();
            }
            break;

          case "speech_detected":
            console.log("[Audio] Speech detected");
            break;

          case "stop":
            console.log("[Audio] Worklet stopped");
            get()._cleanup();
            break;
        }
      };

      // Send input source
      get()._sendMessage({ event: "input_source", data: "react-sta-demo" });

      // Store refs
      set({
        _audioContext: audioContext,
        _mediaStream: stream,
        _recorder: recorder,
        _source: source,
        isRecording: true,
        interimTranscript: "",
      });

      console.log("[Audio] Recording started");
    } catch (error) {
      console.error("[Audio] Failed to start recording:", error);
      get()._cleanup();
    }
  },

  stopRecording: () => {
    const state = get();

    console.log("[Audio] Stopping recording...");

    // Tell server to stop Azure stream
    if (state.isConnected) {
      state._sendMessage({ event: "endAzureStream" });
    }

    // Tell worklet to stop
    if (state._recorder) {
      state._recorder.port.postMessage({ eventType: "stop" });
    }

    state._cleanup();
    set({ isRecording: false });
  },

  // Settings actions
  setLanguage: (language) => set({ language }),
  setAutoSubmit: (autoSubmitEnabled) => set({ autoSubmitEnabled }),

  // Internal actions
  _setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  _setIsRecording: (isRecording) => set({ isRecording }),
  _setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
  _setMetrics: (bytesPerSecond, packetsPerSecond) =>
    set({ bytesPerSecond, packetsPerSecond }),

  _handleServerMessage: (msg) => {
    switch (msg.event) {
      case "speechData":
        console.log("[WS] Speech data:", msg.data);
        if (onFinalTranscript) {
          onFinalTranscript(msg.data);
        }
        set({ interimTranscript: "" });
        break;

      case "azure_event":
        if (msg.data.type === "recognizing") {
          set({ interimTranscript: msg.data.text ?? "" });
        } else if (msg.data.type === "recognized") {
          console.log("[WS] Recognized:", msg.data.text);
          if (onFinalTranscript && msg.data.text) {
            onFinalTranscript(msg.data.text);
          }
          set({ interimTranscript: "" });
        } else if (msg.data.type === "nomatch") {
          console.log("[WS] No speech recognized");
        } else if (msg.data.type === "canceled") {
          console.error("[WS] Recognition canceled:", msg.data.error);
        }
        break;

      case "stream_status":
        console.log("[WS] Stream status:", msg.data.status);
        break;

      case "stream_metrics":
        set({
          bytesPerSecond: msg.data.bytesPerSecond,
          packetsPerSecond: msg.data.packetsPerSecond,
        });
        break;

      case "error":
        console.error("[WS] Server error:", msg.data);
        break;
    }
  },

  _sendMessage: (msg) => {
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.warn("[WS] Cannot send message, not connected");
    }
  },

  _sendAudioData: (buffer) => {
    const ws = get()._ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(buffer);
    }
  },

  _cleanup: () => {
    const state = get();

    // Stop media tracks
    if (state._mediaStream) {
      state._mediaStream.getTracks().forEach((track) => track.stop());
    }

    // Disconnect recorder
    if (state._recorder) {
      state._recorder.disconnect();
    }

    // Disconnect source
    if (state._source) {
      state._source.disconnect();
    }

    // Close audio context
    if (state._audioContext) {
      state._audioContext.close().catch(console.error);
    }

    set({
      _audioContext: null,
      _mediaStream: null,
      _recorder: null,
      _source: null,
    });
  },
}));
