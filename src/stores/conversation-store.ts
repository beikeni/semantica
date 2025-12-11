import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ThreadData, APIRequest, APIResponse, DebugEntry } from '@/types';
import { getAgentForLevel, API_ENDPOINT } from '@/constants/agent-map';

// Storage keys (different from sta-demo for fresh start)
const STORAGE_KEY = 'sta3_conversation';

interface ConversationState {
  // Form state
  level: string;
  story: string;
  chapter: string;
  mode: string;
  section: string;
  learnerId: string;
  lastClientStatus: string;
  
  // Computed from level
  agentId: string;
  
  // Chat state
  messages: ChatMessage[];
  isTyping: boolean;
  isSubmitting: boolean;
  
  // Thread management
  currentThreadId: string | null;
  savedThreads: Record<string, ThreadData>;
  
  // Debug
  debugEntries: DebugEntry[];
  
  // Current transcript (from voice input)
  currentTranscript: string;
  
  // Actions - Form
  setLevel: (level: string) => void;
  setStory: (story: string) => void;
  setChapter: (chapter: string) => void;
  setMode: (mode: string) => void;
  setSection: (section: string) => void;
  setLearnerId: (id: string) => void;
  setLastClientStatus: (status: string) => void;
  
  // Actions - Chat
  addMessage: (text: string, isAgent: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  clearMessages: () => void;
  
  // Actions - Thread
  setCurrentThreadId: (threadId: string | null) => void;
  saveThread: (threadId: string) => void;
  loadThread: (threadId: string) => void;
  
  // Actions - Transcript
  setCurrentTranscript: (transcript: string) => void;
  clearTranscript: () => void;
  
  // Actions - Debug
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void;
  clearDebugEntries: () => void;
  
  // Actions - API
  submitToAPI: () => Promise<void>;
  
  // Actions - Reset
  resetForm: () => void;
}

const initialFormState = {
  level: '',
  story: '',
  chapter: '',
  mode: '',
  section: 'Scripts',
  learnerId: 'L001',
  lastClientStatus: '',
  agentId: '',
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialFormState,
      messages: [],
      isTyping: false,
      isSubmitting: false,
      currentThreadId: null,
      savedThreads: {},
      debugEntries: [],
      currentTranscript: '',
      
      // Form actions
      setLevel: (level) => set({ 
        level, 
        agentId: getAgentForLevel(level),
        // Reset dependent fields when level changes
        story: '',
        chapter: ''
      }),
      
      setStory: (story) => set({ 
        story,
        // Reset chapter when story changes
        chapter: ''
      }),
      
      setChapter: (chapter) => set({ chapter }),
      setMode: (mode) => set({ mode }),
      setSection: (section) => set({ section }),
      setLearnerId: (learnerId) => set({ learnerId }),
      setLastClientStatus: (lastClientStatus) => set({ lastClientStatus }),
      
      // Chat actions
      addMessage: (text, isAgent) => {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          text,
          isAgent,
          timestamp: new Date()
        };
        set((state) => ({
          messages: [...state.messages, message]
        }));
      },
      
      setIsTyping: (isTyping) => set({ isTyping }),
      
      clearMessages: () => set({ messages: [] }),
      
      // Thread actions
      setCurrentThreadId: (currentThreadId) => set({ currentThreadId }),
      
      saveThread: (threadId) => {
        const state = get();
        const threadData: ThreadData = {
          threadId,
          level: state.level,
          story: state.story,
          chapter: state.chapter,
          mode: state.mode,
          createdAt: new Date()
        };
        set((state) => ({
          currentThreadId: threadId,
          savedThreads: {
            ...state.savedThreads,
            [threadId]: threadData
          }
        }));
      },
      
      loadThread: (threadId) => {
        const state = get();
        const thread = state.savedThreads[threadId];
        if (thread) {
          set({
            currentThreadId: threadId,
            level: thread.level,
            story: thread.story,
            chapter: thread.chapter,
            mode: thread.mode,
            agentId: getAgentForLevel(thread.level)
          });
        }
      },
      
