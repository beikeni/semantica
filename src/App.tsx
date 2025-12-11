import "./index.css";
import { useStoreSync } from "@/hooks/use-store-sync";
import { useConversationStore } from "@/stores/conversation-store";
import { LessonSelector, ThreadSelector } from "@/components/lesson";
import { ChatContainer } from "@/components/chat";
import {
  RecordButton,
  RecordingStatus,
  TranscriptPreview,
  AutoSubmitToggle,
  ConnectionBadge,
} from "@/components/voice";
import { DebugPanel } from "@/components/debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function App() {
  // Sync stores (must be called at root)
  useStoreSync();

  const resetForm = useConversationStore((state) => state.resetForm);

  return (
    <div className="container mx-auto p-4 max-w-6xl min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">STA AI Agent</h1>
          <p className="text-sm text-muted-foreground">
            Portuguese Language Learning Assistant
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionBadge />
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Settings */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ThreadSelector />
            <LessonSelector />
            <div className="pt-4 border-t">
              <AutoSubmitToggle />
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Chat & Voice */}
        <Card className="lg:col-span-2 flex flex-col min-h-[600px]">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>

          {/* Chat Messages */}
          <ChatContainer />

          {/* Voice Input Area */}
          <div className="p-4 border-t space-y-3">
            <RecordingStatus />
            <TranscriptPreview />
            <RecordButton />
          </div>
        </Card>
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}

export default App;
