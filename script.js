/* ═══════════════════════════════════════════════════════════════
   GEFF PORTFOLIO — SYSTEM CONTROLLER
   ═══════════════════════════════════════════════════════════════
   Modules:
   1. Boot Sequence Controller
   2. Typewriter Engine
   3. Scroll Reveal Observer
   4. Cursor Glow Tracker
   5. Random CRT Flicker Generator
   ═══════════════════════════════════════════════════════════════ */

;(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     §0  DOM REFERENCES
     ───────────────────────────────────────────── */

  const DOM = {
    bootScreen:     document.getElementById('boot-screen'),
    bootLog:        document.getElementById('boot-log'),
    bootProgressBar:document.getElementById('boot-progress-bar'),
    bootStatus:     document.getElementById('boot-status'),
    mainContent:    document.getElementById('main-content'),
    heroName:       document.getElementById('hero-name'),
    heroCursor:     document.getElementById('hero-cursor'),
    heroSubtitle:   document.getElementById('hero-subtitle'),
    cursorGlow:     document.getElementById('cursor-glow'),
  };


  /* ─────────────────────────────────────────────
     §1  BOOT SEQUENCE CONTROLLER
     ─────────────────────────────────────────────
     Simulates a retro OS boot sequence with
     progressive log lines and a progress bar.
     ───────────────────────────────────────────── */

  const BOOT_LINES = [
    'BIOS v3.7.2 — POST Check .................. OK',
    'Memory Test: 65536K ....................... PASS',
    'Detecting primary storage ................. SSD 512GB',
    'Loading GEFF_KERNEL v4.7 .................. OK',
    'Mounting /dev/portfolio ................... OK',
    'Initializing neural subsystems ............ OK',
    'Loading user profile: GUILHERME.FERRAZ .... OK',
    'Verifying security clearance .............. LEVEL 4',
    'Decrypting project archives ............... OK',
    'Linking AgTech modules .................... OK',
    'Linking EdTech modules .................... OK',
    'Starting display server ................... OK',
    'Applying CRT shader ....................... OK',
    'SYSTEM READY — Launching interface...',
  ];

  /** Minimum delay between boot log lines (ms). */
  const BOOT_LINE_DELAY = 90;

  /** Extra random jitter per line (ms). */
  const BOOT_JITTER = 60;

  /**
   * Runs the full boot sequence, then reveals main content.
   */
  async function runBootSequence() {
    for (let i = 0; i < BOOT_LINES.length; i++) {
      await sleep(BOOT_LINE_DELAY + Math.random() * BOOT_JITTER);

      // Append log line
      const line = document.createElement('div');
      line.classList.add('log-line');
      line.textContent = BOOT_LINES[i];
      DOM.bootLog.appendChild(line);

      // Scroll log to bottom
      DOM.bootLog.scrollTop = DOM.bootLog.scrollHeight;

      // Update progress bar
      const progress = ((i + 1) / BOOT_LINES.length) * 100;
      DOM.bootProgressBar.style.width = progress + '%';

      // Update status text on last few lines
      if (i === BOOT_LINES.length - 2) {
        DOM.bootStatus.textContent = 'FINALIZANDO INICIALIZAÇÃO...';
      }
    }

    // Final pause before transition
    DOM.bootStatus.textContent = 'SISTEMA PRONTO';
    DOM.bootStatus.style.color = '#00ff41';
    DOM.bootStatus.style.animation = 'none';

    await sleep(600);

    // Hide boot screen, reveal main content
    DOM.bootScreen.classList.add('hidden');
    DOM.mainContent.style.display = 'block';

    // Force reflow before adding class
    void DOM.mainContent.offsetHeight;
    DOM.mainContent.classList.add('visible');

    // Start hero typewriter after a brief pause
    await sleep(400);
    startHeroAnimation();
  }


  /* ─────────────────────────────────────────────
     §2  TYPEWRITER ENGINE
     ─────────────────────────────────────────────
     Character-by-character rendering with variable
     speed to simulate natural typing cadence.
     ───────────────────────────────────────────── */

  const HERO_NAME     = 'Guilherme Emanuel Ferreira Ferraz';
  const HERO_SUBTITLE = 'Engenheiro de Controle e Automação | Especialista em Soluções AgTech & EdTech';

  /** Base delay per character (ms). */
  const TYPE_SPEED_NAME     = 55;
  const TYPE_SPEED_SUBTITLE = 25;

  /**
   * Types text into an element character by character.
   * @param {HTMLElement} element  — Target element.
   * @param {string}      text    — Text to type.
   * @param {number}      speed   — Base ms per character.
   * @returns {Promise<void>}
   */
  async function typeText(element, text, speed) {
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      // Variable speed: slower on spaces and punctuation for realism
      const char = text[i];
      let delay = speed;
      if (char === ' ')                     delay = speed * 0.6;
      else if (char === '|' || char === '&') delay = speed * 2;
      else                                  delay = speed + (Math.random() * speed * 0.4);
      await sleep(delay);
    }
  }

  /**
   * Orchestrates the hero animation: name → subtitle.
   */
  async function startHeroAnimation() {
    // Type the name
    await typeText(DOM.heroName, HERO_NAME, TYPE_SPEED_NAME);

    // Brief pause, then type subtitle
    await sleep(300);
    await typeText(DOM.heroSubtitle, HERO_SUBTITLE, TYPE_SPEED_SUBTITLE);

    // After typing, hide blinking cursor
    await sleep(1000);
    DOM.heroCursor.style.display = 'none';
  }


  /* ─────────────────────────────────────────────
     §3  SCROLL REVEAL OBSERVER
     ─────────────────────────────────────────────
     Uses IntersectionObserver to add a "revealed"
     class when sections scroll into the viewport.
     ───────────────────────────────────────────── */

  function initScrollReveal() {
    const sections = document.querySelectorAll('.section, .footer-section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Stop observing once revealed (one-shot)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    sections.forEach((section) => observer.observe(section));
  }


  /* ─────────────────────────────────────────────
     §4  CURSOR GLOW TRACKER
     ─────────────────────────────────────────────
     A subtle radial gradient follows the mouse
     cursor to create a dynamic lighting effect.
     ───────────────────────────────────────────── */

  function initCursorGlow() {
    // Only on devices with a fine pointer (no touch)
    if (window.matchMedia('(pointer: fine)').matches === false) return;

    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!DOM.cursorGlow.classList.contains('active')) {
        DOM.cursorGlow.classList.add('active');
      }

      // Throttle via requestAnimationFrame
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        DOM.cursorGlow.style.left = mouseX + 'px';
        DOM.cursorGlow.style.top  = mouseY + 'px';
        rafId = null;
      });
    });

    document.addEventListener('mouseleave', () => {
      DOM.cursorGlow.classList.remove('active');
    });
  }


  /* ─────────────────────────────────────────────
     §5  RANDOM CRT FLICKER GENERATOR
     ─────────────────────────────────────────────
     Periodically triggers a very brief opacity
     dip on the CRT overlay to simulate unstable
     CRT phosphor behavior.
     ───────────────────────────────────────────── */

  function initRandomFlicker() {
    const overlay = document.querySelector('.crt-overlay');
    if (!overlay) return;

    function triggerFlicker() {
      overlay.style.opacity = (0.6 + Math.random() * 0.3).toString();
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 50 + Math.random() * 80);

      // Schedule next flicker: 3–10 seconds
      const nextDelay = 3000 + Math.random() * 7000;
      setTimeout(triggerFlicker, nextDelay);
    }

    // Start after initial load
    setTimeout(triggerFlicker, 5000);
  }


  /* ─────────────────────────────────────────────
     §6  DYNAMIC CARD TILT (optional enhancement)
     ─────────────────────────────────────────────
     Adds a subtle 3D perspective tilt to project
     cards based on mouse position within the card.
     ───────────────────────────────────────────── */

  function initCardTilt() {
    if (window.matchMedia('(pointer: fine)').matches === false) return;

    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max tilt: 4 degrees
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform =
          `translateY(-4px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }


  /* ─────────────────────────────────────────────
     UTILITY
     ───────────────────────────────────────────── */

  /**
   * Promise-based sleep.
   * @param {number} ms — Milliseconds to wait.
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  /* ─────────────────────────────────────────────
     INITIALIZATION
     ───────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', () => {
    // Kick off boot sequence
    runBootSequence();

    // Initialize interactive modules (they'll work once main content is visible)
    initScrollReveal();
    initCursorGlow();
    initRandomFlicker();
    initCardTilt();
  });

})();
