import React, { useState, useEffect } from 'react';
import { Participant, SocialLink, ProjectItem, Template } from '../../types';
import { TEMPLATES } from '../../templates/templates';
import { detectPlatformFromUrl, deriveDefaultLabel, validateUrl, PLATFORMS_CONFIG } from '../../utils/socialDetection';
import { CardPreview } from '../profile/CardPreview';
import { BrandIcon } from '../common/BrandIcon';
import { downloadIndividualQrPng, getParticipantPublicUrl } from '../../utils/qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Check,
  Copy,
  Download,
  ExternalLink,
  Sparkles,
  Eye,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participantData: Partial<Participant>, shouldPublish: boolean) => Promise<Participant>;
  existingParticipant?: Participant | null;
  targetSlotNumber?: number;
  productionDomain?: string;
  defaultTemplateId?: string;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingParticipant,
  targetSlotNumber,
  productionDomain,
  defaultTemplateId = 'black-and-orange',
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [templateId, setTemplateId] = useState(defaultTemplateId);

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // UI Flow State
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSuccessData, setPublishedSuccessData] = useState<Participant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset or Populate Form
  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPhotoUrl('');
    setHeadline('');
    setBio('');
    setCollege('');
    setDepartment('');
    setEmail('');
    setPhone('');
    setTemplateId(defaultTemplateId);
    setSocialLinks([]);
    setUrlInput('');
    setUrlError(null);
    setProjects([]);
    setSkills([]);
    setSkillInput('');
    setPublishedSuccessData(null);
    setActiveTab('details');
  };

  useEffect(() => {
    if (!isOpen) return;

    if (existingParticipant && existingParticipant.full_name) {
      setFullName(existingParticipant.full_name || '');
      setUsername(existingParticipant.username || '');
      setPhotoUrl(existingParticipant.photo_url || '');
      setHeadline(existingParticipant.headline || '');
      setBio(existingParticipant.bio || '');
      setCollege(existingParticipant.college || '');
      setDepartment(existingParticipant.department || '');
      setEmail(existingParticipant.email || '');
      setPhone(existingParticipant.phone || '');
      setTemplateId(existingParticipant.template_id || defaultTemplateId);
      setSocialLinks(existingParticipant.social_links ? [...existingParticipant.social_links] : []);
      setProjects(existingParticipant.projects ? [...existingParticipant.projects] : []);
      setSkills(existingParticipant.skills ? [...existingParticipant.skills] : []);
      setPublishedSuccessData(null);
    } else {
      resetForm();
    }
  }, [isOpen, existingParticipant]);

  if (!isOpen) return null;

  // Auto generate username when typing full name if not manually edited
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!existingParticipant?.username || !username) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      setUsername(slug);
    }
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 1400000) {
      alert('Choose a PNG, JPEG, WebP or GIF smaller than 1.4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Add Social Link with Auto Detection
  const handleAddSocialLink = () => {
    setUrlError(null);
    if (!urlInput.trim()) return;

    const { isValid, normalizedUrl, error } = validateUrl(urlInput.trim());
    if (!isValid) {
      setUrlError(error || 'Invalid URL');
      return;
    }

    const detectedPlatform = detectPlatformFromUrl(normalizedUrl);
    const defaultLabel = deriveDefaultLabel(detectedPlatform, normalizedUrl);

    const newLink: SocialLink = {
      id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      platform: detectedPlatform,
      url: normalizedUrl,
      label: defaultLabel,
    };

    setSocialLinks([...socialLinks, newLink]);
    setUrlInput('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((l) => l.id !== id));
  };

  const handleUpdateSocialLabel = (id: string, newLabel: string) => {
    setSocialLinks(
      socialLinks.map((l) => (l.id === id ? { ...l, label: newLabel } : l))
    );
  };

  // Projects Management
  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        id: `proj-${Date.now()}`,
        title: '',
        description: '',
        url: '',
        tag: 'Hackathon',
      },
    ]);
  };

  const handleUpdateProject = (id: string, field: keyof ProjectItem, val: string) => {
    setProjects(
      projects.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  // Skills
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Construct draft participant object for live preview
  const previewParticipant: Participant = {
    id: existingParticipant?.id || 'temp-id',
    slot_number: existingParticipant?.slot_number || targetSlotNumber || 1,
    participant_id: existingParticipant?.participant_id || `CID-${String(targetSlotNumber || 1).padStart(3, '0')}`,
    username: username || 'preview',
    full_name: fullName || 'Participant Name',
    photo_url: photoUrl,
    headline: headline || 'Professional Headline',
    bio: bio || 'Participant bio details...',
    college: college || 'College / University',
    department: department || 'Department',
    email,
    phone,
    social_links: socialLinks,
    projects,
    skills,
    template_id: templateId,
    publication_status: 'draft',
    design_json: (existingParticipant?.template_id === templateId && existingParticipant.design_json) || (TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]).defaultDesign,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Handle Save or Publish
  const handleSubmit = async (shouldPublish: boolean) => {
    if (!fullName.trim()) {
      alert('Full Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave: Partial<Participant> = {
        full_name: fullName.trim(),
        username: username.trim(),
        photo_url: photoUrl,
        headline: headline.trim(),
        bio: bio.trim(),
        college: college.trim(),
        department: department.trim(),
        email: email.trim(),
        phone: phone.trim(),
        social_links: socialLinks,
        projects,
        skills,
        template_id: templateId,
        design_json: previewParticipant.design_json,
        slot_number: existingParticipant?.slot_number || targetSlotNumber,
      };

      const saved = await onSave(dataToSave, shouldPublish);

      if (shouldPublish) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setPublishedSuccessData(saved);
      } else {
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Create Next Card"
  const handleCreateNextCard = () => {
    resetForm();
  };

  const publicUrl = publishedSuccessData
    ? getParticipantPublicUrl(publishedSuccessData.username, productionDomain)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-warmWhite w-full max-w-5xl max-h-[92vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-brand-border">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-brand-surface border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-orangeLight text-brand-orange flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black">
                {publishedSuccessData
                  ? 'Card Published Successfully!'
                  : existingParticipant?.full_name
                  ? `Edit Card: ${existingParticipant.full_name}`
                  : `Create New Card ${targetSlotNumber ? `(Slot #${targetSlotNumber})` : ''}`}
              </h2>
              <p className="text-xs text-brand-mutedGrey">
                {publishedSuccessData
                  ? 'Participant card is live on permanent public URL'
                  : 'Personal details, verified social handles, and card styling'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!publishedSuccessData && (
              <div className="flex bg-brand-warmWhite p-1 rounded-xl border border-brand-border text-xs font-semibold mr-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'details'
                      ? 'bg-brand-black text-white'
                      : 'text-brand-mutedGrey hover:text-brand-black'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-brand-black text-white'
                      : 'text-brand-mutedGrey hover:text-brand-black'
                  }`}
                >
                  <Eye size={13} />
                  <span>Live Preview</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-brand-mutedGrey hover:bg-brand-warmWhite hover:text-brand-black transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {publishedSuccessData ? (
            /* ============================================================ */
            /* SUCCESS VIEW (Section 7 Acceptance Criteria)                  */
            /* ============================================================ */
            <div className="max-w-xl mx-auto py-6 text-center animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-2xl font-serif text-brand-black mb-1">
                {publishedSuccessData.full_name} is Live!
              </h3>
              <p className="text-xs text-brand-mutedGrey mb-6">
                Permanent link and print-ready QR code generated.
              </p>

              {/* Public URL Box */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-brand-surface border border-brand-border mb-6">
                <span className="flex-1 text-left font-mono text-xs text-brand-charcoal truncate px-2">
                  {publicUrl}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-brand-black text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-orange transition-colors"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                <a
                  href={`/p/${publishedSuccessData.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-brand-charcoal hover:bg-brand-warmWhite border border-brand-border transition-colors"
                  title="Open live card"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <button
                  onClick={() => downloadIndividualQrPng(publishedSuccessData, productionDomain)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-surface border border-brand-border text-brand-black text-xs font-bold flex items-center justify-center gap-2 hover:border-brand-orange transition-all"
                >
                  <Download size={15} />
                  <span>Download High-Res QR (PNG)</span>
                </button>

                <button
                  onClick={handleCreateNextCard}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Plus size={15} />
                  <span>+ CREATE NEXT CARD</span>
                </button>
              </div>

              {/* Mini Card Preview */}
              <div className="mt-8 pt-6 border-t border-brand-border">
                <CardPreview
                  participant={publishedSuccessData}
                  productionDomain={productionDomain}
                />
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* FORM & PREVIEW TABS                                          */
            /* ============================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Input Form (lg:col-span-7) */}
              <div
                className={`lg:col-span-7 space-y-6 ${
                  activeTab === 'preview' ? 'hidden lg:block' : 'block'
                }`}
              >
                {/* Section: Personal Information */}
                <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    1. Personal Information
                  </h3>

                  {/* Photo Upload & Preview */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-warmWhite border-2 border-dashed border-brand-border flex items-center justify-center group flex-shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-brand-mutedGrey">
                          <Upload size={18} className="mx-auto mb-1 opacity-60" />
                          <span className="text-[10px]">Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Profile Photograph
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="text-xs text-brand-mutedGrey file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-warmWhite file:text-brand-black hover:file:bg-brand-cream cursor-pointer"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-brand-mutedGrey">or URL:</span>
                        <input
                          type="text"
                          value={photoUrl.startsWith('data:') ? '' : photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name and Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Ashi Acharya"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Slug / Username *
                      </label>
                      <div className="flex items-center text-xs px-3 py-2 rounded-xl border border-brand-border bg-brand-warmWhite">
                        <span className="text-brand-mutedGrey font-mono text-[11px] mr-1">/p/</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                            )
                          }
                          placeholder="ashi"
                          className="w-full font-mono text-[11px] bg-transparent focus:outline-none text-brand-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Headline */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-black mb-1">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Autonomous AI Engineer & Full Stack Builder"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  {/* College & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        College / University
                      </label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Stanford University"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ashi@example.com"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-black mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 0192"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  {/* Short Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-black mb-1">
                      Short Biography
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      placeholder="Brief summary of skills, background, or hackathon focus..."
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-brand-border bg-brand-warmWhite focus:outline-none focus:border-brand-orange resize-none"
                    />
                  </div>
                </div>

                {/* Section: Social Media URLs (Auto Platform Detection) */}
                <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        2. Social Media URLs
                      </h3>
                      <p className="text-[11px] text-brand-mutedGrey">
                        Paste any link (Instagram, LinkedIn, GitHub, X, etc.) — platform is auto-detected!
                      </p>
                    </div>
                  </div>

                  {/* Paste input bar */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          if (urlError) setUrlError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSocialLink();
                          }
                        }}
                        placeholder="Paste URL (e.g. linkedin.com/in/ashi, instagram.com/user, etc.)"
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-brand-warmWhite focus:outline-none ${
                          urlError ? 'border-red-400' : 'border-brand-border focus:border-brand-orange'
                        }`}
                      />
                      {urlError && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{urlError}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSocialLink}
                      className="px-4 py-2.5 rounded-xl bg-brand-black text-white text-xs font-semibold hover:bg-brand-orange transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Detected Links List */}
                  {socialLinks.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      {socialLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-brand-warmWhite border border-brand-border text-xs"
                        >
                          <div className="p-1.5 rounded-lg bg-brand-surface">
                            <BrandIcon platform={link.platform} size={16} />
                          </div>
                          <span className="font-semibold text-[11px] capitalize text-brand-charcoal w-20">
                            {link.platform}
                          </span>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleUpdateSocialLabel(link.id, e.target.value)}
                            placeholder="Display label"
                            className="w-32 px-2 py-1 rounded bg-brand-surface border border-brand-border text-[11px] text-brand-black"
                            title="Label"
                          />
                          <span className="flex-1 truncate font-mono text-[10px] text-brand-mutedGrey">
                            {link.url}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialLink(link.id)}
                            className="p-1.5 text-brand-mutedGrey hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-brand-warmWhite border border-dashed border-brand-border text-center text-xs text-brand-mutedGrey">
                      No social links added yet. Paste a link above to detect icon automatically.
                    </div>
                  )}
                </div>

                {/* Section: Projects (Optional) */}
                <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        3. Featured Projects
                      </h3>
                      <p className="text-[11px] text-brand-mutedGrey">
                        Showcase hackathon entries, repositories, or portfolio highlights
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-semibold hover:border-brand-orange text-brand-black flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3 rounded-xl bg-brand-warmWhite border border-brand-border space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => handleUpdateProject(proj.id, 'title', e.target.value)}
                          placeholder="Project title (e.g. AgentCraft AI)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface font-semibold text-xs"
                        />
                        <input
                          type="text"
                          value={proj.tag || ''}
                          onChange={(e) => handleUpdateProject(proj.id, 'tag', e.target.value)}
                          placeholder="Tag (e.g. AI / Web)"
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(proj.id)}
                          className="p-1.5 text-brand-mutedGrey hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="url"
                        value={proj.url}
                        onChange={(e) => handleUpdateProject(proj.id, 'url', e.target.value)}
                        placeholder="Project URL (e.g. https://github.com/...)"
                        className="w-full px-2.5 py-1 rounded-lg border border-brand-border bg-brand-surface text-xs font-mono text-[11px]"
                      />
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) =>
                          handleUpdateProject(proj.id, 'description', e.target.value)
                        }
                        placeholder="Short description of the project..."
                        className="w-full px-2.5 py-1 rounded-lg border border-brand-border bg-brand-surface text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Section: Template Selection */}
                <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    4. Choose Card Template
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setTemplateId(tmpl.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          templateId === tmpl.id
                            ? 'border-brand-orange bg-brand-orangeLight/40 ring-2 ring-brand-orange/30'
                            : 'border-brand-border bg-brand-warmWhite hover:border-brand-mutedGrey'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-lg mb-1.5 border border-black/10 flex items-center justify-center"
                          style={{ backgroundColor: tmpl.thumbnail_preview_color }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tmpl.theme.accentColor }}
                          />
                        </div>
                        <div className="font-semibold text-[11px] truncate text-brand-black">
                          {tmpl.name}
                        </div>
                        <div className="text-[9px] text-brand-mutedGrey truncate">
                          {tmpl.category}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Card Preview (lg:col-span-5) */}
              <div
                className={`lg:col-span-5 flex flex-col items-center justify-start ${
                  activeTab === 'details' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <div className="sticky top-4 w-full flex flex-col items-center">
                  <div className="flex items-center justify-between w-full max-w-[420px] mb-3 px-1">
                    <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-brand-orange" />
                      <span>Live Mobile Card</span>
                    </span>
                    <span className="text-[11px] font-mono text-brand-mutedGrey">
                      {TEMPLATES.find((t) => t.id === templateId)?.name}
                    </span>
                  </div>

                  {/* Render Live Card */}
                  <CardPreview
                    participant={previewParticipant}
                    productionDomain={productionDomain}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        {!publishedSuccessData && (
          <div className="px-6 py-4 bg-brand-surface border-t border-brand-border flex items-center justify-between">
            <div className="text-xs text-brand-mutedGrey hidden sm:block">
              {existingParticipant?.participant_id || `Slot #${targetSlotNumber || 1}`} • Auto-detects social icons & formats vCard
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-charcoal hover:bg-brand-warmWhite transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-warmWhite border border-brand-border text-brand-black text-xs font-bold hover:bg-brand-cream transition-colors"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Publish Card</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
