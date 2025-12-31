"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  Settings,
  Plus,
  SendHorizontal,
  Mic,
  Sparkles,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import SettingsPanel from "@/app/components/SettingsPanel";
import PinModal from "@/app/components/PinModal";
import HistoryPanel from "@/app/components/HistoryPanel";

type Role = "user" | "ai";
type Msg = { role: Role; text: string };

type StoredChat = {
  messages: Msg[];
  summary: string | null;
  createdAt: number;
};

const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [openSettings, setOpenSettings] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pinMode] = useState<"create" | "verify">("verify");

  const [activeChatId, setActiveChatId] = useState("");
  const [storedChats, setStoredChats] = useState<Record<string, StoredChat>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("doctor_chats");
    if (raw) setStoredChats(JSON.parse(raw));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persist = (
    updater: (prev: Record<string, StoredChat>) => Record<string, StoredChat>
  ) => {
    setStoredChats((prev) => {
      const next = updater(prev);
      localStorage.setItem("doctor_chats", JSON.stringify(next));
      return next;
    });
  };

  const saveChat = (
    chatId: string,
    updater: (chat: StoredChat) => StoredChat
  ) => {
    persist((prev) => {
      const base =
        prev[chatId] ?? {
          messages: [],
          summary: null,
          createdAt: Date.now(),
        };

      return {
        ...prev,
        [chatId]: updater(base),
      };
    });
  };

  const loadChat = (chatId: string) => {
    const chat = storedChats[chatId];
    if (!chat) return;
    setActiveChatId(chatId);
    setMessages(chat.messages);
  };

  const startNewChat = () => {
    const id = genId();
    setActiveChatId(id);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = genId();
      setActiveChatId(chatId);
    }

    const userMsg: Msg = { role: "user", text: input };

    setMessages((p) => [...p, userMsg]);
    saveChat(chatId, (c) => ({
      ...c,
      messages: [...c.messages, userMsg],
    }));

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();

      const aiMsg: Msg = {
        role: "ai",
        text: data.reply || "No response",
      };

      setMessages((p) => [...p, aiMsg]);
      saveChat(chatId, (c) => ({
        ...c,
        messages: [...c.messages, aiMsg],
      }));
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "AI error" }]);
    } finally {
      setLoading(false);
    }
  };

  const historyChats = Object.entries(storedChats).map(([id, chat]) => ({
    id,
    title:
      chat.summary ||
      chat.messages?.[0]?.text?.slice(0, 30) ||
      "New Chat",
    date: new Date(chat.createdAt).toLocaleDateString(),
  }));

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#eef2ff] overflow-hidden">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold">Doctor Assist</span>
        </div>
        <div className="flex gap-3">
          <button onClick={startNewChat}>
            <Plus size={18} />
          </button>
          <button onClick={() => setOpenSettings(true)}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-[#f8fafc] to-[#eef2ff]">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <div className="mb-4 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Sparkles size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome to Doctor Assist
            </h2>
            <p className="text-sm max-w-xs">
              Your AI-powered clinical assistant.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div className="max-w-[75%] w-fit">
              {m.role === "ai" && (
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Sparkles size={12} />
                  Doctor Assist
                </div>
              )}

              <div
                className={`inline-block px-4 py-3 rounded-2xl text-sm break-words whitespace-pre-wrap ${m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm chat-user"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm chat-ai"
                  }`}
              >
                <div className="prose prose-sm max-w-none prose-indigo">
                  <ReactMarkdown>
                    {m.text}
                  </ReactMarkdown>
                </div>

              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500 animate-pulse">
            Doctor Assist is thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="h-16 bg-white border-t px-3 flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a clinical question…"
          className="flex-1 rounded-full px-5 py-3 bg-gray-100 outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white p-3 rounded-full"
        >
          <SendHorizontal size={18} />
        </button>
        <button className="hidden sm:block">
          <Mic size={18} />
        </button>
      </footer>

      {openSettings && (
        <SettingsPanel
          onClose={() => setOpenSettings(false)}
          onLogout={() => signOut({ callbackUrl: "/auth/login" })}
          onOpenHistory={() => {
            setOpenSettings(false);
            setShowPin(true);
          }}
        />
      )}

      {showPin && (
        <PinModal
          mode={pinMode}
          onClose={() => setShowPin(false)}
          onSubmit={() => {
            setShowPin(false);
            setShowHistory(true);
          }}
        />
      )}

      {showHistory && (
        <HistoryPanel
          chats={historyChats}
          onSelect={(id) => {
            loadChat(id);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
