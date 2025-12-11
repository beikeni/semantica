import { useConversationStore } from '@/stores/conversation-store';
import { useAudioStore } from '@/stores/audio-store';
import { cn } from '@/lib/utils';

export function TranscriptPreview() {
  const currentTranscript = useConversationStore((state) => state.currentTranscript);
  const interimTranscript = useAudioStore((state) => state.interimTranscript);
  const isRecording = useAudioStore((state) => state.isRecording);

  // Show interim transcript while recording, or final transcript when stopped
  const displayText = isRecording 
    ? (interimTranscript || currentTranscript || 'Listening...')
    : currentTranscript;

  if (!displayText && !isRecording) {
    return null;
  }

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-colors',
      isRecording 
        ? 'bg-muted/50 border-muted-foreground/20' 
        : 'bg-background border-border'
    )}>
      <p className={cn(
        'text-sm',
        isRecording && !interimTranscript && !currentTranscript
          ? 'text-muted-foreground italic'
          : 'text-foreground'
      )}>
        {displayText}
      </p>
      {isRecording && interimTranscript && (
        <p className="text-xs text-muted-foreground mt-1">
          (Listening for more...)
        </p>
      )}
    </div>
  );
}

