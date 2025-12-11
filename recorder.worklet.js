/**
 * AudioWorklet Processor for real-time audio streaming
 * 
 * Responsibilities:
 * - Converts Float32 audio samples to 16-bit PCM
 * - Detects silence using RMS (Root Mean Square) calculation
 * - Automatically stops after prolonged silence
 * - Streams audio chunks to main thread via MessagePort
 */
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Silence detection configuration
    this.silenceThreshold = 0.01; // RMS threshold (0.001-0.1, lower = more sensitive)
    this.silenceDurationMs = 3000; // Milliseconds of silence before auto-stop
    this.sampleRate = 48000; // Sample rate (updated from AudioContext)
    
    // Silence tracking state
    this.silenceStartTime = null; // Timestamp when silence began
    this.lastSpeechTime = Date.now(); // Timestamp of last detected speech
    
    this.port.onmessage = (e) => {
      if (e.data && e.data.eventType === 'stop') {
        this.port.postMessage({ eventType: 'stop' });
      } else if (e.data && e.data.eventType === 'config') {
        if (e.data.silenceThreshold !== undefined) {
          this.silenceThreshold = e.data.silenceThreshold;
        }
        if (e.data.silenceDurationMs !== undefined) {
          this.silenceDurationMs = e.data.silenceDurationMs;
        }
      }
    };
  }

  /**
   * Calculate RMS (Root Mean Square) audio level
   * RMS provides a measure of average audio energy/amplitude
   * @param {Float32Array} channelData - Audio samples array
   * @returns {number} RMS value (0.0 = silence, higher = louder)
   */
  calculateRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }

  /**
   * Process audio input (called continuously by AudioWorklet)
   * 
   * For each audio chunk:
   * 1. Calculate RMS to detect silence
   * 2. Track silence duration
   * 3. Convert to 16-bit PCM format
   * 4. Send to main thread via MessagePort
   * 
   * @param {Array} inputs - Array of input audio buffers
   * @returns {boolean} false to stop processing, true to continue
   */
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0]; // Mono audio channel
      const now = Date.now();
      
      // Calculate audio level using RMS
      const rms = this.calculateRMS(channelData);
      const isSilence = rms < this.silenceThreshold;
      
      // Silence detection logic
      if (isSilence) {
        // Start tracking silence duration
        if (this.silenceStartTime === null) {
          this.silenceStartTime = now;
        }
        const silenceDuration = now - this.silenceStartTime;
        
        // Auto-stop after prolonged silence
        if (silenceDuration >= this.silenceDurationMs) {
          this.port.postMessage({ eventType: 'silence_timeout' });
          return false; // Stop processing (triggers cleanup in main thread)
        }
      } else {
        // Speech detected - reset silence timer
        if (this.silenceStartTime !== null) {
          this.port.postMessage({ eventType: 'speech_detected' });
        }
        this.silenceStartTime = null;
        this.lastSpeechTime = now;
      }
      
      // Convert Float32 audio samples [-1.0, 1.0] to 16-bit PCM (little-endian)
      // This format is required by Azure Speech SDK
      const len = channelData.length;
      const buffer = new ArrayBuffer(len * 2); // 2 bytes per sample (16-bit)
      const view = new DataView(buffer);
      for (let i = 0; i < len; i++) {
        let s = channelData[i];
        // Clamp to valid range
        s = Math.max(-1, Math.min(1, s));
        // Convert to 16-bit signed integer
        // Negative values: multiply by 0x8000, positive: multiply by 0x7FFF
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      // Send audio chunk and RMS level to main thread
      this.port.postMessage({ eventType: 'data', buffer, rms });
    }
    return true; // Continue processing
  }
}

registerProcessor('recorder.worklet', RecorderProcessor);

