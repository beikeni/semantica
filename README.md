# STA AI Agent - React + Bun

A Portuguese language learning assistant with real-time speech recognition powered by Azure Speech Services.

## Features

- **Real-time Speech Recognition**: Uses Azure Speech SDK with AudioWorklet for efficient audio streaming
- **Voice Input**: Record and transcribe speech in Portuguese (pt-BR)
- **AI Conversation**: Integrates with OpenAI Assistants via Make.com webhook
- **Cascading Dropdowns**: Level → Story → Chapter selection with automatic agent assignment
- **Thread Persistence**: Saves conversation threads in localStorage for session continuity
- **Auto-submit**: Optional automatic submission after silence detection
- **Debug Panel**: Real-time logging of API requests/responses

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React Frontend (Port 3000)                                     │
│  - Zustand stores for state management                          │
│  - shadcn/ui components                                         │
│  - AudioWorklet for audio processing                            │
└─────────────────────────────────────┬───────────────────────────┘
                                      │ WebSocket (Binary audio)
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Bun WebSocket Server (Port 1337)                               │
│  - Azure Speech SDK integration                                 │
│  - Real-time speech recognition                                 │
│  - Push audio stream to Azure                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── App.tsx                    # Main app component
├── stores/                    # Zustand state management
│   ├── conversation-store.ts  # Form, chat, threads
│   └── audio-store.ts         # Recording, WebSocket
├── components/
│   ├── chat/                  # Chat UI components
│   ├── voice/                 # Recording controls
│   ├── lesson/                # Level/Story/Chapter selectors
│   ├── debug/                 # Debug panel
│   └── ui/                    # shadcn components
├── constants/                 # Static data (content, agents)
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript types
└── server/                    # Bun WebSocket server
    └── speech/                # Azure Speech SDK integration
```

## Prerequisites

1. **Azure Speech Service** credentials:
   - `AZURE_SPEECH_KEY`
   - `AZURE_SPEECH_REGION`

2. **Bun** runtime (v1.3+)

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file in the root directory:

```env
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

## Development

Start both servers:

```bash
# Terminal 1: Frontend (Port 3000)
bun run dev:frontend

# Terminal 2: WebSocket Server (Port 1337)
bun run dev
```

Or for production:

```bash
NODE_ENV=production bun start
```

## Usage

1. **Select Lesson**: Choose Level → Story → Chapter
2. **Select Mode**: Choose conversation type
3. **Record**: Click "Start Recording" and speak in Portuguese
4. **Submit**: Message is automatically transcribed and sent to AI
5. **Response**: AI tutor responds in the chat

### Auto-submit

Enable "Auto-submit on silence" to automatically send your message after 3 seconds of silence.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **State**: Zustand 5
- **UI**: shadcn/ui (Radix UI primitives)
- **Runtime**: Bun
- **Audio**: Web Audio API, AudioWorklet
- **Speech**: Azure Cognitive Services Speech SDK
- **API**: Make.com webhook → OpenAI Assistants

## Key Differences from sta-demo

| Feature | sta-demo (vanilla JS) | sta-demo-3 (React) |
|---------|----------------------|-------------------|
| Framework | Vanilla JS | React 19 |
| State | Global variables | Zustand stores |
| WebSocket | Socket.IO | Native WebSocket (Bun) |
| Protocol | Event-based | JSON messages |
| Types | None | Full TypeScript |
| UI | Custom CSS | shadcn/ui + Tailwind |

## API Endpoint

Submissions are sent to:
```
https://hook.us2.make.com/5romqcao8vwbfz7bqv1vuf1bctc61g83
```

With query parameters:
- `agent`: OpenAI Assistant ID
- `level`, `story`, `chapter`: Lesson identifiers
- `mode`: Conversation mode
- `query`: User's transcribed message
- `thread_id`: Conversation thread (for continuity)
- `learner_id`: User identifier

## License

Private - Semantica Portuguese
