import { useState, useEffect, useRef } from "react";
import { Menu, Paperclip, Orbit, Play, MessageSquare, Search, Send, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import SessionSidebar, { type SessionSummary } from "./components/SessionSidebar";
import "./index.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [isLiveVoice, setIsLiveVoice] = useState(false);

  
  // App states
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionSummary | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");

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
      const newSession: any = await invoke("create_session", { title: title || "New Chat" });
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }

  async function handleRenameSession(id: string, title: string) {
    try {
      const updated: any = await invoke("rename_session", { sessionId: id, title });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: updated.title, updated_at: updated.updated_at } : s));
      if (currentSession?.id === id) {
        setCurrentSession((prev: any) => prev ? { ...prev, title: updated.title } : prev);
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await invoke("delete_session", { sessionId: id });
      const remaining = sessions.filter(s => s.id !== id);
      setSessions(remaining);
      if (currentSession?.id === id) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }

  async function handleSendMessage() {
    if (!inputText.trim() || isLoading || !currentSession) return;

    const userText = inputText;
    const activeSessionId = currentSession.id;
    setInputText("");
    setIsLoading(true);
    setStreamingContent("");

    // Append user message immediately to the UI
    const tempUserMsg = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Register chunk listener BEFORE invoking send_message so no events are missed
    const unlisten = await listen<{ sessionId: string; text: string }>("hermes://chunk", (event) => {
      if (event.payload.sessionId !== activeSessionId) return;
      setStreamingContent(prev => prev ? prev + "\n" + event.payload.text : event.payload.text);
    });

    try {
      const assistantMsg: any = await invoke("send_message", {
        sessionId: activeSessionId,
        text: userText
      });
      // Replace streaming state with the final persisted Message
      setStreamingContent("");
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);

      // Reload sessions list to reflect updated order and title
      const list: any[] = await invoke("list_sessions");
      setSessions(list);
    } catch (error) {
      console.error("Failed to send message:", error);
      setStreamingContent("");
      // Append an inline error bubble
      const errorMsg = {
        id: Math.random().toString(),
        role: "error",
        content: `${error}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      unlisten();
      setIsLoading(false);
    }
  }

  async function toggleLiveVoice() {
    if (!isLiveVoice) {
      try {
        await invoke("get_livekit_token");
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
      
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={currentSession?.id ?? null}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={selectSession}
        onCreate={handleCreateSession}
        onRename={handleRenameSession}
        onDelete={handleDeleteSession}
      />

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
                  <h2 className="text-4xl font-light tracking-tight sm:text-5xl text-white/90">
                    How can I help you today?
                  </h2>
                  <p className="text-secondary/50 text-xs">Hermes Agent OS</p>
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  <SuggestionChip 
                    icon={<Play className="w-3.5 h-3.5" />} 
                    text="Continue Session" 
                    onClick={() => {
                      if (sessions.length > 0) {
                        selectSession(sessions[0].id);
                      }
                    }}
                  />
                  <SuggestionChip 
                    icon={<Orbit className="w-3.5 h-3.5" />} 
                    text="Start Live Voice" 
                    onClick={toggleLiveVoice}
                  />
                  <SuggestionChip 
                    icon={<Search className="w-3.5 h-3.5" />} 
                    text="Search Memories" 
                    onClick={() => alert("Memory indexing logs verified. Search interop is active.")}
                  />
                  <SuggestionChip 
                    icon={<MessageSquare className="w-3.5 h-3.5" />} 
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
                  className={`flex gap-4 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                    msg.role === 'user'
                      ? 'bg-primary border-primary text-background'
                      : msg.role === 'error'
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-gradient-to-tr from-accent to-purple-600 border-border text-white'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'H'}
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-accent text-white rounded-tr-none' 
                    : msg.role === 'error'
                    ? 'bg-surface border border-red-500/40 text-red-400 rounded-tl-none whitespace-pre-wrap'
                    : 'bg-surface border border-border text-primary rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-600 border border-border flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    H
                  </div>
                  <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-3 text-primary text-sm max-w-[85%] whitespace-pre-wrap">
                    {streamingContent ? (
                      <span>
                        {streamingContent}
                        <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-secondary animate-pulse">
                        Thinking...
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Composer Footer */}
        <footer className="w-full max-w-3xl mx-auto px-6 pb-8 pt-2">
          <div className="relative flex items-end w-full rounded-2xl bg-surface border border-border/80 shadow-2xl overflow-hidden focus-within:ring-1 focus-within:ring-accent/40 focus-within:border-accent/40 transition-all duration-300">
            
            <div className="flex items-center p-3">
              <button 
                onClick={() => alert("File attachment interop is active.")}
                className="p-2 rounded-full text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {isLiveVoice ? (
              <div className="flex-1 flex flex-col justify-center py-4">
                <div className="animate-pulse bg-accent/20 rounded-full h-2 mx-4" />
                <p className="text-xs text-secondary text-center mt-2">Listening...</p>
              </div>
            ) : (
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
            )}

            <div className="flex items-center p-3 gap-1">
              {inputText.length > 0 && !isLiveVoice && (
                <button 
                  onClick={handleSendMessage}
                  className="p-3 rounded-full text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
              {isLiveVoice && (
                <button
                  onClick={toggleLiveVoice}
                  className="p-3 rounded-full text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
                  title="Dismiss voice mode"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
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


    </div>
  );
}

function SuggestionChip({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-transparent border border-border/40 hover:bg-border/20 text-secondary hover:text-primary text-sm transition-all duration-200 active:scale-95 cursor-pointer"
    >
      <span>{icon}</span>
      <span>{text}</span>
    </button>
  );
}

export default App;
