// ========== Audio System for 十面埋伏 ==========
// All sounds generated with Web Audio API (no external files)

const AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicPlaying = false;
  let musicNodes = [];
  let ninjaHasShouted = false;
  let arrowSfxPool = 0;
  let bladeSfxPool = 0;
  const MAX_CONCURRENT_SFX = 4;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.25;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.6;
      sfxGain.connect(masterGain);
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ===== Pentatonic scale: C4 D4 E4 G4 A4 (宫商角徵羽) =====
  const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00];
  const PENTA_HI = [523.25, 587.33, 659.25, 783.99, 880.00];
  const PENTA_LO = [130.81, 146.83, 164.81, 196.00, 220.00];

  // ===== Flute-like tone (箫/笛子) =====
  function playFlute(freq, startTime, duration, vol) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Add slight vibrato for bamboo flute feel
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5 + Math.random() * 2;
    vibratoGain.gain.value = freq * 0.008;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(startTime);
    vibrato.stop(startTime + duration);

    // Breath noise
    const noise = ctx.createBufferSource();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    noise.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq * 2;
    noiseFilter.Q.value = 3;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.gain.value = vol * 0.04;

    filter.type = 'lowpass';
    filter.frequency.value = freq * 4;
    filter.Q.value = 0.7;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    noiseGain.connect(musicGain);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol * 0.3, startTime + 0.05);
    gain.gain.setValueAtTime(vol * 0.3, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
    noise.start(startTime);
    noise.stop(startTime + duration);

    musicNodes.push(osc, vibrato, noise);
  }

  // ===== Guzheng-like pluck (古筝) =====
  function playGuzheng(freq, startTime, duration, vol) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = freq * 6;
    filter.Q.value = 1;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    // Sharp attack, quick decay (plucked string)
    gain.gain.setValueAtTime(vol * 0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(vol * 0.15, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
    musicNodes.push(osc);
  }

  // ===== Percussion hit (鼓点) =====
  function playDrum(startTime, vol) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
    gain.gain.setValueAtTime(vol * 0.6, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(startTime);
    osc.stop(startTime + 0.2);

    // Noise hit
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.15, startTime);
    ng.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
    const hf = ctx.createBiquadFilter();
    hf.type = 'highpass';
    hf.frequency.value = 1000;
    noise.connect(hf);
    hf.connect(ng);
    ng.connect(musicGain);
    noise.start(startTime);
    noise.stop(startTime + 0.1);

    musicNodes.push(osc, noise);
  }

  // ===== Background Music Loop =====
  let musicInterval = null;

  function startMusic() {
    if (musicPlaying || !ctx) return;
    musicPlaying = true;
    playMusicPhrase();
  }

  function playMusicPhrase() {
    if (!musicPlaying || !ctx) return;

    const now = ctx.currentTime + 0.05;
    const bpm = 168; // Fast tempo
    const beatDur = 60 / bpm;
    const noteDur = beatDur * 0.8;
    const vol = 0.35;

    // Generate a fast-paced phrase
    const phrases = [
      // Phrase 1: Ascending flute with guzheng rhythm
      () => {
        for (let i = 0; i < 8; i++) {
          const scale = i < 4 ? PENTA : PENTA_HI;
          const idx = i < 4 ? i : i - 4;
          playFlute(scale[idx], now + i * beatDur, noteDur * 1.5, vol);
          if (i % 2 === 0) playGuzheng(PENTA_LO[Math.floor(Math.random() * 5)], now + i * beatDur, noteDur * 0.6, vol * 0.6);
        }
        // Fast guzheng run
        for (let i = 0; i < 8; i++) {
          playGuzheng(PENTA_HI[i % 5], now + (8 + i * 0.5) * beatDur, noteDur * 0.4, vol * 0.4);
        }
      },
      // Phrase 2: Descending tension
      () => {
        for (let i = 0; i < 8; i++) {
          const idx = 4 - (i % 5);
          playFlute(PENTA[idx], now + i * beatDur, noteDur, vol);
          if (i === 0 || i === 3 || i === 6) playDrum(now + i * beatDur, vol * 0.5);
        }
        for (let i = 0; i < 4; i++) {
          playGuzheng(PENTA[(3 - i) % 5], now + (8 + i) * beatDur, noteDur * 1.2, vol * 0.5);
        }
      },
      // Phrase 3: Rapid arpeggio tension
      () => {
        for (let i = 0; i < 16; i++) {
          const scale = i < 8 ? PENTA : PENTA_HI;
          playGuzheng(scale[i % 5], now + i * beatDur * 0.5, noteDur * 0.5, vol * 0.45);
        }
        for (let i = 0; i < 4; i++) {
          playFlute(PENTA_HI[i % 5], now + (8 + i * 2) * beatDur * 0.5, noteDur * 2, vol * 0.8);
        }
        // Strong drums
        for (let i = 0; i < 4; i++) {
          playDrum(now + (8 + i * 2) * beatDur * 0.5, vol * 0.7);
        }
      },
      // Phrase 4: Dramatic flute melody
      () => {
        const melody = [0, 2, 4, 3, 1, 3, 4, 2, 0, 4, 3, 1];
        for (let i = 0; i < melody.length; i++) {
          const scale = i < 6 ? PENTA : PENTA_HI;
          playFlute(scale[melody[i]], now + i * beatDur, noteDur * 1.2, vol * 0.9);
          if (i % 3 === 0) playGuzheng(PENTA_LO[melody[i]], now + i * beatDur, noteDur * 0.8, vol * 0.4);
          if (i % 4 === 0) playDrum(now + i * beatDur, vol * 0.3);
        }
      },
    ];

    // Play random phrase
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    phrase();

    // Clean up old nodes
    const oldNodes = [...musicNodes];
    musicNodes = [];
    for (const n of oldNodes) {
      try { n.disconnect(); } catch {}
    }

    // Schedule next phrase (12 beats total per phrase)
    const phraseDuration = 12 * beatDur * 1000;
    musicInterval = setTimeout(() => {
      musicNodes = [];
      playMusicPhrase();
    }, phraseDuration - 100);
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicInterval) clearTimeout(musicInterval);
    musicInterval = null;
    for (const n of musicNodes) {
      try { n.disconnect(); } catch {}
    }
    musicNodes = [];
  }

  // ===== Arrow SFX (咻) =====
  function playArrowSfx() {
    if (!ctx || arrowSfxPool >= MAX_CONCURRENT_SFX) return;
    arrowSfxPool++;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    // Noise swoosh
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    noise.buffer = buf;
    const ng = ctx.createGain();
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.setValueAtTime(3000, now);
    nf.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
    nf.Q.value = 2;
    noise.connect(nf);
    nf.connect(ng);
    ng.gain.setValueAtTime(0.15, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    ng.connect(sfxGain);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.15);

    setTimeout(() => arrowSfxPool--, 60);
  }

  // ===== Blade/Dagger SFX (嗖嗖 - metallic) =====
  function playBladeSfx() {
    if (!ctx || bladeSfxPool >= MAX_CONCURRENT_SFX) return;
    bladeSfxPool++;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;

    osc.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    gain.connect(sfxGain);

    // Metallic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = 3500 + Math.random() * 500;
    osc2.connect(gain2);
    gain2.gain.setValueAtTime(0.02, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    gain2.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
    osc2.start(now);
    osc2.stop(now + 0.12);

    setTimeout(() => bladeSfxPool--, 80);
  }

  // ===== Smoke Bomb SFX (嘭) =====
  function playSmokeBombSfx() {
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise burst
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    noise.buffer = buf;
    const ng = ctx.createGain();
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(800, now);
    nf.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    noise.connect(nf);
    nf.connect(ng);
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    ng.connect(sfxGain);
    noise.start(now);
    noise.stop(now + 0.5);

    // Reverb-like echo
    const echo = ctx.createOscillator();
    const eg = ctx.createGain();
    echo.type = 'sine';
    echo.frequency.setValueAtTime(80, now + 0.1);
    echo.frequency.exponentialRampToValueAtTime(20, now + 0.7);
    eg.gain.setValueAtTime(0, now);
    eg.gain.linearRampToValueAtTime(0.2, now + 0.1);
    eg.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    echo.connect(eg);
    eg.connect(sfxGain);
    echo.start(now);
    echo.stop(now + 0.7);
  }

  // ===== Ninja Shout (SpeechSynthesis) =====
  function playNinjaShout() {
    if (ninjaHasShouted) return;
    ninjaHasShouted = true;
    try {
      const utterance = new SpeechSynthesisUtterance('手裏剣！！');
      utterance.lang = 'ja-JP';
      utterance.rate = 1.2;
      utterance.pitch = 0.8;
      utterance.volume = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis not available:', e);
    }
  }

  function resetNinjaShout() {
    ninjaHasShouted = false;
  }

  function stopAll() {
    stopMusic();
    if (ctx) {
      try { speechSynthesis.cancel(); } catch {}
    }
  }

  return {
    init,
    resume,
    startMusic,
    stopMusic,
    stopAll,
    playArrowSfx,
    playBladeSfx,
    playSmokeBombSfx,
    playNinjaShout,
    resetNinjaShout,
  };
})();
