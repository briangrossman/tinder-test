/* ── auth.js — handles both register.html and login.html ── */

const isRegisterPage = document.getElementById('register-form') !== null;

// ── Photo preview (register page only) ──────────────────────────────────────
if (isRegisterPage) {
    const photoInput   = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');

    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.src     = e.target.result;
            photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// ── Error display ────────────────────────────────────────────────────────────
function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.add('show');
}

function hideError() {
    const el = document.getElementById('error-msg');
    el.classList.remove('show');
}

// ── Register form ────────────────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';

        const formData = new FormData(registerForm);

        try {
            const res  = await fetch('/register', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                showError(data.error || 'Registration failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = '🔥 Create Account';
                return;
            }

            // Success — go to rate page
            window.location.href = '/rate.html';
        } catch (err) {
            showError('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = '🔥 Create Account';
        }
    });
}

// ── Login form ───────────────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';

        const name = document.getElementById('name').value.trim();

        try {
            const res  = await fetch('/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name })
            });
            const data = await res.json();

            if (!res.ok) {
                showError(data.error || 'Sign in failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = '🔓 Sign In';
                return;
            }

            window.location.href = '/rate.html';
        } catch (err) {
            showError('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = '🔓 Sign In';
        }
    });
}
