import React, { useState } from 'react';
import { useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FeedbackModal } from './components/common/FeedbackModal';
import { PlanDetailModal } from './components/plans/PlanDetailModal';
import { AuthGate } from './components/auth/AuthGate';

// Onboarding Steps
import { StepWelcome } from './components/onboarding/StepWelcome';
import { StepIncome } from './components/onboarding/StepIncome';
import { StepExpenses } from './components/onboarding/StepExpenses';
import { StepAssets } from './components/onboarding/StepAssets';
import { StepLiabilities } from './components/onboarding/StepLiabilities';
import { StepRiskQuiz } from './components/onboarding/StepRiskQuiz';
import { StepGoals } from './components/onboarding/StepGoals';
import { StepProcessing } from './components/onboarding/StepProcessing';

// Post-onboarding Views
import { DashboardHero } from './components/dashboard/DashboardHero';
import { GoalSummaryList } from './components/dashboard/GoalSummaryList';
import { PlanCard } from './components/plans/PlanCard';
import { PlanCompareView } from './components/plans/PlanCompareView';
import { StrategyRecommendationBanner } from './components/plans/StrategyRecommendationBanner';
import { AIAssistant } from './components/ai/AIAssistant';
import { FloatingAICopilot } from './components/ai/FloatingAICopilot';

import { FinancialPlan } from './types/finance';

export const App: React.FC = () => {
  const {
    isAuthenticated,
    isOnboarded,
    completeOnboarding,
    onboardingStep,
    setOnboardingStep,
    activeTab,
    plans,
    activePlan,
    selectPlan,
    user,
    selectedGoal,
  } = useFinance();

  const [selectedPlanForModal, setSelectedPlanForModal] = useState<FinancialPlan | null>(null);

  // SECTION 1: AUTH GATE AS FIRST SCREEN
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  // Render Onboarding steps (Section 5 & 6)
  const renderOnboarding = () => {
    switch (onboardingStep) {
      case 0:
        return <StepWelcome onNext={() => setOnboardingStep(1)} />;
      case 1:
        return <StepIncome onNext={() => setOnboardingStep(2)} onPrev={() => setOnboardingStep(0)} />;
      case 2:
        return <StepExpenses onNext={() => setOnboardingStep(3)} onPrev={() => setOnboardingStep(1)} />;
      case 3:
        return <StepAssets onNext={() => setOnboardingStep(4)} onPrev={() => setOnboardingStep(2)} />;
      case 4:
        return <StepLiabilities onNext={() => setOnboardingStep(5)} onPrev={() => setOnboardingStep(3)} />;
      case 5:
        // Section 6: Risk quiz routes directly to StepGoals (step 6)
        return <StepRiskQuiz onNext={() => setOnboardingStep(6)} onPrev={() => setOnboardingStep(4)} />;
      case 6:
        return <StepGoals onNext={() => setOnboardingStep(7)} onPrev={() => setOnboardingStep(5)} />;
      case 7:
        return (
          <StepProcessing
            onComplete={() => {
              completeOnboarding();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between selection:bg-brand-green selection:text-white">
      {/* Top Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {!isOnboarded ? (
          <div className="py-4 sm:py-8">{renderOnboarding()}</div>
        ) : (
          <div>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                {/* Hero Net Worth & Cash Flow & Compact Speedometer */}
                <DashboardHero />

                {/* Goals Progress (Sorted Newest First, + Add Another Goal) */}
                <GoalSummaryList />

                {/* Active Plan Recommendation & Strategy Comparison Strip */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-text-primary tracking-tight">
                        Investment Strategy Architecture
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Tailored allocation architectures targeting{' '}
                        <strong className="text-brand-lightGreen">{selectedGoal?.name || 'Primary Goal'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Banner */}
                  <StrategyRecommendationBanner />

                  {/* 3 Strategy Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                      const horizonYears = Math.max(1, (selectedGoal?.targetYear || 2031) - 2026);
                      const isRecommended =
                        horizonYears < 3
                          ? plan.type === 'conservative'
                          : user.riskProfile.category === 'Growth' || user.riskProfile.category === 'Aggressive'
                          ? plan.type === 'growth'
                          : user.riskProfile.category === 'Conservative'
                          ? plan.type === 'conservative'
                          : plan.type === 'balanced';

                      return (
                        <PlanCard
                          key={plan.planId}
                          plan={plan}
                          isRecommended={isRecommended}
                          onOpenDetails={(p) => setSelectedPlanForModal(p)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PLANS & COMPARISON */}
            {activeTab === 'plans' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <PlanCompareView
                  onSelectPlan={(planId) => {
                    selectPlan(planId);
                  }}
                  onOpenDetails={(p) => setSelectedPlanForModal(p)}
                />
              </div>
            )}

            {/* TAB 3: AI ADVISOR & WHAT-IF SIMULATOR */}
            {activeTab === 'assistant' && (
              <div className="py-2">
                <AIAssistant />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modals & Floating AI Copilot */}
      <FloatingAICopilot />
      <FeedbackModal />
      <PlanDetailModal
        plan={selectedPlanForModal}
        onClose={() => setSelectedPlanForModal(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
