import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'uc_secure_session_secret_998877';

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ----------------------------------------------------
// Database Helpers & Auto-Seeding (30 Slots)
// ----------------------------------------------------

function hashPin(pin, salt) {
  return crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
}

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      ensureDbInit();
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return ensureDbInit();
  }
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

function ensureDbInit() {
  const defaultSalt = 'uc_default_salt_2026';
  const defaultPin = '2026';
  const defaultHash = hashPin(defaultPin, defaultSalt);

  const initialParticipants = [];

  // Seed sample participants for slots 1, 2, 3
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

  // Pre-populate all 30 slots
  for (let i = 1; i <= 30; i++) {
    const paddedIndex = String(i).padStart(3, '0');
    const existing = sampleProfiles.find((p) => p.slot_number === i);
    if (existing) {
      initialParticipants.push(existing);
    } else {
      // Empty slot ready for the organizer
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
      productionDomain: 'https://uchihaconnect.com',
      defaultTemplateId: 'black-and-orange',
      totalSlots: 30,
    },
    participants: initialParticipants,
  };

  writeDb(initialDb);
  return initialDb;
}

// ----------------------------------------------------
// Security & Rate Limiting
// ----------------------------------------------------

const failedAttemptsMap = new Map(); // ip -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function createSessionToken(userId = 'organizer') {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifySessionToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [userId, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // 24 hours expiry
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return false;
    }

    const expectedHmac = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${userId}:${timestamp}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  } catch (err) {
    return false;
  }
}

// Auth Middleware for Protected Organizer Endpoints
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.uc_admin_session || req.cookies?.cid_admin_session;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: Organizer session required' });
  }

  next();
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'local';
  const now = Date.now();

  const attemptInfo = failedAttemptsMap.get(ip) || { count: 0, lockedUntil: 0 };
  if (attemptInfo.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed attempts. Temporary lockout for ${remainingSeconds} seconds.`,
      lockoutRemaining: remainingSeconds,
    });
  }

  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const db = readDb();
  const expectedHash = db.config.organizerPinHash;
  const salt = db.config.organizerPinSalt;
  const inputHash = hashPin(pin.trim(), salt);

  if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(expectedHash))) {
    // Reset failed attempts
    failedAttemptsMap.delete(ip);

    const token = createSessionToken();
    res.cookie('uc_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('cid_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      message: 'Authenticated successfully',
      expiresIn: 24 * 60 * 60,
    });
  } else {
    attemptInfo.count += 1;
    if (attemptInfo.count >= MAX_ATTEMPTS) {
      attemptInfo.lockedUntil = now + LOCKOUT_DURATION_MS;
      failedAttemptsMap.set(ip, attemptInfo);
      return res.status(429).json({
        error: 'Too many failed attempts. You have been locked out for 15 minutes.',
        lockoutRemaining: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      });
    }

    failedAttemptsMap.set(ip, attemptInfo);
    const attemptsLeft = MAX_ATTEMPTS - attemptInfo.count;
    return res.status(401).json({
      error: `Invalid PIN. ${attemptsLeft} attempt(s) remaining before temporary lockout.`,
      attemptsLeft,
    });
  }
});

app.get('/api/auth/status', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.uc_admin_session || req.cookies?.cid_admin_session;
  const isAuthenticated = verifySessionToken(token);
  res.json({ isAuthenticated });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('uc_admin_session');
  res.clearCookie('cid_admin_session');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-pin', requireAdminAuth, (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'New PIN must be at least 4 digits' });
  }

  const db = readDb();
  const currentHash = hashPin(currentPin, db.config.organizerPinSalt);
  if (!crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(db.config.organizerPinHash))) {
    return res.status(400).json({ error: 'Current PIN is incorrect' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPin(newPin, newSalt);
  db.config.organizerPinHash = newHash;
  db.config.organizerPinSalt = newSalt;
  writeDb(db);

  res.json({ success: true, message: 'PIN updated successfully' });
});

// ----------------------------------------------------
// Public Profile Endpoint (Mobile-first Visitors)
// Strictly blocks draft and unpublished cards
// ----------------------------------------------------

app.get('/api/public/profile/:username', (req, res) => {
  const requestedUsername = req.params.username.toLowerCase().trim();
  const db = readDb();

  const participant = db.participants.find(
    (p) => p.username && p.username.toLowerCase().trim() === requestedUsername
  );

  if (!participant) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Strictly enforce publication status
  if (participant.publication_status !== 'published') {
    return res.status(404).json({
      error: 'This profile is currently in draft or has been unpublished by the organizer.',
    });
  }

  // Return public participant data
  res.json({
    participant,
    hackathonName: db.config.hackathonName,
  });
});

// ----------------------------------------------------
// Protected Organizer Participant Endpoints
// ----------------------------------------------------

// Get all 30 participants
app.get('/api/participants', requireAdminAuth, (req, res) => {
  const db = readDb();
  res.json({
    participants: db.participants,
    config: {
      hackathonName: db.config.hackathonName,
      productionDomain: db.config.productionDomain,
      defaultTemplateId: db.config.defaultTemplateId,
      totalSlots: db.config.totalSlots || 30,
    },
  });
});

// Get single participant by id or slot number
app.get('/api/participants/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const participant = db.participants.find(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (!participant) {
    return res.status(404).json({ error: 'Participant slot not found' });
  }

  res.json(participant);
});

// Create / Fill a participant
app.post('/api/participants', requireAdminAuth, (req, res) => {
  const data = req.body;
  if (!data.full_name || !data.full_name.trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  let username = (data.username || data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
  const db = readDb();

  // Find first empty slot or target slot
  let targetSlotIndex = -1;
  if (data.slot_number) {
    targetSlotIndex = db.participants.findIndex((p) => p.slot_number === data.slot_number);
  } else {
    // Find next empty slot
    targetSlotIndex = db.participants.findIndex((p) => !p.full_name || p.full_name.trim() === '');
  }

  if (targetSlotIndex === -1) {
    targetSlotIndex = db.participants.length;
  }

  const slotNumber = targetSlotIndex + 1;
  const participantId = data.participant_id || `CID-${String(slotNumber).padStart(3, '0')}`;

  // Check username collision with other slots
  const usernameConflict = db.participants.some(
    (p, idx) => idx !== targetSlotIndex && p.username?.toLowerCase() === username.toLowerCase()
  );

  if (usernameConflict) {
    username = `${username}-${Date.now().toString(36).substr(-4)}`;
  }

  const newParticipant = {
    id: data.id || `cid-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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

  writeDb(db);
  res.status(201).json(newParticipant);
});

