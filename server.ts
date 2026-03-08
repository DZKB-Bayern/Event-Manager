import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('events.db');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Placeholder if missing

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database Setup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Try to add role column if it doesn't exist (migration for existing db)
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member'");
} catch (e) {
  // Column likely already exists
}

// Try to add email column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT UNIQUE");
} catch (e) {
  // Column likely already exists
}

// Try to add image_url column if it doesn't exist
try {
  db.exec("ALTER TABLE events ADD COLUMN image_url TEXT");
} catch (e) {
  // Column likely already exists
}

// Try to add color column if it doesn't exist
try {
  db.exec("ALTER TABLE events ADD COLUMN color TEXT");
} catch (e) {
  // Column likely already exists
}

// Try to add button_text column if it doesn't exist
try {
  db.exec("ALTER TABLE events ADD COLUMN button_text TEXT");
} catch (e) {
  // Column likely already exists
}

// Try to add button_link column if it doesn't exist
try {
  db.exec("ALTER TABLE events ADD COLUMN button_link TEXT");
} catch (e) {
  // Column likely already exists
}

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Types
interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Auth Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user as User;
    next();
  });
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Seed Demo Users
async function seedDemoUsers() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    console.log('Seeding demo users...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Create Admin
    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@example.com', hashedPassword, 'admin');
    
    // Create Member
    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('member', 'member@example.com', hashedPassword, 'member');
    
    console.log('Demo users created: admin/password, member/password');
  }

  // Check for events and seed if empty
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as any;
  if (eventCount.count === 0) {
    console.log('Seeding demo events...');
    
    // Get existing users to attach events to
    const users = db.prepare('SELECT id, username FROM users').all() as any[];
    
    if (users.length > 0) {
        const now = new Date();
        const demoEvents = [
          { title: 'Team Meeting', description: 'Weekly sync', location: 'Room A' },
          { title: 'Project Kickoff', description: 'New project start', location: 'Room B' },
          { title: 'Client Call', description: 'Monthly review', location: 'Online' },
          { title: 'Workshop', description: 'Internal training', location: 'Auditorium' },
          { title: 'Lunch & Learn', description: 'Tech talk', location: 'Cafeteria' },
          { title: 'Code Review', description: 'Reviewing PRs', location: 'Desk' },
          { title: 'Strategy Session', description: 'Q3 planning', location: 'Boardroom' },
          { title: 'Happy Hour', description: 'Friday drinks', location: 'Lounge' }
        ];

        for (const user of users) {
          // Add 2-3 random events per user
          const numEvents = Math.floor(Math.random() * 2) + 2; // 2 or 3
          for (let i = 0; i < numEvents; i++) {
            const eventTemplate = demoEvents[Math.floor(Math.random() * demoEvents.length)];
            const startTime = new Date(now);
            startTime.setDate(now.getDate() + Math.floor(Math.random() * 30)); // Next 30 days
            startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // 9am - 5pm
            
            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 1);

            db.prepare(`
              INSERT INTO events (user_id, title, description, location, start_time, end_time, color)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
              user.id, 
              eventTemplate.title, 
              eventTemplate.description, 
              eventTemplate.location, 
              startTime.toISOString(), 
              endTime.toISOString(),
              '#4F46E5' // Indigo
            );
          }
        }
        console.log('Demo events created.');
    }
  }
}

seedDemoUsers();

// API Routes

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // First user is admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const role = userCount.count === 0 ? 'admin' : 'member';

    const stmt = db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword, role);
    
    const user = { id: Number(result.lastInsertRowid), username, email, role };
    
    // Do NOT automatically login after registration, as per user request for email confirmation flow
    // const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    // res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });
    
    res.json({ message: 'Registration successful. Please confirm your email.', user });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) return res.status(400).json({ error: 'Username/Email and password required' });

  let user: any;
  if (email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    user = stmt.get(email);
  } 
  
  if (!user && username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    user = stmt.get(username);
  }

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });
  res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// Auth: Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
  res.json({ message: 'Logged out' });
});

// Auth: Me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Dev Tool: Promote Me to Admin
app.post('/api/admin/promote-me', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', req.user!.id);
    // Update the token with new role
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });
    
    res.json({ message: 'You are now an admin! Please refresh the page.', user: { id: user.id, username: user.username, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get All Users
app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
  res.json(users);
});

// Admin: Update User
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, role, password } = req.body;
  
  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?')
        .run(username, role, hashedPassword, id);
    } else {
      db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?')
        .run(username, role, id);
    }
    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  if (Number(id) === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  
  db.transaction(() => {
    db.prepare('DELETE FROM events WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  })();
  
  res.json({ message: 'User deleted' });
});

// Admin: Seed Demo Data
app.post('/api/admin/seed', authenticateToken, isAdmin, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const demoUsers = [
      { username: 'demo_user_1', role: 'member' },
      { username: 'demo_user_2', role: 'member' },
      { username: 'demo_user_3', role: 'member' }
    ];

    const createdUsers = [];

    for (const u of demoUsers) {
      try {
        const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
        const result = stmt.run(u.username, hashedPassword, u.role);
        createdUsers.push({ id: result.lastInsertRowid, username: u.username });
      } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          // User exists, fetch id
          const existing = db.prepare('SELECT id, username FROM users WHERE username = ?').get(u.username) as any;
          createdUsers.push(existing);
        } else {
          throw e;
        }
      }
    }

    // Create events for these users
    const now = new Date();
    const demoEvents = [
      { title: 'Team Meeting', description: 'Weekly sync', location: 'Room A' },
      { title: 'Project Kickoff', description: 'New project start', location: 'Room B' },
      { title: 'Client Call', description: 'Monthly review', location: 'Online' },
      { title: 'Workshop', description: 'Internal training', location: 'Auditorium' },
      { title: 'Lunch & Learn', description: 'Tech talk', location: 'Cafeteria' },
      { title: 'Code Review', description: 'Reviewing PRs', location: 'Desk' },
      { title: 'Strategy Session', description: 'Q3 planning', location: 'Boardroom' },
      { title: 'Happy Hour', description: 'Friday drinks', location: 'Lounge' }
    ];

    for (const user of createdUsers) {
      // Check if user already has events
      const count = (db.prepare('SELECT COUNT(*) as count FROM events WHERE user_id = ?').get(user.id) as any).count;
      if (count > 0) continue;

      // Add 2-3 random events
      const numEvents = Math.floor(Math.random() * 2) + 2; // 2 or 3
      for (let i = 0; i < numEvents; i++) {
        const eventTemplate = demoEvents[Math.floor(Math.random() * demoEvents.length)];
        const startTime = new Date(now);
        startTime.setDate(now.getDate() + Math.floor(Math.random() * 30)); // Next 30 days
        startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // 9am - 5pm
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);

        db.prepare(`
          INSERT INTO events (user_id, title, description, location, start_time, end_time, color)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          user.id, 
          eventTemplate.title, 
          eventTemplate.description, 
          eventTemplate.location, 
          startTime.toISOString(), 
          endTime.toISOString(),
          '#4F46E5' // Indigo
        );
      }
    }

    res.json({ message: 'Demo data created successfully' });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete Event (Any event)
app.delete('/api/admin/events/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  res.json({ message: 'Event deleted' });
});

