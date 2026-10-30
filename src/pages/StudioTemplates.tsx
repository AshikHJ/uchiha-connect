import React, { useState } from 'react';
import { TEMPLATES } from '../templates/templates';
import { Template, Participant } from '../types';
import { CardPreview } from '../components/profile/CardPreview';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Layers, Eye, Check, Palette, ArrowRight } from 'lucide-react';

export const StudioTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const navigate = useNavigate();

  // Mock sample participant for live template exploration
  const sampleParticipant: Participant = {
    id: 'sample-preview',
    slot_number: 1,
    participant_id: 'CID-PREVIEW',
    username: 'preview',
    full_name: 'Ashi Acharya',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    headline: 'Full Stack & Autonomous Systems Engineer',
    bio: 'Developing high-performance distributed systems, accessible UI, and modern AI developer tools.',
    college: 'Stanford University',
    department: 'Computer Science',
    email: 'ashi@example.com',
    phone: '+1 (555) 0192',
    publication_status: 'published',
    template_id: selectedTemplate.id,
    social_links: [
      { id: 's1', platform: 'github', url: 'https://github.com/ashiacharya', label: '@ashiacharya' },
      { id: 's2', platform: 'linkedin', url: 'https://linkedin.com/in/ashiacharya', label: 'Ashi Acharya' },
      { id: 's3', platform: 'x', url: 'https://x.com/ashi_codes', label: '@ashi_codes' },
      { id: 's4', platform: 'website', url: 'https://ashi.dev', label: 'ashi.dev' },
    ],
    projects: [
      { id: 'p1', title: 'AgentCraft AI', description: 'Autonomous agent orchestration engine for multi-step software synthesis.', url: 'https://github.com', tag: 'TypeScript / AI' },
      { id: 'p2', title: 'Pulse UI', description: 'Ultra-fast accessible design system for modern web products.', url: 'https://pulseui.dev', tag: 'React / Tailwind' },
    ],
    skills: ['TypeScript', 'React', 'Python', 'LLMs'],
    design_json: selectedTemplate.defaultDesign,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const categories = ['all', 'Modern', 'Dark', 'Minimal', 'Creative', 'Tech'];

  const filteredTemplates = TEMPLATES.filter(
    (t) => filterCategory === 'all' || t.category.toLowerCase() === filterCategory.toLowerCase()
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-brand-black tracking-tight">
          Template Library
        </h1>
        <p className="text-xs text-brand-mutedGrey mt-1 max-w-xl">
          Choose from 10 handcrafted, fully responsive templates. Each template features custom
          typography, color schemes, and layouts tailored for hackathons.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-brand-black text-white'
                : 'bg-brand-surface border border-brand-border text-brand-charcoal hover:bg-brand-cream'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Template Grid + Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Template Cards Grid (lg:col-span-7) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTemplates.map((tmpl) => {
            const isSelected = selectedTemplate.id === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-brand-surface border-brand-orange shadow-premium ring-2 ring-brand-orange/30'
                    : 'bg-brand-surface border-brand-border hover:border-brand-mutedGrey shadow-subtle'
                }`}
              >
                {/* Header Preview Bar */}
                <div
                  className="h-14 rounded-xl mb-3 flex items-center justify-between px-3 border border-black/5"
                  style={{ backgroundColor: tmpl.thumbnail_preview_color }}
                >
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: tmpl.theme.cardBackground,
                      color: tmpl.theme.headingColor,
                    }}
                  >
                    {tmpl.category}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: tmpl.theme.accentColor }}
                  />
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-brand-black">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="p-1 rounded-full bg-brand-orange text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-brand-mutedGrey line-clamp-2 leading-relaxed mb-3">
                  {tmpl.tagline}
                </p>

                <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[10px] font-mono text-brand-charcoal">
                  <span>Font: {tmpl.theme.fontFamily}</span>
                  <span className="capitalize">{tmpl.theme.styleMode}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Live Interactive Card Preview (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-20 w-full max-w-[420px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <span className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                  {selectedTemplate.name}
                </span>
                <span className="text-[10px] text-brand-mutedGrey">
                  Live interactive mobile simulation
                </span>
              </div>
              <button
                onClick={() => navigate('/studio/participants')}
                className="text-xs font-bold text-brand-orange hover:text-brand-orangeHover flex items-center gap-1"
              >
                <span>Apply to Cards</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <CardPreview
              participant={sampleParticipant}
              templateOverride={selectedTemplate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
