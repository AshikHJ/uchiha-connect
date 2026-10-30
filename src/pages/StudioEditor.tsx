import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Participant, CanvasElement, CardDesign, Template } from '../types';
import { api } from '../services/api';
import { TEMPLATES } from '../templates/templates';
import { CardPreview } from '../components/profile/CardPreview';
import { BrandIcon } from '../components/common/BrandIcon';
import {
  Undo2,
  Redo2,
  Save,
  Download,
  Eye,
  ArrowLeft,
  Type,
  Square,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Layers,
  Sliders,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Upload,
  Globe,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StudioEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Participant & Design State
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [design, setDesign] = useState<CardDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CardDesign[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Editor Interaction State
  const [activeTab, setActiveTab] = useState<'templates' | 'text' | 'elements' | 'images' | 'background' | 'uploads'>('text');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Dragging & Resizing State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | null>(null); // handle: 'se', 'sw', 'ne', 'nw'
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load participant
  useEffect(() => {
    async function fetchParticipant() {
      if (!id) return;
      try {
        const data = await api.participants.getById(id);
        setParticipant(data);

        // Initialize design from participant or chosen template
        let initialDesign = data.design_json;
        if (!initialDesign || !initialDesign.elements || initialDesign.elements.length === 0) {
          const tmpl = TEMPLATES.find((t) => t.id === data.template_id) || TEMPLATES[0];
          initialDesign = JSON.parse(JSON.stringify(tmpl.defaultDesign));
        }

        setDesign(initialDesign);
        setHistory([JSON.parse(JSON.stringify(initialDesign))]);
        setHistoryIndex(0);
      } catch (err) {
        console.error('Failed to load participant for editor:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchParticipant();
  }, [id]);

  // Record history when design changes
  const pushHistory = (newDesign: CardDesign) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newDesign)));
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setDesign(newDesign);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setDesign(JSON.parse(JSON.stringify(history[prevIndex])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDesign(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  };

  // Selected element helper
  const selectedElement = design?.elements.find((el) => el.id === selectedElementId) || null;

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!design || !selectedElementId) return;
    const newElements = design.elements.map((el) =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    );
    pushHistory({ ...design, elements: newElements });
  };

  const updateSelectedElementStyle = (styleUpdates: Record<string, any>) => {
    if (!design || !selectedElementId || !selectedElement) return;
    const updated = {
      ...selectedElement,
      style: { ...selectedElement.style, ...styleUpdates },
    };
    const newElements = design.elements.map((el) =>
      el.id === selectedElementId ? updated : el
    );
    pushHistory({ ...design, elements: newElements });
  };

  // Add new element
  const handleAddElement = (type: CanvasElement['type'], extraProps: Partial<CanvasElement> = {}) => {
    if (!design) return;
    const id = `el-${Date.now()}`;
    const newEl: CanvasElement = {
      id,
      type,
      x: 60,
      y: 120,
      width: type === 'text' ? 300 : type === 'avatar' ? 120 : 200,
      height: type === 'text' ? 40 : type === 'avatar' ? 120 : 50,
      content: type === 'text' ? 'New Heading' : '',
      style: {
        fontSize: type === 'text' ? 18 : 14,
        fontWeight: 600,
        color: design.theme.textColor,
        backgroundColor: type === 'shape' ? design.theme.accentColor : 'transparent',
        borderRadius: type === 'shape' ? 12 : 0,
        textAlign: 'center',
      },
      ...extraProps,
    };

    pushHistory({
      ...design,
      elements: [...design.elements, newEl],
    });
    setSelectedElementId(id);
  };

  // Duplicate element
  const handleDuplicateElement = () => {
    if (!design || !selectedElement) return;
    const duplicated: CanvasElement = {
      ...JSON.parse(JSON.stringify(selectedElement)),
      id: `el-${Date.now()}`,
      x: selectedElement.x + 15,
      y: selectedElement.y + 15,
    };
    pushHistory({
      ...design,
      elements: [...design.elements, duplicated],
    });
    setSelectedElementId(duplicated.id);
  };

  // Delete element
  const handleDeleteElement = () => {
    if (!design || !selectedElementId) return;
    pushHistory({
      ...design,
      elements: design.elements.filter((el) => el.id !== selectedElementId),
    });
    setSelectedElementId(null);
  };

  // Apply a template to the design
  const handleApplyTemplate = (tmpl: Template) => {
    if (!design) return;
    const updated = JSON.parse(JSON.stringify(tmpl.defaultDesign));
    pushHistory(updated);
  };

  // Change Canvas Background
  const handleChangeBackground = (color: string) => {
    if (!design) return;
    pushHistory({
      ...design,
      canvas: { ...design.canvas, background: color },
      theme: { ...design.theme, cardBackground: color },
    });
  };

  // Handle Photo Upload into canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleAddElement('avatar', {
        width: 130,
        height: 130,
        content: base64,
        style: { borderRadius: 9999, borderWidth: 2, borderColor: '#FFFFFF' },
      });
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop Logic on Canvas
  const handleMouseDownOnElement = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedElementId(elId);
    setIsDragging(true);

    const el = design?.elements.find((item) => item.id === elId);
    if (!el || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setDragOffset({
      x: mouseX - el.x,
      y: mouseY - el.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !design || !selectedElement) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    if (isDragging && !selectedElement.locked) {
      const newX = Math.round(mouseX - dragOffset.x);
      const newY = Math.round(mouseY - dragOffset.y);

      setDesign({
        ...design,
        elements: design.elements.map((el) =>
          el.id === selectedElement.id ? { ...el, x: newX, y: newY } : el
        ),
      });
    } else if (isResizing && !selectedElement.locked) {
      if (isResizing === 'se') {
        const newWidth = Math.max(30, Math.round(mouseX - selectedElement.x));
        const newHeight = Math.max(20, Math.round(mouseY - selectedElement.y));
        setDesign({
          ...design,
          elements: design.elements.map((el) =>
            el.id === selectedElement.id ? { ...el, width: newWidth, height: newHeight } : el
          ),
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(null);
      if (design) {
        pushHistory(design);
      }
    }
  };

  // Save Card Design
  const handleSave = async (shouldPublish: boolean = false) => {
    if (!participant || !design) return;
    setIsSaving(true);
    try {
      const updatedParticipant = await api.participants.update(participant.participant_id, {
        design_json: design,
        publication_status: shouldPublish ? 'published' : participant.publication_status,
      });

      if (shouldPublish) {
        await api.participants.publish(participant.participant_id);
        confetti({ particleCount: 80, spread: 60 });
      }

      setParticipant({
        ...updatedParticipant,
        publication_status: shouldPublish ? 'published' : updatedParticipant.publication_status,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Error saving design');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Design JSON
  const handleExportJson = () => {
    if (!design) return;
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `uc-${participant?.participant_id || 'card'}-design.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-warmWhite flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-brand-charcoal">Loading Card Canvas...</p>
        </div>
      </div>
    );
  }

  if (!participant || !design) {
    return (
      <div className="min-h-screen bg-brand-warmWhite flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2">Participant not found</h2>
        <Link to="/studio/participants" className="text-sm font-semibold text-brand-orange">
          ← Back to Participants
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1A1A1A] text-white overflow-hidden select-none">
      {/* ============================================================ */}
      {/* TOP BAR                                                      */}
      {/* ============================================================ */}
      <header className="h-14 bg-[#141414] border-b border-[#2A2A2A] px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/studio/participants"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Studio</span>
          </Link>

          <div className="h-5 w-[1px] bg-zinc-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {participant.full_name || 'Card Canvas'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-brand-orange font-mono">
                {participant.participant_id}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              /p/{participant.username} • {participant.publication_status.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Center: Undo, Redo, Zoom */}
        <div className="flex items-center gap-2 bg-[#1C1C1C] px-3 py-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-opacity"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-opacity"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

          <button
            onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
            className="p-1 rounded text-zinc-400 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono text-zinc-300 w-9 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
            className="p-1 rounded text-zinc-400 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Right Actions: Preview, Save, Publish */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPreviewMode
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Eye size={14} />
            <span>{isPreviewMode ? 'Edit Mode' : 'Live Card'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Download Design JSON"
          >
            <Download size={15} />
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Draft</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles size={14} />
            <span>Publish Card</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* WORKSPACE AREA (Left Nav + Canvas Center + Right Inspector)    */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR TABS */}
        <div className="w-16 bg-[#141414] border-r border-[#2A2A2A] flex flex-col items-center py-4 gap-4 z-20">
          <button
            onClick={() => setActiveTab('templates')}
            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              activeTab === 'templates' ? 'bg-brand-orange text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={18} />
            <span>Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              activeTab === 'text' ? 'bg-brand-orange text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Type size={18} />
            <span>Text</span>
          </button>

          <button
            onClick={() => setActiveTab('elements')}
            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              activeTab === 'elements' ? 'bg-brand-orange text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Square size={18} />
            <span>Shapes</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              activeTab === 'images' ? 'bg-brand-orange text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon size={18} />
            <span>Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              activeTab === 'background' ? 'bg-brand-orange text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Palette size={18} />
            <span>Color</span>
          </button>
        </div>

        {/* LEFT TAB DRAWER */}
        <div className="w-72 bg-[#181818] border-r border-[#2A2A2A] p-4 overflow-y-auto z-10 flex flex-col">
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Apply Template
              </h3>
              <p className="text-[11px] text-zinc-500 mb-4">
                Preserves all participant information while restyling canvas layout
              </p>
              <div className="space-y-2.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brand-orange text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-brand-orange">
                        {tmpl.name}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full border border-zinc-700"
                        style={{ backgroundColor: tmpl.thumbnail_preview_color }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{tmpl.tagline}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Add Typography
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleAddElement('text', {
                      content: 'Add Big Heading',
                      style: { fontSize: 26, fontWeight: 800, textAlign: 'center', color: '#FFFFFF' },
                    })
                  }
                  className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left border border-zinc-800 font-extrabold text-base"
                >
                  Big Heading
                </button>
                <button
                  onClick={() =>
                    handleAddElement('text', {
                      content: 'Add Subheading',
                      style: { fontSize: 16, fontWeight: 600, textAlign: 'center', color: '#E87942' },
                    })
                  }
                  className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left border border-zinc-800 font-semibold text-sm text-brand-orange"
                >
                  Subheading
                </button>
                <button
                  onClick={() =>
                    handleAddElement('text', {
                      content: 'Add body description text...',
                      style: { fontSize: 13, fontWeight: 400, textAlign: 'center', color: '#A0A0A0' },
                    })
                  }
                  className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left border border-zinc-800 text-xs text-zinc-400"
                >
                  Body Text
                </button>
              </div>

              {/* Dynamic Field Tags */}
              <div className="pt-4 border-t border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                  Insert Participant Fields:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Name', field: 'full_name', val: participant.full_name },
                    { label: 'Headline', field: 'headline', val: participant.headline },
                    { label: 'Bio', field: 'bio', val: participant.bio },
                    { label: 'College', field: 'college', val: participant.college },
                    { label: 'Dept', field: 'department', val: participant.department },
                  ].map((f) => (
                    <button
                      key={f.field}
                      onClick={() =>
                        handleAddElement('text', {
                          content: f.val || f.label,
                          fieldBinding: f.field,
                          style: { fontSize: 14, fontWeight: 600, textAlign: 'center', color: '#FFFFFF' },
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300"
                    >
                      +{f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elements' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Shapes & Elements
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    handleAddElement('shape', {
                      width: 360,
                      height: 50,
                      style: { backgroundColor: '#E87942', borderRadius: 12 },
                    })
                  }
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 text-xs"
                >
                  <Square size={20} className="text-brand-orange" />
                  <span>Card Box</span>
                </button>

                <button
                  onClick={() =>
                    handleAddElement('badge', {
                      width: 220,
                      height: 28,
                      content: 'VERIFIED PARTICIPANT',
                      style: {
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: 'rgba(232, 121, 66, 0.2)',
                        color: '#E87942',
                        borderRadius: 9999,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 text-xs"
                >
                  <Sparkles size={20} className="text-amber-400" />
                  <span>Badge Pill</span>
                </button>

                <button
                  onClick={() =>
                    handleAddElement('divider', {
                      width: 340,
                      height: 2,
                      style: { backgroundColor: 'rgba(255,255,255,0.15)' },
                    })
                  }
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 text-xs col-span-2"
                >
                  <div className="w-16 h-[2px] bg-zinc-400 my-1" />
                  <span>Divider Line</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Photographs & Avatars
              </h3>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <input
                  type="file"
                  id="photo-upload-editor"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload-editor"
                  className="w-full py-3 px-4 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload size={14} />
                  <span>Upload Image</span>
                </label>
                <p className="text-[10px] text-zinc-500 mt-2">
                  PNG, JPG or WebP up to 8MB
                </p>
              </div>

              {participant.photo_url && (
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-2 font-semibold">
                    Current Participant Photo:
                  </span>
                  <button
                    onClick={() =>
                      handleAddElement('avatar', {
                        width: 140,
                        height: 140,
                        content: participant.photo_url,
                        style: { borderRadius: 9999, borderWidth: 3, borderColor: '#FFFFFF' },
                      })
                    }
                    className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 hover:border-zinc-700"
                  >
                    <img
                      src={participant.photo_url}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Insert Photo</span>
                      <span className="text-[10px] text-zinc-400">Click to place on card</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Card Background
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  '#FFFFFF',
                  '#F8F4EC',
                  '#F1E7D7',
                  '#111111',
                  '#1A1A1A',
                  '#252525',
                  '#0F172A',
                  '#1E293B',
                  '#0B0F19',
                  '#171717',
                  '#E87942',
                  '#06B6D4',
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChangeBackground(color)}
                    className="h-10 rounded-xl border border-zinc-700 hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER CANVA VIEWPORT */}
        <div
          className="flex-1 bg-[#121212] overflow-auto flex items-center justify-center p-8 relative"
          onClick={() => setSelectedElementId(null)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {isPreviewMode ? (
            /* Live Interactive Preview Mode */
            <div className="animate-fadeIn">
              <CardPreview participant={participant} />
            </div>
          ) : (
            /* Editable Card Canvas */
            <div
              ref={canvasRef}
              className="relative shadow-2xl transition-transform duration-100 ease-out"
              style={{
                width: design.canvas.width || 420,
                height: design.canvas.height || 680,
                backgroundColor: design.canvas.background || design.theme.cardBackground,
                borderRadius: design.theme.borderRadius || 24,
                border: `${design.theme.borderWidth || 1}px solid ${design.theme.borderColor || 'rgba(255,255,255,0.1)'}`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Elements Renderer */}
              {design.elements.map((el) => {
                const isSelected = el.id === selectedElementId;

                // Resolve content if bound to participant property
                let displayContent = el.content;
                if (el.fieldBinding && participant) {
                  const val = (participant as any)[el.fieldBinding];
                  if (val && typeof val === 'string') {
                    displayContent = val;
                  }
                }

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDownOnElement(e, el.id)}
                    className={`absolute cursor-move select-none transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-brand-orange ring-offset-2 ring-offset-black/50'
                        : 'hover:ring-1 hover:ring-zinc-400'
                    }`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      opacity: el.opacity !== undefined ? el.opacity : 1,
                      zIndex: isSelected ? 30 : el.style.zIndex || 1,
                    }}
                  >
                    {/* Element Renderers */}
                    {el.type === 'text' && (
                      <div
                        contentEditable={isSelected}
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateSelectedElement({ content: e.currentTarget.textContent || '' })
                        }
                        className="w-full h-full flex items-center outline-none"
                        style={{
                          fontSize: el.style.fontSize || 16,
                          fontWeight: el.style.fontWeight || 500,
                          color: el.style.color || '#FFFFFF',
                          fontFamily: el.style.fontFamily || design.theme.fontFamily,
                          justifyContent:
                            el.style.textAlign === 'center'
                              ? 'center'
                              : el.style.textAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                          letterSpacing: el.style.letterSpacing,
                          lineHeight: el.style.lineHeight,
                        }}
                      >
                        {displayContent}
                      </div>
                    )}

                    {el.type === 'avatar' && (
                      <div
                        className="w-full h-full overflow-hidden shadow-md"
                        style={{
                          borderRadius: el.style.borderRadius !== undefined ? el.style.borderRadius : 9999,
                          border: `${el.style.borderWidth || 2}px solid ${el.style.borderColor || '#FFFFFF'}`,
                        }}
                      >
                        <img
                          src={el.content || participant.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {el.type === 'shape' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: el.style.backgroundColor || design.theme.accentColor,
                          borderRadius: el.style.borderRadius || 12,
                          border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor}` : 'none',
                        }}
                      />
                    )}

                    {el.type === 'badge' && (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold px-3 uppercase tracking-wider"
                        style={{
                          fontSize: el.style.fontSize || 11,
                          color: el.style.color || '#E87942',
                          backgroundColor: el.style.backgroundColor || 'rgba(232, 121, 66, 0.2)',
                          borderRadius: el.style.borderRadius || 9999,
                        }}
                      >
                        {displayContent}
                      </div>
                    )}

                    {el.type === 'divider' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: el.style.backgroundColor || 'rgba(255,255,255,0.2)',
                        }}
                      />
                    )}

                    {el.type === 'social_group' && (
                      <div className="w-full h-full flex items-center justify-center gap-2">
                        {participant.social_links?.slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white"
                          >
                            <BrandIcon platform={s.platform} size={16} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resize Handle (bottom-right) */}
                    {isSelected && !el.locked && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing('se');
                        }}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-orange border-2 border-white rounded-full cursor-se-resize z-40"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT INSPECTOR SIDEBAR */}
        <div className="w-72 bg-[#181818] border-l border-[#2A2A2A] p-4 overflow-y-auto z-20 flex flex-col">
          {selectedElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Element Inspector
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDuplicateElement}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ locked: !selectedElement.locked })}
                    className={`p-1.5 rounded-lg ${
                      selectedElement.locked ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={selectedElement.locked ? 'Unlock' : 'Lock'}
                  >
                    {selectedElement.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    onClick={handleDeleteElement}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Geometry: X, Y, W, H */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                  Position & Dimensions
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-zinc-500 font-mono text-[10px] w-4">X</span>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                      className="w-full bg-transparent text-right font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-zinc-500 font-mono text-[10px] w-4">Y</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                      className="w-full bg-transparent text-right font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-zinc-500 font-mono text-[10px] w-4">W</span>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                      className="w-full bg-transparent text-right font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-zinc-500 font-mono text-[10px] w-4">H</span>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                      className="w-full bg-transparent text-right font-mono text-zinc-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Typography Controls */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Typography
                  </span>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Text Content</label>
                    <input
                      type="text"
                      value={selectedElement.content || ''}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedElement.style.fontSize || 16}
                        onChange={(e) =>
                          updateSelectedElementStyle({ fontSize: Number(e.target.value) })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Font Weight</label>
                      <select
                        value={selectedElement.style.fontWeight || 500}
                        onChange={(e) =>
                          updateSelectedElementStyle({ fontWeight: e.target.value })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                      >
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semibold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Black (800)</option>
                      </select>
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Text Alignment</label>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateSelectedElementStyle({ textAlign: align })}
                          className={`py-1 text-xs rounded capitalize ${
                            selectedElement.style.textAlign === align
                              ? 'bg-zinc-700 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.style.color || '#FFFFFF'}
                        onChange={(e) => updateSelectedElementStyle({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElement.style.color || '#FFFFFF'}
                        onChange={(e) => updateSelectedElementStyle({ color: e.target.value })}
                        className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Styling: Background, Border Radius, Opacity */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  Appearance
                </span>

                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.style.backgroundColor || '#000000'}
                      onChange={(e) =>
                        updateSelectedElementStyle({ backgroundColor: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedElement.style.backgroundColor || 'transparent'}
                      onChange={(e) =>
                        updateSelectedElementStyle({ backgroundColor: e.target.value })
                      }
                      className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">
                    Border Radius ({selectedElement.style.borderRadius || 0}px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.style.borderRadius || 0}
                    onChange={(e) =>
                      updateSelectedElementStyle({ borderRadius: Number(e.target.value) })
                    }
                    className="w-full accent-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">
                    Opacity ({Math.round((selectedElement.opacity ?? 1) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) =>
                      updateSelectedElement({ opacity: Number(e.target.value) / 100 })
                    }
                    className="w-full accent-brand-orange"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
              <Sliders size={28} className="mb-2 opacity-40" />
              <p className="text-xs font-semibold text-zinc-400">No Element Selected</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">
                Click any element on the card canvas to customize its typography, position, or styling.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
