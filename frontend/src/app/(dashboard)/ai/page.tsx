'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, CheckSquare, BookOpen, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// ─── Quick action config ─────────────────

const QUICK_ACTIONS = [
  {
    id: 'tasks',
    icon: CheckSquare,
    label: 'Generate Tasks',
    placeholder: 'Describe a project or goal…',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'summarize',
    icon: FileText,
    label: 'Summarize Note',
    placeholder: 'Paste your note content here…',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'learning',
    icon: BookOpen,
    label: 'Learning Plan',
    placeholder: 'Enter a topic to learn (e.g. "System Design")…',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
  },
] as const;

type QuickActionId = (typeof QUICK_ACTIONS)[number]['id'];

// ─── Markdown-lite renderer ───────────────

function renderContent(text: string) {
  // Convert **bold**, bullet lists, numbered lists, and newlines to JSX
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## '))
      return <p key={i} className="mt-3 font-semibold">{line.slice(3)}</p>;
    if (line.startsWith('# '))
      return <p key={i} className="mt-3 font-bold text-base">{line.slice(2)}</p>;
    if (line.match(/^[\d]+\. /))
      return <p key={i} className="ml-3">{line}</p>;
    if (line.startsWith('* ') || line.startsWith('- '))
      return <p key={i} className="ml-3">• {line.slice(2)}</p>;
    if (line.startsWith('**') && line.endsWith('**'))
      return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
    if (line === '')
      return <div key={i} className="h-2" />;
    return <p key={i}>{line}</p>;
  });
}

// ─── Message bubble ───────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
      )}>
        {isUser ? 'U' : <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-muted text-foreground rounded-tl-sm',
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="space-y-0.5">{renderContent(msg.content)}</div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      content: "Hi! I'm your AI assistant. I can help you:\n- **Generate tasks** from a project description\n- **Summarize notes** into key bullet points\n- **Create learning plans** for any topic\n\nOr just chat with me about anything!",
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);
  const [actionInput, setActionInput]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMessage(role: 'user' | 'model', content: string) {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role, content }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);
    setLoading(true);
    try {
      const history = [...messages, { id: '', role: 'user' as const, content: text }];
      const res = await aiApi.chat(history.map((m) => ({ role: m.role, content: m.content })));
      addMessage('model', res.data.reply);
    } catch {
      addMessage('model', 'Sorry, I couldn\'t process that. Please check your GEMINI_API_KEY in the backend .env file.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction() {
    const text = actionInput.trim();
    if (!text || !activeAction || actionLoading) return;
    setActionLoading(true);
    try {
      let result = '';
      if (activeAction === 'tasks') {
        const res = await aiApi.generateTasks(text);
        result = res.data.tasks;
      } else if (activeAction === 'summarize') {
        const res = await aiApi.summarize(text);
        result = res.data.summary;
      } else if (activeAction === 'learning') {
        const res = await aiApi.learningPlan(text);
        result = res.data.plan;
      }
      // Show result in chat
      const action = QUICK_ACTIONS.find((a) => a.id === activeAction)!;
      addMessage('user', `${action.label}: ${text}`);
      addMessage('model', result);
      setActionInput('');
      setActiveAction(null);
    } catch {
      addMessage('model', 'Sorry, something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="AI Assistant" />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
              Powered by Google Gemini 1.5 Flash · Free tier
            </p>
          </div>
        </div>

        {/* Quick actions sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col gap-3 border-l border-border bg-card p-4 lg:flex">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>

          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;
            return (
              <div
                key={action.id}
                className={cn(
                  'rounded-lg border p-3 transition-all',
                  isActive ? `${action.bg} ${action.border}` : 'border-border bg-background',
                )}
              >
                <button
                  onClick={() => setActiveAction(isActive ? null : action.id)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <Icon className={cn('h-4 w-4 shrink-0', action.color)} />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>

                {isActive && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      autoFocus
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                      placeholder={action.placeholder}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleQuickAction}
                      disabled={!actionInput.trim() || actionLoading}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {actionLoading ? 'Generating…' : 'Generate'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-auto rounded-lg border border-dashed border-border p-3">
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Free tier limits:</strong><br />
              15 requests/min · 1M tokens/min · 1,500 req/day
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Get your key at{' '}
              <span className="text-primary">aistudio.google.com</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