      // Transcript actions
      setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
      clearTranscript: () => set({ currentTranscript: '' }),
      
      // Debug actions
      addDebugEntry: (entry) => {
        const debugEntry: DebugEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };
        set((state) => ({
          debugEntries: [debugEntry, ...state.debugEntries].slice(0, 50) // Keep max 50 entries
        }));
      },
      
      clearDebugEntries: () => set({ debugEntries: [] }),
      
      // API submission
      submitToAPI: async () => {
        const state = get();
        
        if (state.isSubmitting) {
          console.log('Already submitting, ignoring...');
          return;
        }
        
        set({ isSubmitting: true });
        
        // Use transcript as query
        const queryValue = state.currentTranscript.trim();
        
        // Add user message to chat
        if (queryValue) {
          get().addMessage(queryValue, false);
        } else if (state.lastClientStatus === 'Dialogue Reading complete') {
          get().addMessage('Dialogue Reading completed', false);
        }
        
        // Clear transcript
        set({ currentTranscript: '' });
        
        // Build request
        const formData: APIRequest = {
          agent: state.agentId,
          level: state.level,
          story: state.story,
          chapter: state.chapter,
          section: state.section,
          mode: state.mode,
          query: queryValue,
          last_client_status: state.lastClientStatus,
          thread_id: state.currentThreadId ?? '',
          learner_id: state.learnerId
        };
        
        // Build URL with query params
        const params = new URLSearchParams();
        Object.entries(formData).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
        const url = `${API_ENDPOINT}?${params.toString()}`;
        
        // Log request
        get().addDebugEntry({
          type: 'REQUEST',
          title: 'API Request',
          payload: formData,
          meta: { url }
        });
        
        // Show typing indicator
        set({ isTyping: true });
        
        const sendDate = new Date();
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          const responseText = await response.text();
          let responseData: APIResponse;
          
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { answer_to_display: responseText };
          }
          
          // Check for thread_id in response
          const threadId = responseData.thread_id ?? responseData.threadId;
          if (threadId) {
            get().saveThread(threadId);
            console.log('[API] Saved thread_id:', threadId);
            
            // Clear lastClientStatus if it was "Dialogue Reading complete"
            if (state.lastClientStatus === 'Dialogue Reading complete') {
              set({ lastClientStatus: '' });
            }
          }
          
          // Hide typing indicator
          set({ isTyping: false });
          
          // Display agent response
          const agentMessage = responseData.answer_to_display ?? responseData.learner_message;
          if (agentMessage) {
            get().addMessage(agentMessage, true);
          }
          
          // Log response
          const durationMs = Date.now() - sendDate.getTime();
          get().addDebugEntry({
            type: 'RESPONSE',
            title: `Response ${response.status}`,
            payload: responseData,
            meta: {
              url: response.url,
              status: `${response.status} ${response.statusText}`,
              duration: `${durationMs} ms`
            }
          });
          
        } catch (error) {
          console.error('Error submitting form:', error);
          set({ isTyping: false });
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          get().addMessage(`Error: ${errorMessage}`, true);
          
          get().addDebugEntry({
            type: 'ERROR',
            title: 'Request Error',
            payload: {
              message: errorMessage,
              stack: error instanceof Error ? error.stack : undefined
            }
          });
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      // Reset
      resetForm: () => {
        if (confirm('Are you sure you want to clear the settings? This will reset all form fields.')) {
          set({
            ...initialFormState,
            messages: [],
            currentThreadId: null,
            currentTranscript: ''
          });
        }
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        // Only persist these fields
        savedThreads: state.savedThreads,
        currentThreadId: state.currentThreadId,
        level: state.level,
        story: state.story,
        chapter: state.chapter,
        mode: state.mode,
        learnerId: state.learnerId
      })
    }
  )
);

