import React, { useEffect, useState } from 'react';
import { CanvasElement, CardDesign, Participant } from '../../types';
import { BrandIcon } from '../common/BrandIcon';
import { downloadVCard } from '../../utils/vcard';
import { generateQrPngDataUrl } from '../../utils/qrcode';

export function safeUrl(value: string, image = false): string | undefined {
  if (image && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value)) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function resolveElementContent(el: CanvasElement, participant: Participant): string {
  const bound = el.fieldBinding ? participant[el.fieldBinding as keyof Participant] : undefined;
  return typeof bound === 'string' ? bound : el.content || '';
}

function DesignQr({ url }: { url: string }) {
  const [image, setImage] = useState('');
  useEffect(() => {
    let active = true;
    generateQrPngDataUrl(url, 500).then(value => { if (active) setImage(value); }).catch(() => {});
    return () => { active = false; };
  }, [url]);
  return image ? <img src={image} alt="Scan to open this card" className="w-full h-full object-contain" /> : null;
}

// Shared by the editor and published card, so both render the same design.
export function DesignElement({ element: el, participant, design, publicUrl, interactive = false }: {
  element: CanvasElement; participant: Participant; design: CardDesign; publicUrl: string; interactive?: boolean;
}) {
  const content = resolveElementContent(el, participant);
  const style: React.CSSProperties = {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: el.style.textAlign === 'right' ? 'flex-end' : el.style.textAlign === 'left' ? 'flex-start' : 'center',
    fontSize: el.style.fontSize ?? 16, fontWeight: el.style.fontWeight ?? 500,
    fontFamily: el.style.fontFamily || design.theme.fontFamily,
    color: el.style.color || design.theme.textColor, backgroundColor: el.style.backgroundColor,
    borderRadius: el.style.borderRadius, letterSpacing: el.style.letterSpacing,
    lineHeight: el.style.lineHeight, padding: el.style.padding, textAlign: el.style.textAlign,
    border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor || 'transparent'}` : undefined,
    boxShadow: el.style.shadow, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
  };
  switch (el.type) {
    case 'avatar': {
      const source = safeUrl(el.content || content || participant.photo_url || '', true);
      return <div style={{ ...style, overflow: 'hidden', borderRadius: el.style.borderRadius ?? 9999 }}>
        {source && <img src={source} alt={participant.full_name || 'Profile'} className="w-full h-full object-cover" />}
      </div>;
    }
    case 'shape': return <div style={{ ...style, backgroundColor: el.style.backgroundColor || design.theme.accentColor }} />;
    case 'divider': return <div style={{ ...style, backgroundColor: el.style.backgroundColor || design.theme.mutedColor }} />;
    case 'social_group': return <div style={{ ...style, gap: 8, flexWrap: 'wrap' }}>
      {participant.social_links?.filter(link => safeUrl(link.url)).map(link => interactive
        ? <a key={link.id} href={safeUrl(link.url)} target="_blank" rel="noopener noreferrer" aria-label={link.label || link.platform} style={{ padding: 8 }}><BrandIcon platform={link.platform} size={18} /></a>
        : <span key={link.id} style={{ padding: 8 }}><BrandIcon platform={link.platform} size={18} /></span>)}
    </div>;
    case 'button': return interactive
      ? <button style={style} onClick={() => downloadVCard(participant)}>{content || 'Save Contact'}</button>
      : <div style={style}>{content || 'Save Contact'}</div>;
    case 'qr_code': return <DesignQr url={publicUrl} />;
    case 'project_card': return <div style={{ ...style, flexDirection: 'column', alignItems: 'stretch' }}>
      {participant.projects?.map(project => <div key={project.id}>
        {interactive && safeUrl(project.url)
          ? <a href={safeUrl(project.url)} target="_blank" rel="noopener noreferrer">{project.title}</a>
          : <strong>{project.title}</strong>}
        <p>{project.description}</p>
      </div>)}
    </div>;
    default: return <div style={style}>{content}</div>;
  }
}
