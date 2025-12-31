"use client";

// app/chat/page.tsx
export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Settings, Mic, SendHorizontal, Plus } from "lucide-react";

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
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const [openSettings, setOpenSettings] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pinMode, setPinMode] = useState<"create" | "verify">("verify");

  const [activeChatId, setActiveChatId] = useState<string>("");
  const [storedChats, setStoredChats] = useState<Record<string, StoredChat>>({});

  // init chat id
  useEffect(() => {
    if (!activeChatId) setActiveChatId(genId());
  }, [activeChatId]);

  // load chats
  useEffect(() => {
    const raw = localStorage.getItem("doctor_chats");
    if (raw) setStoredChats(JSON.parse(raw));
  }, []);

  const persist = (data: Record<string, StoredChat>) => {
    setStoredChats(data);
    localStorage.setItem("doctor_chats", JSON.stringify(data));
  };

  const saveChat = (
    chatId: string,
    updater: (chat: StoredChat) => StoredChat
  ) => {
    const data = { ...storedChats };
    const base =
      data[chatId] ?? { messages: [], summary: null, createdAt: Date.now() };
    data[chatId] = updater(base);
    persist(data);
  };

  const loadChat = (chatId: string) => {
    const chat = storedChats[chatId];
    if (!chat) return;
    setActiveChatId(chatId);
    setMessages(chat.messages);
    setSummary(chat.summary);
  };

  const startNewChat = () => {
    const id = genId();
    setActiveChatId(id);
    setMessages([]);
    setSummary(null);
  };

  const historyChats = Object.entries(storedChats).map(([id, chat]) => ({
    id,
    title:
      chat.summary?.slice(0, 40) ||
      chat.messages[0]?.text.slice(0, 30) ||
      "New Patient",
    date: new Date(chat.createdAt).toLocaleDateString(),
  }));

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) return;
    const R = (window as any).webkitSpeechRecognition;
    const r = new R();
    r.lang = "en-US";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e: any) =>
      setInput((p) => (p ? p + " " : "") + e.results[0][0].transcript);
    r.start();
    recognitionRef.current = r;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Msg = { role: "user", text: input };

    setMessages((p) => [...p, userMsg]);
    saveChat(activeChatId, (c) => ({
      ...c,
      messages: [...c.messages, userMsg],
    }));

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          messages,
          summary,
        }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (data.isSummary) {
        setSummary(data.reply);
        saveChat(activeChatId, (c) => ({ ...c, summary: data.reply }));
      } else {
        const aiMsg: Msg = { role: "ai", text: data.reply || "No response" };
        setMessages((p) => [...p, aiMsg]);
        saveChat(activeChatId, (c) => ({
          ...c,
          messages: [...c.messages, aiMsg],
        }));
      }
    } catch {
      const errMsg: Msg = { role: "ai", text: "AI error" };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  // 🔐 VIEW HISTORY FLOW (REAL LOGIC)
  const handleOpenHistory = async () => {
    const res = await fetch("/api/history/pin-status");
    const data = await res.json();

    setPinMode(data.hasPin ? "verify" : "create");
    setShowPin(true);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ede9fe] via-[#c7d2fe] to-[#93c5fd]" />

      <div className="relative z-10 flex h-full">
        {/* MAIN CHAT */}
        <div
          className={`flex-1 flex flex-col transition-opacity ${
            openSettings || showPin || showHistory ? "opacity-50" : ""
          }`}
        >
          {/* HEADER */}
          <header className="h-14 bg-white/60 backdrop-blur-xl border-b flex items-center justify-between px-4">
            <h1 className="text-xs tracking-[0.3em] text-gray-700">
              DOCTOR AI ASSISTANT
            </h1>
            <div className="flex gap-3">
              <button onClick={startNewChat}>
                <Plus size={18} />
              </button>
              <button onClick={() => setOpenSettings(true)}>
                <Settings size={18} />
              </button>
            </div>
          </header>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-xl px-4 py-2 rounded-lg ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "mr-auto bg-white text-gray-800"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-600">AI is typing…</div>
            )}
          </div>

          {/* INPUT */}
          <div className="border-t bg-white/70 backdrop-blur-xl p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask medical question…"
              className="flex-1 rounded-lg px-4 py-2 outline-none text-gray-800"
            />
            <button
              onClick={sendMessage}
              className="bg-indigo-600 text-white px-4 rounded-lg"
            >
              <SendHorizontal size={18} />
            </button>
            <button onClick={startListening}>
              <Mic size={18} />
            </button>
          </div>
        </div>

        {/* PANELS */}
        {openSettings && (
          <SettingsPanel
            onClose={() => setOpenSettings(false)}
            onLogout={handleLogout}
            onOpenHistory={() => {
              setOpenSettings(false);
              handleOpenHistory();
            }}
          />
        )}

        {showPin && (
          <PinModal
            mode={pinMode}
            onClose={() => setShowPin(false)}
            onSubmit={async (pin) => {
              const endpoint =
                pinMode === "create"
                  ? "/api/history/create-pin"
                  : "/api/history/verify-pin";

              const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
              });

              const data = await res.json();

              if (
                (pinMode === "create" && data.success) ||
                (pinMode === "verify" && data.valid)
              ) {
                setShowPin(false);
                setShowHistory(true);
              } else {
                throw new Error("Invalid PIN");
              }
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
    </div>
  );
}
