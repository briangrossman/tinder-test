'use strict';

module.exports = function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        if (req.accepts('html') && req.method === 'GET') {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};
