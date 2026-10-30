import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';
import { UcMonogram } from '../components/common/UcLogo';
import { Lock, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const PinLogin: React.FC = () => {
  const { login, error, attemptsLeft, lockoutRemaining, clearError } = useAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4 || lockoutRemaining > 0) return;

    setIsLoading(true);
    await login(pin);
    setIsLoading(false);
  };

  const handleDigitClick = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length < 8) {
      clearError();
      setPin((prev) => prev + digit);
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-brand-warmWhite flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <UcMonogram size={56} variant="crimson" className="mx-auto mb-3 shadow-md" />
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-serif text-3xl font-black tracking-tight text-brand-black">
            UCHIHA CONNECT
          </h1>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-brand-crimsonLight text-brand-crimson">
            UC
          </span>
        </div>
        <p className="font-serif italic text-sm text-brand-crimson font-medium mt-1">
          {BRAND.tagline}
        </p>
        <p className="text-[11px] text-brand-mutedGrey font-medium mt-1">
          UC Studio Organizer Workspace • PIN Authentication
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-brand-surface rounded-[28px] border border-brand-border p-7 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-brand-orange" />
            <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              Enter Access PIN
            </span>
          </div>
          <span className="text-[11px] font-mono text-brand-mutedGrey">Default: 2026</span>
        </div>

        {/* Lockout or Error Alert */}
        {lockoutRemaining > 0 ? (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Security Lockout Active</p>
              <p className="text-[11px] mt-0.5">
                Too many failed attempts. Try again in{' '}
                <span className="font-mono font-bold">{lockoutRemaining}s</span>.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mb-6 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span className="text-[11px]">{error}</span>
          </div>
        ) : null}

        {/* PIN Dots Display */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-brand-orange border-brand-orange scale-110'
                    : 'border-brand-border bg-brand-warmWhite'
                }`}
              />
            ))}
          </div>

          {/* Hidden or standard text input */}
          <input
            type="password"
            maxLength={8}
            value={pin}
            onChange={(e) => {
              clearError();
              setPin(e.target.value.replace(/[^0-9]/g, ''));
            }}
            placeholder="••••"
            disabled={lockoutRemaining > 0}
            className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-2xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
            autoFocus
          />

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                disabled={lockoutRemaining > 0}
                className="py-3 rounded-xl bg-brand-warmWhite hover:bg-brand-cream border border-brand-border font-bold text-sm text-brand-black active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              disabled={lockoutRemaining > 0 || pin.length === 0}
              className="py-3 rounded-xl bg-brand-warmWhite hover:bg-brand-cream border border-brand-border text-xs font-semibold text-brand-mutedGrey"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              disabled={lockoutRemaining > 0}
              className="py-3 rounded-xl bg-brand-warmWhite hover:bg-brand-cream border border-brand-border font-bold text-sm text-brand-black active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              disabled={lockoutRemaining > 0 || pin.length === 0}
              className="py-3 rounded-xl bg-brand-warmWhite hover:bg-brand-cream border border-brand-border text-xs font-semibold text-brand-mutedGrey"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || isLoading || lockoutRemaining > 0}
            className="w-full py-3.5 rounded-2xl bg-brand-black hover:bg-brand-orange text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Organizer Studio</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-brand-border text-center">
          <p className="text-[10px] text-brand-mutedGrey flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Secure Server-Verified HttpOnly Session</span>
          </p>
        </div>
      </div>
    </div>
  );
};
