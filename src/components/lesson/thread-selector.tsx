import { useConversationStore } from '@/stores/conversation-store';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ThreadSelector() {
  const currentThreadId = useConversationStore((state) => state.currentThreadId);
  const savedThreads = useConversationStore((state) => state.savedThreads);
  const setCurrentThreadId = useConversationStore((state) => state.setCurrentThreadId);
  const loadThread = useConversationStore((state) => state.loadThread);

  const threadIds = Object.keys(savedThreads);

  const handleChange = (value: string) => {
    if (value === '__new__') {
      setCurrentThreadId(null);
    } else {
      loadThread(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="threadId">Thread</Label>
      <Select 
        value={currentThreadId ?? '__new__'} 
        onValueChange={handleChange}
      >
        <SelectTrigger id="threadId" className="w-full">
          <SelectValue placeholder="New Thread" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__new__">
            + New Thread
          </SelectItem>
          {threadIds.map((threadId) => {
            const thread = savedThreads[threadId];
            const label = thread 
              ? `${threadId.slice(0, 8)}... (${thread.level}/${thread.story}/${thread.chapter})`
              : threadId;
            return (
              <SelectItem key={threadId} value={threadId}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {currentThreadId && (
        <p className="text-xs text-muted-foreground font-mono truncate">
          {currentThreadId}
        </p>
      )}
    </div>
  );
}

