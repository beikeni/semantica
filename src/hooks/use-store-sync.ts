import { useEffect } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { useAudioStore, setAudioCallbacks } from '@/stores/audio-store';

/**
 * Hook to sync audio store callbacks with conversation store
 * Must be called once at the app root level
 */
export function useStoreSync() {
  const setCurrentTranscript = useConversationStore((state) => state.setCurrentTranscript);
  const submitToAPI = useConversationStore((state) => state.submitToAPI);
  const autoSubmitEnabled = useAudioStore((state) => state.autoSubmitEnabled);
  const stopRecording = useAudioStore((state) => state.stopRecording);
  const currentTranscript = useConversationStore((state) => state.currentTranscript);

  useEffect(() => {
    setAudioCallbacks({
      onFinalTranscript: (text: string) => {
        setCurrentTranscript(text);
      },
      onSilenceTimeout: () => {
        // Stop recording first
        stopRecording();
        
        // Auto-submit if enabled and there's a transcript
        if (autoSubmitEnabled && currentTranscript.trim()) {
          submitToAPI();
        }
      }
    });
  }, [setCurrentTranscript, submitToAPI, autoSubmitEnabled, stopRecording, currentTranscript]);
}

