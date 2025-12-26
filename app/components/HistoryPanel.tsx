// app/components/HistoryPanel.tsx
"use client";

type Chat = {
  id: string;
  title: string;
  date: string;
};

type Props = {
  chats: Chat[];
  onSelect: (id: string) => void;
  onClose: () => void;
};

export default function HistoryPanel({ chats, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur">
      <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="tracking-widest text-sm text-gray-900">
            CHAT HISTORY
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className="w-full text-left p-4 rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              <p className="text-sm font-medium text-gray-900">
                {chat.title}
              </p>
              <p className="text-xs text-gray-500">{chat.date}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
