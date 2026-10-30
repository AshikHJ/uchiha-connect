import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Participant } from '../types';
import { BRAND } from '../config/brand';

/**
 * Returns the full public URL for a participant given the configured domain or fallback origin.
 */
export function getParticipantPublicUrl(username: string, domainConfig?: string): string {
  if (domainConfig && domainConfig.trim() !== '') {
    const cleanDomain = domainConfig.replace(/\/+$/, '');
    return `${cleanDomain}/p/${encodeURIComponent(username)}`;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : BRAND.defaultProductionDomain;
  return `${origin}/p/${encodeURIComponent(username)}`;
}

/**
 * Generates a high-res PNG Data URL for a given profile URL.
 */
export async function generateQrPngDataUrl(
  url: string,
  width: number = 600,
  margin: number = 2
): Promise<string> {
  return await QRCode.toDataURL(url, {
    width,
    margin,
    color: {
      dark: '#111111',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generates an SVG string for a given profile URL.
 */
export async function generateQrSvgString(
  url: string,
  margin: number = 2
): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    margin,
    color: {
      dark: '#111111',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Downloads a high-resolution PNG with branded UCHIHA CONNECT print badge layout.
 */
export async function downloadIndividualQrPng(
  participant: Participant,
  domainConfig?: string
): Promise<void> {
  const profileUrl = getParticipantPublicUrl(participant.username, domainConfig);
  
  // Offscreen canvas for print badge
  const qrDataUrl = await generateQrPngDataUrl(profileUrl, 800, 2);
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border
  ctx.strokeStyle = '#E2DCD2';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Brand Header
  ctx.fillStyle = '#111111';
  ctx.font = '900 36px "DM Serif Display", serif, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UCHIHA CONNECT', canvas.width / 2, 85);

  ctx.fillStyle = '#B51F35';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('ONE IDENTITY. EVERY CONNECTION.', canvas.width / 2, 115);

  // Thin separator
  ctx.strokeStyle = '#B51F35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 130);
  ctx.lineTo(600, 130);
  ctx.stroke();

  // QR Image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const qrSize = 650;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = 160;
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  // Participant Name & ID
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(participant.full_name || 'Participant', canvas.width / 2, 880);

  ctx.fillStyle = '#8B8985';
  ctx.font = '500 20px Inter, sans-serif';
  const subtitle = [participant.participant_id, participant.college].filter(Boolean).join(' • ');
  ctx.fillText(subtitle, canvas.width / 2, 920);

  // URL footer
  ctx.fillStyle = '#252525';
  ctx.font = '16px monospace';
  ctx.fillText(profileUrl, canvas.width / 2, 975);

  ctx.fillStyle = '#B51F35';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('UC DIGITAL BUSINESS CARD • SCAN TO CONNECT', canvas.width / 2, 1020);

  // Trigger download
  const downloadUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `uc-${participant.participant_id}-${participant.username || 'qr'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Downloads an individual SVG QR code.
 */
export async function downloadIndividualQrSvg(
  participant: Participant,
  domainConfig?: string
): Promise<void> {
  const profileUrl = getParticipantPublicUrl(participant.username, domainConfig);
  const svgString = await generateQrSvgString(profileUrl);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `uc-${participant.participant_id}-${participant.username || 'qr'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Generates a ZIP archive containing all QR codes for participants.
 */
export async function exportBulkQrZip(
  participants: Participant[],
  domainConfig?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('uc_qr_codes');

  const publishedOrFilled = participants.filter(
    (p) => p.full_name && p.full_name.trim() !== '' && p.username && p.username.trim() !== ''
  );

  const targets = publishedOrFilled.length > 0 ? publishedOrFilled : participants;

  let indexSummary = `# UCHIHA CONNECT STUDIO — BULK QR EXPORT
Tagline: One Identity. Every Connection.
Total Exported: ${targets.length}
Generated Date: ${new Date().toISOString()}

| Participant ID | Full Name | Username | Status | Profile URL |
|---|---|---|---|---|
`;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    if (onProgress) onProgress(i + 1, targets.length);

    const profileUrl = getParticipantPublicUrl(p.username, domainConfig);
    const qrDataUrl = await generateQrPngDataUrl(profileUrl, 800, 2);
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    const filename = `${p.participant_id}_${p.username || 'user'}.png`;
    folder?.file(filename, base64Data, { base64: true });

    // Also include raw SVG
    const svgContent = await generateQrSvgString(profileUrl);
    folder?.file(`${p.participant_id}_${p.username || 'user'}.svg`, svgContent);

    indexSummary += `| ${p.participant_id} | ${p.full_name || 'Unnamed'} | ${p.username} | ${p.publication_status} | ${profileUrl} |\n`;
  }

  folder?.file('INDEX.md', indexSummary);

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = `uc-all-30-qr-codes-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
