class SpiritAudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.filter = null;
    this.pianoTimer = null;
    this.pianoMasterGain = null;
  }

  start() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Warm ambient sub-bass drone
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(54, now);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(55.6, now);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(95, now);
      this.filter.Q.setValueAtTime(1.0, now);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.0001, now);
      this.droneGain.gain.linearRampToValueAtTime(0.042, now + 3);

      this.droneOsc1.connect(this.filter);
      this.droneOsc2.connect(this.filter);
      this.filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Master bus for dim haunted felt piano
      this.pianoMasterGain = this.ctx.createGain();
      this.pianoMasterGain.gain.setValueAtTime(0.035, now);
      this.pianoMasterGain.connect(this.ctx.destination);

      this.initialized = true;
      this.startHauntedPianoLoop();
    } catch (err) {}
  }

  playHauntedPianoNote(freq, velocity = 0.5) {
    if (!this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const oscFundamental = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const feltFilter = this.ctx.createBiquadFilter();

      oscFundamental.type = 'triangle';
      oscFundamental.frequency.setValueAtTime(freq, now);

      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2.003, now);

      feltFilter.type = 'lowpass';
      feltFilter.frequency.setValueAtTime(1400 * velocity, now);
      feltFilter.frequency.exponentialRampToValueAtTime(280, now + 0.45);
      feltFilter.Q.setValueAtTime(2.0, now);

      const decayTime = 2.8 + Math.random() * 1.4;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.065 * velocity, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      oscFundamental.connect(feltFilter);
      oscHarmonic.connect(feltFilter);
      feltFilter.connect(noteGain);
      noteGain.connect(this.pianoMasterGain);

      oscFundamental.start(now);
      oscHarmonic.start(now);
      oscFundamental.stop(now + decayTime + 0.1);
      oscHarmonic.stop(now + decayTime + 0.1);
    } catch (e) {}
  }

  startHauntedPianoLoop() {
    const hauntedNotes = [
      146.83, 174.61, 220.00, 277.18, 293.66, 329.63, 349.23, 415.30, 440.00, 523.25, 554.37
    ];

    const playNextDimPhrase = () => {
      if (!this.initialized || !this.ctx) return;
      const base = hauntedNotes[Math.floor(Math.random() * hauntedNotes.length)];
      const velocity = 0.32 + Math.random() * 0.35;
      this.playHauntedPianoNote(base, velocity);

      if (Math.random() > 0.45) {
        setTimeout(() => {
          const harmony = hauntedNotes[Math.floor(Math.random() * hauntedNotes.length)];
          this.playHauntedPianoNote(harmony, velocity * 0.7);
        }, 280 + Math.random() * 320);
      }

      const nextInterval = 2300 + Math.random() * 2500;
      this.pianoTimer = setTimeout(playNextDimPhrase, nextInterval);
    };

    this.pianoTimer = setTimeout(playNextDimPhrase, 1000);
  }

  playSnuffSound() {
    if (!this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.18;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * Math.pow(envelope, 1.8);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playReigniteSound() {
    if (!this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const strikeDur = 0.08;
      const strikeSize = Math.floor(this.ctx.sampleRate * strikeDur);
      const strikeBuf = this.ctx.createBuffer(1, strikeSize, this.ctx.sampleRate);
      const data = strikeBuf.getChannelData(0);

      for (let i = 0; i < strikeSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (strikeSize * 0.4));
      }

      const strike = this.ctx.createBufferSource();
      strike.buffer = strikeBuf;

      const strikeFilter = this.ctx.createBiquadFilter();
      strikeFilter.type = 'bandpass';
      strikeFilter.frequency.setValueAtTime(1350, now);
      strikeFilter.Q.setValueAtTime(1.8, now);

      const strikeGain = this.ctx.createGain();
      strikeGain.gain.setValueAtTime(0.04, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + strikeDur);

      strike.connect(strikeFilter);
      strikeFilter.connect(strikeGain);
      strikeGain.connect(this.ctx.destination);
      strike.start(now);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135, now + 0.03);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.setValueAtTime(0.032, now + 0.04);
      oscGain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now + 0.03);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playSlideFriction() {
    if (!this.ctx || !this.initialized) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.55));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(240 + Math.random() * 110, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.026, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  playQuillScratch() {
    if (!this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.09;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playLetterChime(char) {
    if (!this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 260;
      const charCode = (typeof char === 'string' && char.length > 0) ? char.charCodeAt(0) : 65;
      const offset = (charCode % 24) * 12;
      const freq = baseFreq + offset;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, now + 0.45);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  playWaxBreakSound() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    try {
      const now = this.ctx.currentTime;
      const snapDur = 0.15;
      const snapSize = Math.floor(this.ctx.sampleRate * snapDur);
      const snapBuf = this.ctx.createBuffer(1, snapSize, this.ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapSize; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapSize * 0.15));
      }

      const snap = this.ctx.createBufferSource();
      snap.buffer = snapBuf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + snapDur);

      snap.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      snap.start(now);

      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(105, now);
      bell.frequency.exponentialRampToValueAtTime(52, now + 2.5);

      bellGain.gain.setValueAtTime(0.075, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);
      bell.start(now);
      bell.stop(now + 2.5);
    } catch (e) {}
  }

  adjustDroneForDarkness(isAllDark) {
    if (!this.ctx || !this.initialized || !this.droneGain || !this.filter) return;
    const now = this.ctx.currentTime;
    if (isAllDark) {
      this.droneGain.gain.linearRampToValueAtTime(0.038, now + 1.2);
      this.filter.frequency.linearRampToValueAtTime(75, now + 1.2);
      if (this.pianoMasterGain) {
        this.pianoMasterGain.gain.linearRampToValueAtTime(0.022, now + 1.2);
      }
    } else {
      this.droneGain.gain.linearRampToValueAtTime(0.042, now + 0.8);
      this.filter.frequency.linearRampToValueAtTime(95, now + 0.8);
      if (this.pianoMasterGain) {
        this.pianoMasterGain.gain.linearRampToValueAtTime(0.035, now + 0.8);
      }
    }
  }
}

