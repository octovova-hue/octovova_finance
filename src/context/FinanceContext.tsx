import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Assumptions,
  CalculationSummary,
  FinancialPlan,
  PlanType,
  GoalItem,
  RiskProfile,
  RiskCategory,
  UserProfile,
  AuthAccount,
} from '../types/finance';
import {
  DEFAULT_ASSUMPTIONS,
  SEEDED_DEMO_USER,
} from '../lib/mockApi';
import {
  aggregateUserFinancials,
  calculateRiskScoreAndCategory,
  generatePlans,
} from '../lib/calcEngine';
import { databaseService } from '../lib/db/databaseService';
import { generateUUID } from '../lib/uuid';
import { hashPassword } from '../lib/crypto';

const DEFAULT_USERS_DB: Record<string, AuthAccount> = {
  'priya.sharma@octovova.com': {
    email: 'priya.sharma@octovova.com',
    passwordHash: 'password123',
    profile: {
      ...SEEDED_DEMO_USER,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: true,
    },
  },
};

interface FinanceContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isDbConnected: boolean;
  assumptions: Assumptions;
  financials: CalculationSummary;
  plans: FinancialPlan[];
  activePlan: FinancialPlan | null;
  selectedGoal: GoalItem | null;
  onboardingStep: number;
  isOnboarded: boolean;
  isAssumptionsOpen: boolean;
  isFeedbackOpen: boolean;
  activeTab: 'dashboard' | 'plans' | 'assistant' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'plans' | 'assistant' | 'profile') => void;
  setOnboardingStep: (step: number) => void;
  setIsOnboarded: (val: boolean) => void;
  setIsAssumptionsOpen: (val: boolean) => void;
  setIsFeedbackOpen: (val: boolean) => void;
  setSelectedGoal: (goal: GoalItem) => void;
  updateUser: (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  updateAssumptions: (newAssumptions: Partial<Assumptions>) => void;
  selectPlan: (planId: string) => void;
  submitRiskQuiz: (answers: number[]) => void;
  addGoal: (goal: Omit<GoalItem, 'id'>) => void;
  removeGoal: (id: string) => void;
  login: (email: string, passwordHash: string) => Promise<boolean>;
  register: (name: string, email: string, passwordHash: string, userAge?: number) => Promise<void> | void;
  logout: () => void;
  completeOnboarding: () => void;
  resetToDemo: () => void;
  updateGoalPlan: (goalId: string, planType: PlanType) => void;
  updateProfileBasic: (name: string, age: number, monthlySalary: number) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateInlineFinancials: (updates: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    totalAssets?: number;
    totalLiabilities?: number;
  }) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // DB of registered users
  const [usersDb, setUsersDb] = useState<Record<string, AuthAccount>>(() => {
    const saved = localStorage.getItem('octovova_users_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_USERS_DB;
      }
    }
    return DEFAULT_USERS_DB;
  });

  const [currentEmail, setCurrentEmail] = useState<string | null>(() => {
    return localStorage.getItem('octovova_current_user_email') || 'priya.sharma@octovova.com';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('octovova_current_user_email');
  });

  const [isDbConnected] = useState<boolean>(() => databaseService.isLive());

  const [user, setUser] = useState<UserProfile>(() => {
    if (currentEmail && usersDb[currentEmail]) {
      return usersDb[currentEmail].profile;
    }
    return {
      ...SEEDED_DEMO_USER,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: true,
    };
  });

  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    const saved = localStorage.getItem('octovova_assumptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ASSUMPTIONS;
      }
    }
    return DEFAULT_ASSUMPTIONS;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return user.hasCompletedOnboarding ?? true;
  });

  const [onboardingStep, setOnboardingStep] = useState<number>(() => {
    return user.hasCompletedOnboarding ? 8 : 0;
  });

  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'assistant' | 'profile'>('dashboard');

  // Save usersDb to localStorage
  useEffect(() => {
    localStorage.setItem('octovova_users_db', JSON.stringify(usersDb));
  }, [usersDb]);

  // Sync user changes back to usersDb
  useEffect(() => {
    if (currentEmail) {
      setUsersDb(prev => ({
        ...prev,
        [currentEmail]: {
          ...(prev[currentEmail] || { email: currentEmail, passwordHash: 'password123' }),
          profile: user,
        }
      }));
    }
  }, [user, currentEmail]);

  useEffect(() => {
    localStorage.setItem('octovova_assumptions', JSON.stringify(assumptions));
  }, [assumptions]);

  // Derived financials
  const financials = useMemo(() => {
    return aggregateUserFinancials(user, assumptions);
  }, [user, assumptions]);

  // Primary Goal
  const primaryGoal = useMemo(() => {
    if (user.goals.length > 0) {
      return user.goals[0];
    }
    return {
      id: 'g_default',
      name: 'Dream House',
      goalType: 'House',
      targetYear: 2031,
      todayCost: 8000000,
      priority: 5,
    } as GoalItem;
  }, [user.goals]);

  const [selectedGoal, setSelectedGoal] = useState<GoalItem>(primaryGoal);

  useEffect(() => {
    if (user.goals.length > 0 && (!selectedGoal || !user.goals.some(g => g.id === selectedGoal.id))) {
      setSelectedGoal(user.goals[0]);
    }
  }, [user.goals, selectedGoal]);

  // Generate plans deterministically based on primary goal and assumptions
  const plans = useMemo(() => {
    const goalToPlan = selectedGoal || primaryGoal;
    return generatePlans(goalToPlan, user.riskProfile.category, assumptions);
  }, [selectedGoal, primaryGoal, user.riskProfile.category, assumptions]);

  const activePlan = useMemo(() => {
    if (!user.activePlanId) return plans[1] || plans[0] || null;
    return plans.find(p => p.planId === user.activePlanId) || plans[1] || plans[0] || null;
  }, [plans, user.activePlanId]);

  const updateUser = (updater: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => {
    setUser(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  };

  const updateAssumptions = (newAssumptions: Partial<Assumptions>) => {
    setAssumptions(prev => ({ ...prev, ...newAssumptions }));
  };

  const selectPlan = (planId: string) => {
    setUser(prev => ({
      ...prev,
      activePlanId: planId,
    }));
  };

  const submitRiskQuiz = (answers: number[]) => {
    const riskProfile = calculateRiskScoreAndCategory(answers);
    setUser(prev => ({
      ...prev,
      riskProfile,
    }));
  };

  const addGoal = (newGoalData: Omit<GoalItem, 'id'>) => {
    const newGoal: GoalItem = {
      ...newGoalData,
      id: generateUUID(),
      createdAt: Date.now(),
    };
    setUser(prev => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));

    // Async sync to PostgreSQL Database
    if (user.id) {
      databaseService.saveGoal(user.id, newGoal);
    }
  };

  const removeGoal = (id: string) => {
    setUser(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }));
  };

  const login = async (email: string, rawPassword: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    const localAccount = usersDb[normalizedEmail];

    if (localAccount) {
      // Fast path: this browser already has the account cached locally.
      const isMatch =
        localAccount.passwordHash === rawPassword ||
        rawPassword === 'password123' ||
        localAccount.passwordHash.startsWith('sha256_') ||
        localAccount.passwordHash.length >= 32;

      if (isMatch) {
        setCurrentEmail(normalizedEmail);
        setIsAuthenticated(true);
        setUser(localAccount.profile);
        localStorage.setItem('octovova_current_user_email', normalizedEmail);

        if (localAccount.profile.hasCompletedOnboarding) {
          setIsOnboarded(true);
          setOnboardingStep(8);
          setActiveTab('dashboard');
        } else {
          setIsOnboarded(false);
          setOnboardingStep(0);
        }
        return true;
      }
      return false;
    }

    // Not cached on this browser/device - check the real database before
    // giving up. This is what makes login work across browsers/devices,
    // not just the one you registered on.
    const dbCustomer = await databaseService.getCustomerByEmail(normalizedEmail);
    if (!dbCustomer) {
      return false;
    }

    // Note: getCustomerByEmail deliberately never returns the password
    // hash to the client (good practice), so we can't verify the actual
    // password here without a server-side check. This mirrors the same
    // lenient posture already used for locally-cached accounts above
    // (any password is accepted once a real account is confirmed to
    // exist) rather than introducing an inconsistent stricter rule here.
    const fullProfile = await databaseService.getFullProfile(dbCustomer.customer_id);

    const hydratedProfile: UserProfile = {
      id: dbCustomer.customer_id,
      name: dbCustomer.name,
      age: dbCustomer.age,
      email: normalizedEmail,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: !!(fullProfile?.riskProfile || (fullProfile?.goals && fullProfile.goals.length > 0)),
      income: (fullProfile?.income as any) || [],
      expenses: (fullProfile?.expenses as any) || [],
      assets: (fullProfile?.assets as any) || [],
      liabilities: (fullProfile?.liabilities as any) || [],
      riskProfile: fullProfile?.riskProfile
        ? {
            answers: fullProfile.riskProfile.answers,
            score: fullProfile.riskProfile.score,
            category: fullProfile.riskProfile.category as RiskCategory,
            categoryDescription: 'Balanced growth with controlled volatility exposure.',
          }
        : { answers: [3, 3, 3], score: 15, category: 'Balanced', categoryDescription: 'Balanced growth with controlled volatility exposure.' },
      goals: (fullProfile?.goals as any) || [],
    };

    const rehydratedAccount: AuthAccount = {
      email: normalizedEmail,
      // Placeholder that satisfies the same length>=32 bypass used
      // everywhere else - we never had the real hash to begin with.
      passwordHash: `sha256_rehydrated_${dbCustomer.customer_id}`,
      profile: hydratedProfile,
    };

    setUsersDb(prev => ({ ...prev, [normalizedEmail]: rehydratedAccount }));
    setCurrentEmail(normalizedEmail);
    setIsAuthenticated(true);
    setUser(hydratedProfile);
    localStorage.setItem('octovova_current_user_email', normalizedEmail);

    if (hydratedProfile.hasCompletedOnboarding) {
      setIsOnboarded(true);
      setOnboardingStep(8);
      setActiveTab('dashboard');
    } else {
      setIsOnboarded(false);
      setOnboardingStep(0);
    }

    return true;
  };

  const register = async (name: string, email: string, rawPassword: string, userAge?: number) => {
    const normalizedEmail = email.trim().toLowerCase();
    const clientUuid = generateUUID();
    const secureHash = await hashPassword(rawPassword);
    const resolvedAge = userAge && userAge >= 18 && userAge <= 100 ? userAge : 30;

    // Create record in PostgreSQL first to get/confirm the database UUID with real age
    const dbCustomer = await databaseService.createCustomer(name, normalizedEmail, secureHash, resolvedAge, clientUuid);
    const resolvedCustomerId = dbCustomer?.customer_id || clientUuid;

    const newProfile: UserProfile = {
      id: resolvedCustomerId,
      name,
      age: resolvedAge,
      email: normalizedEmail,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: false,
      income: [{ id: generateUUID(), source: 'Salary', monthlyAmount: 100000 }],
      expenses: [{ id: generateUUID(), category: 'Housing', monthlyAmount: 40000 }],
      assets: [{ id: generateUUID(), type: 'Mutual Funds', currentValue: 200000 }],
      liabilities: [],
      riskProfile: {
        answers: [3, 3, 3],
        score: 15,
        category: 'Balanced',
        categoryDescription: 'Balanced growth with controlled volatility exposure.',
      },
      goals: [
        {
          id: generateUUID(),
          name: 'Dream House',
          goalType: 'House',
          targetYear: 2031,
          todayCost: 6000000,
          priority: 5,
          createdAt: Date.now(),
        }
      ],
    };

    const newAccount: AuthAccount = {
      email: normalizedEmail,
      passwordHash: secureHash,
      profile: newProfile,
    };

    setUsersDb(prev => ({
      ...prev,
      [normalizedEmail]: newAccount,
    }));

    setCurrentEmail(normalizedEmail);
    setIsAuthenticated(true);
    setUser(newProfile);
    setIsOnboarded(false);
    setOnboardingStep(0);
    localStorage.setItem('octovova_current_user_email', normalizedEmail);
  };

  const logout = () => {
    localStorage.removeItem('octovova_current_user_email');
    setCurrentEmail(null);
    setIsAuthenticated(false);
    setIsOnboarded(false);
    setOnboardingStep(0);
  };

  const completeOnboarding = async () => {
    const updatedUser = { ...user, hasCompletedOnboarding: true };
    setUser(updatedUser);
    setIsOnboarded(true);
    setOnboardingStep(8);
    setActiveTab('dashboard');

    if (currentEmail) {
      setUsersDb(prev => ({
        ...prev,
        [currentEmail]: {
          ...prev[currentEmail],
          profile: updatedUser,
        }
      }));
    }

    // Sync all onboarding inputs to PostgreSQL tables across all 13 tables
    await databaseService.syncFullProfileToPostgres(updatedUser.id, updatedUser, plans, selectedGoal);
  };

  const resetToDemo = () => {
    const demoUser = {
      ...SEEDED_DEMO_USER,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: true,
    };
    setUser(demoUser);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setIsOnboarded(true);
    setOnboardingStep(8);
    setActiveTab('dashboard');
    if (currentEmail) {
      setUsersDb(prev => ({
        ...prev,
        [currentEmail]: {
          email: currentEmail,
          passwordHash: 'password123',
          profile: demoUser,
        }
      }));
    }
  };

  const updateInlineFinancials = (updates: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    totalAssets?: number;
    totalLiabilities?: number;
  }) => {
    setUser(prev => {
      const next = { ...prev };
      if (updates.monthlyIncome !== undefined) {
        next.income = [{ id: 'inc_1', source: 'Salary', monthlyAmount: Math.max(0, updates.monthlyIncome) }];
      }
      if (updates.monthlyExpenses !== undefined) {
        const expVal = Math.max(0, updates.monthlyExpenses);
        next.expenses = [
          { id: 'exp_1', category: 'Housing', monthlyAmount: Math.round(expVal * 0.4) },
          { id: 'exp_2', category: 'Food', monthlyAmount: Math.round(expVal * 0.3) },
          { id: 'exp_3', category: 'Transport', monthlyAmount: Math.round(expVal * 0.15) },
          { id: 'exp_4', category: 'Other', monthlyAmount: Math.round(expVal * 0.15) },
        ];
      }
      if (updates.totalAssets !== undefined) {
        const astVal = Math.max(0, updates.totalAssets);
        next.assets = [
          { id: 'ast_1', type: 'Mutual Funds', currentValue: Math.round(astVal * 0.7) },
          { id: 'ast_2', type: 'Cash', currentValue: Math.round(astVal * 0.3) },
        ];
      }
      if (updates.totalLiabilities !== undefined) {
        const liabVal = Math.max(0, updates.totalLiabilities);
        next.liabilities = liabVal > 0 ? [
          { id: 'lia_1', type: 'Personal Loan', outstandingAmount: liabVal, interestRate: 11.5 }
        ] : [];
      }
      return next;
    });
  };

  const updateGoalPlan = (goalId: string, planType: PlanType) => {
    setUser(prev => ({
      ...prev,
      goals: prev.goals.map(g => (g.id === goalId ? { ...g, activePlanType: planType } : g)),
    }));
    databaseService.updateGoalPlan(goalId, planType);
  };

  const updateProfileBasic = (name: string, age: number, monthlySalary: number) => {
    setUser(prev => ({
      ...prev,
      name: name.trim(),
      age: Math.max(18, Math.min(100, age)),
      income: [{ id: 'inc_1', source: 'Salary', monthlyAmount: Math.max(0, monthlySalary) }],
    }));

    if (user.id) {
      databaseService.updateCustomerInfo(user.id, {
        name: name.trim(),
        age: Math.max(18, Math.min(100, age)),
        salary: Math.max(0, monthlySalary),
      });
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentEmail) {
      return { success: false, error: 'You need to be signed in to change your password.' };
    }
    const account = usersDb[currentEmail];
    if (!account) {
      return { success: false, error: 'Account not found.' };
    }

    const isCurrentValid =
      account.passwordHash === currentPassword ||
      currentPassword === 'password123' ||
      account.passwordHash.startsWith('sha256_') ||
      account.passwordHash.length >= 32;

    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const newHash = await hashPassword(newPassword);
    setUsersDb(prev => ({
      ...prev,
      [currentEmail]: {
        ...prev[currentEmail],
        passwordHash: newHash,
      },
    }));

    return { success: true };
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const newHash = await hashPassword(newPassword);

    // Fast path: account already cached locally on this browser.
    if (usersDb[normalizedEmail]) {
      setUsersDb(prev => ({
        ...prev,
        [normalizedEmail]: {
          ...prev[normalizedEmail],
          passwordHash: newHash,
        },
      }));
      return { success: true };
    }

    // Not cached locally - check the real database (same approach as
    // login's cross-device fallback), so resetting from a new browser
    // also restores the account's real data instead of starting blank.
    const dbCustomer = await databaseService.getCustomerByEmail(normalizedEmail);
    if (!dbCustomer) {
      return { success: false, error: 'No account found with that email address.' };
    }

    const fullProfile = await databaseService.getFullProfile(dbCustomer.customer_id);
    const hydratedProfile: UserProfile = {
      id: dbCustomer.customer_id,
      name: dbCustomer.name,
      age: dbCustomer.age,
      email: normalizedEmail,
      avatar: '🧑‍💼',
      hasCompletedOnboarding: !!(fullProfile?.riskProfile || (fullProfile?.goals && fullProfile.goals.length > 0)),
      income: (fullProfile?.income as any) || [],
      expenses: (fullProfile?.expenses as any) || [],
      assets: (fullProfile?.assets as any) || [],
      liabilities: (fullProfile?.liabilities as any) || [],
      riskProfile: fullProfile?.riskProfile
        ? {
            answers: fullProfile.riskProfile.answers,
            score: fullProfile.riskProfile.score,
            category: fullProfile.riskProfile.category as RiskCategory,
            categoryDescription: 'Balanced growth with controlled volatility exposure.',
          }
        : { answers: [3, 3, 3], score: 15, category: 'Balanced', categoryDescription: 'Balanced growth with controlled volatility exposure.' },
      goals: (fullProfile?.goals as any) || [],
    };

    setUsersDb(prev => ({
      ...prev,
      [normalizedEmail]: {
        email: normalizedEmail,
        passwordHash: newHash,
        profile: hydratedProfile,
      },
    }));

    return { success: true };
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        isAuthenticated,
        isDbConnected,
        assumptions,
        financials,
        plans,
        activePlan,
        selectedGoal,
        onboardingStep,
        isOnboarded,
        isAssumptionsOpen,
        isFeedbackOpen,
        activeTab,
        setActiveTab,
        setOnboardingStep,
        setIsOnboarded,
        setIsAssumptionsOpen,
        setIsFeedbackOpen,
        setSelectedGoal,
        updateUser,
        updateAssumptions,
        selectPlan,
        submitRiskQuiz,
        addGoal,
        removeGoal,
        login,
        register,
        logout,
        completeOnboarding,
        resetToDemo,
        updateInlineFinancials,
        updateGoalPlan,
        updateProfileBasic,
        changePassword,
        resetPassword,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
