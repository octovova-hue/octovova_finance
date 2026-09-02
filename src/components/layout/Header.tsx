import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { OctovovaLogo } from '../common/OctovovaLogo';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { RiskBadge } from '../common/Badge';
import { formatINR } from '../../lib/formatters';
import { PlanType } from '../../types/finance';
import {
  DashboardNavColoredIcon,
  PlansNavColoredIcon,
  RobotAdvisorColoredIcon,
  SalaryBriefcaseColoredIcon,
  HouseColoredIcon,
  WeddingRingsColoredIcon,
  RetirementIslandColoredIcon,
  GraduationCapColoredIcon,
  BullseyeTargetColoredIcon,
} from '../common/ColoredIcon';
import {
  RotateCcw,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Save,
  Check,
  X,
  Target,
  Layers,
  Bell,
  Sparkles,
} from 'lucide-react';

const PRESET_AVATARS = ['🧑‍💼', '👩‍💻', '👨‍🚀', '👩‍⚕️', '🧙‍♂️', '🦁', '💎', '🚀', '📈'];

export const Header: React.FC = () => {
  const {
    user,
    updateUser,
    activeTab,
    setActiveTab,
    isOnboarded,
    logout,
    updateGoalPlan,
    updateProfileBasic,
  } = useFinance();

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Section 4: User Profile Editing Fields in dropdown
  const [editName, setEditName] = useState<string>(user.name || '');
  const [editAge, setEditAge] = useState<number>(user.age || 30);
  const [editSalary, setEditSalary] = useState<number>(user.income?.[0]?.monthlyAmount || 150000);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Keep edit fields synced if user updates elsewhere
  useEffect(() => {
    setEditName(user.name || '');
    setEditAge(user.age || 30);
    setEditSalary(user.income?.[0]?.monthlyAmount || 150000);
  }, [user.name, user.age, user.income]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGoalIcon = (goalType: string) => {
    switch (goalType.toLowerCase()) {
      case 'house':
      case 'dream home':
        return <span className="text-sm">🏡</span>;
      case 'wedding':
        return <span className="text-sm">💍</span>;
      case 'car':
        return <span className="text-sm">🚗</span>;
      case 'retirement':
        return <span className="text-sm">🏖️</span>;
      case 'education':
        return <span className="text-sm">🎓</span>;
      default:
        return <Target className="w-3.5 h-3.5 text-brand-lightGreen" />;
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileBasic(editName, editAge, editSalary);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080E0C]/90 backdrop-blur-xl border-b border-brand-green/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => setActiveTab('dashboard')}
        >
          <OctovovaLogo size="md" />
          <div>
            <span className="text-base font-extrabold tracking-tight text-text-primary flex items-center gap-1.5">
              Octovova <span className="text-brand-lightGreen">Finance</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs (3 items: Dashboard · Plans · AI Advisor) with Linear-inspired Pill Design */}
        {isOnboarded && (
          <nav className="hidden md:flex items-center gap-1 bg-surface-dark rounded-xl p-1 border border-white/8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-brand-green text-white shadow-glow-green font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <DashboardNavColoredIcon className="w-3.5 h-3.5" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'plans'
                  ? 'bg-brand-green text-white shadow-glow-green font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <PlansNavColoredIcon className="w-3.5 h-3.5" /> Strategy & Plans
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'assistant'
                  ? 'bg-gradient-green text-white shadow-glow-green font-bold'
                  : 'text-brand-lightGreen hover:bg-white/5'
              }`}
            >
              <RobotAdvisorColoredIcon className="w-3.5 h-3.5" /> AI Advisor
            </button>
          </nav>
        )}

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Notifications Trigger */}
          {isOnboarded && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl bg-surface-dark hover:bg-white/5 border border-white/8 hover:border-white/15 text-text-secondary hover:text-text-primary transition-all relative"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-brand-green absolute top-1.5 right-1.5 shadow-glow-green" />
              </button>

              {/* Notifications Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0C1410] rounded-2xl border border-white/10 shadow-modal p-4 space-y-3 z-50 animate-modal-enter text-left">
                  <div className="flex items-center justify-between border-b border-white/8 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Fintech Intelligence
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-lightGreen">
                      3 New
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Allocation Rebalance
                      </span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Your <strong>{user.goals[0]?.name || 'Primary Goal'}</strong> timeline aligns with 55% Equity exposure.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-mint" /> Emergency Cushion
                      </span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Liquid reserves are healthy at ~4.2 months. Next review in 60 days.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Inflation Rate (6.0%)
                      </span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        All future value forecasts calculate with compound 6% annual inflation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-dark hover:bg-white/5 border border-white/8 hover:border-brand-green/50 transition-all text-left"
              title="Profile & Plan Settings"
            >
              <span className="text-base leading-none select-none">{user.avatar || '🧑‍💼'}</span>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-text-primary leading-tight flex items-center gap-1">
                  {user.name || 'User'}
                  <span className="text-[10px] text-text-tertiary font-normal">({user.age || 30})</span>
                </span>
                <span className="text-[10px] text-text-tertiary truncate max-w-[110px]">
                  {user.email || 'user@octovova.com'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* PROFILE DROPDOWN PANEL (Section 7: Opaque background fix) */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-[350px] sm:w-[420px] max-h-[calc(100vh-5rem)] overflow-y-auto bg-[#0B1510] rounded-card border border-border/80 shadow-2xl p-5 space-y-4 z-50 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-white/20">
                {/* Header Summary (Sticky top inside dropdown - Opaque) */}
                <div className="sticky top-0 bg-[#0B1510] -mx-5 -mt-5 p-5 pb-3 border-b border-border z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 rounded-2xl bg-surface border border-border">
                      {user.avatar || '🧑‍💼'}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-text-primary leading-snug">
                        {user.name || 'User Profile'}
                      </h4>
                      <p className="text-xs text-text-secondary truncate max-w-[180px]">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-text-secondary border border-border font-medium">
                          Age {user.age || 30}
                        </span>
                        <RiskBadge category={user.riskProfile?.category || 'moderate'} size="sm" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="p-1.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Avatar Picker Selector */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">
                    Choose Avatar
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => updateUser({ avatar: av })}
                        className={`w-8 h-8 rounded-full text-base flex items-center justify-center transition-all ${
                          user.avatar === av
                            ? 'bg-brand-green/20 border-2 border-brand-green scale-110 shadow-glow-green'
                            : 'bg-surface border border-border hover:border-brand-green/50'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 4: User Profile Editing Fields (Name, Age, Income/Salary) */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Profile Details
                    </span>
                    <span className="text-[10px] text-text-tertiary">Inline Editable</span>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-2.5 text-xs">
                    {/* Full Name */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-text-secondary text-[11px]">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-44 bg-surface border border-border focus:border-brand-green rounded-full px-3 py-1.5 text-xs font-bold text-text-primary outline-none"
                      />
                    </div>

                    {/* Age */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-text-secondary text-[11px]">Age</label>
                      <input
                        type="number"
                        min="18"
                        max="90"
                        value={editAge}
                        onChange={(e) => setEditAge(parseInt(e.target.value, 10) || 30)}
                        className="w-44 bg-surface border border-border focus:border-brand-green rounded-full px-3 py-1.5 text-xs font-mono font-bold text-text-primary outline-none"
                      />
                    </div>

                    {/* Monthly Salary */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-text-secondary text-[11px] flex items-center gap-1.5">
                        <SalaryBriefcaseColoredIcon className="w-3.5 h-3.5" />
                        <span>Monthly Salary</span>
                      </label>
                      <div className="relative w-44">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-text-tertiary text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={editSalary}
                          onChange={(e) => setEditSalary(parseFloat(e.target.value) || 0)}
                          className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-text-primary outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        saveSuccess
                          ? 'bg-brand-green text-white shadow-glow-green'
                          : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green'
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Profile Updated!
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Profile Details
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Section 4: "Switch Active Plan Per Goal" Control */}
                <div className="border-t border-border pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-lightGreen" />
                      <span>Active Plan Per Goal</span>
                    </span>
                    <span className="text-[10px] text-text-tertiary">{user.goals.length} Goals</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {user.goals.map((goal) => {
                      const currentPlanType: PlanType = goal.activePlanType || 'balanced';

                      return (
                        <div
                          key={goal.id}
                          className="p-2.5 rounded-2xl bg-surface border border-border flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {getGoalIcon(goal.goalType)}
                              <span className="font-bold text-text-primary truncate max-w-[170px]">{goal.name}</span>
                            </div>
                            <span className="text-[10px] text-text-tertiary font-mono">({goal.targetYear})</span>
                          </div>

                          {/* 3-Plan Switcher Pills */}
                          <div className="grid grid-cols-3 gap-1 bg-surface-dark/60 p-1 rounded-full border border-border">
                            {[
                              { id: 'conservative', label: 'Low Risk' },
                              { id: 'balanced', label: 'Moderate' },
                              { id: 'growth', label: 'High Risk' },
                            ].map((pt) => {
                              const isSelected = currentPlanType === pt.id;
                              return (
                                <button
                                  key={pt.id}
                                  type="button"
                                  onClick={() => updateGoalPlan(goal.id, pt.id as PlanType)}
                                  className={`py-1 text-[10px] font-bold rounded-full transition-all ${
                                    isSelected
                                      ? 'bg-brand-green text-white shadow-glow-green'
                                      : 'text-text-secondary hover:text-text-primary'
                                  }`}
                                >
                                  {pt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Button at Bottom (Sticky footer inside dropdown - Opaque) */}
                <div className="sticky bottom-0 bg-[#0B1510] -mx-5 -mb-5 p-5 pt-3 border-t border-border z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 rounded-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out / Switch Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar (3 items) */}
      {isOnboarded && (
        <div className="flex md:hidden items-center justify-around bg-surface border-t border-border py-2 px-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'dashboard' ? 'text-brand-lightGreen font-bold' : 'text-text-secondary'
            }`}
          >
            <DashboardNavColoredIcon className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'plans' ? 'text-brand-lightGreen font-bold' : 'text-text-secondary'
            }`}
          >
            <PlansNavColoredIcon className="w-4 h-4" /> Plans
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'assistant' ? 'text-brand-lightGreen font-bold' : 'text-text-secondary'
            }`}
          >
            <RobotAdvisorColoredIcon className="w-4 h-4" /> AI Advisor
          </button>
        </div>
      )}
    </header>
  );
};
