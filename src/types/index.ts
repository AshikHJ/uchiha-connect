export type SocialPlatform =
  | 'instagram'
  | 'linkedin'
  | 'github'
  | 'x'
  | 'facebook'
  | 'youtube'
  | 'behance'
  | 'dribbble'
  | 'website'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  url: string;
  tag?: string;
}

export type PublicationStatus = 'draft' | 'published' | 'unpublished';

export type CanvasElementType =
  | 'text'
  | 'avatar'
  | 'shape'
  | 'badge'
  | 'social_group'
  | 'button'
  | 'divider'
  | 'project_card'
  | 'qr_code';

export interface CanvasElementStyle {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  padding?: number;
  shadow?: string;
  zIndex?: number;
  [key: string]: any;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  content?: string;
  fieldBinding?: string; // e.g. 'full_name', 'headline', 'photo_url', 'bio', 'college', 'department'
  style: CanvasElementStyle;
  locked?: boolean;
}

export interface CardTheme {
  id: string;
  name: string;
  background: string;
  cardBackground: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  mutedColor: string;
  fontFamily: string;
  headingFontFamily: string;
  borderRadius: number;
  borderWidth?: number;
  borderColor?: string;
  styleMode: 'minimal' | 'editorial' | 'dark' | 'gradient' | 'cyber' | 'glass' | 'corporate';
}

export interface CardDesign {
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  theme: CardTheme;
  elements: CanvasElement[];
}

export interface Participant {
  id: string;
  slot_number: number;
  participant_id: string; // e.g. "CID-001"
  username: string; // slug for /p/:username
  full_name: string;
  photo_url: string;
  headline: string;
  bio: string;
  college: string;
  department: string;
  email: string;
  phone: string;
  social_links: SocialLink[];
  projects: ProjectItem[];
  skills: string[];
  design_json: CardDesign;
  template_id: string;
  publication_status: PublicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  tagline: string;
  category: 'Modern' | 'Dark' | 'Minimal' | 'Creative' | 'Tech';
  thumbnail_preview_color: string;
  theme: CardTheme;
  defaultDesign: CardDesign;
}

export interface AppConfig {
  hackathonName: string;
  organizerPin: string;
  productionDomain: string;
  defaultTemplateId: string;
  totalSlots: number;
}