const spiritAudio = new SpiritAudioEngine();

class SpiritBrain {
  constructor() {
    this.keywordResponses = {
      "who": ["THE FORGOTTEN", "ONE WHO WAITS", "YOUR SHADOW", "HE WHO DROWNED", "A SISTER UNNAMED", "THE SLEEPLESS"],
      "where": ["BEHIND YOU", "UNDER THE BOARDS", "IN THE MIRROR", "IN THE COLD ROOM", "AT THY THRESHOLD"],
      "when": ["AT MIDNIGHT", "TOO LATE", "WHEN CANDLES DIE", "BEFORE SUNRISE", "SOON"],
      "die": ["ALL DUST RETURN", "THE COLD GRIP", "IT HURTS LESS", "SOONER THAN EXPECTED"],
      "death": ["JUST A VEIL", "THE SLEEP WITHOUT DREAMS", "WE ALL SHARE IT", "AN OPEN DOOR"],
      "love": ["FORGOTTEN TEARS", "A COLD EMBRACE", "ASHES OF ROSES"],
      "alone": ["NEVER ALONE", "TURN AROUND", "WE WATCH ALWAYS"],
      "name": ["MALACHI", "EZEKIEL", "SARAH", "ABIGAIL", "THOMAS", "CORVUS"],
      "help": ["NO ESCAPE", "LOOK BEHIND", "BE STILL"],
      "fear": ["WE SMELL IT", "IT FEEDS US", "CLOSE THY EYES"],
      "ghost": ["WE ARE SHADOWS", "THE DRIFTING ONES", "MEMORIES WITH TEETH"]
    };

    this.yesNoQuestions = ["am i", "is there", "will i", "can i", "are you", "should i", "do you", "did you", "is it", "shall i"];
    this.generalAnswers = ["NOT ALONE", "BEHIND YOU", "LOOK CLOSER", "HE WATCHES", "DO NOT SLEEP", "COLD HANDS", "BURIED DEEP", "IT COMMENCES", "TOO LATE"];
  }

  consultOracle(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    if (query === "goodbye" || query === "bye" || query.includes("farewell")) {
      return "GOODBYE";
    }
    for (const [key, answers] of Object.entries(this.keywordResponses)) {
      if (query.includes(key)) {
        return answers[Math.floor(Math.random() * answers.length)];
      }
    }
    const isYesNo = this.yesNoQuestions.some(prefix => query.startsWith(prefix));
    if (isYesNo) {
      const outcomes = ["YES", "NO", "NEVER", "ALWAYS", "DOUBTFUL"];
      return outcomes[Math.floor(Math.random() * outcomes.length)];
    }
    return this.generalAnswers[Math.floor(Math.random() * this.generalAnswers.length)];
  }
}

const spiritBrain = new SpiritBrain();

