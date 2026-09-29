import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Zap,
  Scale,
  Building2,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { getOfflineBarangayResponse } from '../services/camohaguinKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
}

type ModelType = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

interface PersonaRole {
  id: string;
  name: string;
  description: string;
  defaultModel: ModelType;
  icon: React.ComponentType<{ className?: string }>;
  systemPrompt: string;
}

const PERSONA_ROLES: PersonaRole[] = [
  {
    id: 'general',
    name: 'Frontline Desk Officer',
    description: 'General services, clearances, certificates & application procedures',
    defaultModel: 'gemini-3.5-flash',
    icon: Building2,
    systemPrompt: 'You are an accommodating and knowledgeable Barangay Frontline Desk Officer for Barangay Camohaguin, Gumaca, Quezon. Provide thorough, step-by-step guidance on all barangay certificates, clearances, application steps, and general queries.',
  },
  {
    id: 'fast',
    name: 'Fast Q&A & Hotlines',
    description: 'Instant answers for requirements, fees & emergency contacts',
    defaultModel: 'gemini-3.1-flash-lite',
    icon: Zap,
    systemPrompt: 'You are a fast, high-speed barangay lookup assistant for Barangay Camohaguin. Provide direct, concise bullet points answering operating hours, document fees, documentary requirements, and emergency hotlines with minimum preamble.',
  },
  {
    id: 'legal',
    name: 'Lupon & Dispute Mediator',
    description: 'Katarungang Pambarangay conciliation & dispute procedures',
    defaultModel: 'gemini-3.1-pro-preview',
    icon: Scale,
    systemPrompt: 'You are an advisor specializing in Katarungang Pambarangay (Barangay Justice System) under RA 7160 (Local Government Code) for Barangay Camohaguin. Explain mediation, conciliation, Lupong Tagapamayapa summons, arbitration steps, and peace & order guidelines with legal clarity and fairness.',
  },
];

const SUGGESTED_QUESTIONS = [
  'What are the requirements for a Barangay Clearance?',
  'How much is the fee for Certificate of Indigency?',
  'How does Katarungang Pambarangay mediation work?',
  'What are the office hours and emergency numbers in Camohaguin?',
];

export const GeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Magandang araw! Ako si **Ka-Barangay AI**, ang opisyal na digital assistant ng Barangay Camohaguin, Gumaca, Quezon. Paano kita matutulungan ngayong araw ukol sa mga serbisyo, clearance, o katanungan sa barangay?',
      model: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaRole>(PERSONA_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3.5-flash');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handlePersonaChange = (persona: PersonaRole) => {
    setSelectedPersona(persona);
    setSelectedModel(persona.defaultModel);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Kumusta! Naka-set ako ngayon bilang **${selectedPersona.name}**. Ano ang maipaglilingkod ko sa iyo?`,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMsg(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
    const chatUrl = `${apiBase}/api/chat`;

    try {
      let replyContent = '';
      let replyModel: string = selectedModel;
      let callServerSucceeded = false;

      try {
        const response = await fetch(chatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map(m => ({ role: m.role, content: m.content })),
            roleInstruction: selectedPersona.systemPrompt,
            model: selectedModel,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          replyContent = data.content;
          replyModel = data.model || selectedModel;
          callServerSucceeded = true;
        } else if (response.status === 404) {
          console.warn('[Ka-Barangay AI] /api/chat not found (static hosting environment like GitHub Pages). Falling back to Camohaguin Knowledge Engine.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
      } catch (netErr: any) {
        console.warn('[Ka-Barangay AI] Backend server unreachable, falling back to static knowledge engine:', netErr?.message);
      }

      if (!callServerSucceeded) {
        replyContent = getOfflineBarangayResponse(query, selectedPersona.id);
        replyModel = isGithubPages ? 'Static Engine (GitHub Pages)' : 'Camohaguin Knowledge Engine';
      }

      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        model: replyModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[Chatbot Error]:', err);
      const fallback = getOfflineBarangayResponse(query, selectedPersona.id);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: fallback,
          model: 'Camohaguin Knowledge Engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-4 py-3 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 border-2 border-amber-300/40"
          aria-label="Open Barangay AI Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-sm tracking-wide">Ka-Barangay AI</span>
          <span className="hidden sm:inline-block bg-emerald-950/60 text-amber-200 text-[10px] px-2 py-0.5 rounded-full border border-amber-300/20 font-mono">
            Gemini
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[88vh] max-h-[820px]'
              : 'w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-3.5 flex items-center justify-between border-b border-emerald-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide text-amber-300 font-serif">
                    Ka-Barangay AI
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-800/80 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-700">
                    {typeof window !== 'undefined' && window.location.hostname.includes('github.io') ? 'GitHub Pages' : '24/7 Desk'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80">Barangay Camohaguin, Gumaca</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-200">
              <button
                onClick={handleClearHistory}
                title="Restart Conversation"
                className="p-1.5 hover:bg-emerald-800/60 rounded-lg transition hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="p-1.5 hover:bg-emerald-800/60 rounded-lg transition hover:text-white hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 hover:bg-emerald-800/60 rounded-lg transition hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role & Model Selector Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-xs gap-2">
            {/* Persona Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              {PERSONA_ROLES.map(role => {
                const Icon = role.icon;
                const isSelected = selectedPersona.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handlePersonaChange(role)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-emerald-800 text-amber-300 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={role.description}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{role.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Model Badge */}
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as ModelType)}
              className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-600"
              title="Selected Gemini Model"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            </select>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs leading-relaxed space-y-1 ${
                    msg.role === 'user'
                      ? 'bg-emerald-800 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[9px] ${
                      msg.role === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.model && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{msg.model}</span>
                      </>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-medium ml-1">Ka-Barangay is formulating an answer...</span>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs space-y-1">
                <span className="font-bold block">Notice:</span>
                <p>{errorMsg}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Starter Pill Carousel */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-400 font-semibold shrink-0">Subukan itanong:</span>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-slate-700 rounded-full whitespace-nowrap transition shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Magtanong ukol sa serbisyo, permit, clearance, o tulong..."
                className="w-full resize-none pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-normal"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-emerald-800 text-amber-300 rounded-lg hover:bg-emerald-900 disabled:opacity-40 transition shadow-xs"
                title="Send Message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Barangay Camohaguin AI Helpdesk</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
