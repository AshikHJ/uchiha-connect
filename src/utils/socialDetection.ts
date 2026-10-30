import { SocialPlatform } from '../types';

export interface PlatformConfig {
  platform: SocialPlatform;
  name: string;
  color: string;
  bgLight: string;
  placeholder: string;
  domainPatterns: RegExp[];
}

export const PLATFORMS_CONFIG: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    bgLight: '#FCE7EB',
    placeholder: 'https://instagram.com/username',
    domainPatterns: [/(?:www\.)?instagram\.com/i, /(?:www\.)?instagr\.am/i],
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bgLight: '#E8F1FA',
    placeholder: 'https://linkedin.com/in/username',
    domainPatterns: [/(?:www\.)?linkedin\.com/i],
  },
  github: {
    platform: 'github',
    name: 'GitHub',
    color: '#181717',
    bgLight: '#EBEBEB',
    placeholder: 'https://github.com/username',
    domainPatterns: [/(?:www\.)?github\.com/i],
  },
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    bgLight: '#E6E6E6',
    placeholder: 'https://x.com/username',
    domainPatterns: [/(?:www\.)?x\.com/i, /(?:www\.)?twitter\.com/i],
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bgLight: '#EAF1FD',
    placeholder: 'https://facebook.com/username',
    domainPatterns: [/(?:www\.)?facebook\.com/i, /(?:www\.)?fb\.com/i],
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    bgLight: '#FFEAEA',
    placeholder: 'https://youtube.com/@channel',
    domainPatterns: [/(?:www\.)?youtube\.com/i, /(?:www\.)?youtu\.be/i],
  },
  behance: {
    platform: 'behance',
    name: 'Behance',
    color: '#1769FF',
    bgLight: '#EBF1FF',
    placeholder: 'https://behance.net/username',
    domainPatterns: [/(?:www\.)?behance\.net/i],
  },
  dribbble: {
    platform: 'dribbble',
    name: 'Dribbble',
    color: '#EA4C89',
    bgLight: '#FDECF3',
    placeholder: 'https://dribbble.com/username',
    domainPatterns: [/(?:www\.)?dribbble\.com/i],
  },
  website: {
    platform: 'website',
    name: 'Website',
    color: '#E87942',
    bgLight: '#faeade',
    placeholder: 'https://yourportfolio.com',
    domainPatterns: [],
  },
  custom: {
    platform: 'custom',
    name: 'Custom Link',
    color: '#252525',
    bgLight: '#E8E8E8',
    placeholder: 'https://example.com/link',
    domainPatterns: [],
  },
};

/**
 * Validates whether a URL is secure and structurally valid.
 * Strictly blocks javascript:, data:, vbscript: and non-http(s) protocols.
 */
export function validateUrl(rawUrl: string): { isValid: boolean; normalizedUrl: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, normalizedUrl: '', error: 'URL cannot be empty' };
  }

  const trimmed = rawUrl.trim();

  // Explicit safety block against script injection
  const dangerousProtocols = /^(javascript:|data:|vbscript:|file:|about:)/i;
  if (dangerousProtocols.test(trimmed)) {
    return { isValid: false, normalizedUrl: '', error: 'Unsafe URL protocol detected' };
  }

  // Prepend https:// if user pasted domain or path without protocol
  let urlToTest = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    urlToTest = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(urlToTest);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, normalizedUrl: '', error: 'Only HTTP and HTTPS URLs are permitted' };
    }
    // Must contain a dot in hostname
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { isValid: false, normalizedUrl: '', error: 'Invalid domain name format' };
    }
    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, normalizedUrl: '', error: 'Please enter a valid URL' };
  }
}

/**
 * Automatically detects the platform from the URL string.
 */
export function detectPlatformFromUrl(rawUrl: string): SocialPlatform {
  const { normalizedUrl } = validateUrl(rawUrl);
  if (!normalizedUrl) return 'custom';

  try {
    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.toLowerCase();

    for (const [key, cfg] of Object.entries(PLATFORMS_CONFIG)) {
      if (key === 'website' || key === 'custom') continue;
      for (const pattern of cfg.domainPatterns) {
        if (pattern.test(host)) {
          return key as SocialPlatform;
        }
      }
    }

    return 'website';
  } catch {
    return 'custom';
  }
}

/**
 * Derives a clean default label for a link (e.g. "@username" or platform name)
 */
export function deriveDefaultLabel(platform: SocialPlatform, url: string): string {
  try {
    const { normalizedUrl } = validateUrl(url);
    if (!normalizedUrl) return PLATFORMS_CONFIG[platform].name;

    const parsed = new URL(normalizedUrl);
    const pathname = parsed.pathname.replace(/^\/|\/$/g, '');

    if (platform === 'instagram' || platform === 'x' || platform === 'github' || platform === 'dribbble' || platform === 'behance') {
      const parts = pathname.split('/');
      if (parts[0]) return `@${parts[0]}`;
    }

    if (platform === 'linkedin') {
      const parts = pathname.split('/');
      if (parts.length >= 2 && parts[0] === 'in') {
        return parts[1];
      }
    }

    if (platform === 'website') {
      return parsed.hostname.replace(/^www\./, '');
    }

    return PLATFORMS_CONFIG[platform].name;
  } catch {
    return PLATFORMS_CONFIG[platform].name;
  }
}