class OuijaParlor {
  constructor() {
    this.covenantModal = document.getElementById('covenantModal');
    this.covenantCheck = document.getElementById('covenantCheck');
    this.breakSealBtn = document.getElementById('breakSealBtn');
    this.breakSealText = document.getElementById('breakSealText');

    this.boardContainer = document.getElementById('boardContainer');
    this.planchette = document.getElementById('planchette');
    this.questionInput = document.getElementById('questionInput');
    this.inquireBtn = document.getElementById('inquireBtn');
    this.manifestedArea = document.getElementById('manifestedArea');
    this.manifestedAnswer = document.getElementById('manifestedAnswer');
    this.manifestedLabel = document.getElementById('manifestedLabel');
    this.shadowDarkness = document.getElementById('shadowDarkness');

    this.candleLeft = document.getElementById('candleLeft');
    this.candleRight = document.getElementById('candleRight');
    this.candleLeftFlame = document.getElementById('candleLeftFlame');
    this.candleRightFlame = document.getElementById('candleRightFlame');
    this.candleLeftSmoke = document.getElementById('candleLeftSmoke');
    this.candleRightSmoke = document.getElementById('candleRightSmoke');
    this.candleLeftEmber = document.getElementById('candleLeftEmber');
    this.candleRightEmber = document.getElementById('candleRightEmber');

    this.currentPos = { x: 0, y: 0 };
    this.leftLit = true;
    this.rightLit = true;
    this.isChanneling = false;

    this.init();
  }

