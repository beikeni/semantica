import { useAudioStore } from '@/stores/audio-store';
import { Label } from '@/components/ui/label';

export function AutoSubmitToggle() {
  const autoSubmitEnabled = useAudioStore((state) => state.autoSubmitEnabled);
  const setAutoSubmit = useAudioStore((state) => state.setAutoSubmit);

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="autoSubmit"
        checked={autoSubmitEnabled}
        onChange={(e) => setAutoSubmit(e.target.checked)}
        className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
      />
      <Label htmlFor="autoSubmit" className="text-sm cursor-pointer">
        Auto-submit on silence
      </Label>
    </div>
  );
}

