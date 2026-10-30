import { Participant, PublicationStatus } from '../types';
import { detectPlatformFromUrl, deriveDefaultLabel, validateUrl } from './socialDetection';
import { getTemplateById } from '../templates/templates';

export interface CsvImportRow {
  participant_id?: string;
  full_name: string;
  username: string;
  headline?: string;
  bio?: string;
  college?: string;
  department?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  x_url?: string;
  website_url?: string;
  template_id?: string;
  status?: string;
}

export interface CsvValidationResult {
  validRows: Partial<Participant>[];
  invalidRows: { rowNumber: number; data: any; errors: string[] }[];
  duplicateUsernames: string[];
}

/**
 * Generates a standard sample CSV template for download.
 */
export function generateCsvTemplate(): string {
  const headers = [
    'participant_id',
    'full_name',
    'username',
    'headline',
    'bio',
    'college',
    'department',
    'email',
    'phone',
    'photo_url',
    'instagram_url',
    'linkedin_url',
    'github_url',
    'x_url',
    'website_url',
    'template_id',
    'status',
  ];

  const sampleRows = [
    [
      'CID-001',
      'Ashi Acharya',
      'ashi',
      'AI & Full Stack Engineer',
      'Building next-gen autonomous systems and developer tools.',
      'Stanford University',
      'Computer Science',
      'ashi@example.com',
      '+1 555 0192',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      'https://instagram.com/ashi_codes',
      'https://linkedin.com/in/ashiacharya',
      'https://github.com/ashiacharya',
      'https://x.com/ashiacharya',
      'https://ashi.dev',
      'black-and-orange',
      'published',
    ],
    [
      'CID-002',
      'Rahul Verma',
      'rahul',
      'Cloud Architect & DevOps Specialist',
      'Designing fault-tolerant distributed platforms and Kubernetes infrastructure.',
      'MIT',
      'Electrical Engineering',
      'rahul@example.com',
      '+1 555 0193',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      '',
      'https://linkedin.com/in/rahulverma',
      'https://github.com/rahulverma',
      'https://x.com/rahulv',
      'https://rahulverma.io',
      'minimal-white',
      'published',
    ],
    [
      'CID-003',
      'Priya Sharma',
      'priya',
      'Lead Product Designer & UX Researcher',
      'Human-centric design systems, accessible typography, and delightful interactions.',
      'Rhode Island School of Design',
      'Digital Media',
      'priya@example.com',
      '+1 555 0194',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      'https://instagram.com/priyadesigns',
      'https://linkedin.com/in/priyasharma',
      '',
      'https://x.com/priyaux',
      'https://priyasharma.design',
      'editorial-cream',
      'published',
    ],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Triggers a download of the CSV template.
 */
export function downloadCsvTemplate(): void {
  const content = generateCsvTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'uc-participants-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Parses raw CSV string into rows with quotation awareness.
 */
export function parseCsvString(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let entry = '';
  let insideQuote = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        entry += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(entry.trim());
      entry = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }

  if (entry.length > 0 || row.length > 0) {
    row.push(entry.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Validates and transforms parsed CSV data into Participant records.
 */
export function validateAndTransformCsv(
  csvText: string,
  existingParticipants: Participant[]
): CsvValidationResult {
  const rawRows = parseCsvString(csvText);
  if (rawRows.length < 2) {
    return {
      validRows: [],
      invalidRows: [{ rowNumber: 1, data: null, errors: ['CSV file is empty or missing data rows'] }],
      duplicateUsernames: [],
    };
  }

  const headers = rawRows[0].map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
  const dataRows = rawRows.slice(1);

  const existingUsernames = new Set(
    existingParticipants.map((p) => p.username?.toLowerCase().trim()).filter(Boolean)
  );

  const seenInFileUsernames = new Set<string>();
  const duplicateUsernames: string[] = [];

  const validRows: Partial<Participant>[] = [];
  const invalidRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIndex) => {
      rowObj[header] = row[colIndex] || '';
    });

    const errors: string[] = [];
    const fullName = (rowObj['full_name'] || '').trim();
    let username = (rowObj['username'] || '').toLowerCase().trim();

    if (!fullName) {
      errors.push('Full name is required');
    }

    if (!username) {
      // Auto-generate username from full name if missing
      username = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Username format check
    if (!/^[a-z0-9_-]{2,30}$/.test(username)) {
      errors.push('Username must be 2-30 alphanumeric characters, dashes or underscores');
    }

    // Check duplicate inside file
    if (seenInFileUsernames.has(username)) {
      errors.push(`Duplicate username "${username}" in CSV`);
      duplicateUsernames.push(username);
    } else {
      seenInFileUsernames.add(username);
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber, data: rowObj, errors });
      return;
    }

    // Social links building
    const socialLinks: any[] = [];
    const possibleUrls = [
      rowObj['instagram_url'],
      rowObj['linkedin_url'],
      rowObj['github_url'],
      rowObj['x_url'],
      rowObj['website_url'],
    ];

    possibleUrls.forEach((url) => {
      if (url && url.trim() !== '') {
        const { isValid, normalizedUrl } = validateUrl(url);
        if (isValid) {
          const platform = detectPlatformFromUrl(normalizedUrl);
          socialLinks.push({
            id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            platform,
            url: normalizedUrl,
            label: deriveDefaultLabel(platform, normalizedUrl),
          });
        }
      }
    });

    const templateId = rowObj['template_id'] || 'black-and-orange';
    const template = getTemplateById(templateId);

    const statusInput = (rowObj['status'] || 'draft').toLowerCase().trim();
    const status: PublicationStatus = ['published', 'draft', 'unpublished'].includes(statusInput)
      ? (statusInput as PublicationStatus)
      : 'draft';

    validRows.push({
      participant_id: rowObj['participant_id'] || '',
      full_name: fullName,
      username,
      headline: rowObj['headline'] || '',
      bio: rowObj['bio'] || '',
      college: rowObj['college'] || '',
      department: rowObj['department'] || '',
      email: rowObj['email'] || '',
      phone: rowObj['phone'] || '',
      photo_url: rowObj['photo_url'] || '',
      social_links: socialLinks,
      template_id: template.id,
      design_json: JSON.parse(JSON.stringify(template.defaultDesign)),
      publication_status: status,
      projects: [],
      skills: [],
    });
  });

  return { validRows, invalidRows, duplicateUsernames };
}

/**
 * Exports current participants list to CSV.
 */
export function exportParticipantsToCsv(participants: Participant[]): void {
  const headers = [
    'participant_id',
    'full_name',
    'username',
    'headline',
    'bio',
    'college',
    'department',
    'email',
    'phone',
    'photo_url',
    'publication_status',
    'template_id',
    'social_links_count',
  ];

  const rows = participants.map((p) => [
    p.participant_id,
    p.full_name,
    p.username,
    p.headline,
    p.bio,
    p.college,
    p.department,
    p.email,
    p.phone,
    p.photo_url,
    p.publication_status,
    p.template_id,
    p.social_links?.length || 0,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) =>
      r
        .map((c) => {
          const str = String(c ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `uc-participants-export-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
