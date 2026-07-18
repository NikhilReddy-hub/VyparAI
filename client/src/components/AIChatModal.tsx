'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { Bot, Send, X, Mic, MicOff, Sparkles, Check, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actionsReport?: any; // To render AI Business Brain choices
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Business Brain. Ask me any decisions like "I have ₹50,000. Which products should I restock?" or query sales reports.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [budgetVal, setBudgetVal] = useState(50000);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputValue(text);
        setIsRecording(false);
      };

      rec.onerror = () => {
        setIsRecording(false);
        toast.error('Voice recognition failed. Please try again.');
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
      toast('Listening...', { icon: '🎙️' });
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputValue('');

    try {
      // Determine if it is a restock query (trigger Business Brain decision agent)
      if (text.toLowerCase().includes('restock') || text.toLowerCase().includes('order') || text.toLowerCase().includes('buy')) {
        const res = await vyaparApi.askBrain(text, budgetVal);
        if (res.success && res.data) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: res.data.narrative || `Here is my restocking plan for a budget of ${formatINR(budgetVal)}:`,
              actionsReport: res.data
            }
          ]);
        } else {
          throw new Error('AI brain returned empty');
        }
      } else {
        // Standard chatbot request
        const res = await vyaparApi.chat(text);
        setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I am having trouble connecting to my AI engines. Make sure your Gemini API key is configured correctly in server env." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const suggestions = [
    "I have ₹50,000. Which products should I restock?",
    "Who is my best customer?",
    "How much profit today?",
    "Which products need restocking?"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[550px] bg-neutral-900 border border-white/10 rounded-2xl flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">AI Business Operating Brain</h3>
              <p className="text-[10px] text-muted-foreground">Decision-Making Agent & Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <span className="text-[10px] text-muted-foreground">Budget Limit:</span>
              <input 
                type="number"
                value={budgetVal}
                onChange={(e) => setBudgetVal(Number(e.target.value))}
                className="w-16 bg-transparent text-xs text-white focus:outline-none text-right font-mono"
              />
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className="max-w-[85%] space-y-3">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-neutral-800/60 border border-white/5 text-neutral-200 rounded-tl-none'
                }`}>
                  {m.content}
                </div>

                {/* Actions report (Decision results) */}
                {m.actionsReport && (
                  <div className="p-4 bg-neutral-950/80 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">AI Procurement Suggestions</span>
                      <span className="text-[10px] font-mono text-emerald-400">Confidence: {m.actionsReport.confidence}%</span>
                    </div>

                    <div className="space-y-2">
                      {m.actionsReport.actions?.map((act: any, i: number) => (
                        <div key={i} className="flex items-start justify-between p-2 rounded-xl bg-white/5 border border-white/5 gap-4">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-lg mt-0.5 ${act.do ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              <Check className="h-3 w-3" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{act.action}</p>
                              <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{act.reason}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-white font-mono">{act.quantity}</span>
                            <p className="text-[9px] text-indigo-400 font-mono mt-0.5">Est. {formatINR(act.estimatedCost)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost Summaries */}
                    <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Total Budget Cost</span>
                        <p className="text-xs font-semibold text-white font-mono">{formatINR(m.actionsReport.totalEstimatedCost || 0)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground">Projected Sales Profit</span>
                        <p className="text-xs font-semibold text-emerald-400 font-mono">+{formatINR(m.actionsReport.totalEstimatedProfit || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 bg-neutral-800/40 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Quick pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="text-[10px] text-neutral-300 hover:text-white bg-white/5 hover:bg-indigo-600/20 border border-white/5 rounded-full px-2.5 py-1 transition-all whitespace-nowrap cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5">
            {/* Mic trigger */}
            <button
              onClick={toggleRecording}
              className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-red-500/10 border-red-500 text-red-500' 
                  : 'bg-white/5 border-white/10 hover:border-indigo-500/40 text-muted-foreground hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="h-4.5 w-4.5 animate-pulse" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <input
              type="text"
              placeholder="Ask a question or request business restock choices..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none placeholder:text-muted-foreground transition-all"
            />

            <button
              onClick={() => handleSend(inputValue)}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ask</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
