import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Participant, AppConfig, PublicationStatus } from '../types';
import { api } from '../services/api';
import { downloadIndividualQrPng, getParticipantPublicUrl } from '../utils/qrcode';
import { BrandIcon } from '../components/common/BrandIcon';
import {
  downloadCsvTemplate,
  exportParticipantsToCsv,
  validateAndTransformCsv,
  CsvValidationResult,
} from '../utils/csv';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  QrCode,
  Edit,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface StudioParticipantsProps {
  refreshKey?: number;
  onOpenCreateModal: (targetSlot?: number, participant?: Participant) => void;
  onOpenPreviewModal?: (participant: Participant) => void;
}

export const StudioParticipants: React.FC<StudioParticipantsProps> = ({
  onOpenCreateModal,
  onOpenPreviewModal,
  refreshKey = 0,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'unpublished'>('all');
  const [sortField, setSortField] = useState<'slot_number' | 'full_name' | 'publication_status'>('slot_number');
  const [sortAsc, setSortAsc] = useState(true);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFileContent, setCsvFileContent] = useState<string>('');
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await api.participants.getAll();
      setParticipants(res.participants);
      setConfig(res.config);
    } catch (err) {
      console.error('Error loading participants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Filter and sort participants
  const filteredParticipants = participants
    .filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.participant_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.college?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || p.publication_status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'slot_number') {
        comp = a.slot_number - b.slot_number;
      } else if (sortField === 'full_name') {
        comp = (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortField === 'publication_status') {
        comp = a.publication_status.localeCompare(b.publication_status);
      }
      return sortAsc ? comp : -comp;
    });

  // Action Handlers
  const handleTogglePublish = async (p: Participant) => {
    try {
      if (p.publication_status === 'published') {
        await api.participants.unpublish(p.participant_id);
      } else {
        await api.participants.publish(p.participant_id);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating publication status');
    }
  };

  const handleDeleteSlot = async (p: Participant) => {
    if (confirm(`Are you sure you want to clear Slot ${p.participant_id}?`)) {
      try {
        await api.participants.resetSlot(p.participant_id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Error clearing slot');
      }
    }
  };

  const handleDuplicateSlot = async (p: Participant) => {
    const nextEmptySlot = participants.find((item) => !item.full_name || item.full_name.trim() === '');
    if (!nextEmptySlot) {
      alert('All 30 slots are filled. Reset a slot to duplicate.');
      return;
    }

    try {
      await api.participants.update(nextEmptySlot.participant_id, {
        full_name: `${p.full_name} (Copy)`,
        username: `${p.username}-copy-${Date.now().toString(36).substr(-3)}`,
        photo_url: p.photo_url,
        headline: p.headline,
        bio: p.bio,
        college: p.college,
        department: p.department,
        email: p.email,
        phone: p.phone,
        social_links: p.social_links,
        projects: p.projects,
        skills: p.skills,
        template_id: p.template_id,
        design_json: p.design_json,
        publication_status: 'draft',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error duplicating slot');
    }
  };

  // CSV File Handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvFileContent(text);
      const validation = validateAndTransformCsv(text, participants);
      setCsvValidation(validation);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!csvValidation || csvValidation.validRows.length === 0) return;
    setIsImporting(true);
    try {
      await api.participants.bulkImport(csvValidation.validRows);
      setIsCsvModalOpen(false);
      setCsvFileContent('');
      setCsvValidation(null);
      loadData();
      alert(`Imported ${csvValidation.validRows.length} participants successfully!`);
    } catch (err: any) {
      alert(err.message || 'Error during CSV import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-black text-brand-black tracking-tight">
            Participant Management
          </h1>
          <p className="text-xs text-brand-mutedGrey">
            Manage, edit, publish and export 30 participant cards for your hackathon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadCsvTemplate}
            className="px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-xs font-semibold text-brand-charcoal hover:bg-brand-warmWhite flex items-center gap-1.5 transition-colors"
            title="Download blank CSV template"
          >
            <FileSpreadsheet size={14} />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-xs font-semibold text-brand-charcoal hover:bg-brand-warmWhite flex items-center gap-1.5 transition-colors"
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => exportParticipantsToCsv(participants)}
            className="px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-xs font-semibold text-brand-charcoal hover:bg-brand-warmWhite flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenCreateModal()}
            className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>+ CREATE NEW CARD</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border flex flex-col md:flex-row items-center justify-between gap-3 shadow-subtle">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-mutedGrey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, slug, college, ID..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'published', 'draft', 'unpublished'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-brand-black text-white'
                  : 'bg-brand-warmWhite text-brand-charcoal hover:bg-brand-cream'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-brand-surface rounded-[24px] border border-brand-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-warmWhite/80 text-[11px] font-bold text-brand-charcoal uppercase tracking-wider">
                <th
                  onClick={() => {
                    setSortField('slot_number');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-brand-orange"
                >
                  <div className="flex items-center gap-1">
                    <span>ID / Slot</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('full_name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-brand-orange"
                >
                  <div className="flex items-center gap-1">
                    <span>Participant</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Username & URL</th>
                <th className="py-3.5 px-4">Social Handles</th>
                <th className="py-3.5 px-4">Template</th>
                <th
                  onClick={() => {
                    setSortField('publication_status');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-brand-orange"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filteredParticipants.map((p) => {
                const hasData = p.full_name && p.full_name.trim() !== '';
                const isPublished = p.publication_status === 'published';
                const publicUrl = getParticipantPublicUrl(p.username, config?.productionDomain);

                return (
                  <tr
                    key={p.participant_id}
                    className={`hover:bg-brand-warmWhite/50 transition-colors ${
                      !hasData ? 'opacity-60 italic' : ''
                    }`}
                  >
                    {/* ID / Slot */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-charcoal whitespace-nowrap">
                      {p.participant_id}
                    </td>

                    {/* Participant Photo + Name + College */}
                    <td className="py-3.5 px-4">
                      {hasData ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-cream border border-brand-border flex-shrink-0">
                            {p.photo_url ? (
                              <img
                                src={p.photo_url}
                                alt={p.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[11px] text-brand-charcoal">
                                {p.full_name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-brand-black">{p.full_name}</div>
                            <div className="text-[11px] text-brand-mutedGrey truncate max-w-[200px]">
                              {p.headline || [p.college, p.department].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-brand-mutedGrey">Empty Slot #{p.slot_number}</span>
                      )}
                    </td>

                    {/* Username & URL */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {hasData ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-brand-charcoal">/p/{p.username}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(publicUrl);
                              setCopiedId(p.participant_id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1 text-brand-mutedGrey hover:text-brand-black"
                            title="Copy Public URL"
                          >
                            {copiedId === p.participant_id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-brand-mutedGrey">—</span>
                      )}
                    </td>

                    {/* Social Handles */}
                    <td className="py-3.5 px-4">
                      {p.social_links && p.social_links.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {p.social_links.slice(0, 3).map((s) => (
                            <div
                              key={s.id}
                              className="p-1 rounded bg-brand-warmWhite border border-brand-border"
                              title={`${s.platform}: ${s.url}`}
                            >
                              <BrandIcon platform={s.platform} size={12} />
                            </div>
                          ))}
                          {p.social_links.length > 3 && (
                            <span className="text-[10px] text-brand-mutedGrey font-mono">
                              +{p.social_links.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-brand-mutedGrey text-[11px]">None</span>
                      )}
                    </td>

                    {/* Template */}
                    <td className="py-3.5 px-4 text-[11px] font-medium text-brand-charcoal capitalize">
                      {p.template_id?.replace(/-/g, ' ') || 'Default'}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasData ? (
                        <button
                          onClick={() => handleTogglePublish(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-transform active:scale-95 ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : p.publication_status === 'draft'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {p.publication_status}
                        </button>
                      ) : (
                        <span className="text-brand-mutedGrey text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasData ? (
                          <>
                            {/* Visual Editor */}
                            <button
                              onClick={() => navigate(`/studio/editor/${p.participant_id}`)}
                              className="p-1.5 rounded-lg text-brand-charcoal hover:bg-brand-cream transition-colors"
                              title="Canva-style Visual Editor"
                            >
                              <Edit size={14} />
                            </button>

                            {/* Edit Form Modal */}
                            <button
                              onClick={() => onOpenCreateModal(p.slot_number, p)}
                              className="p-1.5 rounded-lg text-brand-charcoal hover:bg-brand-cream transition-colors"
                              title="Edit Details Form"
                            >
                              <FileSpreadsheet size={14} />
                            </button>

                            {/* Download QR */}
                            <button
                              onClick={() => downloadIndividualQrPng(p, config?.productionDomain)}
                              className="p-1.5 rounded-lg text-brand-charcoal hover:bg-brand-cream transition-colors"
                              title="Download QR (PNG)"
                            >
                              <QrCode size={14} />
                            </button>

                            {/* Open Live Profile (If published) */}
                            {isPublished && (
                              <a
                                href={`/p/${p.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-brand-charcoal hover:text-brand-orange hover:bg-brand-cream transition-colors"
                                title="Open Live Profile"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateSlot(p)}
                              className="p-1.5 rounded-lg text-brand-charcoal hover:bg-brand-cream transition-colors"
                              title="Duplicate to next empty slot"
                            >
                              <Copy size={14} />
                            </button>

                            {/* Clear Slot */}
                            <button
                              onClick={() => handleDeleteSlot(p)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Clear / Reset Slot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onOpenCreateModal(p.slot_number)}
                            className="px-3 py-1 rounded-lg bg-brand-orange text-white font-bold text-[11px] hover:bg-brand-orangeHover transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-warmWhite w-full max-w-2xl rounded-[28px] border border-brand-border p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-black">
                  Import Participants via CSV
                </h3>
                <p className="text-xs text-brand-mutedGrey">
                  Batch import up to 30 participants with usernames and social links
                </p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 rounded-xl text-brand-mutedGrey hover:bg-brand-surface"
              >
                ✕
              </button>
            </div>

            {/* Upload Area */}
            <div className="p-6 rounded-2xl bg-brand-surface border-2 border-dashed border-brand-border text-center">
              <input
                type="file"
                id="csv-file-input"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-brand-orangeLight text-brand-orange flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-bold text-brand-black">
                  Click to select CSV file
                </span>
                <span className="text-[11px] text-brand-mutedGrey">
                  Or drag & drop here (follows standard CSV headers)
                </span>
              </label>
            </div>

            {/* Validation Preview */}
            {csvValidation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-black">
                    Validation Results:
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-semibold">
                      ✓ {csvValidation.validRows.length} valid
                    </span>
                    {csvValidation.invalidRows.length > 0 && (
                      <span className="text-red-600 font-semibold">
                        ✕ {csvValidation.invalidRows.length} failed
                      </span>
                    )}
                  </div>
                </div>

                {csvValidation.invalidRows.length > 0 && (
                  <div className="max-h-36 overflow-y-auto p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 space-y-1">
                    {csvValidation.invalidRows.map((err, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                        <span>
                          Row {err.rowNumber}: {err.errors.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!csvValidation || csvValidation.validRows.length === 0 || isImporting}
                className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold disabled:opacity-40 shadow-sm"
              >
                {isImporting ? 'Importing...' : `Confirm & Import (${csvValidation?.validRows.length || 0})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