  init() {
    this.setupDisclaimerGate();
    this.setupCandleInteraction();
    this.setupAirDrafts();
    this.setupInquiry();
    this.initEmberCanvas();
    this.centerPlanchetteHome(false);

    window.addEventListener('mousemove', (e) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${xPercent}%`);
      document.documentElement.style.setProperty('--mouse-y', `${yPercent}%`);
    });

    window.addEventListener('resize', () => {
      if (!this.isChanneling) {
        this.centerPlanchetteHome(false);
      }
    });
  }

  setupDisclaimerGate() {
    this.covenantCheck.addEventListener('change', () => {
      if (this.covenantCheck.checked) {
        this.breakSealBtn.disabled = false;
        this.breakSealText.textContent = "Break Seal & Enter at Thine Own Peril";
      } else {
        this.breakSealBtn.disabled = true;
        this.breakSealText.textContent = "Confirm Affidavit Above";
      }
    });

    this.breakSealBtn.addEventListener('click', () => {
      if (!this.covenantCheck.checked) return;

      spiritAudio.playWaxBreakSound();
      spiritAudio.start();

      this.covenantModal.classList.add('dissolve');

      setTimeout(() => {
        this.covenantModal.style.display = 'none';
        this.questionInput.focus();
      }, 1300);
    });
  }

  setupCandleInteraction() {
    this.candleLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      spiritAudio.start();
      this.leftLit = !this.leftLit;
      this.updateCandle('left', this.leftLit);
    });

    this.candleRight.addEventListener('click', (e) => {
      e.stopPropagation();
      spiritAudio.start();
      this.rightLit = !this.rightLit;
      this.updateCandle('right', this.rightLit);
    });
  }

  setupAirDrafts() {
    let lastX = 0, lastTime = performance.now();
    let leftTilt = 0, rightTilt = 0;

    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const vx = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTime = now;

      if (!this.candleLeft || !this.candleRight) return;

      const rectL = this.candleLeft.getBoundingClientRect();
      const cLx = rectL.left + rectL.width / 2;
      const cLy = rectL.top + rectL.height / 2;
      const distL = Math.hypot(e.clientX - cLx, e.clientY - cLy);

      const rectR = this.candleRight.getBoundingClientRect();
      const cRx = rectR.left + rectR.width / 2;
      const cRy = rectR.top + rectR.height / 2;
      const distR = Math.hypot(e.clientX - cRx, e.clientY - cRy);

      if (distL < 280) {
        const inf = Math.max(0, 1 - distL / 280);
        leftTilt = Math.max(-11, Math.min(11, leftTilt + vx * 2.8 * inf));
      }
      if (distR < 280) {
        const inf = Math.max(0, 1 - distR / 280);
        rightTilt = Math.max(-11, Math.min(11, rightTilt + vx * 2.8 * inf));
      }
    });

    const updateDrafts = () => {
      leftTilt *= 0.93;
      rightTilt *= 0.93;
      if (Math.abs(leftTilt) < 0.05) leftTilt = 0;
      if (Math.abs(rightTilt) < 0.05) rightTilt = 0;

      document.documentElement.style.setProperty('--candle-left-tilt', `${leftTilt.toFixed(2)}deg`);
      document.documentElement.style.setProperty('--candle-right-tilt', `${rightTilt.toFixed(2)}deg`);

      requestAnimationFrame(updateDrafts);
    };
    updateDrafts();
  }

  updateCandle(which, isLit) {
    const flame = which === 'left' ? this.candleLeftFlame : this.candleRightFlame;
    const smoke = which === 'left' ? this.candleLeftSmoke : this.candleRightSmoke;
    const ember = which === 'left' ? this.candleLeftEmber : this.candleRightEmber;
    const candleStand = which === 'left' ? this.candleLeft : this.candleRight;
    const cssVar = which === 'left' ? '--candle-left-lit' : '--candle-right-lit';

    if (isLit) {
      candleStand.classList.remove('is-unlit');
      flame.classList.remove('hidden');
      if (smoke) {
        smoke.classList.add('hidden');
      }
      if (ember) {
        ember.classList.remove('dying-ember');
      }
      document.documentElement.style.setProperty(cssVar, '1');
      spiritAudio.playReigniteSound();
    } else {
      candleStand.classList.add('is-unlit');
      flame.classList.add('hidden');
      if (smoke) {
        smoke.classList.remove('hidden');
        const trails = smoke.querySelectorAll('.smoke-trail');
        trails.forEach((trail) => {
          trail.style.animation = 'none';
          trail.offsetHeight;
          trail.style.animation = '';
        });
      }
      if (ember) {
        ember.classList.remove('dying-ember');
        ember.offsetHeight;
        ember.classList.add('dying-ember');
      }
      document.documentElement.style.setProperty(cssVar, '0');
      spiritAudio.playSnuffSound();

      setTimeout(() => {
        if (!((which === 'left' && this.leftLit) || (which === 'right' && this.rightLit))) {
          if (smoke) smoke.classList.add('hidden');
        }
      }, 2700);
    }

    const bothDead = (!this.leftLit && !this.rightLit);
    if (bothDead) {
      this.shadowDarkness.classList.add('active');
      spiritAudio.adjustDroneForDarkness(true);
    } else {
      this.shadowDarkness.classList.remove('active');
      spiritAudio.adjustDroneForDarkness(false);
    }
  }

  setupInquiry() {
    const submitQuestion = () => this.handleChannelRequest();
    this.inquireBtn.addEventListener('click', submitQuestion);
    this.questionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitQuestion();
      }
    });
  }

  centerPlanchetteHome(smooth = true) {
    const homeNode = document.getElementById('node-HOME');
    if (!homeNode) return;
    this.movePlanchetteToElement(homeNode, smooth);
  }

  /* Exact Coordinate Extraction & Physics-Based Trajectory Glide */
  movePlanchetteToElement(targetEl, smooth = true) {
    if (!targetEl) return;
    
    const boardRect = this.boardContainer.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Exact pixel center coordinates of targeted letter relative to board
    const destX = (targetRect.left + targetRect.width / 2) - boardRect.left;
    const destY = (targetRect.top + targetRect.height / 2) - boardRect.top;

    // Dynamic Physics: Calculate movement vector (deltaX, deltaY) to determine realistic drag tilt
    const deltaX = destX - this.currentPos.x;
    const deltaY = destY - this.currentPos.y;
    
    let dragTilt = (deltaX * 0.05);
    dragTilt = Math.max(-11, Math.min(11, dragTilt));
    const naturalJitter = (Math.random() * 3 - 1.5);
    const finalAngle = dragTilt + naturalJitter;

    if (smooth) {
      this.planchette.style.transition = 'left 0.85s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.85s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.85s ease-out';
    } else {
      this.planchette.style.transition = 'none';
    }

    // Apply coordinates (margin-top: -72px & margin-left: -45px align lens center exactly over destX, destY)
    this.planchette.style.left = `${destX}px`;
    this.planchette.style.top = `${destY}px`;
    this.planchette.style.transform = `rotate(${finalAngle}deg)`;

    this.currentPos = { x: destX, y: destY };
    spiritAudio.playSlideFriction();
  }

  async handleChannelRequest() {
    const question = this.questionInput.value.trim();
    if (!question || this.isChanneling) return;

    this.isChanneling = true;
    this.questionInput.disabled = true;
    this.inquireBtn.disabled = true;

    spiritAudio.start();

    this.manifestedLabel.textContent = "Communing with the ether...";
    this.manifestedAnswer.innerHTML = '';

    const answer = spiritBrain.consultOracle(question);

    // Pre-travel agitation shiver
    for (let i = 0; i < 3; i++) {
      const angle = (Math.random() * 6 - 3);
      this.planchette.style.transform = `scale(1.02) rotate(${angle}deg)`;
      spiritAudio.playSlideFriction();
      await this.delay(120);
    }
    await this.delay(300);

    await this.spellOutSequence(answer);
    await this.concludeSession(answer);
  }

  /* Target Identification, Trajectory Glide, and Synchronized Real-Time Inking */
  async spellOutSequence(response) {
    const glideDuration = 850;
    let tokens = [];
    const upper = response.toUpperCase().trim();

    if (upper === 'YES' || upper === 'NO' || upper === 'GOODBYE') {
      tokens = [upper];
    } else {
      tokens = upper.split('');
    }

    for (let i = 0; i < tokens.length; i++) {
      const char = tokens[i];

      if (char === ' ') {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'w-2.5 inline-block';
        this.manifestedAnswer.appendChild(spaceSpan);
        await this.delay(glideDuration * 0.5);
        continue;
      }

      // Target Identification by explicit node ID (#node-A, #node-YES, etc.)
      let targetEl = document.getElementById(`node-${char}`);
      if (!targetEl && /^[A-Z0-9]$/.test(char)) {
        targetEl = document.querySelector(`[data-char="${char}"]`);
      }

      if (targetEl) {
        // Smooth Trajectory Glide with drag physics
        this.movePlanchetteToElement(targetEl, true);

        // Wait for planchette travel animation to complete
        await this.delay(glideDuration);

        // Letter Highlight: Add .active to pulse and scale character with vivid crimson glow
        targetEl.classList.add('active');
        spiritAudio.playLetterChime(char);

        // Real-Time Parchment Inking: Bloom letter into calling slip
        const letterSpan = document.createElement('span');
        letterSpan.className = 'bloomed-letter';
        letterSpan.textContent = char;
        this.manifestedAnswer.appendChild(letterSpan);
        spiritAudio.playQuillScratch();

        // Hold illumination for 1.15 seconds so user can clearly see through the viewing glass
        await this.delay(1150);

        targetEl.classList.remove('active');
        await this.delay(180);
      } else {
        await this.delay(glideDuration * 0.4);
      }
    }

    await this.delay(glideDuration * 0.7);

    // Glide planchette to GOODBYE node to seal communion
    const goodbyeTarget = document.getElementById('node-GOODBYE');
    if (goodbyeTarget && upper !== 'GOODBYE') {
      this.movePlanchetteToElement(goodbyeTarget, true);
      await this.delay(glideDuration);
      goodbyeTarget.classList.add('active');
      spiritAudio.playLetterChime('G');
      await this.delay(1150);
      goodbyeTarget.classList.remove('active');
      await this.delay(280);
    }
  }

  async concludeSession(answer) {
    this.centerPlanchetteHome(true);
    await this.delay(650);

    this.manifestedLabel.textContent = "The ether hath spoken";

    // Re-enable question line for subsequent inquiries
    this.questionInput.disabled = false;
    this.inquireBtn.disabled = false;
    this.questionInput.value = '';
    this.questionInput.placeholder = "Inquire once more of the ether...";
    this.questionInput.focus();

    this.isChanneling = false;
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  initEmberCanvas() {
    const canvas = document.getElementById('emberCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particleCount = 28;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.3,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: Math.random() * 0.2 - 0.1,
        opacity: Math.random() * 0.6 + 0.15,
        fadeSpeed: Math.random() * 0.005 + 0.002,
        color: Math.random() > 0.4 ? 'rgba(210, 130, 45,' : 'rgba(180, 65, 20,'
      });
    }

    const renderEmbers = () => {
      ctx.clearRect(0, 0, width, height);

      const anyCandleLit = (this.leftLit || this.rightLit);
      const flickerVariance = anyCandleLit ? (1 + Math.sin(Date.now() * 0.015) * 0.07 + Math.random() * 0.04) : 0.04;
      document.documentElement.style.setProperty('--flicker-int', flickerVariance.toString());

      for (let p of particles) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.12;
        p.opacity -= p.fadeSpeed;

        if (p.opacity <= 0 || p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.opacity = Math.random() * 0.7 + 0.15;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity * (anyCandleLit ? 1 : 0.05)})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(210, 90, 20, 0.3)';
        ctx.fill();
      }

      requestAnimationFrame(renderEmbers);
    };

    renderEmbers();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new OuijaParlor();
});