// Update participant by ID or slot number
app.put('/api/participants/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const db = readDb();

  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  const existing = db.participants[index];

  // If username is changing, ensure uniqueness
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

  db.participants[index] = updatedParticipant;
  writeDb(db);

  res.json(updatedParticipant);
});

// Publish card
app.post('/api/participants/:id/publish', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  db.participants[index].publication_status = 'published';
  db.participants[index].updated_at = new Date().toISOString();
  writeDb(db);

  res.json({
    success: true,
    participant: db.participants[index],
    message: 'Card published successfully',
  });
});

// Unpublish card
app.post('/api/participants/:id/unpublish', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.participants.findIndex(
    (p) => p.participant_id === id || p.id === id || String(p.slot_number) === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  db.participants[index].publication_status = 'unpublished';
  db.participants[index].updated_at = new Date().toISOString();
  writeDb(db);

  res.json({
    success: true,
    participant: db.participants[index],
    message: 'Card unpublished. Public access disabled.',
  });
});

// Clear / Delete participant slot (resets slot to empty)
app.delete('/api/participants/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
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

  writeDb(db);
  res.json({ success: true, message: 'Slot reset successfully' });
});

// Bulk import participants
app.post('/api/participants/bulk-import', requireAdminAuth, (req, res) => {
  const { participants } = req.body;
  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Array of participants required' });
  }

  const db = readDb();
  let importedCount = 0;

  participants.forEach((incoming) => {
    // Check if slot exists or find first empty slot
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
        participant_id: incoming.participant_id || db.participants[targetIndex].participant_id,
        updated_at: new Date().toISOString(),
      };
      importedCount++;
    }
  });

  writeDb(db);
  res.json({
    success: true,
    importedCount,
    message: `Successfully imported ${importedCount} participant cards`,
  });
});

// Settings Endpoints
app.get('/api/settings', requireAdminAuth, (req, res) => {
  const db = readDb();
  res.json({
    hackathonName: db.config.hackathonName,
    productionDomain: db.config.productionDomain,
    defaultTemplateId: db.config.defaultTemplateId,
    totalSlots: db.config.totalSlots || 30,
  });
});

app.put('/api/settings', requireAdminAuth, (req, res) => {
  const { hackathonName, productionDomain, defaultTemplateId } = req.body;
  const db = readDb();

  if (hackathonName) db.config.hackathonName = hackathonName.trim();
  if (productionDomain) db.config.productionDomain = productionDomain.trim().replace(/\/+$/, '');
  if (defaultTemplateId) db.config.defaultTemplateId = defaultTemplateId;

  writeDb(db);
  res.json({ success: true, config: db.config, message: 'Settings saved' });
});

// Image Upload Endpoint (Stores base64 or saves to server/uploads)
app.post('/api/upload', requireAdminAuth, (req, res) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  // Base64 data URL can be returned directly or saved to uploads directory
  res.json({
    url: imageBase64,
    success: true,
  });
});

// Initialize and start server
ensureDbInit();

app.listen(PORT, () => {
  console.log(`[UCHIHA CONNECT API Server] Listening on http://localhost:${PORT}`);
});
