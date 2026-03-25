/* ═══════════════════════════════════════════════
   VERMI — Login JS
   - Canvas de partículas "memorias"
   - Validación en tiempo real
   - Toggle contraseña
   - Submit con loading state + fetch
   - Manejo de errores del servidor
═══════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   1. CANVAS: Partículas flotantes de "recuerdos"
   Pequeños puntos dorados que ascienden
───────────────────────────────────────────── */
(function initParticles() {
    const canvas  = document.getElementById('memoryCanvas');
    const ctx     = canvas.getContext('2d');
    let particles = [];
    let W, H;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function randomBetween(a, b) {
        return a + Math.random() * (b - a);
    }

    class Particle {
        constructor() { this.reset(true); }

        reset(initial = false) {
            this.x     = randomBetween(0, W);
            this.y     = initial ? randomBetween(0, H) : H + 10;
            this.size  = randomBetween(1, 3.5);
            this.speed = randomBetween(0.2, 0.7);
            this.alpha = randomBetween(0.1, 0.55);
            this.drift = randomBetween(-0.25, 0.25);
            // Colores: dorado, ámbar, crema
            const palette = ['201,168,76', '212,145,74', '232,201,122', '245,230,192'];
            this.color = palette[Math.floor(Math.random() * palette.length)];
        }

        update() {
            this.y     -= this.speed;
            this.x     += this.drift;
            this.alpha -= 0.0008;
            if (this.y < -10 || this.alpha <= 0) this.reset();
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
            ctx.fill();
        }
    }

    function spawnParticles(count) {
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        particles = [];
        spawnParticles(80);
    });

    resize();
    spawnParticles(80);
    animate();
})();


/* ─────────────────────────────────────────────
   2. TOGGLE CONTRASEÑA (ver / ocultar)
───────────────────────────────────────────── */
const togglePass = document.getElementById('togglePass');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

// SVG alternativo: ojo tachado
const eyeOffSVG = `
<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
<line x1="1" y1="1" x2="23" y2="23"/>`;

const eyeOnSVG = `
<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
<circle cx="12" cy="12" r="3"/>`;

togglePass.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIcon.innerHTML  = isHidden ? eyeOffSVG : eyeOnSVG;
    togglePass.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Ver contraseña');
});


/* ─────────────────────────────────────────────
   3. VALIDACIÓN EN TIEMPO REAL
───────────────────────────────────────────── */
const usuarioInput = document.getElementById('usuario');

function showFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    field.classList.add('has-error');
    error.textContent = message;
    error.classList.add('visible');
}

function clearFieldError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    field.classList.remove('has-error');
    error.textContent = '';
    error.classList.remove('visible');
}

// Valida usuario al salir del campo
usuarioInput.addEventListener('blur', () => {
    const val = usuarioInput.value.trim();
    if (!val) {
        showFieldError('fieldUsuario', 'errorUsuario', 'El usuario es obligatorio.');
    } else if (val.length < 3) {
        showFieldError('fieldUsuario', 'errorUsuario', 'Mínimo 3 caracteres.');
    } else {
        clearFieldError('fieldUsuario', 'errorUsuario');
    }
});

usuarioInput.addEventListener('input', () => {
    if (usuarioInput.value.trim().length >= 3) {
        clearFieldError('fieldUsuario', 'errorUsuario');
    }
});

// Valida contraseña al salir del campo
passwordInput.addEventListener('blur', () => {
    if (!passwordInput.value) {
        showFieldError('fieldPassword', 'errorPassword', 'La contraseña es obligatoria.');
    } else if (passwordInput.value.length < 6) {
        showFieldError('fieldPassword', 'errorPassword', 'Mínimo 6 caracteres.');
    } else {
        clearFieldError('fieldPassword', 'errorPassword');
    }
});

passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length >= 6) {
        clearFieldError('fieldPassword', 'errorPassword');
    }
});


