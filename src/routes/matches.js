'use strict';

const express = require('express');
const db      = require('../db');

const router  = express.Router();
const TOTAL   = 8; // total number of tinder images

// GET /matches — ranked list of other users by agreement score
router.get('/', (req, res) => {
    const userId = req.session.user.id;

    // Check how many images the current user has rated
    const myRatedCount = db.prepare(
        'SELECT COUNT(*) as count FROM ratings WHERE user_id = ?'
    ).get(userId).count;

    // SQL: join current user's ratings with each other user's ratings
    // on same image AND same rating to get agreement count
    const matches = db.prepare(`
        SELECT
            u.id        AS userId,
            u.name      AS name,
            u.photo_path AS photoPath,
            COUNT(r2.image_name) AS score,
            (SELECT COUNT(*) FROM ratings WHERE user_id = u.id) AS theirRatedCount
        FROM users u
        LEFT JOIN ratings r1 ON r1.user_id = :userId
        LEFT JOIN ratings r2
            ON  r2.user_id    = u.id
            AND r2.image_name = r1.image_name
            AND r2.rating     = r1.rating
        WHERE u.id != :userId
        GROUP BY u.id, u.name, u.photo_path
        ORDER BY score DESC, u.name ASC
    `).all({ userId });

    return res.json({
        myRatedCount,
        total: TOTAL,
        myDone: myRatedCount >= TOTAL,
        matches: matches.map(m => ({
            userId:          m.userId,
            name:            m.name,
            photoPath:       m.photoPath,
            score:           m.score,
            theirRatedCount: m.theirRatedCount,
            theirDone:       m.theirRatedCount >= TOTAL
        }))
    });
});

module.exports = router;
