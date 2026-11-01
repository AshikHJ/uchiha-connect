import 'dotenv/config';
import express from 'express';
import { createStore } from './store.js';
import { participantInput } from './validation.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!!supabaseUrl !== !!serviceKey) throw new Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
if (production && (!supabaseUrl || !serviceKey)) throw new Error('Production requires persistent Supabase storage. Run migration 002 and configure Supabase.');
if (production && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || ['uc_secure_session_secret_998877', 'uc_organizer_secure_session_secret_key_2026'].includes(process.env.SESSION_SECRET))) throw new Error('Production requires a random SESSION_SECRET of at least 32 characters');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const app = express();
// Trust only the configured ingress hop count, never arbitrary forwarded IPs.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || (process.env.VERCEL ? 1 : 0)));
const allowedOrigins = [process.env.PRODUCTION_DOMAIN, ...(process.env.ALLOWED_ORIGINS || '').split(','), ...(!production ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : [])].filter(Boolean).map(s => s.trim().replace(/\/+$/, ''));
app.use((req, res, next) => {
  const origin = req.get('origin');
  const sameOrigin = !origin || origin === `${req.protocol}://${req.get('host')}`;
  if (!sameOrigin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin is not allowed' });
  next();
});
app.use(cors({ origin: (origin, done) => done(null, origin || false), credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const store = createStore({
  filename: process.env.DB_FILE || path.join(__dirname, 'data', 'local-db.json'),
  initialize: ensureDbInit, supabaseUrl, serviceKey,
});
app.use(store.middleware);
const readDb = () => store.read();
const writeDb = data => store.write(data);
function hashPin(pin, salt) {
  return crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
}

function ensureDbInit() {
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultPin = process.env.ORGANIZER_PIN || (production ? '' : '2026');
  if (!/^\d{4,12}$/.test(defaultPin) || (production && defaultPin.length < 6)) {
    throw new Error('Set ORGANIZER_PIN to 6-12 digits for initial production setup');
  }
  const defaultHash = hashPin(defaultPin, defaultSalt);

  const initialParticipants = [];

  const sampleProfiles = [
    {
      slot_number: 1,
      participant_id: 'CID-001',
      username: 'ashi',
      full_name: 'Ashi Acharya',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      headline: 'Autonomous Agent Engineer & Full Stack Builder',
      bio: 'Crafting intelligent developer tooling, reactive interfaces, and distributed systems. Hackathon 2026 Lead Participant.',
      college: 'Stanford University',
      department: 'Computer Science & AI',
      email: 'ashi@example.com',
      phone: '+1 (555) 234-5678',
      publication_status: 'published',
      template_id: 'black-and-orange',
      social_links: [
        { id: 's1', platform: 'github', url: 'https://github.com/ashiacharya', label: '@ashiacharya' },
        { id: 's2', platform: 'linkedin', url: 'https://linkedin.com/in/ashiacharya', label: 'Ashi Acharya' },
        { id: 's3', platform: 'x', url: 'https://x.com/ashi_codes', label: '@ashi_codes' },
        { id: 's4', platform: 'instagram', url: 'https://instagram.com/ashi.codes', label: '@ashi.codes' },
        { id: 's5', platform: 'website', url: 'https://ashi.dev', label: 'ashi.dev' },
      ],
      projects: [
        { id: 'p1', title: 'AgentCraft AI', description: 'Autonomous agent orchestration engine for multi-step software synthesis.', url: 'https://github.com/ashiacharya/agentcraft', tag: 'TypeScript / AI' },
        { id: 'p2', title: 'Pulse UI', description: 'Ultra-fast accessible design system for modern web products.', url: 'https://pulseui.dev', tag: 'React / Tailwind' },
      ],
      skills: ['TypeScript', 'React', 'Python', 'LLMs', 'Distributed Systems'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_number: 2,
      participant_id: 'CID-002',
      username: 'rahul',
      full_name: 'Rahul Verma',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      headline: 'Cloud Systems Architect & Infrastructure Specialist',
      bio: 'Designing fault-tolerant microservices, Kubernetes control planes, and low latency caching layers.',
      college: 'MIT',
      department: 'Electrical Engineering & CS',
      email: 'rahul.verma@example.com',
      phone: '+1 (555) 345-6789',
      publication_status: 'published',
      template_id: 'minimal-white',
      social_links: [
        { id: 's6', platform: 'github', url: 'https://github.com/rahulverma', label: '@rahulverma' },
        { id: 's7', platform: 'linkedin', url: 'https://linkedin.com/in/rahulverma', label: 'Rahul Verma' },
        { id: 's8', platform: 'x', url: 'https://x.com/rahul_infra', label: '@rahul_infra' },
        { id: 's9', platform: 'website', url: 'https://rahulverma.io', label: 'rahulverma.io' },
      ],
      projects: [
        { id: 'p3', title: 'KubeMesh', description: 'Zero-overhead service mesh daemon for edge container clusters.', url: 'https://github.com/rahulverma/kubemesh', tag: 'Go / K8s' },
      ],
      skills: ['Go', 'Kubernetes', 'Docker', 'Rust', 'Terraform'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_number: 3,
      participant_id: 'CID-003',
      username: 'priya',
      full_name: 'Priya Sharma',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
      headline: 'Lead UX Researcher & Editorial Designer',
      bio: 'Human-centered interfaces, editorial typography, and high-craft brand identities for web3 and fintech products.',
      college: 'Rhode Island School of Design',
      department: 'Digital Media & Typography',
      email: 'priya.sharma@example.com',
      phone: '+1 (555) 456-7890',
      publication_status: 'draft',
      template_id: 'editorial-cream',
      social_links: [
        { id: 's10', platform: 'dribbble', url: 'https://dribbble.com/priyadesigns', label: 'priyadesigns' },
        { id: 's11', platform: 'behance', url: 'https://behance.net/priyasharma', label: 'Priya Sharma' },
        { id: 's12', platform: 'linkedin', url: 'https://linkedin.com/in/priyasharma', label: 'Priya Sharma' },
        { id: 's13', platform: 'instagram', url: 'https://instagram.com/priya.typeface', label: '@priya.typeface' },
      ],
      projects: [
        { id: 'p4', title: 'Editorial Noir', description: 'Interactive typography specimen and kinetic web experience.', url: 'https://priyasharma.design', tag: 'Design / WebGL' },
      ],
      skills: ['Figma', 'Typography', 'Design Systems', 'Next.js', 'Framer'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (let i = 1; i <= 30; i++) {
    const paddedIndex = String(i).padStart(3, '0');
    const existing = production ? null : sampleProfiles.find((p) => p.slot_number === i);
    if (existing) {
      initialParticipants.push(existing);
    } else {
      initialParticipants.push({
        slot_number: i,
        participant_id: `CID-${paddedIndex}`,
        username: `slot${i}`,
        full_name: '',
        photo_url: '',
        headline: '',
        bio: '',
        college: '',
        department: '',
        email: '',
        phone: '',
        publication_status: 'draft',
        template_id: 'black-and-orange',
        social_links: [],
        projects: [],
        skills: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const initialDb = {
    config: {
      organizerPinHash: defaultHash,
      organizerPinSalt: defaultSalt,
      hackathonName: 'UCHIHA CONNECT HACKATHON 2026',
      productionDomain: process.env.PRODUCTION_DOMAIN || '',
      authVersion: crypto.randomBytes(16).toString('hex'),
      defaultTemplateId: 'black-and-orange',
      totalSlots: 30,
    },
    participants: initialParticipants,
  };

  return initialDb;
}

// ----------------------------------------------------
// Security & Rate Limiting
// ----------------------------------------------------

function createSessionToken(authVersion) {
  const payload = Buffer.from(JSON.stringify({ user: 'organizer', issued: Date.now(), authVersion })).toString('base64url');
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}
async function verifySessionToken(token) {
  if (typeof token !== 'string' || token.length > 2048) return false;
  const [payload, signature, extra] = token.split('.');
  if (extra || !payload || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest();
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) return false;
  let session;
  try { session = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return false; }
  if (!session || typeof session.issued !== 'number') return false;
  const age = Date.now() - session.issued;
  if (session.user !== 'organizer' || !Number.isFinite(age) || age < 0 || age > 86400000) return false;
  const db = await readDb();
  return session.authVersion === db.config.authVersion;
}
function requestToken(req) {
  return req.headers.authorization?.replace(/^Bearer /, '') || req.cookies?.uc_admin_session;
}
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const requireAdminAuth = asyncHandler(async (req, res, next) => {
  if (!await verifySessionToken(requestToken(req))) return res.status(401).json({ error: 'Unauthorized: Organizer session required' });
  next();
});
const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };

// ----------------------------------------------------
// Create Modular Router
// Mounted at BOTH `/api` and `/` so Vercel rewrites NEVER miss!
// ----------------------------------------------------

const apiRouter = express.Router();

// Health check
apiRouter.get('/health', asyncHandler(async (req, res) => {
  res.json({ status: 'ok', brand: 'UCHIHA CONNECT (UC)', time: new Date().toISOString() });
}));

// Authentication Endpoints
apiRouter.post('/auth/login', asyncHandler(async (req, res) => {
  // HMAC IPs before persisting them. The DB operation is atomic across instances.
  const key = crypto.createHmac('sha256', SESSION_SECRET).update(req.ip || 'unknown').digest('hex');
  const attemptInfo = await store.consumeLoginAttempt(key);
  if (!attemptInfo.allowed) {
    res.set('Retry-After', String(attemptInfo.lockoutRemaining));
    return res.status(429).json({ error: 'Too many login attempts. Try again later.', lockoutRemaining: attemptInfo.lockoutRemaining });
  }

  const { pin } = req.body || {};
  if (typeof pin !== 'string' || !/^\d{4,12}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4-12 digits' });
  }

  const db = await readDb();
  const expectedHash = db.config.organizerPinHash;
  const salt = db.config.organizerPinSalt;
  const inputHash = hashPin(pin.trim(), salt);

  if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(expectedHash))) {
    const token = createSessionToken(db.config.authVersion);

    res.cookie('uc_admin_session', token, { ...cookieOptions, maxAge: 86400000 });

    return res.json({
      success: true,
      token,
      message: 'Authenticated successfully',
      expiresIn: 24 * 60 * 60,
    });
  } else {
    const attemptsLeft = attemptInfo.attemptsLeft;
    return res.status(401).json({
      error: `Invalid PIN. ${attemptsLeft} attempt(s) remaining before temporary lockout.`,
      attemptsLeft,
    });
  }
}));

apiRouter.get('/auth/status', asyncHandler(async (req, res) => {
  const isAuthenticated = await verifySessionToken(requestToken(req));
  res.json({ isAuthenticated });
}));

apiRouter.post('/auth/logout', requireAdminAuth, asyncHandler(async (req, res) => {
  const db = await readDb();
  db.config.authVersion = crypto.randomBytes(16).toString('hex');
  await writeDb(db);
  res.clearCookie('uc_admin_session', cookieOptions);
  res.clearCookie('cid_admin_session', cookieOptions);
  res.json({ success: true, message: 'Logged out successfully' });
}));

apiRouter.post('/auth/change-pin', requireAdminAuth, asyncHandler(async (req, res) => {
  const { currentPin, newPin } = req.body || {};
  if (typeof currentPin !== 'string' || typeof newPin !== 'string' || !/^\d{6,12}$/.test(newPin)) {
    return res.status(400).json({ error: 'Current PIN is required and new PIN must be 6-12 digits' });
  }

  const db = await readDb();
  const currentHash = hashPin(currentPin, db.config.organizerPinSalt);
  if (!crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(db.config.organizerPinHash))) {
    return res.status(400).json({ error: 'Current PIN is incorrect' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPin(newPin, newSalt);
  db.config.organizerPinHash = newHash;
  db.config.organizerPinSalt = newSalt;
  db.config.authVersion = crypto.randomBytes(16).toString('hex');
  await writeDb(db);

  const token = createSessionToken(db.config.authVersion);
  res.cookie('uc_admin_session', token, { ...cookieOptions, maxAge: 86400000 });
  res.json({ success: true, message: 'PIN updated successfully' });
}));

// Public Profile Endpoint (Mobile-first Visitors)
apiRouter.get('/public/profile/:username', asyncHandler(async (req, res) => {
  const requestedUsername = req.params.username.toLowerCase().trim();
  const db = await readDb();

  const participant = db.participants.find(
    (p) => p.username && p.username.toLowerCase().trim() === requestedUsername
  );

  if (!participant) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (participant.publication_status !== 'published') {
    return res.status(404).json({
      error: 'This profile is currently in draft or has been unpublished by the organizer.',
    });
  }

  res.json({
    participant,
    hackathonName: db.config.hackathonName,
  });
}));

// Protected Organizer Participant Endpoints
apiRouter.get('/participants', requireAdminAuth, asyncHandler(async (req, res) => {
  const db = await readDb();
  res.json({
    participants: db.participants,
    config: {
      hackathonName: db.config.hackathonName,
      productionDomain: db.config.productionDomain,
      defaultTemplateId: db.config.defaultTemplateId,
      totalSlots: db.config.totalSlots || 30,
    },
  });
}));

apiRouter.get('/participants/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const participant = db.participants.find(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (!participant) {
    return res.status(404).json({ error: 'Participant slot not found' });
  }

  res.json(participant);
}));

apiRouter.post('/participants', requireAdminAuth, asyncHandler(async (req, res) => {
  const data = participantInput(req.body || {});
  if (!data.full_name || !data.full_name.trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  let username = (data.username || data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || `participant-${crypto.randomUUID().slice(0, 8)}`).trim();
  const db = await readDb();

  let targetSlotIndex = -1;
  if (req.body.slot_number !== undefined) {
    targetSlotIndex = db.participants.findIndex((p) => p.slot_number === req.body.slot_number);
    if (targetSlotIndex === -1) return res.status(400).json({ error: 'Invalid slot number' });
    if (db.participants[targetSlotIndex].full_name) return res.status(409).json({ error: 'This slot is already occupied. Edit the existing card instead.' });
  } else {
    targetSlotIndex = db.participants.findIndex((p) => !p.full_name || p.full_name.trim() === '');
  }

  if (targetSlotIndex === -1) {
    return res.status(409).json({ error: 'All participant slots are occupied' });
  }

  const slotNumber = targetSlotIndex + 1;
  const participantId = `CID-${String(slotNumber).padStart(3, '0')}`;

  const usernameConflict = db.participants.some(
    (p, idx) => idx !== targetSlotIndex && p.username?.toLowerCase() === username.toLowerCase()
  );

  if (usernameConflict) {
    username = `${username}-${Date.now().toString(36).substr(-4)}`;
  }

  const newParticipant = {
    id: crypto.randomUUID(),
    slot_number: slotNumber,
    participant_id: participantId,
    username,
    full_name: data.full_name.trim(),
    photo_url: data.photo_url || '',
    headline: data.headline || '',
    bio: data.bio || '',
    college: data.college || '',
    department: data.department || '',
    email: data.email || '',
    phone: data.phone || '',
    social_links: data.social_links || [],
    projects: data.projects || [],
    skills: data.skills || [],
    design_json: data.design_json || null,
    template_id: data.template_id || db.config.defaultTemplateId || 'black-and-orange',
    publication_status: data.publication_status || 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (targetSlotIndex < db.participants.length) {
    db.participants[targetSlotIndex] = newParticipant;
  } else {
    db.participants.push(newParticipant);
  }

  await writeDb(db);
  res.status(201).json(newParticipant);
}));

apiRouter.put('/participants/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = participantInput(req.body || {});
  const db = await readDb();

  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  if (data.username === '') return res.status(400).json({ error: 'Username cannot be empty' });
  const existing = db.participants[index];
  if (data.full_name !== undefined && !data.full_name) return res.status(400).json({ error: 'Full name is required' });

  if (data.username && data.username.toLowerCase() !== existing.username?.toLowerCase()) {
    const conflict = db.participants.some(
      (p, idx) => idx !== index && p.username?.toLowerCase() === data.username.toLowerCase()
    );
    if (conflict) {
      return res.status(400).json({ error: 'Username is already taken by another participant' });
    }
  }

  const updatedParticipant = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (updatedParticipant.publication_status === 'published' && !updatedParticipant.full_name?.trim()) return res.status(400).json({ error: 'Full name is required before publishing' });
  db.participants[index] = updatedParticipant;
  await writeDb(db);

  res.json(updatedParticipant);
}));

apiRouter.post('/participants/:id/publish', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  if (!db.participants[index].full_name?.trim()) return res.status(400).json({ error: 'Full name is required before publishing' });
  db.participants[index].publication_status = 'published';
  db.participants[index].updated_at = new Date().toISOString();
  await writeDb(db);

  res.json({
    success: true,
    participant: db.participants[index],
    message: 'Card published successfully',
  });
}));

apiRouter.post('/participants/:id/unpublish', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  db.participants[index].publication_status = 'unpublished';
  db.participants[index].updated_at = new Date().toISOString();
  await writeDb(db);

  res.json({
    success: true,
    participant: db.participants[index],
    message: 'Card unpublished. Public access disabled.',
  });
}));

apiRouter.delete('/participants/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant slot not found' });
  }

  const slotNumber = db.participants[index].slot_number;
  const participantId = `CID-${String(slotNumber).padStart(3, '0')}`;

  db.participants[index] = {
    slot_number: slotNumber,
    participant_id: participantId,
    username: `slot${slotNumber}`,
    full_name: '',
    photo_url: '',
    headline: '',
    bio: '',
    college: '',
    department: '',
    email: '',
    phone: '',
    publication_status: 'draft',
    template_id: db.config.defaultTemplateId || 'black-and-orange',
    social_links: [],
    projects: [],
    skills: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await writeDb(db);
  res.json({ success: true, message: 'Slot reset successfully' });
}));

apiRouter.post('/participants/bulk-import', requireAdminAuth, asyncHandler(async (req, res) => {
  const { participants } = req.body || {};
  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Array of participants required' });
  }

  const db = await readDb();
  let importedCount = 0;

  const validated = participants.map(incoming => ({ ...participantInput(incoming), participant_id: typeof incoming.participant_id === 'string' ? incoming.participant_id : undefined }));
  validated.forEach((incoming) => {
    let targetIndex = db.participants.findIndex(
      (p) => p.participant_id === incoming.participant_id || (!p.full_name && !p.username)
    );

    if (targetIndex === -1) {
      targetIndex = db.participants.findIndex((p) => !p.full_name || p.full_name.trim() === '');
    }

    if (targetIndex !== -1) {
      const slotNumber = db.participants[targetIndex].slot_number;
      db.participants[targetIndex] = {
        ...db.participants[targetIndex],
        ...incoming,
        slot_number: slotNumber,
        participant_id: db.participants[targetIndex].participant_id,
        updated_at: new Date().toISOString(),
      };
      importedCount++;
    }
  });

  const usernames = db.participants.map(p => p.username.toLowerCase());
  if (new Set(usernames).size !== usernames.length) return res.status(400).json({ error: 'Import contains duplicate usernames' });
  if (db.participants.some(p => p.publication_status === 'published' && !p.full_name?.trim())) return res.status(400).json({ error: 'Published cards require a full name' });
  await writeDb(db);
  res.json({
    success: true,
    importedCount,
    message: `Successfully imported ${importedCount} participant cards`,
  });
}));

