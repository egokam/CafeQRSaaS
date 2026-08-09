"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Send, Loader2, Wifi } from "lucide-react";
import { sendSupportTicket } from "@/actions/support";

interface SupportTabProps {
  cafeId: string;
  cafeName: string;
  planType: string | null;
  activeLang: string;
  t: any;
  dir: string;
  onMessagesRead: () => void;
  latestMessage: any; // 🌟 استقبال الرسالة الجديدة من المكون الأب
  isConnected: boolean; // 🌟 استقبال حالة الاتصال من المكون الأب
}

export default function SupportTab({ cafeId, cafeName, planType, activeLang, t, dir, onMessagesRead, latestMessage, isConnected }: SupportTabProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const onMessagesReadRef = useRef(onMessagesRead);
  
  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead;
  }, [onMessagesRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. الجلب الأولي للرسائل عند فتح التبويب
  useEffect(() => {
    if (!cafeId) return;

    const fetchInitialMessages = async () => {
      const { data } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("cafe_id", cafeId)
        .order("created_at", { ascending: true });
        
      if (data) {
        setMessages(data);
        const hasUnread = data.some(m => m.sender === 'super_admin' && !m.is_read);
        if (hasUnread) {
          await supabase.from("admin_messages").update({ is_read: true }).eq("cafe_id", cafeId).eq("sender", "super_admin").eq("is_read", false);
          onMessagesReadRef.current();
        }
      }
    };
    
    fetchInitialMessages();
  }, [cafeId]);

  // 2. 🌟 إضافة الرسائل اللحظية الواردة من المكون الأب (بدون تعارض قنوات)
  useEffect(() => {
    if (latestMessage && latestMessage.cafe_id === cafeId) {
      setMessages(prev => {
        // منع التكرار
        const exists = prev.some(m => m.id === latestMessage.id || (m.message_text === latestMessage.message_text && m.created_at === latestMessage.created_at));
        if (exists) return prev;
        return [...prev, latestMessage];
      });
      
      // تعليم الرسالة كمقروءة فور وصولها لأننا داخل التبويب حالياً
      if (latestMessage.sender === 'super_admin') {
        supabase.from("admin_messages").update({ is_read: true }).eq("id", latestMessage.id).then(() => {
          onMessagesReadRef.current();
        });
      }
    }
  }, [latestMessage, cafeId]);

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim() || !cafeId) return;
    
    const messageText = supportInput;
    setSupportInput(""); 
    setIsSendingSupport(true);

    // Optimistic UI
    const tempMessage = {
      id: crypto.randomUUID(),
      cafe_id: cafeId,
      sender: 'cafe_admin',
      message_text: messageText,
      is_read: true,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await sendSupportTicket({ cafeId, cafeName, message: messageText, planType: planType || "unknown" });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSendingSupport(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-300" dir={dir}>
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col h-[70vh] min-h-[500px] overflow-hidden">
        
        <div className="bg-zinc-50 p-5 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900">{t.supportChatTitle || "الدعم الفني والإشعارات"}</h2>
              <p className="text-xs font-bold text-zinc-500 mt-1">تواصل مباشر مع الإدارة</p>
            </div>
          </div>
          <div>
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm">
                <Wifi size={14} /> {activeLang === 'ar' ? 'متصل' : 'Connected'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold bg-amber-100 px-3 py-1.5 rounded-full shadow-sm">
                <Loader2 className="animate-spin" size={14} /> {activeLang === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="m-auto text-sm font-bold text-zinc-400 bg-white p-6 rounded-2xl border border-dashed border-zinc-200 text-center">
              {t.noMessages || "لا توجد رسائل حالياً. كيف يمكننا مساعدتك؟"}
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender === 'cafe_admin';
              return (
                <div key={msg.id} className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm ${isMine ? 'bg-zinc-900 text-white self-end rounded-tr-sm' : 'bg-white text-zinc-800 self-start rounded-tl-sm border border-zinc-200'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                  <div className={`text-[10px] mt-2 font-bold ${isMine ? 'text-zinc-400 text-right' : 'text-zinc-400 text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>

        <form onSubmit={handleSendSupport} className="p-4 sm:p-5 bg-white border-t border-zinc-200 flex gap-3 shrink-0">
          <input 
            type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)}
            placeholder={t.writeMessage || "اكتب رسالتك للدعم هنا..."} disabled={isSendingSupport}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-sm font-bold outline-none focus:border-zinc-900 focus:bg-white disabled:opacity-50 transition-colors"
          />
          <button type="submit" disabled={isSendingSupport || !supportInput.trim()} className="bg-zinc-900 text-white p-4 rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-md">
            {isSendingSupport ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={dir === 'rtl' ? 'rotate-180' : ''}/>}
          </button>
        </form>
      </div>
    </div>
  );
}