import { useAudioStore } from '@/stores/audio-store';
import { cn } from '@/lib/utils';

export function RecordingStatus() {
  const isRecording = useAudioStore((state) => state.isRecording);
  const connectionStatus = useAudioStore((state) => state.connectionStatus);
  const bytesPerSecond = useAudioStore((state) => state.bytesPerSecond);

  if (!isRecording) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 rounded-lg">
      {/* Pulsing dot */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
      </span>
      
      <span className="text-sm font-medium text-destructive">
        Recording...
      </span>

      {/* Audio level indicator */}
      {bytesPerSecond > 0 && (
        <span className="text-xs text-muted-foreground">
          {Math.round(bytesPerSecond / 1024)} KB/s
        </span>
      )}
    </div>
  );
}

export function ConnectionBadge() {
  const connectionStatus = useAudioStore((state) => state.connectionStatus);
  const isRecording = useAudioStore((state) => state.isRecording);

  const statusConfig = {
    disconnected: { label: 'Disconnected', className: 'bg-muted text-muted-foreground' },
    connecting: { label: 'Connecting...', className: 'bg-yellow-500/20 text-yellow-600' },
    connected: { label: 'Connected', className: 'bg-green-500/20 text-green-600' },
    error: { label: 'Error', className: 'bg-destructive/20 text-destructive' }
  };

  const config = statusConfig[connectionStatus];

  // Show "Recording" status when actively recording
  if (isRecording) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
        Recording
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      config.className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        connectionStatus === 'connected' ? 'bg-green-600' :
        connectionStatus === 'connecting' ? 'bg-yellow-600 animate-pulse' :
        connectionStatus === 'error' ? 'bg-destructive' :
        'bg-muted-foreground'
      )} />
      {config.label}
    </span>
  );
}

