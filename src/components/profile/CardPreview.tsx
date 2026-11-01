import React, { useState } from 'react';
import { DesignedCard } from './DesignedCard';
import { safeUrl } from './DesignElement';
import { Participant, Template } from '../../types';
import { BrandIcon } from '../common/BrandIcon';
import { getTemplateById } from '../../templates/templates';
import { downloadVCard } from '../../utils/vcard';
import { BRAND } from '../../config/brand';
import { UcMonogram } from '../common/UcLogo';
import {
  Download,
  Share2,
  Mail,
  Phone,
  ExternalLink,
  QrCode,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react';
import { generateQrPngDataUrl, getParticipantPublicUrl } from '../../utils/qrcode';

interface CardPreviewProps {
  participant: Participant;
  templateOverride?: Template;
  productionDomain?: string;
  isPublicView?: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  participant,
  templateOverride,
  productionDomain,
  isPublicView = false,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedContact, setSavedContact] = useState(false);

  const activeTemplate = templateOverride || getTemplateById(participant.template_id || 'black-and-orange');
  const design = templateOverride?.defaultDesign || participant.design_json;
  const theme = design?.theme || activeTemplate.theme;

  const publicUrl = getParticipantPublicUrl(participant.username, productionDomain);

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${participant.full_name || 'Participant'} — ${BRAND.name}`,
          text: participant.headline || `Connect with me on ${BRAND.name}`,
          url: publicUrl,
        });
        return;
      } catch (err) {
        // Fallback to QR modal
      }
    }
    const qrUrl = await generateQrPngDataUrl(publicUrl, 500);
    setQrDataUrl(qrUrl);
    setShowQrModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveContact = () => {
    downloadVCard(participant);
    setSavedContact(true);
    setTimeout(() => setSavedContact(false), 2500);
  };

  // Safe external link opener
  const openExternal = (url: string) => {
    const safe = safeUrl(url);
    if (safe) window.open(safe, '_blank', 'noopener,noreferrer');
  };

  const isDark = ['dark', 'cyber'].includes(theme.styleMode);

  return (
    <div className="w-full max-w-[420px] mx-auto transition-all duration-300">
      {design ? <>
        <DesignedCard design={design} participant={participant} publicUrl={publicUrl} />
        <div className="flex flex-wrap justify-center gap-3 mt-4 p-3 rounded-xl bg-white text-black text-sm">
          <button onClick={handleSaveContact} className="px-3 py-2 rounded-lg border">{savedContact ? 'Saved!' : 'Save Contact'}</button>
          <button onClick={handleShareClick} className="px-3 py-2 rounded-lg border">Share</button>
          {participant.email && <a className="px-3 py-2" href={`mailto:${participant.email}`}>Email</a>}
          {participant.phone && <a className="px-3 py-2" href={`tel:${participant.phone}`}>Call</a>}
        </div>
      </> : <div
        className="relative overflow-hidden rounded-[28px] transition-all duration-300 shadow-card"
        style={{
          backgroundColor: theme.cardBackground,
          color: theme.textColor,
          border: `${theme.borderWidth || 1}px solid ${theme.borderColor || 'rgba(0,0,0,0.08)'}`,
          fontFamily: theme.fontFamily,
        }}
      >
        {/* Top Decorative Banner / Gradient Accent */}
        <div
          className="h-28 w-full relative overflow-hidden"
          style={{
            background:
              theme.id === 'creative-gradient'
                ? 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDE047 100%)'
                : theme.id === 'black-and-orange'
                ? 'linear-gradient(135deg, #111111 0%, #252525 60%, #E87942 100%)'
                : theme.id === 'luxury-black-and-gold'
                ? 'linear-gradient(135deg, #171717 0%, #262626 70%, #B45309 100%)'
                : theme.id === 'futuristic-technology'
                ? 'linear-gradient(135deg, #0B0F19 0%, #1E293B 70%, #06B6D4 100%)'
                : theme.id === 'professional-blue'
                ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #3B82F6 100%)'
                : theme.id === 'editorial-cream'
                ? 'linear-gradient(135deg, #EAE1D1 0%, #D8CEBE 100%)'
                : isDark
                ? '#1E1E1E'
                : '#F1E7D7',
          }}
        >
          {/* Subtle grid pattern for tech theme */}
          {theme.styleMode === 'cyber' && (
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #E87942 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
          )}

          {/* Quick Share / QR Button in Banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleShareClick}
              aria-label="Share or show QR"
              className="p-2 rounded-full backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.65)',
                color: theme.headingColor,
              }}
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 pb-7 -mt-16 flex flex-col items-center text-center">
          {/* Profile Picture */}
          <div className="relative mb-3 group">
            <div
              className="w-28 h-28 rounded-full overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                border: `3.5px solid ${theme.cardBackground}`,
                backgroundColor: isDark ? '#222222' : '#E8E4DC',
              }}
            >
              {participant.photo_url ? (
                <img
                  src={participant.photo_url}
                  alt={participant.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback avatar
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-2xl uppercase"
                  style={{ color: theme.accentColor, backgroundColor: isDark ? '#262626' : '#F1E7D7' }}
                >
                  {(participant.full_name || 'CID').substring(0, 2)}
                </div>
              )}
            </div>

            {/* Verified badge pill */}
            <div
              className="absolute bottom-0 right-1 p-1 rounded-full shadow-sm"
              style={{
                backgroundColor: theme.accentColor,
                color: theme.styleMode === 'cyber' || theme.id === 'minimal-white' ? '#FFFFFF' : '#111111',
              }}
              title="Verified Participant"
            >
              <Sparkles size={13} />
            </div>
          </div>

          {/* Full Name */}
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{
              color: theme.headingColor,
              fontFamily: theme.headingFontFamily || theme.fontFamily,
            }}
          >
            {participant.full_name || 'Participant Name'}
          </h1>

          {/* Professional Headline */}
          {participant.headline && (
            <p
              className="text-sm font-medium mb-3 max-w-[320px] leading-snug"
              style={{ color: theme.accentColor }}
            >
              {participant.headline}
            </p>
          )}

          {/* College & Department Pill */}
          {(participant.college || participant.department) && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1E7D7',
                color: theme.textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2DCD2'}`,
              }}
            >
              <span>{participant.college}</span>
              {participant.college && participant.department && <span>•</span>}
              <span>{participant.department}</span>
            </div>
          )}

          {/* Short Bio */}
          {participant.bio && (
            <p
              className="text-xs leading-relaxed mb-5 max-w-[340px]"
              style={{ color: theme.mutedColor }}
            >
              {participant.bio}
            </p>
          )}

          {/* Primary Action Buttons (Save Contact & Share) */}
          <div className="w-full flex items-center justify-center gap-3 mb-6">
            <button
              onClick={handleSaveContact}
              className="flex-1 max-w-[175px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
              style={{
                backgroundColor: theme.accentColor,
                color: isDark && theme.id !== 'black-and-orange' ? '#000000' : '#FFFFFF',
              }}
            >
              {savedContact ? (
                <>
                  <Check size={15} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Save Contact</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareClick}
              className="flex-1 max-w-[145px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1E7D7',
                color: theme.headingColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2DCD2'}`,
              }}
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          </div>

          {/* Quick Direct Communication Buttons (Email, Phone) */}
          {(participant.email || participant.phone) && (
            <div className="w-full flex items-center justify-center gap-2 mb-6">
              {participant.email && (
                <a
                  href={`mailto:${participant.email}`}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F4EC',
                    color: theme.textColor,
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2DCD2'}`,
                  }}
                >
                  <Mail size={13} className="text-brand-orange" />
                  <span className="truncate">{participant.email}</span>
                </a>
              )}
              {participant.phone && (
                <a
                  href={`tel:${participant.phone}`}
                  className="py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F4EC',
                    color: theme.textColor,
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2DCD2'}`,
                  }}
                  title={participant.phone}
                >
                  <Phone size={13} className="text-brand-orange" />
                  <span>Call</span>
                </a>
              )}
            </div>
          )}

          {/* Social Links Row / Grid */}
          {participant.social_links && participant.social_links.length > 0 && (
            <div className="w-full mb-6">
              <div className="text-[11px] font-semibold tracking-wider uppercase mb-3 opacity-60">
                Connect Online
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {participant.social_links
                  .filter((link) => link.url && link.url.trim() !== '')
                  .map((link) => (
                    <button
                      key={link.id}
                      onClick={() => openExternal(link.url)}
                      className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2DCD2'}`,
                        color: theme.textColor,
                      }}
                      title={link.url}
                    >
                      <BrandIcon platform={link.platform} size={15} />
                      <span className="max-w-[130px] truncate">{link.label}</span>
                      <ExternalLink size={11} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {participant.projects && participant.projects.length > 0 && (
            <div className="w-full mb-6 text-left">
              <div className="text-[11px] font-semibold tracking-wider uppercase mb-2.5 opacity-60 text-center">
                Featured Projects
              </div>
              <div className="space-y-2.5">
                {participant.projects
                  .filter((p) => p.title && p.title.trim() !== '')
                  .map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => proj.url && openExternal(proj.url)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        proj.url ? 'cursor-pointer hover:border-brand-orange' : ''
                      }`}
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2DCD2'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: theme.headingColor }}>
                          {proj.title}
                        </span>
                        {proj.tag && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1E7D7',
                              color: theme.accentColor,
                            }}
                          >
                            {proj.tag}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-[11px] leading-relaxed" style={{ color: theme.mutedColor }}>
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Skills Badges */}
          {participant.skills && participant.skills.length > 0 && (
            <div className="w-full mb-4">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {participant.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1E7D7',
                      color: theme.textColor,
                    }}
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brand Watermark / Footer */}
          <div className="pt-4 border-t w-full flex flex-col items-center justify-center gap-1 opacity-70 text-[10px] tracking-wide"
            style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2DCD2' }}
          >
            <div className="flex items-center gap-1.5">
              <span>POWERED BY</span>
              <span className="font-bold tracking-wider text-brand-crimson font-serif">UCHIHA CONNECT</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-brand-crimsonLight text-brand-crimson">UC</span>
              <span>•</span>
              <span className="font-mono">{participant.participant_id}</span>
            </div>
            <span className="text-[9px] text-brand-mutedGrey font-medium">{BRAND.tagline}</span>
          </div>
        </div>
      </div>}

      {/* QR & Share Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-scaleUp"
            style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
          >
            <h3 className="text-lg font-bold text-center mb-1">
              {participant.full_name || 'Participant'}
            </h3>
            <p className="text-xs text-brand-mutedGrey text-center mb-5">
              Scan to view digital card & save contact
            </p>

            {qrDataUrl && (
              <div className="flex justify-center mb-5 p-4 bg-brand-warmWhite rounded-2xl border border-brand-border">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
            )}

            {/* Profile URL Copy Bar */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-cream border border-brand-border text-xs mb-5">
              <span className="truncate flex-1 font-mono text-[11px] text-brand-charcoal">
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-lg bg-brand-black text-white font-medium flex items-center gap-1 text-[11px] hover:bg-brand-orange transition-colors"
              >
                {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-charcoal hover:bg-brand-cream transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
