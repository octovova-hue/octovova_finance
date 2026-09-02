import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AIChatMessage, sendAIMessage } from '../../lib/aiChatService';
import { formatINR } from '../../lib/formatters';
import {
  X,
  Send,
  User as UserIcon,
  Maximize2,
  Sparkles,
  Bot,
  Minimize2,
} from 'lucide-react';

export const FloatingAICopilot: React.FC = () => {
  const {
    user,
    financials,
    activePlan,
    assumptions,
    selectedGoal,
    setActiveTab,
    isOnboarded,
  } = useFinance();

  // Only show once onboarded
  if (!isOnboarded) return null;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'quick_welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hi **${user.name || 'there'}**! I am your AI Financial Advisor. Ask me anything about your **${activePlan?.name || 'Balanced'}** strategy, monthly SIP requirements, or run what-if stress tests!`,
      category: 'general',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendAIMessage(
        text,
        messages,
        user,
        financials,
        activePlan,
        assumptions,
        selectedGoal
      );

      const assistantMsg: AIChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: reply,
        category: 'advisory',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          text: 'I can help advise on your savings, asset allocation, and goal timelines.',
          category: 'general',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
      {!isOpen ? (
        /* Minimized Sleek Pill - Non-obstructive docking */
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setHasInteracted(true);
          }}
          className={`pointer-events-auto group flex items-center gap-2.5 h-11 px-4 rounded-full bg-[#0D1612] hover:bg-[#121F19] border border-white/12 hover:border-brand-green/50 text-text-primary font-semibold text-xs shadow-card transition-all duration-200 hover:scale-105 active:scale-95 ${
            !hasInteracted ? 'animate-ai-jump' : ''
          }`}
          aria-label="Open AI Advisor Copilot"
        >
          <div className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-lightGreen flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline">AI Advisor Copilot</span>
          <span className="sm:hidden">Advisor</span>
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
        </button>
      ) : (
        /* Expanded Floating Chat Panel / Responsive Sheet on Mobile */
        <div className="pointer-events-auto fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 w-auto sm:w-[420px] h-[520px] max-h-[85vh] bg-[#0C1410] rounded-2xl border border-white/12 flex flex-col shadow-modal overflow-hidden animate-modal-enter">
          {/* Header */}
          <div className="p-4 bg-[#0F1914] border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-green/15 text-brand-lightGreen border border-brand-green/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary tracking-tight">
                  Octovova AI Advisor
                </h4>
                <p className="text-[10px] text-text-secondary font-mono">
                  Strategy: {activePlan?.name || 'Balanced'} ({activePlan?.allocation.equity}% Equity)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('assistant');
                }}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
                title="Expand to Full Page AI Assistant"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
                title="Minimize Copilot"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="px-4 py-2 bg-brand-green/10 border-b border-brand-green/20 flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">
              Cash Flow: <strong className="text-brand-lightGreen font-mono">+{formatINR(financials.monthlyCashFlow)}/mo</strong>
            </span>
            <span className="text-text-secondary">
              Required SIP: <strong className="text-brand-mint font-mono">{formatINR(activePlan?.monthlyInvestmentRequired || 132000)}/mo</strong>
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white'
                      : 'bg-white/5 text-text-secondary border border-white/8'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <UserIcon className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-brand-lightGreen" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white rounded-tr-none shadow-glow-green'
                      : 'bg-[#101915] border border-white/8 text-text-primary rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-text-secondary p-2 bg-white/5 rounded-xl animate-pulse max-w-fit">
                <Sparkles className="w-3.5 h-3.5 text-brand-lightGreen animate-spin" />
                Analyzing portfolio parameters...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-[#0F1914] border-t border-white/8 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about goals, SIPs, or allocations..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-surface-dark border border-white/10 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand-green focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-glow-green"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
