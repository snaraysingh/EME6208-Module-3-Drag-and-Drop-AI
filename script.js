const MAX_ITEMS_PER_BOX = 3;
const ROUND_SECONDS = 120;
const HOST_LINE = "Place 3 correct film or theater production for each actor!";

let draggedItem = null;
let audioCtx = null;
let score = 0;
let lockedCount = 0;
let timeLeft = ROUND_SECONDS;
let timerInterval = null;
let gameEnded = false;
let tryAgainTimeout = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playDing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [1046.5, 1567.98, 2093].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(i === 0 ? 0.16 : 0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55 - i * 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  });
}

function playBuzzer() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [110, 116.5].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  });
}

function playApplause() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 3.0;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const noise = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  for (let c = 0; c < 65; c++) {
    const offset = Math.random() * (dur - 0.2);
    const t = now + offset;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1000 + Math.random() * 1400, t);
    bp.Q.setValueAtTime(2.2, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(t, offset, 0.07);
  }
}

function playTimesUpAndAww() {
  const ctx = getAudioCtx();
  if (ctx) {
    const now = ctx.currentTime;
    [0, 0.22].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 220 : 185, now + offset);
      g.gain.setValueAtTime(0.001, now + offset);
      g.gain.linearRampToValueAtTime(0.1, now + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.38);
    });
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Time's up! Awww!");
    u.rate = 0.94;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  }
}

function speakHostVoice() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(HOST_LINE);
  utterance.rate = 1.04;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return m + ':' + s;
}

function updateHUD() {
  const wordBank = document.getElementById('allItems');
  document.getElementById('remainingCount').textContent = String(
    wordBank.querySelectorAll('li').length
  );
  document.getElementById('scoreValue').textContent = String(score);
  document.getElementById('lockedValue').textContent = lockedCount + ' / 18';
  const timerEl = document.getElementById('timerValue');
  timerEl.textContent = formatTime(timeLeft);
  timerEl.classList.toggle('low-time', timeLeft <= 20);
}

function showTryAgainPopup() {
  const popup = document.getElementById('tryAgainPopup');
  popup.hidden = false;
  if (tryAgainTimeout) clearTimeout(tryAgainTimeout);
  tryAgainTimeout = setTimeout(() => {
    popup.hidden = true;
  }, 1100);
}

function closeCurtains(won) {
  gameEnded = true;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (won) {
    playApplause();
    document.getElementById('finaleTitle').textContent = 'Standing Ovation!';
    document.getElementById('finaleSubtitle').textContent =
      'All 18 film and theater productions matched!';
  } else {
    playTimesUpAndAww();
    document.getElementById('finaleTitle').textContent = "Time's Up!";
    document.getElementById('finaleSubtitle').textContent =
      'The audience sighs "Awww!" as the curtains close.';
  }

  document.getElementById('finalScoreNumber').textContent = String(score) + ' PTS';
  const curtainStage = document.getElementById('curtainStage');
  curtainStage.classList.add('closed');
  document.getElementById('finaleCard').hidden = false;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameEnded) return;
    timeLeft = Math.max(0, timeLeft - 1);
    updateHUD();
    if (timeLeft === 0) {
      closeCurtains(false);
    }
  }, 1000);
}

function shuffleWordBank() {
  const wordBank = document.getElementById('allItems');
  const items = Array.from(
    document.querySelectorAll('#dhtmlgoodies_dragDropContainer li')
  );
  for (let i = items.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [items[i], items[r]] = [items[r], items[i]];
  }
  items.forEach((li) => {
    li.className = '';
    li.setAttribute('draggable', 'true');
    wordBank.appendChild(li);
  });
}

function setupDropZone(ulElement) {
  const wrapperBox = ulElement.parentElement;

  wrapperBox.addEventListener('dragover', (event) => {
    if (gameEnded || !draggedItem || ulElement.id === 'allItems') return;
    if (ulElement.querySelectorAll('li').length < MAX_ITEMS_PER_BOX) {
      event.preventDefault();
      wrapperBox.classList.add('mouseover');
    }
  });

  wrapperBox.addEventListener('dragleave', (event) => {
    if (!wrapperBox.contains(event.relatedTarget)) {
      wrapperBox.classList.remove('mouseover');
    }
  });

  wrapperBox.addEventListener('drop', (event) => {
    event.preventDefault();
    wrapperBox.classList.remove('mouseover');
    if (gameEnded || !draggedItem || ulElement.id === 'allItems') return;
    if (ulElement.querySelectorAll('li').length >= MAX_ITEMS_PER_BOX) return;

    const item = draggedItem;
    const expectedBoxId = item.getAttribute('data-groupid');

    if (expectedBoxId === ulElement.id) {
      ulElement.appendChild(item);
      item.className = 'correctAnswer';
      item.setAttribute('draggable', 'false');
      score += 100;
      lockedCount += 1;
      playDing();
      updateHUD();
      if (lockedCount === 18) {
        setTimeout(() => closeCurtains(true), 500);
      }
    } else {
      ulElement.appendChild(item);
      item.className = 'wrongAnswer';
      playBuzzer();
      showTryAgainPopup();
      setTimeout(() => {
        item.className = '';
        document.getElementById('allItems').appendChild(item);
        updateHUD();
      }, 550);
    }
  });
}

function resetEncore() {
  gameEnded = false;
  score = 0;
  lockedCount = 0;
  timeLeft = ROUND_SECONDS;
  document.getElementById('curtainStage').classList.remove('closed');
  document.getElementById('finaleCard').hidden = true;
  document.getElementById('tryAgainPopup').hidden = true;
  shuffleWordBank();
  updateHUD();
  startTimer();
  speakHostVoice();
}

function populateMarqueeBulbs() {
  ['topBulbs', 'bottomBulbs'].forEach((id) => {
    const row = document.getElementById(id);
    if (!row) return;
    row.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const bulb = document.createElement('span');
      bulb.className = 'bulb';
      row.appendChild(bulb);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  populateMarqueeBulbs();
  document.querySelectorAll('#dhtmlgoodies_dragDropContainer li').forEach((li) => {
    li.addEventListener('dragstart', (e) => {
      if (gameEnded || li.classList.contains('correctAnswer')) {
        e.preventDefault();
        return;
      }
      draggedItem = li;
      e.dataTransfer.setData('text/plain', li.id);
    });
    li.addEventListener('dragend', () => {
      draggedItem = null;
      document
        .querySelectorAll('.mouseover')
        .forEach((b) => b.classList.remove('mouseover'));
    });
  });

  document
    .querySelectorAll('#dhtmlgoodies_mainContainer ul')
    .forEach((ul) => setupDropZone(ul));

  document.getElementById('speakHostBtn').addEventListener('click', speakHostVoice);
  document.getElementById('resetBtn').addEventListener('click', resetEncore);
  document.getElementById('encoreBtn').addEventListener('click', resetEncore);

  shuffleWordBank();
  updateHUD();
  startTimer();
});
