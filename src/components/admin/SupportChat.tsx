"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, MessageCircle, Send, Loader2 } from "lucide-react";
import { sendSupportTicket } from "@/actions/support";

interface SupportChatProps {
  cafeId: string;
  cafeName: string;
  planType: string | null;
  activeLang: string;
  t: any;
  dir: string;
}

export default function SupportChat({ cafeId, cafeName, planType, activeLang, t, dir }: SupportChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);

  // Refs for auto-scroll and click-outside tracking
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDropdownOpen = useRef(showMsgDropdown);

  // Sync ref and scroll on dropdown open
  useEffect(() => {
    isDropdownOpen.current = showMsgDropdown;
    if (showMsgDropdown) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showMsgDropdown]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMsgDropdown(false);
      }
    };
    if (showMsgDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMsgDropdown]);

  // Supabase Realtime for Messages
  useEffect(() => {
    if (!cafeId) return;

    const fetchMessages = async () => {
      const { data } = await supabase.from("admin_messages").select("*").eq("cafe_id", cafeId).order("created_at", { ascending: true });
      if (data) {
        setMessages(data);
        const unread = data.some(m => m.sender === 'super_admin' && !m.is_read);
        setHasUnreadMsg(unread);
      }
    };
    fetchMessages();

    const messagesChannel = supabase.channel(`support_${cafeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_messages", filter: `cafe_id=eq.${cafeId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        if (payload.new.sender === 'super_admin' && !isDropdownOpen.current) {
          setHasUnreadMsg(true);
        }
      }).subscribe();

    return () => { supabase.removeChannel(messagesChannel); };
  }, [cafeId]);

  const handleOpenMessages = async () => {
    setShowMsgDropdown(!showMsgDropdown);
    if (!showMsgDropdown && hasUnreadMsg) {
      await supabase.from("admin_messages").update({ is_read: true }).eq("cafe_id", cafeId).eq("sender", "super_admin").eq("is_read", false);
      setHasUnreadMsg(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim() || !cafeId) return;
    setIsSendingSupport(true);
    await sendSupportTicket({ cafeId, cafeName, message: supportInput, planType: planType || "unknown" });
    setSupportInput("");
    setIsSendingSupport(false);
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={handleOpenMessages}
        className={`relative p-2.5 rounded-full border transition-colors ${hasUnreadMsg ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'}`}
      >
        <Bell size={18} className={hasUnreadMsg ? "animate-pulse" : ""} />
        {hasUnreadMsg && (
          <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </button>

      {showMsgDropdown && (
        <div 
          className={`absolute top-full mt-4 w-[calc(100vw-2rem)] sm:w-96 max-w-[380px] bg-white border border-border shadow-2xl rounded-2xl flex flex-col z-[100] animate-in fade-in slide-in-from-top-4 overflow-hidden ${dir === 'rtl' ? 'left-0 sm:-left-4' : 'right-0 sm:-right-4'}`} 
          style={{ height: '480px' }}
        >
          <div className="bg-muted/50 p-4 border-b font-black flex items-center gap-2 shrink-0">
            <MessageCircle size={18} className="text-primary"/> {t.supportChatTitle}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="m-auto text-xs font-bold text-muted-foreground text-center">{t.noMessages}</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`max-w-[85%] p-3 rounded-xl text-sm font-medium shadow-sm ${msg.sender === 'cafe_admin' ? 'bg-primary text-primary-foreground self-end rounded-tr-none' : 'bg-white text-foreground self-start rounded-tl-none border border-border'}`}>
                  {msg.message_text}
                  <div className={`text-[9px] mt-1.5 opacity-60 ${msg.sender === 'cafe_admin' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} className="h-1 shrink-0" />
          </div>

          <form onSubmit={handleSendSupport} className="p-3 bg-white border-t flex gap-2 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <input 
              type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)}
              placeholder={t.writeMessage} disabled={isSendingSupport}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 text-sm outline-none focus:border-primary disabled:opacity-50 transition-colors"
            />
            <button type="submit" disabled={isSendingSupport || !supportInput.trim()} className="bg-primary text-primary-foreground p-3.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-primary/20">
              {isSendingSupport ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''}/>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}