apiRouter.get('/settings', requireAdminAuth, asyncHandler(async (req, res) => {
  const db = await readDb();
  res.json({
    hackathonName: db.config.hackathonName,
    productionDomain: db.config.productionDomain,
    defaultTemplateId: db.config.defaultTemplateId,
    totalSlots: db.config.totalSlots || 30,
  });
}));

apiRouter.put('/settings', requireAdminAuth, asyncHandler(async (req, res) => {
  const { hackathonName, productionDomain, defaultTemplateId } = req.body || {};
  const db = await readDb();

  if ([hackathonName, productionDomain, defaultTemplateId].some(value => value !== undefined && typeof value !== 'string')) return res.status(400).json({ error: 'Settings must be text' });
  if (productionDomain && !/^https?:\/\/[^/]+\/?$/.test(productionDomain)) return res.status(400).json({ error: 'Production domain must be an http(s) origin' });
  if (hackathonName) db.config.hackathonName = hackathonName.trim();
  if (productionDomain) db.config.productionDomain = productionDomain.trim().replace(/\/+$/, '');
  if (defaultTemplateId) db.config.defaultTemplateId = defaultTemplateId;

  await writeDb(db);
  res.json({ success: true, config: { hackathonName: db.config.hackathonName, productionDomain: db.config.productionDomain, defaultTemplateId: db.config.defaultTemplateId, totalSlots: db.config.totalSlots }, message: 'Settings saved' });
}));

apiRouter.post('/upload', requireAdminAuth, asyncHandler(async (req, res) => {
  const { imageBase64 } = req.body || {};
  if (typeof imageBase64 !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(imageBase64) || imageBase64.length > 2000000) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  res.json({
    url: imageBase64,
    success: true,
  });
}));

// Fallback JSON 404 for unhandled API routes
apiRouter.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl || req.url}` });
});

// MOUNT ROUTER AT BOTH `/api` AND `/`
// This ensures that whether Vercel passes `/api/auth/login` or `/auth/login`, it ALWAYS works!
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message);
  const status = error.status || 503;
  res.status(status).json({ error: status === 409 ? error.message : status === 400 ? error.message : status === 413 ? 'Request body is too large' : 'Storage unavailable. Check server configuration and database migrations.' });
});

export default app;
