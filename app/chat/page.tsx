// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function Home() {
  const router = useRouter();
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

  const [pin, setPin] = useState("");
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [storedChats, setStoredChats] = useState<Record<string, StoredChat>>({});

  // init chat
  useEffect(() => {
    if (!activeChatId) setActiveChatId(genId());
  }, [activeChatId]);

  // load from storage
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
    const base: StoredChat =
      data[chatId] ?? { messages: [], summary: null, createdAt: Date.now() };
    data[chatId] = updater(base);
    persist(data);
  };

  const loadChat = (chatId: string) => {
    const chat = storedChats[chatId];
    if (!chat) return;
    setActiveChatId(chatId);
    setMessages(chat.messages);
    setSummary(chat.summary ?? null);
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

    const userText = input;
    const userMsg: Msg = { role: "user", text: userText };

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
          message: userText,
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
        const aiMsg: Msg = {
          role: "ai",
          text: data.reply || "No response",
        };
        setMessages((p) => [...p, aiMsg]);
        saveChat(activeChatId, (c) => ({
          ...c,
          messages: [...c.messages, aiMsg],
        }));
      }
    } catch {
      const errMsg: Msg = { role: "ai", text: "AI error" };
      setMessages((p) => [...p, errMsg]);
      saveChat(activeChatId, (c) => ({
        ...c,
        messages: [...c.messages, errMsg],
      }));
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = () => {
    if (pin === "1234") {
      setShowPin(false);
      setShowHistory(true);
      setPin("");
    }
  };

  // ✅ FIXED LOGOUT (NextAuth)
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ede9fe] via-[#c7d2fe] to-[#93c5fd]" />

      <div className="relative z-10 h-full w-full flex">
        <div
          className={`flex-1 flex flex-col ${
            openSettings || showPin || showHistory
              ? "blur-sm pointer-events-none"
              : ""
          }`}
        >
          <header className="w-full bg-white/30 backdrop-blur-xl border-b border-white/40">
            <div className="h-14 max-w-7xl mx-auto px-4 flex items-center justify-between">
              {/* 🔴 BUILD MARKER */}
              <h1 className="tracking-[0.25em] text-xs text-red-600 font-bold">
                DOCTOR AI ASSISTANT — BUILD v999
              </h1>

              <div className="flex gap-3">
                <button onClick={startNewChat} title="New Patient">
                  <Plus size={18} className="text-gray-700" />
                </button>
                <button onClick={() => setOpenSettings(true)}>
                  <Settings size={18} className="text-gray-700" />
                </button>
              </div>
            </div>
          </header>

          {/* बाकी code unchanged */}
          {/* messages / input / panels same as before */}
        </div>

        {openSettings && (
          <SettingsPanel
            onClose={() => setOpenSettings(false)}
            onLogout={handleLogout}
            onOpenHistory={() => {
              setOpenSettings(false);
              setShowPin(true);
            }}
          />
        )}

        {showPin && (
          <PinModal
            pin={pin}
            setPin={setPin}
            onVerify={verifyPin}
            onClose={() => {
              setShowPin(false);
              setPin("");
            }}
          />
        )}

        {showHistory && (
          <HistoryPanel
            chats={historyChats}
            onSelect={(id: string) => {
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
