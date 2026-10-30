import { Participant } from '../types';

/**
 * Generates an RFC-6350 / vCard 3.0 compliant string for a participant.
 */
export function generateVCardString(participant: Participant): string {
  const nameParts = (participant.full_name || 'Participant').trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${participant.full_name || 'Participant'}`,
    `N:${lastName};${firstName};;;`,
  ];

  if (participant.college || participant.department) {
    const org = [participant.college, participant.department].filter(Boolean).join(' - ');
    lines.push(`ORG:${org}`);
  }

  if (participant.headline) {
    lines.push(`TITLE:${participant.headline}`);
  }

  if (participant.email) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${participant.email}`);
  }

  if (participant.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE,PREF:${participant.phone}`);
  }

  const noteParts = [
    participant.bio ? participant.bio.replace(/\n/g, '\\n') : '',
    'Connected via UCHIHA CONNECT (UC) • One Identity. Every Connection.',
  ].filter(Boolean).join('\\n\\n');

  lines.push(`NOTE:${noteParts}`);

  // Add website and social links
  participant.social_links?.forEach((link) => {
    if (link.url) {
      lines.push(`URL;TYPE=${link.platform.toUpperCase()}:${link.url}`);
    }
  });

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Triggers a download of the .vcf contact card in browser.
 */
export function downloadVCard(participant: Participant): void {
  const vcfContent = generateVCardString(participant);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const filename = `${participant.username || 'contact'}.vcf`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
