import React, { useState, useEffect } from 'react';
import { Participant, AppConfig } from '../types';
import { api } from '../services/api';
import {
  generateQrPngDataUrl,
  downloadIndividualQrPng,
  downloadIndividualQrSvg,
  exportBulkQrZip,
  getParticipantPublicUrl,
} from '../utils/qrcode';
import {
  QrCode,
  Download,
  Share2,
  ExternalLink,
  Printer,
  Sparkles,
  Search,
  Check,
  Copy,
} from 'lucide-react';

export const StudioQR: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.participants.getAll();
        setParticipants(res.participants);
        setConfig(res.config);

        // Select first participant with name or first slot
        const first = res.participants.find((p) => p.full_name) || res.participants[0];
        if (first) {
          selectParticipant(first, res.config.productionDomain);
        }
      } catch (err) {
        console.error('Failed to load participants for QR:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  const selectParticipant = async (p: Participant, domain?: string) => {
    setSelectedParticipant(p);
    const url = getParticipantPublicUrl(p.username, domain || config?.productionDomain);
    const dataUrl = await generateQrPngDataUrl(url, 600);
    setPreviewQrDataUrl(dataUrl);
  };

  const handleBulkZipExport = async () => {
    setIsExportingZip(true);
    try {
      await exportBulkQrZip(participants, config?.productionDomain, (current, total) => {
        setExportProgress({ current, total });
      });
    } catch (err: any) {
      alert(err.message || 'Error generating bulk ZIP');
    } finally {
      setIsExportingZip(false);
      setExportProgress(null);
    }
  };

  const filtered = participants.filter(
    (p) =>
      !searchQuery ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.participant_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-brand-mutedGrey">Loading QR Manager...</p>
      </div>
    );
  }

  const publicUrl = selectedParticipant
    ? getParticipantPublicUrl(selectedParticipant.username, config?.productionDomain)
    : '';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-brand-black tracking-tight">
            QR Code Manager
          </h1>
          <p className="text-xs text-brand-mutedGrey mt-1 max-w-xl">
            High-resolution print-ready QR codes for badges, lanyards, and event displays.
            Configured for production domain: <span className="font-mono text-brand-charcoal">{config?.productionDomain}</span>
          </p>
        </div>

        <button
          onClick={handleBulkZipExport}
          disabled={isExportingZip}
          className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Download size={16} />
          <span>
            {isExportingZip && exportProgress
              ? `Exporting (${exportProgress.current}/${exportProgress.total})...`
              : 'Download All 30 QRs (ZIP)'}
          </span>
        </button>
      </div>

      {/* Main Grid: Selector List + Preview Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Participant List (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-mutedGrey" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID or username..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="bg-brand-surface rounded-[24px] border border-brand-border overflow-hidden shadow-subtle divide-y divide-brand-border/60 max-h-[620px] overflow-y-auto">
            {filtered.map((p) => {
              const isSelected = selectedParticipant?.participant_id === p.participant_id;
              const hasData = p.full_name && p.full_name.trim() !== '';

              return (
                <div
                  key={p.participant_id}
                  onClick={() => selectParticipant(p)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-cream/60 border-l-4 border-l-brand-orange'
                      : 'hover:bg-brand-warmWhite/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[11px] text-brand-charcoal w-16">
                      {p.participant_id}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-xs text-brand-black">
                        {p.full_name || <span className="italic text-brand-mutedGrey">Empty Slot #{p.slot_number}</span>}
                      </div>
                      <div className="font-mono text-[10px] text-brand-mutedGrey">
                        /p/{p.username}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.publication_status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {p.publication_status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadIndividualQrPng(p, config?.productionDomain);
                      }}
                      className="p-1.5 rounded-lg text-brand-charcoal hover:bg-brand-warmWhite"
                      title="Download PNG"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Print Badge Specimen (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {selectedParticipant && (
            <div className="sticky top-20 w-full max-w-[380px]">
              {/* Badge Preview Shell */}
              <div className="bg-white rounded-[28px] border-2 border-brand-border p-6 shadow-card text-center space-y-4 relative">
                {/* Lanyard punch hole aesthetic */}
                <div className="w-12 h-2.5 rounded-full bg-zinc-200 mx-auto -mt-1" />

                {/* Brand Title */}
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <span className="font-serif font-black text-xl tracking-tight text-brand-black block">
                      UCHIHA CONNECT
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono bg-brand-crimsonLight text-brand-crimson">
                      UC
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-crimson block">
                    ONE IDENTITY. EVERY CONNECTION.
                  </span>
                </div>

                {/* QR Canvas */}
                <div className="p-3 bg-brand-warmWhite rounded-2xl border border-brand-border flex items-center justify-center">
                  {previewQrDataUrl ? (
                    <img
                      src={previewQrDataUrl}
                      alt="QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-xs text-brand-mutedGrey">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Participant Information */}
                <div>
                  <h3 className="font-bold text-base text-brand-black">
                    {selectedParticipant.full_name || 'Participant Name'}
                  </h3>
                  <p className="text-xs text-brand-mutedGrey font-medium mt-0.5">
                    {[selectedParticipant.participant_id, selectedParticipant.college].filter(Boolean).join(' • ')}
                  </p>
                  <p className="font-mono text-[10px] text-brand-charcoal mt-2 truncate px-2">
                    {publicUrl}
                  </p>
                </div>

                {/* Actions: Download PNG, Download SVG */}
                <div className="pt-2 border-t border-brand-border flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadIndividualQrPng(selectedParticipant, config?.productionDomain)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-brand-black hover:bg-brand-orange text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download size={14} />
                      <span>Download PNG</span>
                    </button>

                    <button
                      onClick={() => downloadIndividualQrSvg(selectedParticipant, config?.productionDomain)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-brand-surface border border-brand-border text-brand-charcoal hover:bg-brand-warmWhite text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download size={14} />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  {/* Copy Link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-brand-mutedGrey hover:text-brand-black flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Profile Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
