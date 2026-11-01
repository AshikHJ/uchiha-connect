import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Participant } from '../types';
import { api } from '../services/api';
import { CardPreview } from '../components/profile/CardPreview';
import { Sparkles, ShieldX, ArrowLeft, Home } from 'lucide-react';

export const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [hackathonName, setHackathonName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicCard() {
      if (!username) {
        setErrorMessage('No username specified');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await api.publicProfile.getByUsername(username);
        setParticipant(res.participant);
        setHackathonName(res.hackathonName);
      } catch (err: any) {
        setErrorMessage(
          err.message ||
            'This card is currently in draft or has been unpublished by the organizer.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicCard();
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-warmWhite flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-brand-charcoal font-mono">
          Loading digital card...
        </p>
      </div>
    );
  }

  // Error / Blocked view for Draft or Unpublished cards
  if (errorMessage || !participant) {
    return (
      <div className="min-h-screen bg-brand-warmWhite flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-cream text-brand-charcoal flex items-center justify-center mx-auto mb-4 border border-brand-border">
          <ShieldX size={32} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-black mb-2">
          Card Unavailable
        </h1>
        <p className="text-xs text-brand-mutedGrey max-w-sm mb-6 leading-relaxed">
          {errorMessage || 'This digital business card has not been published or does not exist.'}
        </p>
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-black text-white text-xs font-semibold hover:bg-brand-orange transition-colors"
        >
          <Home size={14} />
          <span>Organizer Access</span>
        </Link>
      </div>
    );
  }

  // Active Published Card View
  return (
    <div className="min-h-screen bg-[#F4EFEA] flex flex-col items-center justify-center p-3 sm:p-6 py-8">
      {/* Top subtle branding indicator */}
      <header className="mb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-brand-border text-[11px] font-bold text-brand-charcoal shadow-sm">
          <Sparkles size={12} className="text-brand-crimson" />
          <span>{hackathonName || 'UCHIHA CONNECT DIGITAL BUSINESS CARD'}</span>
        </div>
      </header>

      {/* Main Responsive Card Container */}
      <main className="w-full flex justify-center animate-scaleUp">
        <CardPreview participant={participant} isPublicView={true} />
      </main>

      {/* Footer Branding */}
      <footer className="mt-6 text-center text-[11px] text-brand-mutedGrey space-y-1">
        <p className="font-serif italic text-xs text-brand-crimson font-medium">
          One Identity. Every Connection.
        </p>
        <p>
          Organized with{' '}
          <Link to="/studio" className="font-bold text-brand-black hover:text-brand-crimson transition-colors underline decoration-brand-border">
            UCHIHA CONNECT STUDIO
          </Link>
        </p>
      </footer>
    </div>
  );
};
