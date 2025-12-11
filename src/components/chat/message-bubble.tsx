import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.isAgent;
  
  return (
    <div className={cn(
      'flex',
      isAgent ? 'justify-start' : 'justify-end'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2',
        isAgent 
          ? 'bg-muted text-foreground rounded-bl-md' 
          : 'bg-primary text-primary-foreground rounded-br-md'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={cn(
          'text-xs mt-1',
          isAgent ? 'text-muted-foreground' : 'text-primary-foreground/70'
        )}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

