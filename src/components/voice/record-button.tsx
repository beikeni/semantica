import { useAudioStore } from '@/stores/audio-store';
import { useConversationStore } from '@/stores/conversation-store';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Loader2 } from 'lucide-react';

export function RecordButton() {
  const isRecording = useAudioStore((state) => state.isRecording);
  const isSubmitting = useConversationStore((state) => state.isSubmitting);
  const currentTranscript = useConversationStore((state) => state.currentTranscript);
  const lastClientStatus = useConversationStore((state) => state.lastClientStatus);
  const startRecording = useAudioStore((state) => state.startRecording);
  const stopRecording = useAudioStore((state) => state.stopRecording);
  const submitToAPI = useConversationStore((state) => state.submitToAPI);

  const isDialogueComplete = lastClientStatus === 'Dialogue Reading complete';
  const hasTranscript = currentTranscript.trim().length > 0;

  // Handle submit
  const handleSubmit = () => {
    if (isRecording) {
      stopRecording();
    }
    submitToAPI();
  };

  // If submitting, show loading state
  if (isSubmitting) {
    return (
      <Button 
        size="lg" 
        disabled 
        className="w-full h-14"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ml-2">Sending...</span>
      </Button>
    );
  }

  // If dialogue complete mode, show send button
  if (isDialogueComplete) {
    return (
      <Button 
        size="lg" 
        onClick={handleSubmit}
        className="w-full h-14"
      >
        <Send className="w-5 h-5" />
        <span className="ml-2">Send</span>
      </Button>
    );
  }

  // If recording, show stop button
  if (isRecording) {
    return (
      <Button 
        size="lg" 
        variant="destructive"
        onClick={stopRecording}
        className="w-full h-14 animate-pulse"
      >
        <Square className="w-5 h-5" />
        <span className="ml-2">Stop Recording</span>
      </Button>
    );
  }

  // If we have a transcript, show both record again and send
  if (hasTranscript) {
    return (
      <div className="flex gap-2">
        <Button 
          size="lg" 
          variant="outline"
          onClick={startRecording}
          className="flex-1 h-14"
        >
          <Mic className="w-5 h-5" />
          <span className="ml-2">Record Again</span>
        </Button>
        <Button 
          size="lg" 
          onClick={handleSubmit}
          className="flex-1 h-14"
        >
          <Send className="w-5 h-5" />
          <span className="ml-2">Send</span>
        </Button>
      </div>
    );
  }

  // Default: show record button
  return (
    <Button 
      size="lg" 
      onClick={startRecording}
      className="w-full h-14"
    >
      <Mic className="w-5 h-5" />
      <span className="ml-2">Start Recording</span>
    </Button>
  );
}

