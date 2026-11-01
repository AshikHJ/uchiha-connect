import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Participant, AppConfig } from '../types';
import { api } from '../services/api';
import { downloadIndividualQrPng, getParticipantPublicUrl, exportBulkQrZip } from '../utils/qrcode';
import { BrandIcon } from '../components/common/BrandIcon';
import {
  Users,
  CheckCircle2,
  FileEdit,
  EyeOff,
  QrCode,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

interface StudioDashboardProps {
  refreshKey?: number;
  onOpenCreateModal: (targetSlot?: number, participant?: Participant) => void;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({ onOpenCreateModal, refreshKey = 0 }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await api.participants.getAll();
      setParticipants(res.participants);
      setConfig(res.config);
    } catch (err) {
      console.error('Failed to load participants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const totalSlots = config?.totalSlots || 30;
  const filledParticipants = participants.filter((p) => p.full_name && p.full_name.trim() !== '');
  const publishedCount = participants.filter((p) => p.publication_status === 'published').length;
  const draftCount = participants.filter(
    (p) => p.publication_status === 'draft' && p.full_name && p.full_name.trim() !== ''
  ).length;
  const unpublishedCount = participants.filter(
    (p) => p.publication_status === 'unpublished' && p.full_name && p.full_name.trim() !== ''
  ).length;

  const handleCopyPublicLink = (p: Participant) => {
    const url = getParticipantPublicUrl(p.username, config?.productionDomain);
    navigator.clipboard.writeText(url);
    setCopiedId(p.participant_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePublish = async (p: Participant) => {
    try {
      if (p.publication_status === 'published') {
        await api.participants.unpublish(p.participant_id);
      } else {
        await api.participants.publish(p.participant_id);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-brand-mutedGrey">Loading Studio Overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner / Welcome Header */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-brand-surface border border-brand-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-crimsonLight text-brand-crimson text-xs font-bold">
            <Sparkles size={14} />
            <span>UCHIHA CONNECT STUDIO</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-brand-black tracking-tight">
            {config?.hackathonName || 'UCHIHA CONNECT HACKATHON 2026'}
          </h1>
          <p className="font-serif italic text-sm text-brand-crimson font-medium">
            One Identity. Every Connection.
          </p>
          <p className="text-xs text-brand-mutedGrey max-w-xl leading-relaxed">
            Create, customize, and individually publish up to {totalSlots} personalized UC digital business
            cards with mobile-first profiles and instant QR code downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onOpenCreateModal()}
            className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 sm:flex-initial"
          >
            <Plus size={16} />
            <span>+ CREATE NEW CARD</span>
          </button>

          <button
            onClick={() => exportBulkQrZip(participants, config?.productionDomain)}
            className="px-4 py-3 rounded-2xl bg-brand-warmWhite hover:bg-brand-cream border border-brand-border text-brand-black text-xs font-bold flex items-center justify-center gap-2 transition-all flex-1 sm:flex-initial"
            title="Download all QR codes in a ZIP"
          >
            <Download size={15} />
            <span>Bulk QR ZIP</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle">
          <div className="flex items-center justify-between text-brand-mutedGrey mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Slots</span>
            <Users size={16} className="text-brand-charcoal" />
          </div>
          <div className="text-2xl font-serif font-black text-brand-black">
            {filledParticipants.length}
            <span className="text-xs font-sans font-medium text-brand-mutedGrey ml-1">
              / {totalSlots}
            </span>
          </div>
          <p className="text-[10px] text-brand-mutedGrey mt-1">Capacity configured</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle">
          <div className="flex items-center justify-between text-brand-mutedGrey mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Published</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-black text-emerald-600">
            {publishedCount}
          </div>
          <p className="text-[10px] text-brand-mutedGrey mt-1">Live public cards</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle">
          <div className="flex items-center justify-between text-brand-mutedGrey mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Draft Cards</span>
            <FileEdit size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-black text-amber-500">
            {draftCount}
          </div>
          <p className="text-[10px] text-brand-mutedGrey mt-1">Organizer only</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle">
          <div className="flex items-center justify-between text-brand-mutedGrey mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unpublished</span>
            <EyeOff size={16} className="text-zinc-500" />
          </div>
          <div className="text-2xl font-serif font-black text-zinc-500">
            {unpublishedCount}
          </div>
          <p className="text-[10px] text-brand-mutedGrey mt-1">Disabled public access</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-brand-mutedGrey mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">QR Codes</span>
            <QrCode size={16} className="text-brand-orange" />
          </div>
          <div className="text-2xl font-serif font-black text-brand-orange">
            {publishedCount}
          </div>
          <p className="text-[10px] text-brand-mutedGrey mt-1">Print ready</p>
        </div>
      </div>

      {/* 30 Participant Slots Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-brand-black">
              Participant Slots (1 - {totalSlots})
            </h2>
            <p className="text-xs text-brand-mutedGrey">
              Click any empty slot to add a participant or edit existing cards
            </p>
          </div>
          <Link
            to="/studio/participants"
            className="text-xs font-bold text-brand-orange hover:text-brand-orangeHover flex items-center gap-1"
          >
            <span>Table View</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {participants.map((p) => {
            const hasData = p.full_name && p.full_name.trim() !== '';
            const isPublished = p.publication_status === 'published';

            return (
              <div
                key={p.participant_id}
                className={`p-4 rounded-2xl border transition-all ${
                  hasData
                    ? 'bg-brand-surface border-brand-border hover:shadow-card'
                    : 'bg-brand-warmWhite/60 border-dashed border-brand-border hover:border-brand-orange'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-warmWhite border border-brand-border text-brand-charcoal">
                    {p.participant_id}
                  </span>
                  {hasData && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.publication_status === 'draft'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {p.publication_status}
                    </span>
                  )}
                </div>

                {hasData ? (
                  <div className="space-y-3">
                    {/* Participant Details */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-cream border border-brand-border flex-shrink-0">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-brand-charcoal">
                            {p.full_name.substring(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-bold text-brand-black truncate">
                          {p.full_name}
                        </h3>
                        <p className="text-[10px] text-brand-mutedGrey truncate">
                          {p.headline || p.college || 'Participant'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Social Count */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {p.social_links?.slice(0, 4).map((s) => (
                        <div key={s.id} className="p-1 rounded bg-brand-warmWhite text-brand-charcoal" title={s.platform}>
                          <BrandIcon platform={s.platform} size={12} />
                        </div>
                      ))}
                      {(p.social_links?.length || 0) > 4 && (
                        <span className="text-[9px] text-brand-mutedGrey font-mono">
                          +{p.social_links.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => navigate(`/studio/editor/${p.participant_id}`)}
                        className="text-brand-black font-semibold hover:text-brand-orange"
                      >
                        Edit
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => downloadIndividualQrPng(p, config?.productionDomain)}
                          className="p-1 text-brand-mutedGrey hover:text-brand-black"
                          title="Download QR"
                        >
                          <QrCode size={13} />
                        </button>

                        <button
                          onClick={() => handleCopyPublicLink(p)}
                          className="p-1 text-brand-mutedGrey hover:text-brand-black"
                          title="Copy Link"
                        >
                          {copiedId === p.participant_id ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {isPublished && (
                          <a
                            href={`/p/${p.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-brand-mutedGrey hover:text-brand-orange"
                            title="Open public card"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Slot View */
                  <div
                    onClick={() => onOpenCreateModal(p.slot_number)}
                    className="py-5 text-center cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-warmWhite text-brand-mutedGrey group-hover:bg-brand-orangeLight group-hover:text-brand-orange flex items-center justify-center mx-auto mb-1.5 transition-colors">
                      <Plus size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors block">
                      Empty Slot #{p.slot_number}
                    </span>
                    <span className="text-[9px] text-brand-mutedGrey">
                      Click to assign participant
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
