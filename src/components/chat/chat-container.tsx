import { useEffect, useRef } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { MessageCircle } from 'lucide-react';

export function ChatContainer() {
  const messages = useConversationStore((state) => state.messages);
  const isTyping = useConversationStore((state) => state.isTyping);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center">
          Start a conversation by recording your message
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
        />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  );
}

