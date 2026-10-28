/* ==========================================================================
   Stage & Screen: Broadway & Film Trivia
   Standalone Game Logic, Pointer Drag-and-Drop & Web Audio Engine (script.js)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Actors & Productions Dataset (18 True Works + 6 Decoys = 24 Titles)
     ------------------------------------------------------------------------ */
  const ACTORS = [
    {
      id: 'denzel',
      name: 'Denzel Washington',
      initials: 'DW',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg/330px-Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg/330px-Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg',
      credentials: 'Tony & Two-Time Oscar Winner',
      works: ['Othello (Theater)', 'Malcolm X', 'Fences'],
    },
    {
      id: 'idris',
      name: 'Idris Elba',
      initials: 'IE',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg/330px-Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg/330px-Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg',
      credentials: 'Screen, RSC & Musical Star',
      works: ['Cats', 'Dark Tower', 'Mandela'],
    },
    {
      id: 'hugh',
      name: 'Hugh Jackman',
      initials: 'HJ',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Hugh_Jackman_by_Gage_Skidmore_3.jpg/330px-Hugh_Jackman_by_Gage_Skidmore_3.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Hugh_Jackman_by_Gage_Skidmore_3.jpg/330px-Hugh_Jackman_by_Gage_Skidmore_3.jpg',
      credentials: 'Two-Time Tony Winner & Film Lead',
      works: ['Happy Feet', 'Les Misérables', 'The Greatest Showman'],
    },
    {
      id: 'viola',
      name: 'Viola Davis',
      initials: 'VD',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Viola_Davis_2026_%28cropped%29.jpg/330px-Viola_Davis_2026_%28cropped%29.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Viola_Davis_2026_%28cropped%29.jpg/330px-Viola_Davis_2026_%28cropped%29.jpg',
      credentials: 'EGOT & Two-Time Tony Winner',
      works: ['Seven Guitars', 'The Woman King', 'Ma Rainey’s Black Bottom'],
    },
    {
      id: 'cynthia',
      name: 'Cynthia Erivo',
      initials: 'CE',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg/330px-Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg/330px-Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg',
      credentials: 'Tony, Grammy & Emmy Winner',
      works: ['The Color Purple', 'Sister Act (The Musical)', 'Harriet'],
    },
    {
      id: 'meryl',
      name: 'Meryl Streep',
      initials: 'MS',
      wikimediaUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg/330px-Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg',
      altWikimediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg/330px-Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_%28cropped1%29.jpg',
      credentials: 'Three-Time Oscar & Stage Icon',
      works: ['Mamma Mia!', 'The Iron Lady', 'The Taming of the Shrew'],
    },
  ];

  const DECOY_TITLES = [
    'A Beautiful Mind',
    'Pocahontas',
    'Ali',
    'Ray',
    'Gandhi',
    'Braveheart',
  ];

  function createShuffledWordBank() {
    const tiles = [];
    ACTORS.forEach(function (actor) {
      actor.works.forEach(function (work, idx) {
        tiles.push({
          id: actor.id + '-work-' + idx,
          title: work,
          actorId: actor.id,
        });
      });
    });
    DECOY_TITLES.forEach(function (decoy, idx) {
      tiles.push({
        id: 'decoy-' + idx,
        title: decoy,
        actorId: null,
      });
    });

    // Fisher-Yates shuffle on every load and ENCORE
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = tiles[i];
      tiles[i] = tiles[j];
      tiles[j] = temp;
    }
    return tiles;
  }

  /* ------------------------------------------------------------------------
     2. Self-Contained Web Audio & Host Speech Engine
     ------------------------------------------------------------------------ */
  const SoundEngine = {
    ctx: null,
    muted: false,
    applauseBuffer: null,
    awwBuffer: null,

    ensureContext: function () {
      if (this.muted) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.buildStudioBuffers();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
      return this.ctx;
    },

    unlock: function () {
      this.ensureContext();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    },

    buildStudioBuffers: function () {
      const ctx = this.ctx;
      if (!ctx) return;
      const sr = ctx.sampleRate;

      // 1) Studio Applause & Cheers AudioBuffer (2.4s)
      const durClap = 2.4;
      const clapBuf = ctx.createBuffer(1, Math.floor(sr * durClap), sr);
      const clapData = clapBuf.getChannelData(0);
      const numClaps = 340;
      for (let c = 0; c < numClaps; c++) {
        const start = Math.pow(Math.random(), 0.85) * (durClap - 0.16);
        const startIdx = Math.floor(start * sr);
        const freq = 900 + Math.random() * 1450;
        const r = Math.exp((-Math.PI * 440) / sr);
        const coef = 2 * r * Math.cos((2 * Math.PI * freq) / sr);
        let y1 = 0;
        let y2 = 0;
        const amp =
          (0.25 + Math.random() * 0.75) *
          Math.sin(Math.PI * Math.min(1, (durClap - start) / durClap));
        const len = Math.floor((0.032 + Math.random() * 0.04) * sr);
        for (let k = 0; k < len && startIdx + k < clapData.length; k++) {
          const kt = k / sr;
          const env = Math.exp(-kt * 95) * (kt < 0.003 ? kt / 0.003 : 1);
          const n = (Math.random() * 2 - 1) * env;
          const out = (1 - r) * n + coef * y1 - r * r * y2;
          y2 = y1;
          y1 = out;
          clapData[startIdx + k] += out * amp * 0.22;
        }
      }
      let maxClap = 0;
      for (let i = 0; i < clapData.length; i++) {
        maxClap = Math.max(maxClap, Math.abs(clapData[i]));
      }
      for (let i = 0; i < clapData.length; i++) {
        clapData[i] = (clapData[i] / (maxClap || 1)) * 0.8;
      }
      this.applauseBuffer = clapBuf;

      // 2) 24-Voice Formant Studio Audience "Awww..." AudioBuffer (2.0s)
      const durAww = 2.0;
      const awwBuf = ctx.createBuffer(1, Math.floor(sr * durAww), sr);
      const awwData = awwBuf.getChannelData(0);
      const voices = 24;
      for (let v = 0; v < voices; v++) {
        const isFemale = v % 2 === 0;
        const baseF0 = (isFemale ? 244 : 136) * (0.92 + ((v * 17) % 19) * 0.009);
        const startDelay = ((v * 31) % 100) * 0.0016;
        const vibRate = 4.5 + (v % 5) * 0.4;
        let phase = (v * 0.37) % 1;
        let y1_1 = 0, y2_1 = 0, y1_2 = 0, y2_2 = 0;

        for (let i = Math.floor(startDelay * sr); i < awwData.length; i++) {
          const t = i / sr - startDelay;
          const normT = t / (durAww - startDelay);
          const pitchContour =
            normT < 0.12
              ? 1.0 + 0.04 * (normT / 0.12)
              : 1.04 * Math.pow(0.74, (normT - 0.12) / 0.88);
          const f0 = baseF0 * pitchContour * (1 + 0.012 * Math.sin(2 * Math.PI * vibRate * t));
          phase += f0 / sr;
          if (phase >= 1) phase -= 1;

          const glottal =
            phase < 0.42
              ? 0.5 * (1 - Math.cos((Math.PI * phase) / 0.42))
              : phase < 0.58
              ? Math.cos((Math.PI * (phase - 0.42)) / (2 * 0.16))
              : 0;
          const src = glottal - 0.28 + (Math.random() * 2 - 1) * 0.04;

          const f1 = 680 - 170 * normT;
          const f2 = 1120 - 270 * normT;
          const r1 = Math.exp((-Math.PI * 85) / sr);
          const c1 = 2 * r1 * Math.cos((2 * Math.PI * f1) / sr);
          const out1 = (1 - r1) * src + c1 * y1_1 - r1 * r1 * y2_1;
          y2_1 = y1_1;
          y1_1 = out1;

          const r2 = Math.exp((-Math.PI * 110) / sr);
          const c2 = 2 * r2 * Math.cos((2 * Math.PI * f2) / sr);
          const out2 = (1 - r2) * src + c2 * y1_2 - r2 * r2 * y2_2;
          y2_2 = y1_2;
          y1_2 = out2;

          const env = Math.min(1, t / 0.14) * Math.pow(Math.max(0, 1 - normT), 0.75);
          awwData[i] += (out1 * 0.66 + out2 * 0.34) * env * (1.2 / voices);
        }
      }
      let maxAww = 0;
      for (let i = 0; i < awwData.length; i++) {
        maxAww = Math.max(maxAww, Math.abs(awwData[i]));
      }
      for (let i = 0; i < awwData.length; i++) {
        awwData[i] = (awwData[i] / (maxAww || 1)) * 0.82;
      }
      this.awwBuffer = awwBuf;
    },

    playCountdownBeep: function (isFinal) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1320 : 980, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.24, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.28 : 0.14));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.3 : 0.16));
    },

    playCurtainFanfare: function () {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const notes = [392.0, 493.88, 587.33, 783.99];
      const now = ctx.currentTime;
      notes.forEach(function (freq, i) {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.085;
        const dur = i === notes.length - 1 ? 0.75 : 0.28;
        osc.type = 'triangle';
        osc2.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc2.frequency.setValueAtTime(freq * 2, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc2.start(start);
        osc.stop(start + dur + 0.02);
        osc2.stop(start + dur + 0.02);
      });
    },

    playDing: function () {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [1046.5, 1567.98, 2093.0].forEach(function (freq, idx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = now + idx * 0.045;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(idx === 2 ? 0.14 : 0.25, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.68);
      });
    },

    playBuzz: function () {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [110, 116.5].forEach(function (freq) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.88, now + 0.42);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
        gain.gain.setValueAtTime(0.16, now + 0.32);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
      });
    },

    playAudienceCheers: function (grandFinale) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      if (this.applauseBuffer) {
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        src.buffer = this.applauseBuffer;
        gain.gain.value = grandFinale ? 0.85 : 0.58;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      }
      if (grandFinale) {
        this.playCurtainFanfare();
      }
    },

    playAudienceAww: function () {
      const ctx = this.ensureContext();
      if (!ctx) return;
      if (this.awwBuffer) {
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        src.buffer = this.awwBuffer;
        gain.gain.value = 0.9;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      }
    },

    speakHost: function (text) {
      if (this.muted || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(function (v) {
            return (
              v.lang.indexOf('en') === 0 &&
              (v.name.indexOf('Google US English') !== -1 ||
                v.name.indexOf('Samantha') !== -1 ||
                v.name.indexOf('Alex') !== -1 ||
                v.name.indexOf('Natural') !== -1)
            );
          }) ||
          voices.find(function (v) {
            return v.lang.indexOf('en') === 0;
          });
        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.04;
        utterance.pitch = 1.08;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (_err) {
        // Ignore if browser speech unavailable
      }
    },
  };

  /* ------------------------------------------------------------------------
     3. Game State
     ------------------------------------------------------------------------ */
  const state = {
    phase: 'TITLE_MENU', // TITLE_MENU | MOVIE_COUNTDOWN | CURTAIN_RISING | PLAYING | VICTORY | DEFEAT
    selectedDuration: 180,
    timeLeft: 180,
    countdownNum: 3,
    wordBank: [],
    actorSlots: {},
    actorImageStage: {}, // 'primary' | 'alt' | 'initials'
    score: 0,
    misses: 0,
    hostLine: 'Place 3 correct films for each actor!',
    selectedTileId: null,
    activeDragTile: null,
    returningTileId: null,
    hoveredSlot: null,
    shakingWrong: null,
    floatingScoreSlot: null,
  };

  let gameTimerInterval = null;
  let countdownTimeout = null;
  let tryAgainTimeout = null;
  let wrongReturnTimeout = null;
  let pointerSession = null;

  /* ------------------------------------------------------------------------
     4. DOM Element References
     ------------------------------------------------------------------------ */
  const els = {};

  function cacheElements() {
    els.valanceBulbs = document.getElementById('valance-bulbs');
    els.hudBulbs = document.getElementById('hud-bulbs');
    els.curtainOverlay = document.getElementById('curtain-overlay');
    els.introMenuCard = document.getElementById('intro-menu-card');
    els.countdownCard = document.getElementById('countdown-card');
    els.countdownNumber = document.getElementById('countdown-number');
    els.risingBanner = document.getElementById('rising-banner');
    els.introMuteBtn = document.getElementById('intro-mute-btn');
    els.hudMuteBtn = document.getElementById('hud-mute-btn');
    els.startShowBtn = document.getElementById('start-show-btn');
    els.skipIntroBtn = document.getElementById('skip-intro-btn');
    els.replayIntroBtn = document.getElementById('replay-intro-btn');
    els.giveUpBtn = document.getElementById('give-up-btn');
    els.hearHostBtn = document.getElementById('hear-host-btn');
    els.hostQuote = document.getElementById('host-quote');
    els.scoreValue = document.getElementById('score-value');
    els.matchedValue = document.getElementById('matched-value');
    els.showstoppersValue = document.getElementById('showstoppers-value');
    els.timerLabel = document.getElementById('timer-label');
    els.timerValue = document.getElementById('timer-value');
    els.navWordBankCount = document.getElementById('nav-wordbank-count');
    els.wordBankCount = document.getElementById('word-bank-count');
    els.wordBankGrid = document.getElementById('word-bank-grid');
    els.actorsGrid = document.getElementById('actors-grid');
    els.tryAgainToast = document.getElementById('try-again-toast');
    els.dragGhost = document.getElementById('drag-ghost');
    els.dragGhostTitle = document.getElementById('drag-ghost-title');
    els.endModal = document.getElementById('end-modal');
    els.endModalTitle = document.getElementById('end-modal-title');
    els.endModalDesc = document.getElementById('end-modal-desc');
    els.finalScoreVal = document.getElementById('final-score-val');
    els.finalMatchedVal = document.getElementById('final-matched-val');
    els.finalAccuracyVal = document.getElementById('final-accuracy-val');
    els.encoreBtn = document.getElementById('encore-btn');
  }

  function initBulbs() {
    let valanceHtml = '';
    for (let i = 0; i < 22; i++) {
      valanceHtml += '<span class="bulb bulb--lg" aria-hidden="true"></span>';
    }
    els.valanceBulbs.innerHTML = valanceHtml;

    let hudHtml = '';
    for (let i = 0; i < 28; i++) {
      hudHtml += '<span class="bulb" aria-hidden="true"></span>';
    }
    els.hudBulbs.innerHTML = hudHtml;
  }

  function resetSlots() {
    state.actorSlots = {};
    ACTORS.forEach(function (actor) {
      state.actorSlots[actor.id] = [null, null, null];
      if (!state.actorImageStage[actor.id]) {
        state.actorImageStage[actor.id] = 'primary';
      }
    });
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------------
     5. Rendering Functions
     ------------------------------------------------------------------------ */
  function renderMuteButtons() {
    els.introMuteBtn.textContent = SoundEngine.muted
      ? 'Sound Muted'
      : 'Sound & Host Voice On';
    els.hudMuteBtn.textContent = SoundEngine.muted ? 'Muted' : 'Audio On';
  }

  function renderOverlay() {
    if (
      state.phase === 'PLAYING' ||
      state.phase === 'VICTORY' ||
      state.phase === 'DEFEAT'
    ) {
      els.curtainOverlay.classList.add('hidden');
      els.curtainOverlay.classList.remove('curtain-overlay--rising');
    } else {
      els.curtainOverlay.classList.remove('hidden');
      if (state.phase === 'CURTAIN_RISING') {
        els.curtainOverlay.classList.add('curtain-overlay--rising');
      } else {
        els.curtainOverlay.classList.remove('curtain-overlay--rising');
      }
    }

    els.introMenuCard.classList.toggle('hidden', state.phase !== 'TITLE_MENU');
    els.countdownCard.classList.toggle('hidden', state.phase !== 'MOVIE_COUNTDOWN');
    els.risingBanner.classList.toggle('hidden', state.phase !== 'CURTAIN_RISING');
    els.countdownNumber.textContent = String(state.countdownNum);
  }

  function renderScoreboard() {
    let totalPlaced = 0;
    let completedActors = 0;
    ACTORS.forEach(function (a) {
      const filled = state.actorSlots[a.id].filter(Boolean).length;
      totalPlaced += filled;
      if (filled === 3) completedActors++;
    });

    els.hostQuote.textContent = '“' + state.hostLine + '”';
    els.scoreValue.textContent = state.score.toLocaleString();
    els.matchedValue.textContent = totalPlaced + '/18';
    els.showstoppersValue.textContent = completedActors + '/6';

    els.timerLabel.textContent = state.timeLeft <= 15 ? 'Final Seconds' : 'Stage Timer';
    els.timerValue.textContent = formatTime(state.timeLeft);
    els.timerValue.className =
      'metric-value tabular-nums ' +
      (state.timeLeft <= 15
        ? 'metric-value--danger'
        : state.timeLeft <= 45
        ? 'metric-value--warn'
        : '');

    els.giveUpBtn.classList.toggle('hidden', state.phase !== 'PLAYING');
    els.navWordBankCount.textContent = 'Word Bank (' + state.wordBank.length + ')';
    els.wordBankCount.textContent = state.wordBank.length + ' left · 6 decoys';
  }

  function renderWordBank() {
    const frag = document.createDocumentFragment();

    state.wordBank.forEach(function (tile) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.tileId = tile.id;

      const isGhosted =
        (state.activeDragTile && state.activeDragTile.id === tile.id) ||
        state.returningTileId === tile.id;
      const isSelected = state.selectedTileId === tile.id;

      btn.className =
        'tile-btn' +
        (isGhosted ? ' tile-btn--ghosted' : '') +
        (isSelected ? ' tile-btn--selected' : '');

      btn.disabled = state.phase !== 'PLAYING' || state.returningTileId === tile.id;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.innerHTML =
        '<span class="tile-grip" aria-hidden="true">⋮⋮</span>' +
        '<span>' +
        escapeHtml(tile.title) +
        '</span>';

      btn.addEventListener('pointerdown', function (e) {
        onTilePointerDown(e, tile);
      });

      frag.appendChild(btn);
    });

    els.wordBankGrid.innerHTML = '';
    els.wordBankGrid.appendChild(frag);
  }

  function renderActors() {
    const frag = document.createDocumentFragment();

    ACTORS.forEach(function (actor) {
      const slots = state.actorSlots[actor.id];
      const filledCount = slots.filter(Boolean).length;
      const isShowstopper = filledCount === 3;
      const isHovered =
        state.hoveredSlot && state.hoveredSlot.actorId === actor.id;

      const section = document.createElement('section');
      section.dataset.actorId = actor.id;
      section.setAttribute(
        'aria-label',
        actor.name + ' column (' + filledCount + ' of 3 placed)'
      );
      section.className =
        'actor-card' +
        (isShowstopper
          ? ' actor-card--showstopper'
          : isHovered
          ? ' actor-card--hovered'
          : '');

      // Compact 64x84 (3:4) Unobstructed Portrait Header
      const header = document.createElement('div');
      header.className = 'actor-header';

      const photoFrame = document.createElement('div');
      photoFrame.className = 'actor-photo-frame';
      const imgStage = state.actorImageStage[actor.id] || 'primary';

      if (imgStage === 'initials') {
        photoFrame.innerHTML =
          '<div class="actor-initials-fallback">' +
          escapeHtml(actor.initials) +
          '</div>';
      } else {
        const img = document.createElement('img');
        img.className = 'actor-photo';
        img.alt = actor.name;
        img.referrerPolicy = 'no-referrer';
        img.src =
          imgStage === 'primary' ? actor.wikimediaUrl : actor.altWikimediaUrl;
        img.addEventListener('error', function () {
          if (state.actorImageStage[actor.id] === 'primary') {
            state.actorImageStage[actor.id] = 'alt';
          } else {
            state.actorImageStage[actor.id] = 'initials';
          }
          renderActors();
        });
        photoFrame.appendChild(img);
      }

      const meta = document.createElement('div');
      meta.className = 'actor-meta';
      meta.innerHTML =
        '<div class="actor-title-row">' +
        '<h2 class="actor-name">' +
        escapeHtml(actor.name) +
        '</h2>' +
        '<span class="actor-progress tabular-nums">' +
        filledCount +
        '/3</span>' +
        '</div>' +
        '<p class="actor-credentials">' +
        escapeHtml(actor.credentials) +
        '</p>' +
        '<div class="actor-status ' +
        (isShowstopper ? 'actor-status--complete' : '') +
        '">' +
        (isShowstopper ? '★ Showstopper Complete!' : 'Drop 3 productions below') +
        '</div>';

      header.appendChild(photoFrame);
      header.appendChild(meta);
      section.appendChild(header);

      // 3 Drop Slots
      const slotsList = document.createElement('div');
      slotsList.className = 'slots-list';

      slots.forEach(function (placedTile, slotIdx) {
        const isShakingHere =
          state.shakingWrong &&
          state.shakingWrong.actorId === actor.id &&
          state.shakingWrong.slotIndex === slotIdx;

        const firstEmptyIdx = slots.findIndex(function (s) {
          return s === null;
        });
        const isDirectHover =
          state.hoveredSlot &&
          state.hoveredSlot.actorId === actor.id &&
          (state.hoveredSlot.slotIndex === slotIdx ||
            (state.hoveredSlot.slotIndex === null &&
              !placedTile &&
              firstEmptyIdx === slotIdx));

        const showScorePop =
          state.floatingScoreSlot &&
          state.floatingScoreSlot.actorId === actor.id &&
          state.floatingScoreSlot.slotIndex === slotIdx;

        if (placedTile) {
          const lockedDiv = document.createElement('div');
          lockedDiv.className = 'slot-locked';
          lockedDiv.dataset.actorId = actor.id;
          lockedDiv.dataset.slotIndex = String(slotIdx);
          lockedDiv.innerHTML =
            '<span>' +
            escapeHtml(placedTile.title) +
            '</span><span aria-label="Correct">✓</span>' +
            (showScorePop ? '<span class="score-float-badge">+100</span>' : '');
          slotsList.appendChild(lockedDiv);
        } else if (isShakingHere) {
          const wrongDiv = document.createElement('div');
          wrongDiv.className = 'slot-wrong';
          wrongDiv.dataset.actorId = actor.id;
          wrongDiv.dataset.slotIndex = String(slotIdx);
          wrongDiv.innerHTML =
            '<span>' +
            escapeHtml(state.shakingWrong.title) +
            '</span><span aria-label="Incorrect">✕</span>';
          slotsList.appendChild(wrongDiv);
        } else {
          const emptyBtn = document.createElement('button');
          emptyBtn.type = 'button';
          emptyBtn.dataset.actorId = actor.id;
          emptyBtn.dataset.slotIndex = String(slotIdx);
          emptyBtn.setAttribute(
            'aria-label',
            actor.name + ' empty slot ' + (slotIdx + 1)
          );
          emptyBtn.className =
            'slot-empty' +
            (isDirectHover
              ? ' slot-empty--hovered'
              : state.selectedTileId
              ? ' slot-empty--selectable'
              : '');

          emptyBtn.textContent = isDirectHover
            ? 'Release to Place'
            : state.selectedTileId
            ? 'Tap to Place in Slot ' + (slotIdx + 1)
            : 'Slot ' + (slotIdx + 1);

          emptyBtn.addEventListener('click', function () {
            if (state.phase === 'PLAYING' && state.selectedTileId) {
              const tile = state.wordBank.find(function (t) {
                return t.id === state.selectedTileId;
              });
              if (tile) attemptPlaceTile(tile, actor.id, slotIdx);
            }
          });
          slotsList.appendChild(emptyBtn);
        }
      });

      section.appendChild(slotsList);
      frag.appendChild(section);
    });

    els.actorsGrid.innerHTML = '';
    els.actorsGrid.appendChild(frag);
  }

  function renderEndModal() {
    const isEnded = state.phase === 'VICTORY' || state.phase === 'DEFEAT';
    els.endModal.classList.toggle('hidden', !isEnded);
    if (!isEnded) return;

    let totalPlaced = 0;
    ACTORS.forEach(function (a) {
      totalPlaced += state.actorSlots[a.id].filter(Boolean).length;
    });
    const attempts = totalPlaced + state.misses;
    const accuracy = attempts > 0 ? Math.round((totalPlaced / attempts) * 100) : 100;

    if (state.phase === 'VICTORY') {
      els.endModalTitle.textContent = 'Standing Ovation! You’re a Showstopper!';
      els.endModalDesc.textContent =
        'The crowd is on its feet! You matched all 18 stage and screen productions across every star.';
    } else {
      els.endModalTitle.textContent = 'Final Curtain — Time’s Up!';
      els.endModalDesc.textContent =
        'The audience sighs “Awww!” — take another bow and match all 18 credits in an encore performance!';
    }

    els.finalScoreVal.textContent = state.score.toLocaleString();
    els.finalMatchedVal.textContent = totalPlaced + '/18';
    els.finalAccuracyVal.textContent = accuracy + '%';
  }

  function renderAll() {
    renderMuteButtons();
    renderOverlay();
    renderScoreboard();
    renderWordBank();
    renderActors();
    renderEndModal();
  }

  /* ------------------------------------------------------------------------
     6. Game Loop, Countdown & Placement Logic
     ------------------------------------------------------------------------ */
  function clearTimers() {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (countdownTimeout) clearTimeout(countdownTimeout);
    if (tryAgainTimeout) clearTimeout(tryAgainTimeout);
    if (wrongReturnTimeout) clearTimeout(wrongReturnTimeout);
    gameTimerInterval = null;
    countdownTimeout = null;
  }

  function startPlayTimer() {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(function () {
      if (state.phase !== 'PLAYING') return;
      state.timeLeft = Math.max(0, state.timeLeft - 1);
      renderScoreboard();

      if (state.timeLeft <= 0) {
        triggerDefeat('Time is up! Ready for an encore?');
      }
    }, 1000);
  }

  function triggerDefeat(message) {
    clearTimers();
    state.phase = 'DEFEAT';
    state.selectedTileId = null;
    state.activeDragTile = null;
    state.hostLine = message;
    els.dragGhost.classList.add('hidden');
    SoundEngine.playAudienceAww();
    renderAll();
  }

  function runCountdownStep() {
    if (state.phase !== 'MOVIE_COUNTDOWN') return;
    renderOverlay();
    SoundEngine.playCountdownBeep(state.countdownNum === 1);

    countdownTimeout = setTimeout(function () {
      if (state.countdownNum > 1) {
        state.countdownNum -= 1;
        runCountdownStep();
      } else {
        launchCurtainRise();
      }
    }, 850);
  }

  function launchCurtainRise() {
    if (countdownTimeout) clearTimeout(countdownTimeout);
    state.phase = 'CURTAIN_RISING';
    renderOverlay();
    SoundEngine.playCurtainFanfare();
    SoundEngine.speakHost('Place 3 correct films for each actor!');

    countdownTimeout = setTimeout(function () {
      state.phase = 'PLAYING';
      renderAll();
      startPlayTimer();
    }, 880);
  }

  function startNewGame(skipCountdown) {
    SoundEngine.unlock();
    clearTimers();

    state.wordBank = createShuffledWordBank();
    resetSlots();
    state.score = 0;
    state.misses = 0;
    state.timeLeft = state.selectedDuration;
    state.selectedTileId = null;
    state.activeDragTile = null;
    state.returningTileId = null;
    state.hoveredSlot = null;
    state.shakingWrong = null;
    state.floatingScoreSlot = null;
    state.hostLine = 'Place 3 correct films for each actor!';
    els.tryAgainToast.classList.add('hidden');
    els.dragGhost.classList.add('hidden');

    if (skipCountdown) {
      renderAll();
      launchCurtainRise();
    } else {
      state.countdownNum = 3;
      state.phase = 'MOVIE_COUNTDOWN';
      renderAll();
      runCountdownStep();
    }
  }

  function attemptPlaceTile(tile, targetActorId, requestedSlotIdx) {
    if (state.phase !== 'PLAYING') return;
    if (state.returningTileId === tile.id) return;

    const currentSlots = state.actorSlots[targetActorId];
    if (!currentSlots) return;

    const slotIndex =
      requestedSlotIdx !== null &&
      requestedSlotIdx !== undefined &&
      currentSlots[requestedSlotIdx] === null
        ? requestedSlotIdx
        : currentSlots.findIndex(function (s) {
            return s === null;
          });

    if (slotIndex === -1) return;

    state.selectedTileId = null;

    if (tile.actorId === targetActorId) {
      // Correct Match: Lock in place with Green Glow + DING + 100 pts
      currentSlots[slotIndex] = tile;
      state.wordBank = state.wordBank.filter(function (t) {
        return t.id !== tile.id;
      });
      state.score += 100;
      state.floatingScoreSlot = { actorId: targetActorId, slotIndex: slotIndex };
      SoundEngine.playDing();

      const actorFilledCount = currentSlots.filter(Boolean).length;
      let allPlacedCount = 0;
      ACTORS.forEach(function (a) {
        allPlacedCount += state.actorSlots[a.id].filter(Boolean).length;
      });

      if (allPlacedCount === 18) {
        clearTimers();
        state.hostLine = 'You’re a showstopper! Standing ovation!';
        SoundEngine.playAudienceCheers(true);
        SoundEngine.speakHost('You’re a showstopper!');
        renderAll();
        setTimeout(function () {
          state.phase = 'VICTORY';
          renderEndModal();
          renderScoreboard();
        }, 550);
      } else if (actorFilledCount === 3) {
        const actorObj = ACTORS.find(function (a) {
          return a.id === targetActorId;
        });
        state.hostLine =
          'You’re a showstopper! ' + (actorObj ? actorObj.name : 'Actor') + ' complete!';
        SoundEngine.playAudienceCheers(false);
        SoundEngine.speakHost('You’re a showstopper!');
        renderAll();
      } else {
        state.hostLine = 'Correct! +100 points for "' + tile.title + '"!';
        renderAll();
      }
    } else {
      // Wrong Actor or Decoy: Shake Red + BUZZ + "TRY AGAIN!" Popup -> Return to Word Bank
      state.misses += 1;
      state.returningTileId = tile.id;
      state.shakingWrong = {
        actorId: targetActorId,
        slotIndex: slotIndex,
        title: tile.title,
      };
      state.hostLine = 'Buzz! Try again — check Broadway & film credits!';

      SoundEngine.playBuzz();

      els.tryAgainToast.classList.remove('hidden');
      els.tryAgainToast.style.animation = 'none';
      void els.tryAgainToast.offsetWidth;
      els.tryAgainToast.style.animation = '';

      renderAll();

      if (tryAgainTimeout) clearTimeout(tryAgainTimeout);
      tryAgainTimeout = setTimeout(function () {
        els.tryAgainToast.classList.add('hidden');
      }, 1350);

      if (wrongReturnTimeout) clearTimeout(wrongReturnTimeout);
      wrongReturnTimeout = setTimeout(function () {
        state.shakingWrong = null;
        state.returningTileId = null;
        renderWordBank();
        renderActors();
      }, 620);
    }
  }

  /* ------------------------------------------------------------------------
     7. Unified Desktop & Mobile Pointer Drag-and-Drop
     ------------------------------------------------------------------------ */
  function findDropTargetAtPoint(clientX, clientY) {
    const elements = document.elementsFromPoint(clientX, clientY);
    let foundSlotIdx = null;
    let foundActorId = null;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!(el instanceof HTMLElement)) continue;
      if (foundSlotIdx === null && el.dataset.slotIndex !== undefined) {
        const parsed = parseInt(el.dataset.slotIndex, 10);
        if (!Number.isNaN(parsed)) foundSlotIdx = parsed;
      }
      if (el.dataset.actorId) {
        foundActorId = el.dataset.actorId;
        break;
      }
    }

    if (!foundActorId) return null;
    const hasEmpty = state.actorSlots[foundActorId].some(function (s) {
      return s === null;
    });
    if (!hasEmpty) return null;

    return { actorId: foundActorId, slotIndex: foundSlotIdx };
  }

  function moveGhost(clientX, clientY) {
    els.dragGhost.style.transform =
      'translate3d(' +
      Math.round(clientX - 96) +
      'px, ' +
      Math.round(clientY - 22) +
      'px, 0)';
  }

  function onTilePointerDown(e, tile) {
    if (state.phase !== 'PLAYING' || state.returningTileId === tile.id) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    SoundEngine.unlock();
    pointerSession = {
      tile: tile,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
    };
  }

  function bindGlobalPointerEvents() {
    window.addEventListener(
      'pointermove',
      function (e) {
        if (!pointerSession || e.pointerId !== pointerSession.pointerId) return;

        const dx = e.clientX - pointerSession.startX;
        const dy = e.clientY - pointerSession.startY;

        if (!pointerSession.isDragging && Math.hypot(dx, dy) > 6) {
          pointerSession.isDragging = true;
          state.activeDragTile = pointerSession.tile;
          state.selectedTileId = null;
          els.dragGhostTitle.textContent = pointerSession.tile.title;
          els.dragGhost.classList.remove('hidden');
          renderWordBank();
          renderActors();
        }

        if (pointerSession.isDragging) {
          e.preventDefault();
          moveGhost(e.clientX, e.clientY);

          if (e.clientY < 70) {
            window.scrollBy(0, -10);
          } else if (e.clientY > window.innerHeight - 70) {
            window.scrollBy(0, 10);
          }

          const hit = findDropTargetAtPoint(e.clientX, e.clientY);
          const prev = state.hoveredSlot;
          const changed =
            (prev ? prev.actorId : null) !== (hit ? hit.actorId : null) ||
            (prev ? prev.slotIndex : null) !== (hit ? hit.slotIndex : null);

          if (changed) {
            state.hoveredSlot = hit;
            renderActors();
          }
        }
      },
      { passive: false }
    );

    function finishPointer(e) {
      if (!pointerSession || e.pointerId !== pointerSession.pointerId) return;
      const session = pointerSession;
      pointerSession = null;

      if (session.isDragging) {
        const hit =
          e.type === 'pointerup'
            ? findDropTargetAtPoint(e.clientX, e.clientY)
            : null;
        state.activeDragTile = null;
        state.hoveredSlot = null;
        els.dragGhost.classList.add('hidden');

        if (hit) {
          attemptPlaceTile(session.tile, hit.actorId, hit.slotIndex);
        } else {
          renderWordBank();
          renderActors();
        }
      } else if (e.type === 'pointerup') {
        state.selectedTileId =
          state.selectedTileId === session.tile.id ? null : session.tile.id;
        renderWordBank();
        renderActors();
      }
    }

    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.selectedTileId) {
        state.selectedTileId = null;
        renderWordBank();
        renderActors();
      }
    });
  }

  /* ------------------------------------------------------------------------
     8. Initialization
     ------------------------------------------------------------------------ */
  function init() {
    cacheElements();
    initBulbs();
    state.wordBank = createShuffledWordBank();
    resetSlots();
    bindGlobalPointerEvents();

    const durBtns = document.querySelectorAll('[data-duration]');
    durBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const secs = parseInt(btn.getAttribute('data-duration'), 10);
        state.selectedDuration = secs;
        state.timeLeft = secs;
        durBtns.forEach(function (b) {
          b.classList.toggle('duration-btn--active', b === btn);
        });
        renderScoreboard();
      });
    });

    function toggleMute() {
      SoundEngine.muted = !SoundEngine.muted;
      if (SoundEngine.muted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      renderMuteButtons();
    }
    els.introMuteBtn.addEventListener('click', toggleMute);
    els.hudMuteBtn.addEventListener('click', toggleMute);

    els.startShowBtn.addEventListener('click', function () {
      startNewGame(false);
    });
    els.skipIntroBtn.addEventListener('click', function () {
      startNewGame(true);
    });
    els.replayIntroBtn.addEventListener('click', function () {
      startNewGame(false);
    });
    els.encoreBtn.addEventListener('click', function () {
      startNewGame(true);
    });
    els.giveUpBtn.addEventListener('click', function () {
      if (state.phase === 'PLAYING') {
        triggerDefeat('Curtain call! Give it another shot in the encore!');
      }
    });
    els.hearHostBtn.addEventListener('click', function () {
      SoundEngine.unlock();
      SoundEngine.speakHost(state.hostLine);
    });

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
