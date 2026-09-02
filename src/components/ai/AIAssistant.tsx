import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  AIChatMessage as BaseAIChatMessage,
  sendAIMessage,
} from '../../lib/aiChatService';
import { WhatIfDelta } from '../../types/finance';
import { mockApi } from '../../lib/mockApi';
import { formatINR } from '../../lib/formatters';
import {
  RobotAdvisorColoredIcon,
  StocksGrowthColoredIcon,
  WalletColoredIcon,
} from '../common/ColoredIcon';
import {
  User as UserIcon,
  Send,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface ExtendedAIChatMessage extends BaseAIChatMessage {
  whatIfDelta?: WhatIfDelta;
}

const AI_SUGGESTED_PROMPTS = [
  'What if I invest ₹15,000 more per month?',
  'What if inflation rises to 7% instead of 6%?',
  'What if I delay my goal by 2 years?',
  'Why did you recommend this specific asset allocation?',
  'How can I optimize my monthly expenses to save more?',
  'Is my emergency reserve sufficient for unexpected disruptions?',
];

export const AIAssistant: React.FC = () => {
  const {
    user,
    financials,
    activePlan,
    assumptions,
    selectedGoal,
  } = useFinance();

  const [messages, setMessages] = useState<ExtendedAIChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hello **${user.name || 'Priya'}**! I am your **Octovova AI Wealth Advisor & Scenario Simulator**.
      
I have complete context on your financial profile:
• **Net Worth**: ${formatINR(financials.netWorth)}
• **Monthly Cash Flow**: ${formatINR(financials.monthlyCashFlow)}/month
• **Risk Profile**: ${user.riskProfile.category} (Score ${user.riskProfile.score}/25)
• **Active Strategy**: ${activePlan?.name || 'Balanced Growth'} (${activePlan?.allocation.equity || 55}% Equity / ${activePlan?.allocation.debt || 40}% Debt)
• **Target Goal**: ${selectedGoal?.name || 'House'} (${selectedGoal?.targetYear || 2031})

Ask me anything about your asset allocation, debt optimization, or simulate **What-If scenarios** (e.g., "What if I invest ₹15,000 more/mo?").`,
      category: 'general',
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: ExtendedAIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const lower = text.toLowerCase();
    const isWhatIf =
      lower.includes('what if') ||
      lower.includes('what-if') ||
      lower.includes('invest') ||
      lower.includes('sip') ||
      lower.includes('delay') ||
      (lower.includes('inflation') && lower.includes('%'));

    try {
      let whatIfDelta: WhatIfDelta | undefined;
      let responseText = '';

      if (isWhatIf && activePlan && selectedGoal) {
        whatIfDelta = await mockApi.processWhatIf(text, activePlan, selectedGoal, assumptions);
        responseText = whatIfDelta.explanation;
      } else {
        responseText = await sendAIMessage(
          text,
          messages,
          user,
          financials,
          activePlan,
          assumptions,
          selectedGoal
        );
      }

      const assistantMsg: ExtendedAIChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: responseText,
        category: 'advisory',
        whatIfDelta,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ExtendedAIChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: 'I can help advise on your asset allocation, savings targets, and scenario simulations. Please ask your question again.',
        category: 'general',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: `Conversation reset. I am ready to advise you on your financial plan and run scenario simulations, ${user.name || 'Priya'}!`,
        category: 'general',
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-card glass-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface">
            <RobotAdvisorColoredIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                Octovova AI Wealth Advisor
              </h2>
              <span className="text-[10px] uppercase font-bold text-brand-lightGreen bg-brand-green/20 px-2.5 py-0.5 rounded-full border border-brand-green/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" /> What-If Simulator Active
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Personalized guidance and what-if scenario testing anchored to your financial plan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-text-tertiary hover:text-text-primary transition-colors text-xs"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Chat Feed (Left 2 cols) & Context Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Chat Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Suggested Query Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-text-tertiary font-bold uppercase text-[10px] shrink-0">
              Try Asking:
            </span>
            {AI_SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="shrink-0 px-3.5 py-1.5 rounded-full glass-card hover:glass-card-raised border border-border hover:border-brand-green text-text-secondary hover:text-text-primary transition-all text-xs font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="rounded-card glass-card border border-border p-4 sm:p-6 min-h-[460px] max-h-[580px] overflow-y-auto space-y-4 shadow-glass">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`p-2.5 rounded-full shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white shadow-glow-green'
                      : 'bg-surface border border-border'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <UserIcon className="w-4 h-4" />
                  ) : (
                    <RobotAdvisorColoredIcon className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-card p-4 space-y-3 leading-relaxed text-xs sm:text-sm ${
                    msg.sender === 'user'
                      ? 'bg-brand-green text-white rounded-tr-none shadow-glow-green'
                      : 'glass-card-raised border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  {/* WHAT-IF BEFORE/AFTER DELTA CARD IF PRESENT */}
                  {msg.whatIfDelta && (
                    <div className="p-3.5 rounded-2xl glass-card border border-brand-green/40 space-y-3 text-xs shadow-glow-green/20">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <span className="text-[11px] uppercase font-bold text-brand-lightGreen flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-brand-lightGreen" />
                          {msg.whatIfDelta.parameterLabel} Simulation
                        </span>
                        <span className="font-mono text-brand-mint font-bold text-xs">
                          {msg.whatIfDelta.newValue}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="p-2.5 rounded-xl bg-surface border border-border">
                          <span className="text-[10px] text-text-tertiary block">Current Plan SIP</span>
                          <strong className="font-mono text-text-primary text-xs">
                            ₹{msg.whatIfDelta.currentMonthlyInvestment.toLocaleString('en-IN')}/mo
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-xl bg-surface border border-border">
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

                  {/* Formatted Text Content */}
                  <div className="whitespace-pre-line space-y-2">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph.split('**').map((segment, sIdx) => {
                          if (sIdx % 2 === 1) {
                            return (
                              <strong
                                key={sIdx}
                                className={
                                  msg.sender === 'user'
                                    ? 'text-white font-extrabold'
                                    : 'text-brand-lightGreen font-extrabold'
                                }
                              >
                                {segment}
                              </strong>
                            );
                          }
                          return segment;
                        })}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-white/10">
                    <span>
                      {msg.sender === 'user' ? 'You' : 'Octovova AI Advisor'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-full bg-surface border border-border">
                  <RobotAdvisorColoredIcon className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-card glass-card-raised border border-border text-xs text-text-secondary animate-pulse flex items-center gap-2">
                  Computing scenario simulation with your portfolio math...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              maxLength={600}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or simulate a scenario (e.g. 'What if I save ₹20,000 more/mo?')..."
              className="flex-1 bg-surface border border-border focus:border-brand-green rounded-full px-5 py-3.5 text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary outline-none shadow-glass transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 text-white transition-all shadow-glow-green"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Financial Context Sidebar */}
        <div className="space-y-4">
          <div className="p-5 rounded-card glass-card border border-border space-y-4 shadow-glass">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-text-secondary tracking-wider">
                Live Advisor Context
              </h3>
              <span className="text-[10px] text-brand-lightGreen font-semibold">
                Auto-Synced
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Profile */}
              <div className="p-3.5 rounded-2xl glass-card-raised border border-border">
                <span className="text-[10px] text-text-tertiary block font-semibold">Investor Profile</span>
                <strong className="text-text-primary font-bold">
                  {user.name || 'Priya Sharma'} (Age {user.age || 35})
                </strong>
                <span className="text-[11px] text-text-secondary block mt-0.5">
                  Risk Category: <strong className="text-brand-lightGreen">{user.riskProfile.category}</strong>
                </span>
              </div>

              {/* Net Worth & Cash Flow */}
              <div className="p-3.5 rounded-2xl glass-card-raised border border-border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-text-tertiary font-semibold">Net Worth</span>
                  <strong className="font-mono text-text-primary">
                    {formatINR(financials.netWorth)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-tertiary font-semibold">Monthly Cash Flow</span>
                  <strong className="font-mono text-brand-lightGreen">
                    +{formatINR(financials.monthlyCashFlow)}/mo
                  </strong>
                </div>
              </div>

              {/* Active Plan */}
              <div className="p-3.5 rounded-2xl glass-card-raised border border-border">
                <span className="text-[10px] text-text-tertiary block font-semibold">Selected Strategy</span>
                <strong className="text-brand-lightGreen font-bold block">
                  {activePlan?.name || 'Balanced Growth'}
                </strong>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1">
                  <span>Allocation:</span>
                  <span className="font-mono font-bold">
                    {activePlan?.allocation.equity}% Eq / {activePlan?.allocation.debt}% Debt
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mt-0.5">
                  <span>Required SIP:</span>
                  <span className="font-mono font-bold text-brand-mint">
                    {formatINR(activePlan?.monthlyInvestmentRequired || 132000)}/mo
                  </span>
                </div>
              </div>

              {/* Emergency Fund Meter */}
              <div className="p-3.5 rounded-2xl glass-card-raised border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-tertiary font-semibold">Emergency Reserve</span>
                  <span className={`font-bold font-mono text-[11px] ${financials.isEmergencyFundAdequate ? 'text-brand-lightGreen' : 'text-warning'}`}>
                    {financials.emergencyFundMonthsCovered} / {assumptions.emergencyBufferMonths} mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
