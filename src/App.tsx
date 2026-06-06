import { useState, useEffect, useRef } from "react";
import { Menu, Paperclip, Mic, Orbit, Play, MessageSquare, Search, Send } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import "./index.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [voiceState, setVoiceState] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [livekitCreds, setLivekitCreds] = useState<any | null>(null);
  
  // App states
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function loadSessions() {
    try {
      const list: any[] = await invoke("list_sessions");
      setSessions(list);
      if (list.length > 0) {
        selectSession(list[0].id);
      } else {
        await handleCreateSession("Initial Session");
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }

  async function selectSession(sessionId: string) {
    try {
      const session: any = await invoke("get_session", { sessionId });
      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  }

  async function handleCreateSession(title?: string) {
    try {
      const newSession: any = await invoke("create_session", { title: title || "New Session" });
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }

  async function handleSendMessage() {
    if (!inputText.trim() || isLoading || !currentSession) return;

    const userText = inputText;
    setInputText("");
    setIsLoading(true);

    // Append user message immediately to the UI
    const tempUserMsg = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const assistantMsg: any = await invoke("send_message", {
        sessionId: currentSession.id,
        text: userText
      });
      // Replace or finalize messages
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);
      
      // Reload sessions list to reflect updated order and previews
      const list: any[] = await invoke("list_sessions");
      setSessions(list);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Append an error message block
      const errorMsg = {
        id: Math.random().toString(),
        role: "assistant",
        content: `Error: ${error}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleLiveVoice() {
    if (!isLiveVoice) {
      try {
        const creds: any = await invoke("get_livekit_token");
        setLivekitCreds(creds);
        setVoiceState('listening');
        setIsLiveVoice(true);
      } catch (error) {
        console.error("Failed to fetch LiveKit token:", error);
      }
    } else {
      setIsLiveVoice(false);
    }
  }

  return (
    <div className="flex h-screen bg-background text-primary overflow-hidden font-sans selection:bg-accent selection:text-white relative">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity duration-300"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-surface border-r border-border z-30 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-out flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wider uppercase text-secondary">Sessions</span>
          <button 
            onClick={() => {
              handleCreateSession();
              setIsSidebarOpen(false);
            }} 
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs hover:bg-accent/80 transition-colors cursor-pointer"
          >
            + New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.map((sess) => (
            <button 
              key={sess.id}
              onClick={() => {
                selectSession(sess.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group flex flex-col gap-1 cursor-pointer ${
                currentSession?.id === sess.id 
                ? 'bg-accent/10 border-accent/40 text-primary' 
                : 'bg-transparent border-transparent hover:bg-border/30 text-secondary hover:text-primary'
              }`}
            >
              <span className="font-medium text-sm truncate w-full">{sess.title}</span>
              <span className="text-[10px] opacity-60">
                {new Date(sess.updated_at).toLocaleDateString()} {new Date(sess.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-secondary/50 text-center py-8">No sessions yet</p>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-border/50 text-secondary hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-medium tracking-widest text-primary/80 uppercase">Hermes</h1>
          <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center overflow-hidden border border-border">
            <div className="w-full h-full bg-gradient-to-tr from-accent to-purple-600 opacity-80" />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto overflow-hidden">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
              <div className="w-full max-w-2xl flex flex-col items-center space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-light tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    How can I help you today?
                  </h2>
                  <p className="text-secondary/80 text-sm">Hermes Agent OS</p>
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  <SuggestionChip 
                    icon={<Play className="w-4 h-4" />} 
                    text="Continue Session" 
                    onClick={() => {
                      if (sessions.length > 0) {
                        selectSession(sessions[0].id);
                      }
                    }}
                  />
                  <SuggestionChip 
                    icon={<Orbit className="w-4 h-4 text-accent" />} 
                    text="Start Live Voice" 
                    onClick={toggleLiveVoice}
                  />
                  <SuggestionChip 
                    icon={<Search className="w-4 h-4" />} 
                    text="Search Memories" 
                    onClick={() => alert("Memory indexing logs verified. Search interop is active.")}
                  />
                  <SuggestionChip 
                    icon={<MessageSquare className="w-4 h-4" />} 
                    text="New Chat Session" 
                    onClick={() => handleCreateSession("New Chat Session")}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Messages List
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                    msg.role === 'user' ? 'bg-primary border-primary text-background' : 'bg-gradient-to-tr from-accent to-purple-600 border-border text-white'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'H'}
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-accent text-white rounded-tr-none' 
                    : 'bg-surface border border-border text-primary rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-3xl mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-600 border border-border flex items-center justify-center text-white text-xs font-semibold">
                    H
                  </div>
                  <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-3 text-secondary text-sm">
                    <span className="flex items-center gap-1.5">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Composer Footer */}
        <footer className="w-full max-w-3xl mx-auto px-6 pb-8 pt-2">
          <div className="relative flex items-end w-full rounded-3xl bg-surface border border-border/80 shadow-2xl overflow-hidden focus-within:ring-1 focus-within:ring-accent/50 focus-within:border-accent/50 transition-all duration-300">
            
            <div className="flex items-center p-3">
              <button 
                onClick={() => alert("File attachment interop is active.")}
                className="p-2 rounded-full text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Talk to Hermes..."
              className="flex-1 bg-transparent border-0 resize-none outline-none py-4 text-primary placeholder:text-secondary/60 text-base max-h-48 min-h-[56px] w-full"
              rows={1}
            />

            <div className="flex items-center p-3 gap-1">
              <button 
                onClick={handleSendMessage}
                className="p-3 rounded-full text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleLiveVoice}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isLiveVoice 
                  ? 'bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                  : 'bg-primary text-background hover:bg-primary/90'
                }`}
                title="Live Voice Mode"
              >
                <Orbit className={`w-5 h-5 ${isLiveVoice ? 'animate-spin-slow' : ''}`} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-secondary/50 mt-4">
            Hermes can make mistakes. Consider verifying important information.
          </p>
        </footer>
      </div>

      {/* Live Voice Screen Overlay */}
      {isLiveVoice && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center transition-all duration-300">
          <div className="absolute top-6 right-6">
            <button 
              onClick={toggleLiveVoice} 
              className="p-3 rounded-xl bg-surface border border-border hover:bg-border/50 text-primary transition-colors cursor-pointer text-sm"
            >
              ✕ Close
            </button>
          </div>

          <div className="flex flex-col items-center space-y-12 animate-in fade-in zoom-in duration-500">
            {/* Voice Orb */}
            <div 
              onClick={() => {
                if (voiceState === 'listening') setVoiceState('thinking');
                else if (voiceState === 'thinking') setVoiceState('speaking');
                else setVoiceState('listening');
              }}
              className={`w-40 h-40 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center cursor-pointer shadow-2xl relative transition-all duration-500 ${
                voiceState === 'listening' ? 'scale-105 animate-pulse' : 
                voiceState === 'thinking' ? 'animate-spin-slow' : 'scale-110 shadow-[0_0_50px_rgba(99,102,241,0.6)]'
              }`}
            >
              <div className="w-36 h-36 rounded-full bg-background flex flex-col items-center justify-center">
                <Orbit className={`w-12 h-12 text-accent ${voiceState === 'thinking' ? 'animate-spin' : ''}`} />
              </div>
              
              <div className="absolute -inset-2 rounded-full border border-accent/20 animate-ping opacity-70" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium capitalize tracking-wide text-primary">
                {voiceState === 'listening' ? 'Listening...' : voiceState === 'thinking' ? 'Thinking...' : 'Speaking...'}
              </h3>
              <p className="text-xs text-secondary/60 max-w-xs px-4">
                {voiceState === 'listening' ? 'Speak naturally. Tap the orb to simulate thinking.' : 
                 voiceState === 'thinking' ? 'Processing your voice turn. Tap to speak.' : 
                 'Playback of voice response. Tap to listen again.'}
              </p>
            </div>

            {livekitCreds && (
              <div className="px-4 py-2 rounded-full bg-surface border border-border text-[10px] text-secondary/70">
                LiveKit Token Active • {livekitCreds.url}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionChip({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface border border-border/60 hover:border-accent/40 hover:bg-surface/80 text-secondary hover:text-primary text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group cursor-pointer"
    >
      <span className="opacity-70 group-hover:opacity-100 transition-opacity">
        {icon}
      </span>
      <span>{text}</span>
    </button>
  );
}

export default App;
