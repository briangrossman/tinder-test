/* ── matches.js — fetch and render match list on matches.html ── */

const matchList        = document.getElementById('match-list');
const matchesSubtitle  = document.getElementById('matches-subtitle');
const incompleteWarn   = document.getElementById('incomplete-warning');
const logoutBtn        = document.getElementById('logout-btn');
const rateAgainBtn     = document.getElementById('rate-again-btn');
const userName         = document.getElementById('user-name');
const userAvatar       = document.getElementById('user-avatar');

const RANK_ICONS = ['🥇', '🥈', '🥉'];

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    // Load session user
    try {
        const res  = await fetch('/me');
        if (!res.ok) { window.location.href = '/login.html'; return; }
        const user = await res.json();
        userName.textContent = user.name;
        userAvatar.src       = `/${user.photoPath}`;
        userAvatar.alt       = user.name;
    } catch {
        window.location.href = '/login.html';
        return;
    }

    await loadMatches();
}

// ── Load matches from API ─────────────────────────────────────────────────────
async function loadMatches() {
    matchList.innerHTML = '<div class="no-matches">Loading matches…</div>';

    try {
        const res  = await fetch('/matches');
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();

        // Show warning if current user hasn't rated all images
        if (!data.myDone) {
            incompleteWarn.style.display = 'block';
            matchesSubtitle.textContent  = `You've rated ${data.myRatedCount} of ${data.total} tinder images.`;
        }

        renderMatches(data.matches, data.total);
    } catch (err) {
        console.error('Matches error:', err);
        matchList.innerHTML = '<div class="no-matches">Failed to load matches. Please try again.</div>';
    }
}

// ── Render match cards ────────────────────────────────────────────────────────
function renderMatches(matches, total) {
    if (!matches || matches.length === 0) {
        matchList.innerHTML = `
            <div class="no-matches">
                <div style="font-size:2.5rem;margin-bottom:12px;">🌲</div>
                No other users yet! Invite friends to join Tinder.
            </div>`;
        return;
    }

    matchList.innerHTML = '';

    matches.forEach((match, idx) => {
        const rank      = idx + 1;
        const rankIcon  = rank <= 3 ? RANK_ICONS[rank - 1] : `#${rank}`;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';

        const scoreText = match.theirDone
            ? `${match.score} / ${total} in common`
            : `${match.score} in common so far (${match.theirRatedCount}/${total} rated)`;

        const badgeClass = match.theirDone ? 'match-badge' : 'match-badge incomplete-badge';
        const badgeText  = match.theirDone ? `${match.score}/${total}` : `${match.score}/${match.theirRatedCount}`;

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <div class="match-rank ${rankClass}">${rankIcon}</div>
            <img class="match-avatar"
                 src="/${match.photoPath}"
                 alt="${escapeHtml(match.name)}"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text y=\\'.9em\\' font-size=\\'90\\'></text></svg>'">
            <div class="match-info">
                <div class="match-name">${escapeHtml(match.name)}</div>
                <div class="match-score">${scoreText}</div>
            </div>
            <div class="${badgeClass}">${badgeText}</div>
        `;

        matchList.appendChild(card);
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Logout ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
});

// ── Rate Again ────────────────────────────────────────────────────────────────
rateAgainBtn.addEventListener('click', async () => {
    await fetch('/tinder/reset', { method: 'POST' });
    window.location.href = '/rate.html';
});

// ── Start ─────────────────────────────────────────────────────────────────────
init();