// Events: List (Public)
app.get('/api/events', (req, res) => {
  const stmt = db.prepare(`
    SELECT events.*, users.username as creator_name 
    FROM events 
    JOIN users ON events.user_id = users.id 
    ORDER BY start_time ASC
  `);
  const events = stmt.all();
  res.json(events);
});

// Events: My Events
app.get('/api/events/me', authenticateToken, (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE user_id = ? 
    ORDER BY start_time ASC
  `);
  const events = stmt.all(req.user!.id);
  res.json(events);
});

// Helper: Send Email Notification (Resend Integration)
async function sendEmailNotification(event: any, user: any) {
  console.log('---------------------------------------------------');
  console.log('📧 EMAIL NOTIFICATION TRIGGERED');
  
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('Attempting to send email via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'Events App <onboarding@resend.dev>',
        to: ['admin@example.com'], // In a real app, this would be the admin's email
        subject: `New Event Created: ${event.title}`,
        html: `
          <h1>New Event Created</h1>
          <p><strong>User:</strong> ${user.username}</p>
          <p><strong>Title:</strong> ${event.title}</p>
          <p><strong>Description:</strong> ${event.description}</p>
          <p><strong>Time:</strong> ${event.start_time}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        `
      });

      if (error) {
        console.error('Resend Error:', error);
      } else {
        console.log('Email sent successfully via Resend:', data);
      }
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
    }
  } else {
    console.log('⚠️ RESEND_API_KEY not found. Skipping actual email send.');
    console.log('To enable real emails, add RESEND_API_KEY to your .env file.');
  }

  console.log(`To: admin@example.com`);
  console.log(`Subject: New Event Created: ${event.title}`);
  console.log(`Body: User ${user.username} created a new event.`);
  console.log(`Event Details:`, event);
  console.log('---------------------------------------------------');
}

// Events: Create
app.post('/api/events', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('POST /api/events body:', req.body);
    console.log('POST /api/events file:', req.file);

    const { title, description, location, start_time, end_time, color, button_text, button_link } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !start_time || !end_time) {
      console.error('Missing required fields:', { title, start_time, end_time });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO events (user_id, title, description, location, start_time, end_time, image_url, color, button_text, button_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(req.user!.id, title, description, location, start_time, end_time, image_url, color, button_text, button_link);
    
    const newEvent = { id: result.lastInsertRowid, ...req.body, image_url, user_id: req.user!.id };
    
    // Trigger Email Notification
    await sendEmailNotification(newEvent, req.user);

    res.json(newEvent);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Events: Update
app.put('/api/events/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, location, start_time, end_time, color, button_text, button_link } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });
  
  // Allow admin to update any event, or user to update their own
  if (req.user!.role !== 'admin' && event.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  let stmt;
  if (image_url) {
    stmt = db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?, image_url = ?, color = ?, button_text = ?, button_link = ?
      WHERE id = ?
    `);
    stmt.run(title, description, location, start_time, end_time, image_url, color, button_text, button_link, id);
  } else {
    stmt = db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?, color = ?, button_text = ?, button_link = ?
      WHERE id = ?
    `);
    stmt.run(title, description, location, start_time, end_time, color, button_text, button_link, id);
  }
  
  res.json({ id, title, description, location, start_time, end_time, image_url: image_url || event.image_url, color, button_text, button_link });
});

// Events: Delete
app.delete('/api/events/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });
  
  // Allow admin to delete any event, or user to delete their own
  if (req.user!.role !== 'admin' && event.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  res.json({ message: 'Event deleted' });
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
