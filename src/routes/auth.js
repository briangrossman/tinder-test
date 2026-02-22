'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const db      = require('../db');

const router = express.Router();

// Multer config for profile photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const ext    = path.extname(file.originalname).toLowerCase() || '.jpg';
        const unique = crypto.randomBytes(8).toString('hex');
        cb(null, `${unique}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext     = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// POST /register
router.post('/register', upload.single('photo'), (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Profile photo is required' });
        }

        const trimmedName = name.trim();
        const photoPath   = `uploads/${req.file.filename}`;

        try {
            const stmt   = db.prepare('INSERT INTO users (name, photo_path) VALUES (?, ?)');
            const result = stmt.run(trimmedName, photoPath);

            req.session.user = {
                id:        result.lastInsertRowid,
                name:      trimmedName,
                photoPath: photoPath
            };

            return res.json({ ok: true, userId: result.lastInsertRowid, name: trimmedName, photoPath });
        } catch (err) {
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'That name is already taken. Please choose another.' });
            }
            throw err;
        }
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /login
router.post('/login', express.json(), (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name.trim());
        if (!user) {
            return res.status(401).json({ error: 'No account found with that name' });
        }

        req.session.user = {
            id:        user.id,
            name:      user.name,
            photoPath: user.photo_path
        };

        return res.json({ ok: true, userId: user.id, name: user.name, photoPath: user.photo_path });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
    }
});

// POST /logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

// GET /me — return current session user info
router.get('/me', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json(req.session.user);
});

module.exports = router;
