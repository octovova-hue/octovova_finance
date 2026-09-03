import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowRight, Lock, Mail, User as UserIcon, KeyRound, Check } from 'lucide-react';
import { OctovovaLogo } from '../common/OctovovaLogo';

export const AuthGate: React.FC = () => {
  const { login, register, resetPassword } = useFinance();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Register state (CRED-style progressive disclosure)
  const [regStage, setRegStage] = useState<'name' | 'email' | 'password'>('name');
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login state (empty by default)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot-password state (no email step - confirm account, then set a
  // new password directly; see the conversation with the user for why)
  const [forgotStage, setForgotStage] = useState<'email' | 'newPassword' | 'done'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regStage === 'name') {
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters)');
        return;
      }
      setError(null);
      setRegStage('email');
    } else if (regStage === 'email') {
      if (!regEmail.includes('@') || !regEmail.includes('.')) {
        setError('Please enter a valid email address');
        return;
      }
      setError(null);
      setRegStage('password');
    } else {
      if (regPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setError(null);
      register(name.trim(), regEmail.trim(), regPassword);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please fill in both email and password');
      return;
    }
    setError(null);
    setIsLoggingIn(true);
    try {
      const success = await login(loginEmail.trim(), loginPassword.trim());
      if (!success) {
        setError('Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fillDemoAccount = () => {
    setLoginEmail('priya.sharma@octovova.com');
    setLoginPassword('password123');
    setError(null);
  };

  const handleForgotEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@') || !forgotEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    setForgotStage('newPassword');
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setIsResettingPassword(true);
    try {
      const result = await resetPassword(forgotEmail.trim(), forgotNewPassword);
      if (result.success) {
        setForgotStage('done');
      } else {
        setError(result.error || 'Could not reset password.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const returnToLoginAfterReset = () => {
    setLoginEmail(forgotEmail);
    setLoginPassword('');
    setMode('login');
    setForgotStage('email');
    setForgotEmail('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-brand-green selection:text-white">
      {/* Brand Header with Circular Green Bar Chart Logo */}
      <div className="text-center space-y-3 mb-8 animate-in fade-in duration-300 flex flex-col items-center">
        <OctovovaLogo size="xl" />
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            Octovova <span className="text-brand-lightGreen">Finance</span>
          </h1>
        </div>
      </div>

      {/* Auth Card (Glassmorphism Raised) */}
      <div className="w-full max-w-md glass-card-raised rounded-card border border-border p-6 sm:p-8 shadow-glass space-y-6 animate-in zoom-in-95 duration-200">
        {/* Toggle Mode Pills (hidden during password reset) */}
        {mode !== 'forgot' && (
          <div className="flex rounded-full bg-surface p-1 border border-border">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-brand-green text-white shadow-glow-green'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-brand-green text-white shadow-glow-green'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-4 text-text-tertiary" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="rahul@gmail.com"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStage('email');
                    setForgotEmail(loginEmail);
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-brand-lightGreen hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-4 text-text-tertiary" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all font-mono"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger font-medium animate-in fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Checking...' : (
                <>
                  Access Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Demo User Fill (Clean helper) */}
            <div className="pt-2 border-t border-border flex items-center justify-center text-xs">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-brand-lightGreen font-semibold hover:underline"
              >
                Sign In with Demo Account
              </button>
            </div>
          </form>
        ) : mode === 'register' ? (
          /* REGISTER FORM (CRED-STYLE PROGRESSIVE DISCLOSURE) */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-center">
            {regStage === 'name' && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-lg font-bold text-text-primary">What's your full name?</h3>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none"
                  />
                </div>
              </div>
            )}

            {regStage === 'email' && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-lg font-bold text-text-primary">What's your email address?</h3>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="email"
                    autoFocus
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rahul@gmail.com"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none"
                  />
                </div>
              </div>
            )}

            {regStage === 'password' && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-lg font-bold text-text-primary">Create a secure password</h3>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="password"
                    autoFocus
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-danger font-medium animate-in fade-in">{error}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              {regStage !== 'name' && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setRegStage(regStage === 'password' ? 'email' : 'name');
                  }}
                  className="px-5 py-3 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {regStage === 'password' ? 'Start Financial Quiz' : 'Next'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* FORGOT PASSWORD FLOW - no email step, direct reset after
             confirming the account (see product decision: this app has
             no email-sending infrastructure wired up, so this matches
             the existing security posture rather than a real emailed
             reset link) */
          <div className="space-y-4 text-center">
            {forgotStage === 'email' && (
              <form onSubmit={handleForgotEmailContinue} className="space-y-3 animate-in fade-in">
                <h3 className="text-lg font-bold text-text-primary">Reset your password</h3>
                <p className="text-xs text-text-secondary">
                  Enter the email address on your account.
                </p>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="email"
                    autoFocus
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="rahul@gmail.com"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none"
                  />
                </div>

                {error && <p className="text-xs text-danger font-medium animate-in fade-in">{error}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="px-5 py-3 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {forgotStage === 'newPassword' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 animate-in fade-in">
                <h3 className="text-lg font-bold text-text-primary">Choose a new password</h3>
                <p className="text-xs text-text-secondary">
                  For <span className="text-text-primary font-semibold">{forgotEmail}</span>
                </p>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="password"
                    autoFocus
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="New password (min. 6 characters)"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none font-mono"
                  />
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-4 text-text-tertiary" />
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-tertiary outline-none font-mono"
                  />
                </div>

                {error && <p className="text-xs text-danger font-medium animate-in fade-in">{error}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStage('email');
                      setError(null);
                    }}
                    className="px-5 py-3 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="flex-1 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

            {forgotStage === 'done' && (
              <div className="space-y-4 animate-in fade-in py-4">
                <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-brand-lightGreen" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Password updated</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    You can now sign in with your new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={returnToLoginAfterReset}
                  className="w-full py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Back to Sign In <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
