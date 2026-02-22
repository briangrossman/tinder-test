/* ── rate.js — swipe card logic for rate.html ── */

// ── State ─────────────────────────────────────────────────────────────────────
let currentImage   = null;
let isDragging     = false;
let startX         = 0;
let currentX       = 0;
let isAnimating    = false;

const SWIPE_THRESHOLD = 100; // px needed to commit swipe

// ── DOM refs ─────────────────────────────────────────────────────────────────
const card          = document.getElementById('swipe-card');
const tinderImg     = document.getElementById('tinder-img');
const likeLabel     = document.getElementById('like-label');
const dislikeLabel  = document.getElementById('dislike-label');
const cardContainer = document.getElementById('card-container');
const actionButtons = document.getElementById('action-buttons');
const doneCard      = document.getElementById('done-card');
const progressBar   = document.getElementById('progress-bar');
const progressText  = document.getElementById('progress-text');
const btnLike       = document.getElementById('btn-like');
const btnDislike    = document.getElementById('btn-dislike');
const logoutBtn     = document.getElementById('logout-btn');
const matchesBtn    = document.getElementById('matches-btn');
const rateAgainBtn  = document.getElementById('rate-again-btn');
const userName      = document.getElementById('user-name');
const userAvatar    = document.getElementById('user-avatar');

// ── Init: load user info + first card ─────────────────────────────────────────
async function init() {
    // Load session user info
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

    await loadNextCard();
}

// ── Load next card from server ────────────────────────────────────────────────
async function loadNextCard() {
    try {
        const res  = await fetch('/tinder/next');
        const data = await res.json();

        updateProgress(data.rated, data.total);

        if (data.done) {
            showDone();
            return;
        }

        currentImage   = data.image;
        tinderImg.src  = data.src;

        // Reset card appearance
        card.style.transform  = '';
        card.style.transition = '';
        card.style.opacity    = '1';
        card.className        = 'swipe-card';
        likeLabel.style.opacity    = '0';
        dislikeLabel.style.opacity = '0';

        cardContainer.style.display = 'flex';
        actionButtons.style.display = 'flex';
        doneCard.classList.remove('show');

        isAnimating = false;
    } catch (err) {
        console.error('Failed to load next card:', err);
    }
}

// ── Update progress bar ───────────────────────────────────────────────────────
function updateProgress(rated, total) {
    const pct = total > 0 ? Math.round((rated / total) * 100) : 0;
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${rated} / ${total}`;
}

// ── Show done state ───────────────────────────────────────────────────────────
function showDone() {
    cardContainer.style.display = 'none';
    actionButtons.style.display = 'none';
    doneCard.classList.add('show');
}

// ── Submit rating to server ───────────────────────────────────────────────────
async function postRating(rating) {
    try {
        await fetch('/tinder/rate', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ image: currentImage, rating })
        });
    } catch (err) {
        console.error('Failed to post rating:', err);
    }
}

// ── Commit a swipe (direction: 'like' | 'dislike') ───────────────────────────
async function commitSwipe(direction) {
    if (isAnimating || !currentImage) return;
    isAnimating = true;

    // Post rating (fire and forget — don't wait before animating)
    postRating(direction);

    // Fly the card off screen
    card.classList.add(direction === 'like' ? 'flying-right' : 'flying-left');

    // After animation finishes, load next card
    card.addEventListener('transitionend', async () => {
        await loadNextCard();
    }, { once: true });
}

// ── Drag / Swipe gesture ──────────────────────────────────────────────────────
function onDragStart(e) {
    if (isAnimating) return;
    isDragging = true;
    startX     = e.touches ? e.touches[0].clientX : e.clientX;
    currentX   = 0;
    card.style.transition = 'none';
}

function onDragMove(e) {
    if (!isDragging || isAnimating) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    currentX = clientX - startX;

    const rotate = currentX * 0.08;
    card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

    // Fade in labels
    if (currentX > 0) {
        likeLabel.style.opacity    = Math.min(currentX / SWIPE_THRESHOLD, 1).toString();
        dislikeLabel.style.opacity = '0';
    } else {
        dislikeLabel.style.opacity = Math.min(-currentX / SWIPE_THRESHOLD, 1).toString();
        likeLabel.style.opacity    = '0';
    }
}

function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (isAnimating) return;

    if (currentX > SWIPE_THRESHOLD) {
        commitSwipe('like');
    } else if (currentX < -SWIPE_THRESHOLD) {
        commitSwipe('dislike');
    } else {
        // Snap back
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        card.style.transform  = 'translateX(0) rotate(0deg)';
        likeLabel.style.opacity    = '0';
        dislikeLabel.style.opacity = '0';
    }
}

// Mouse events
card.addEventListener('mousedown',  onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup',   onDragEnd);

// Touch events
card.addEventListener('touchstart', onDragStart, { passive: true });
window.addEventListener('touchmove',  onDragMove,  { passive: true });
window.addEventListener('touchend',   onDragEnd);

// ── Button clicks ─────────────────────────────────────────────────────────────
btnLike.addEventListener('click', () => {
    if (!isAnimating) {
        // Quick like animation: flash label then commit
        likeLabel.style.opacity = '1';
        setTimeout(() => commitSwipe('like'), 80);
    }
});

btnDislike.addEventListener('click', () => {
    if (!isAnimating) {
        dislikeLabel.style.opacity = '1';
        setTimeout(() => commitSwipe('dislike'), 80);
    }
});

// ── Logout ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
});

// ── Matches button ────────────────────────────────────────────────────────────
matchesBtn.addEventListener('click', () => {
    window.location.href = '/matches.html';
});

// ── Rate Again ────────────────────────────────────────────────────────────────
rateAgainBtn.addEventListener('click', async () => {
    await fetch('/tinder/reset', { method: 'POST' });
    await loadNextCard();
    updateProgress(0, 8);
});

// ── Prevent image drag ────────────────────────────────────────────────────────
tinderImg.addEventListener('dragstart', e => e.preventDefault());

// ── Start ─────────────────────────────────────────────────────────────────────
init();
