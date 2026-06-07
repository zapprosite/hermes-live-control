import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Trash2, MessageSquare } from "lucide-react";

export interface SessionSummary {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface Props {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when rename mode activates
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startRename(sess: SessionSummary) {
    setEditingId(sess.id);
    setEditValue(sess.title);
  }

  function commitRename() {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  }

  function cancelRename() {
    setEditingId(null);
  }

  function handleRenameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") cancelRename();
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    onDelete(id);
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-border z-30 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-out flex flex-col`}
        aria-label="Chat sessions"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-semibold tracking-widest uppercase text-secondary/70 select-none">
            Sessions
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                onCreate();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 transition-colors cursor-pointer"
              id="sidebar-new-chat"
            >
              <MessageSquare className="w-3 h-3" />
              New Chat
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-xs text-secondary/40 text-center py-12 px-4">
              No sessions yet. Start a new chat!
            </p>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const isEditing = sess.id === editingId;
              const isDeleting = sess.id === deletingId;

              return (
                <div
                  key={sess.id}
                  className={`group relative flex items-center w-full rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-accent/10 border border-accent/30"
                      : "border border-transparent hover:bg-border/25"
                  } ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {isEditing ? (
                    /* Inline rename input */
                    <div className="flex-1 px-3 py-2.5">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        className="w-full bg-border/30 border border-accent/40 rounded-md px-2 py-1 text-sm text-primary outline-none focus:ring-1 focus:ring-accent/60"
                        maxLength={80}
                        aria-label="Rename session"
                      />
                    </div>
                  ) : (
                    /* Normal session row */
                    <button
                      onClick={() => {
                        onSelect(sess.id);
                        onClose();
                      }}
                      onDoubleClick={() => startRename(sess)}
                      className="flex-1 text-left px-3 py-2.5 cursor-pointer min-w-0"
                      id={`session-item-${sess.id}`}
                      title="Click to open · Double-click to rename"
                    >
                      <span
                        className={`block text-sm font-medium truncate leading-snug ${
                          isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                        }`}
                      >
                        {sess.title}
                      </span>
                      <span className="block text-[10px] text-secondary/40 mt-0.5">
                        {formatTimestamp(sess.updated_at)}
                      </span>
                    </button>
                  )}

                  {/* Hover-reveal trash icon */}
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sess.id);
                      }}
                      className="shrink-0 mr-2 p-1.5 rounded-lg text-secondary/0 group-hover:text-secondary/50 hover:!text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
                      aria-label={`Delete session ${sess.title}`}
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-secondary/30 text-center">
            Double-click a session to rename
          </p>
        </div>
      </aside>
    </>
  );
}
