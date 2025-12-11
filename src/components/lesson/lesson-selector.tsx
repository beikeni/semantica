import { useConversationStore } from "@/stores/conversation-store";
import {
  getLevels,
  getStoriesForLevel,
  getChaptersForStory,
} from "@/constants/content-data";
import {
  MODE_OPTIONS,
  LAST_CLIENT_STATUS_OPTIONS,
} from "@/constants/agent-map";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function LessonSelector() {
  const {
    level,
    story,
    chapter,
    mode,
    learnerId,
    lastClientStatus,
    agentId,
    setLevel,
    setStory,
    setChapter,
    setMode,
    setLearnerId,
    setLastClientStatus,
  } = useConversationStore();

  const levels = getLevels();
  const stories = level ? getStoriesForLevel(level) : [];
  const chapters = level && story ? getChaptersForStory(level, story) : [];

  return (
    <div className="space-y-4">
      {/* Level Select */}
      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger id="level" className="w-full">
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Story Select */}
      <div className="space-y-2">
        <Label htmlFor="story">Story</Label>
        <Select value={story} onValueChange={setStory} disabled={!level}>
          <SelectTrigger id="story" className="w-full">
            <SelectValue placeholder="Select Story" />
          </SelectTrigger>
          <SelectContent>
            {stories.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chapter Select */}
      <div className="space-y-2">
        <Label htmlFor="chapter">Chapter</Label>
        <Select value={chapter} onValueChange={setChapter} disabled={!story}>
          <SelectTrigger id="chapter" className="w-full">
            <SelectValue placeholder="Select Chapter" />
          </SelectTrigger>
          <SelectContent>
            {chapters.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode Select */}
      <div className="space-y-2">
        <Label htmlFor="mode">Mode</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger id="mode" className="w-full">
            <SelectValue placeholder="Select Mode" />
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Last Client Status */}
      <div className="space-y-2">
        <Label htmlFor="lastClientStatus">Last Client Status</Label>
        <Select
          value={lastClientStatus || "__none__"}
          onValueChange={(val) =>
            setLastClientStatus(val === "__none__" ? "" : val)
          }
        >
          <SelectTrigger id="lastClientStatus" className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {LAST_CLIENT_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learner ID */}
      <div className="space-y-2">
        <Label htmlFor="learnerId">Learner ID</Label>
        <Input
          id="learnerId"
          value={learnerId}
          onChange={(e) => setLearnerId(e.target.value)}
          placeholder="L001"
        />
      </div>

      {/* Agent ID (read-only) */}
      {agentId && (
        <div className="space-y-2">
          <Label htmlFor="agentId" className="text-muted-foreground text-xs">
            Agent ID
          </Label>
          <Input
            id="agentId"
            value={agentId}
            readOnly
            className="text-xs font-mono bg-muted"
          />
        </div>
      )}
    </div>
  );
}
