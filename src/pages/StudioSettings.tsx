import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { api } from '../services/api';
import { TEMPLATES } from '../templates/templates';
import {
  Settings,
  Lock,
  Globe,
  Tag,
  Layers,
  Save,
  Check,
  ShieldAlert,
  Database,
  Download,
} from 'lucide-react';

export const StudioSettings: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields
  const [hackathonName, setHackathonName] = useState('');
  const [productionDomain, setProductionDomain] = useState('');
  const [defaultTemplateId, setDefaultTemplateId] = useState('black-and-orange');

  // Change PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.settings.get();
        setConfig(data);
        setHackathonName(data.hackathonName || '');
        setProductionDomain(data.productionDomain || '');
        setDefaultTemplateId(data.defaultTemplateId || 'black-and-orange');
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.settings.update({
        hackathonName,
        productionDomain,
        defaultTemplateId,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (!/^\d{6,12}$/.test(newPin)) {
      setPinMessage({ text: 'New PIN must be 6-12 digits', isError: true });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ text: 'New PINs do not match', isError: true });
      return;
    }

    setIsChangingPin(true);
    try {
      await api.auth.changePin(currentPin, newPin);
      setPinMessage({ text: 'Organizer PIN successfully changed!', isError: false });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinMessage({ text: err.message || 'Failed to change PIN', isError: true });
    } finally {
      setIsChangingPin(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-brand-mutedGrey">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-brand-black tracking-tight">
          Application & Branding Settings
        </h1>
        <p className="text-xs text-brand-mutedGrey mt-1">
          Configure organizer PIN credentials, custom domains for QR printing, and hackathon branding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Application Configuration */}
        <div className="bg-brand-surface rounded-[24px] border border-brand-border p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-border">
            <Globe size={18} className="text-brand-orange" />
            <h2 className="text-sm font-bold text-brand-black">General Branding</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                Event / Hackathon Name
              </label>
              <input
                type="text"
                value={hackathonName}
                onChange={(e) => setHackathonName(e.target.value)}
                placeholder="e.g. UCHIHA CONNECT HACKATHON 2026"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                Production Domain (for QR codes & profile links)
              </label>
              <input
                type="url"
                value={productionDomain}
                onChange={(e) => setProductionDomain(e.target.value)}
                placeholder="https://uchihaconnect.com"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
              />
              <p className="text-[10px] text-brand-mutedGrey mt-1">
                QR codes generated will point to this domain for print distribution.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                Default Card Template
              </label>
              <select
                value={defaultTemplateId}
                onChange={(e) => setDefaultTemplateId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-brand-black hover:bg-brand-orange text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Branding'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Organizer PIN Management */}
        <div className="bg-brand-surface rounded-[24px] border border-brand-border p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-border">
            <Lock size={18} className="text-brand-orange" />
            <h2 className="text-sm font-bold text-brand-black">Organizer Access PIN</h2>
          </div>

          <form onSubmit={handleChangePin} className="space-y-4">
            {pinMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pinMessage.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span>{pinMessage.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                Current PIN
              </label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Current PIN"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                New PIN (6-12 digits)
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new PIN"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1">
                Confirm New PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-type new PIN"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPin}
              className="w-full py-2.5 rounded-xl bg-brand-surface border border-brand-border hover:bg-brand-warmWhite text-brand-charcoal text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>{isChangingPin ? 'Updating...' : 'Update Organizer PIN'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
