import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { login, register } = useFinance();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Register state (CRED-style progressive disclosure)
  const [regStage, setRegStage] = useState<'name' | 'email' | 'password'>('name');
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login state (empty by default)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please fill in both email and password');
      return;
    }
    const success = login(loginEmail.trim(), loginPassword.trim());
    if (!success) {
      setError('Invalid credentials. Please verify your email and password.');
    } else {
      setError(null);
    }
  };

  const fillDemoAccount = () => {
    setLoginEmail('priya.sharma@octovova.com');
    setLoginPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-brand-green selection:text-white">
      {/* Brand Header - Tagline removed per Section 3 */}
      <div className="text-center space-y-3 mb-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-gradient-green mx-auto flex items-center justify-center shadow-glow-green text-white text-3xl font-extrabold">
          💎
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            Octovova <span className="text-brand-lightGreen">Finance</span>
          </h1>
        </div>
      </div>

      {/* Auth Card (Glassmorphism Raised) */}
      <div className="w-full max-w-md glass-card-raised rounded-card border border-border p-6 sm:p-8 shadow-glass space-y-6 animate-in zoom-in-95 duration-200">
        {/* Toggle Mode Pills */}
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
                  placeholder="name@domain.com"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password
              </label>
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
              className="w-full py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Access Dashboard <ArrowRight className="w-4 h-4" />
            </button>

            {/* Demo User Fill (Clean helper) */}
            <div className="pt-2 border-t border-border flex items-center justify-center text-xs">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-brand-lightGreen font-semibold hover:underline"
              >
                Sign In with Priya Sharma Demo
              </button>
            </div>
          </form>
        ) : (
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
                    placeholder="rahul@example.com"
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
        )}
      </div>
    </div>
  );
};
