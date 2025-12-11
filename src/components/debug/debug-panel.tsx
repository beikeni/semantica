import { useState } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Download, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const debugEntries = useConversationStore((state) => state.debugEntries);
  const clearDebugEntries = useConversationStore((state) => state.clearDebugEntries);

  const handleDownload = () => {
    if (debugEntries.length === 0) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      entryCount: debugEntries.length,
      entries: debugEntries
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2"
      >
        {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronUp className="w-4 h-4 mr-2" />}
        {isOpen ? 'Hide' : 'Show'} Debug Data
        {debugEntries.length > 0 && (
          <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
            {debugEntries.length}
          </span>
        )}
      </Button>

      {/* Panel */}
      {isOpen && (
        <Card className="max-h-80 overflow-hidden flex flex-col shadow-lg">
          <CardHeader className="py-2 px-4 border-b flex-row items-center justify-between">
            <CardTitle className="text-sm">Debug Log</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                disabled={debugEntries.length === 0}
                title="Download debug data"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDebugEntries}
                disabled={debugEntries.length === 0}
                title="Clear debug entries"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {debugEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No debug data yet. Submit a request to see details here.
              </p>
            ) : (
              <div className="divide-y">
                {debugEntries.map((entry) => (
                  <DebugEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DebugEntry({ entry }: { entry: { id: string; type: string; title: string; timestamp: Date; payload: unknown; meta?: Record<string, unknown> } }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors = {
    REQUEST: 'bg-blue-500/20 text-blue-600',
    RESPONSE: 'bg-green-500/20 text-green-600',
    ERROR: 'bg-destructive/20 text-destructive',
    INFO: 'bg-muted text-muted-foreground'
  };

  const colorClass = typeColors[entry.type as keyof typeof typeColors] || typeColors.INFO;

  return (
    <div className="p-2 hover:bg-muted/50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', colorClass)}>
          {entry.type}
        </span>
        <span className="text-sm font-medium truncate flex-1">
          {entry.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {entry.timestamp.toLocaleTimeString()}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {entry.meta && Object.keys(entry.meta).length > 0 && (
            <div className="text-xs space-y-1">
              {Object.entries(entry.meta).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono truncate">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
            {JSON.stringify(entry.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