/* ─────────────────────────────────────────────
   4. SUBMIT DEL FORMULARIO
   Hace fetch al backend, gestiona loading,
   errores de servidor y redirección
───────────────────────────────────────────── */
const form       = document.getElementById('loginForm');
const btnSubmit  = document.getElementById('btnSubmit');
const globalErr  = document.getElementById('globalError');

function setLoading(active) {
    btnSubmit.disabled = active;
    btnSubmit.classList.toggle('loading', active);
    btnSubmit.querySelector('.btn-text').textContent = active ? 'Verificando…' : 'Entrar';
}

function showGlobalError(message) {
    globalErr.textContent = message;
    globalErr.classList.add('visible');
    // Quitar después de 5 segundos
    setTimeout(() => globalErr.classList.remove('visible'), 5000);
}

function validateAll() {
    let valid = true;
    const usuario  = usuarioInput.value.trim();
    const password = passwordInput.value;

    if (!usuario || usuario.length < 3) {
        showFieldError('fieldUsuario', 'errorUsuario', 'El usuario es obligatorio (mín. 3 caracteres).');
        valid = false;
    }
    if (!password || password.length < 6) {
        showFieldError('fieldPassword', 'errorPassword', 'La contraseña es obligatoria (mín. 6 caracteres).');
        valid = false;
    }
    return valid;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    globalErr.classList.remove('visible');

    if (!validateAll()) return;

    setLoading(true);

    /* ─────────────────────────────────────────────
       BACKEND — INSTRUCCIONES PARA EL FETCH:
       - Endpoint: form.action ("/api/auth/login")
       - Envía JSON con { usuario, password, recordarme }
       - Espera respuesta JSON del servidor:
           Éxito:  { success: true, redirectTo: "/feed" }
           Error:  { success: false, error: "Credenciales incorrectas" }
       - Si el servidor devuelve un JWT, guárdalo en
         httpOnly cookie (manejo en el servidor, no aquí)
         o en memoria (NO en localStorage por seguridad)
    ───────────────────────────────────────────── */
    try {
        const body = {
            usuario:    usuarioInput.value.trim(),
            password:   passwordInput.value,
            recordarme: document.getElementById('recordarme').checked,
        };

        const res  = await fetch(form.action, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Envía/recibe cookies
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            // ─── ÉXITO: redirigir al feed o página indicada por el servidor
            btnSubmit.querySelector('.btn-text').textContent = '¡Bienvenido! ✦';
            setTimeout(() => {
                window.location.href = data.redirectTo || '/feed';
            }, 600);

        } else {
            // ─── ERROR DEL SERVIDOR (credenciales incorrectas, cuenta bloqueada, etc.)
            setLoading(false);
            showGlobalError(data.error || 'Usuario o contraseña incorrectos. Inténtalo de nuevo.');
        }

    } catch (networkError) {
        // ─── ERROR DE RED (sin conexión, servidor caído)
        setLoading(false);
        showGlobalError('No se pudo conectar con el servidor. Revisa tu conexión.');
        console.error('[Vermi Login] Error de red:', networkError);
    }
});


/* ─────────────────────────────────────────────
   5. PEQUEÑO DETALLE: Mover la tarjeta
   suavemente siguiendo el mouse (parallax leve)
───────────────────────────────────────────── */
(function initCardParallax() {
    const card = document.querySelector('.form-card');
    if (!card || window.innerWidth < 720) return;

    let tX = 0, tY = 0;
    let cX = 0, cY = 0;

    document.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth  / 2;
        const cy = window.innerHeight / 2;
        tX = (e.clientX - cx) / cx * 5;  // máximo ±5px
        tY = (e.clientY - cy) / cy * 4;
    });

    function animate() {
        cX += (tX - cX) * 0.06;
        cY += (tY - cY) * 0.06;
        card.style.transform = `translate(${cX}px, ${cY}px)`;
        requestAnimationFrame(animate);
    }

    animate();
})();
