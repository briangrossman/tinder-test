'use strict';

const path    = require('path');
const express = require('express');
const session = require('express-session');

// Initialize DB (creates tables if needed)
require('./db');

const authRoutes    = require('./routes/auth');
const tinderRoutes  = require('./routes/tinder');
const matchRoutes   = require('./routes/matches');
const requireAuth   = require('./middleware/requireAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images',  express.static(path.join(__dirname, '..', 'images')));
app.use('/uploads', express.static(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads')));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sessions ──────────────────────────────────────────────────────────────────
app.use(session({
    secret:            process.env.SESSION_SECRET || 'tinder-fire-secret-2026',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false, // set true in production behind HTTPS
        maxAge:   24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);                          // /register, /login, /logout, /me
app.use('/tinder', requireAuth, tinderRoutes);     // /tinder/next, /tinder/rate, etc.
app.use('/matches', requireAuth, matchRoutes);     // /matches

// Root redirect
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/rate.html');
    }
    res.redirect('/index.html');
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🔥 Tinder app running at http://localhost:${PORT}`);
});
