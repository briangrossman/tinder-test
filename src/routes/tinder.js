'use strict';

const express = require('express');
const db      = require('../db');

const router = express.Router();

const TINDER_IMAGES = [
    'paper',
    'twigs',
    'pinecones',
    'Fahrenheit451',
    'toiletpaper',
    'shavings',
    'hardwood',
    'cardboard'
];

// GET /tinder/images — return full list (for client use)
router.get('/images', (req, res) => {
    return res.json({ images: TINDER_IMAGES });
});

// GET /tinder/next — return the next unrated image for this user
router.get('/next', (req, res) => {
    const userId = req.session.user.id;

    // Get all images this user has already rated
    const ratedRows = db.prepare(
        'SELECT image_name FROM ratings WHERE user_id = ?'
    ).all(userId);

    const rated = new Set(ratedRows.map(r => r.image_name));

    // Find first image in canonical order that is not yet rated
    const nextImage = TINDER_IMAGES.find(img => !rated.has(img));

    if (!nextImage) {
        return res.json({ done: true, rated: TINDER_IMAGES.length, total: TINDER_IMAGES.length });
    }

    return res.json({
        done:      false,
        image:     nextImage,
        src:       `/images/tinder/${nextImage}.png`,
        rated:     rated.size,
        remaining: TINDER_IMAGES.length - rated.size,
        total:     TINDER_IMAGES.length
    });
});

// POST /tinder/rate — submit a rating for an image
router.post('/rate', express.json(), (req, res) => {
    const userId = req.session.user.id;
    const { image, rating } = req.body;

    if (!image || !TINDER_IMAGES.includes(image)) {
        return res.status(400).json({ error: 'Invalid image name' });
    }
    if (!rating || !['like', 'dislike'].includes(rating)) {
        return res.status(400).json({ error: 'Rating must be "like" or "dislike"' });
    }

    db.prepare(
        'INSERT OR REPLACE INTO ratings (user_id, image_name, rating) VALUES (?, ?, ?)'
    ).run(userId, image, rating);

    // Calculate remaining after this rating
    const ratedCount = db.prepare(
        'SELECT COUNT(*) as count FROM ratings WHERE user_id = ?'
    ).get(userId).count;

    const remaining = TINDER_IMAGES.length - ratedCount;
    const done = remaining === 0;

    return res.json({ ok: true, rated: ratedCount, remaining, done, total: TINDER_IMAGES.length });
});

// GET /tinder/progress — get current rating progress
router.get('/progress', (req, res) => {
    const userId = req.session.user.id;

    const ratedCount = db.prepare(
        'SELECT COUNT(*) as count FROM ratings WHERE user_id = ?'
    ).get(userId).count;

    return res.json({
        rated:     ratedCount,
        total:     TINDER_IMAGES.length,
        done:      ratedCount >= TINDER_IMAGES.length,
        remaining: TINDER_IMAGES.length - ratedCount
    });
});

// POST /tinder/reset — clear all ratings for this user (start over)
router.post('/reset', (req, res) => {
    const userId = req.session.user.id;
    db.prepare('DELETE FROM ratings WHERE user_id = ?').run(userId);
    return res.json({ ok: true });
});

module.exports = router;
