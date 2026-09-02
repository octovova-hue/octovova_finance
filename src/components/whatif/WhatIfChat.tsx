import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ChatMessage, WhatIfDelta } from '../../types/finance';
import { mockApi } from '../../lib/mockApi';
import { formatINR } from '../../lib/formatters';
import { RobotAdvisorColoredIcon } from '../common/ColoredIcon';
import { Send, User as UserIcon } from 'lucide-react';

const SUGGESTIONS = [
  'What if I invest ₹15,000 more per month?',
  'What if inflation rises to 7% instead of 6%?',
  'What if I delay my goal purchase by 2 years?',
  'What if I save ₹25,000 more each month?',
];

export const WhatIfChat: React.FC = () => {
  const { activePlan, selectedGoal, assumptions, user } = useFinance();
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hello ${user.name || 'there'}! I am your Octovova Scenario Simulator. You can ask me how changes in your monthly investment, inflation rates, or target timelines shift your ${activePlan?.name || 'Financial Plan'}.`,
    },
  ]);

  const handleSend = async (questionText: string) => {
    const text = questionText.trim();
    if (!text || loading || !activePlan || !selectedGoal) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const delta = await mockApi.processWhatIf(text, activePlan, selectedGoal, assumptions);
      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: delta.explanation,
        whatIfDelta: delta,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: 'I can help with income, monthly contribution, inflation rate, and timeline changes right now.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="p-4 rounded-card glass-card border border-border flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface">
            <RobotAdvisorColoredIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">What-If Scenario Simulator</h2>
            <p className="text-xs text-text-secondary">
              Active Strategy: <strong className="text-brand-lightGreen">{activePlan?.name}</strong> (Target: {selectedGoal?.name})
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Scenario Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-text-tertiary font-bold uppercase text-[10px] shrink-0">Try Asking:</span>
        {SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sug)}
            className="shrink-0 px-3.5 py-1.5 rounded-full glass-card hover:glass-card-raised border border-border hover:border-brand-green text-text-secondary hover:text-text-primary transition-all text-xs font-medium"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="rounded-card glass-card border border-border p-4 sm:p-6 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 shadow-glass">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`p-2 rounded-full shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-brand-green text-white'
                  : 'bg-surface border border-border'
              }`}
            >
              {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <RobotAdvisorColoredIcon className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-card p-4 space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-brand-green text-white rounded-tr-none shadow-glow-green'
                  : 'glass-card-raised border border-border text-text-primary rounded-tl-none'
              }`}
            >
              {/* BEFORE/AFTER DELTA CARD */}
              {msg.whatIfDelta && (
                <div className="p-3.5 rounded-2xl glass-card border border-brand-green/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-[11px] uppercase font-bold text-brand-lightGreen">
                      {msg.whatIfDelta.parameterLabel} Delta
                    </span>
                    <span className="font-mono text-brand-mint font-bold text-xs">
                      {msg.whatIfDelta.newValue}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2 rounded-xl bg-surface border border-border">
                      <span className="text-[10px] text-text-tertiary block">Current Plan SIP</span>
                      <strong className="font-mono text-text-primary text-xs">
                        ₹{msg.whatIfDelta.currentMonthlyInvestment.toLocaleString('en-IN')}/mo
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-surface border border-border">
                      <span className="text-[10px] text-text-tertiary block">New Simulated SIP</span>
                      <strong className="font-mono text-brand-lightGreen text-xs">
                        ₹{msg.whatIfDelta.newMonthlyInvestment.toLocaleString('en-IN')}/mo
                      </strong>
                    </div>
                  </div>

                  {msg.whatIfDelta.surplusOrDeficit !== 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-text-secondary">Projected Outcome:</span>
                      <strong className="font-mono text-brand-mint">
                        {msg.whatIfDelta.surplusOrDeficit > 0
                          ? `+₹${msg.whatIfDelta.surplusOrDeficit.toLocaleString('en-IN')} Surplus`
                          : `-₹${Math.abs(msg.whatIfDelta.surplusOrDeficit).toLocaleString('en-IN')} Shortfall`}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* NARRATIVE EXPLANATION */}
              <p className="text-xs leading-relaxed">
                {msg.text}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-surface border border-border">
              <RobotAdvisorColoredIcon className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-card glass-card-raised border border-border text-xs text-text-secondary animate-pulse">
              Recalculating scenario deltas...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          maxLength={500}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a scenario (e.g., 'What if I invest ₹10,000 more per month?')..."
          className="flex-1 bg-surface border border-border focus:border-brand-green rounded-full px-5 py-3 text-xs text-text-primary placeholder:text-text-tertiary outline-none shadow-glass"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 text-white transition-all shadow-glow-green"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
