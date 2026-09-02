import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AIChatMessage, sendAIMessage } from '../../lib/aiChatService';
import { formatINR } from '../../lib/formatters';
import { RobotAdvisorColoredIcon } from '../common/ColoredIcon';
import {
  X,
  Send,
  User as UserIcon,
  Maximize2,
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
  const [hasInteracted, setHasInteracted] = useState<boolean>(() => {
    return sessionStorage.getItem('octovova_ai_interacted') === 'true';
  });

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'quick_welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hi **${user.name || 'there'}**! I am your AI Copilot. Ask me any questions about your **${activePlan?.name || 'Financial Plan'}**, monthly investments, or what-if scenario simulations!`,
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

  const handleOpenCopilot = () => {
    setIsOpen(true);
    if (!hasInteracted) {
      setHasInteracted(true);
      sessionStorage.setItem('octovova_ai_interacted', 'true');
    }
  };

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
    <div className="fixed bottom-5 right-5 z-40">
      <style>{`
        @keyframes idleCopilotPulseGreen {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.45);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 28px rgba(52, 211, 153, 0.85);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .copilot-idle-pulse-green {
            animation: none !important;
          }
        }
        .copilot-idle-pulse-green {
          animation: idleCopilotPulseGreen 3.5s ease-in-out infinite;
        }
      `}</style>

      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpenCopilot}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-green hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform ${
            !hasInteracted ? 'copilot-idle-pulse-green' : 'hover:scale-105'
          }`}
        >
          <div className="p-1 rounded-full bg-white/20">
            <RobotAdvisorColoredIcon className="w-4 h-4" />
          </div>
          <span>AI Advisor Copilot</span>
          <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" />
        </button>
      ) : (
        <div className="w-[92vw] sm:w-[400px] h-[520px] glass-card-raised rounded-card border border-border flex flex-col shadow-glass overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-surface border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-surface border border-border">
                <RobotAdvisorColoredIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary">Octovova AI Copilot</h4>
                <p className="text-[10px] text-text-tertiary">
                  Plan: {activePlan?.name || 'Moderate Risk'} ({activePlan?.allocation.equity}% Eq)
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
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface"
                title="Expand to Full Page AI Assistant"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="px-3 py-2 bg-brand-green/10 border-b border-brand-green/20 flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">Cash Flow: <strong className="text-brand-lightGreen font-mono">+{formatINR(financials.monthlyCashFlow)}/mo</strong></span>
            <span className="text-text-secondary">Monthly Required: <strong className="text-brand-mint font-mono">{formatINR(activePlan?.monthlyInvestmentRequired || 132000)}/mo</strong></span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`p-1.5 rounded-full shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white'
                      : 'bg-surface border border-border'
                  }`}
                >
                  {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <RobotAdvisorColoredIcon className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-card p-3 space-y-1.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white rounded-tr-none shadow-glow-green'
                      : 'glass-card border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-[11px] leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-text-secondary p-2 bg-surface rounded-full animate-pulse">
                <RobotAdvisorColoredIcon className="w-3.5 h-3.5 animate-spin" />
                Thinking...
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
            className="p-2.5 bg-surface border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-surface-raised border border-border focus:border-brand-green rounded-full px-3.5 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 text-white transition-all shadow-glow-green"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
