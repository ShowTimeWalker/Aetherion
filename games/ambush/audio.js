// ========== Audio System for 十面埋伏 ==========
// All sounds generated with Web Audio API (no external files)

const AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicPlaying = false;
  let ninjaHasShouted = false;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.8;
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

  // ===== 五声音阶 (宫商角徵羽) =====
  // Extended range for more musical variety
  const NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
    C6: 1046.50, D6: 1174.66,
  };

  // ===== 箫 (Xiao) - low, breathy, melancholy bamboo flute =====
  function playXiao(freq, time, dur, vol) {
    if (!ctx) return;
    // Main tone - sine for pure bamboo flute
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Slight vibrato (natural breathing)
    const vib = ctx.createOscillator();
    const vibG = ctx.createGain();
    vib.frequency.value = 4.5;
    vibG.gain.value = freq * 0.006;
    vib.connect(vibG);
    vibG.connect(osc.frequency);

    // Breath noise - crucial for xiao character
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * dur * 1.1, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = freq * 1.5;
    nFilter.Q.value = 2;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.gain.value = vol * 0.08;

    // Low-pass for warm tone
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = freq * 3;
    lpf.Q.value = 0.5;

    const gain = ctx.createGain();
    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(musicGain);
    nGain.connect(musicGain);

    // Xiao has slow attack (breath), sustain, slow release
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.7, time + 0.12);
    gain.gain.setValueAtTime(vol * 0.7, time + dur * 0.6);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    vib.start(time);
    vib.stop(time + dur);
    osc.start(time);
    osc.stop(time + dur);
    noise.start(time);
    noise.stop(time + dur);
  }

  // ===== 笛子 (Dizi) - bright, sharp bamboo flute =====
  function playDizi(freq, time, dur, vol) {
    if (!ctx) return;
    // Brighter tone with harmonics
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2; // 2nd harmonic
    const g2 = ctx.createGain();
    g2.gain.value = 0.15;

    // Vibrato - slightly faster than xiao
    const vib = ctx.createOscillator();
    const vibG = ctx.createGain();
    vib.frequency.value = 6;
    vibG.gain.value = freq * 0.01;
    vib.connect(vibG);
    vibG.connect(osc1.frequency);

    // Breath noise (lighter than xiao)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * dur * 1.1, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 2000;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.gain.value = vol * 0.03;

    // Bright high-pass
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'lowpass';
    hpf.frequency.value = freq * 6;
    hpf.frequency.Q = 1;

    const gain = ctx.createGain();
    osc1.connect(hpf);
    osc2.connect(g2);
    g2.connect(hpf);
    hpf.connect(gain);
    gain.connect(musicGain);
    nGain.connect(musicGain);

    // Quick attack, clear sustain
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.55, time + 0.04);
    gain.gain.setValueAtTime(vol * 0.55, time + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    vib.start(time);
    vib.stop(time + dur);
    osc1.start(time);
    osc1.stop(time + dur);
    osc2.start(time);
    osc2.stop(time + dur);
    noise.start(time);
    noise.stop(time + dur);
  }

  // ===== 琵琶 (Pipa) - plucked lute, sharp attack, fast decay =====
  function playPipa(freq, time, dur, vol) {
    if (!ctx) return;
    // Use multiple harmonics for pipa timbre
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 3;
    const g2 = ctx.createGain();
    g2.gain.value = 0.08;

    // Very sharp attack, fast decay (characteristic pipa)
    const gain = ctx.createGain();
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(freq * 8, time);
    lpf.frequency.exponentialRampToValueAtTime(freq * 2, time + 0.15);

    osc1.connect(lpf);
    osc2.connect(g2);
    g2.connect(lpf);
    lpf.connect(gain);
    gain.connect(musicGain);

    gain.gain.setValueAtTime(vol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(vol * 0.2, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc1.start(time);
    osc1.stop(time + dur);
    osc2.start(time);
    osc2.stop(time + dur);
  }

  // ===== 大鼓 (War Drum) =====
  function playDrum(time, vol) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(time);
    osc.stop(time + 0.3);

    // Impact noise
    const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
    const ns = ctx.createBufferSource();
    ns.buffer = nBuf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.2, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    ns.connect(ng);
    ng.connect(musicGain);
    ns.start(time);
    ns.stop(time + 0.08);
  }

  // ===== 背景音乐 - MP3 文件播放 =====
  let bgmAudio = null;

  function startMusic() {
    if (musicPlaying) return;
    if (!bgmAudio) {
      bgmAudio = new Audio('bgm.mp3');
      bgmAudio.loop = true;
      bgmAudio.volume = 0.8;
    }
    musicPlaying = true;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    bgmAudio.play().catch(() => {});
  }

  function stopMusic() {
    musicPlaying = false;
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
  }

  // ===== BGM now plays bgm.mp3 via startMusic() above =====

  // ===== Arrow SFX (咻) =====
  function playArrowSfx() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
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
  }

  // ===== Blade/Dagger SFX (嗖嗖 - metallic) =====
  function playBladeSfx() {
    if (!ctx) return;
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
  }

  // ===== Smoke Bomb SFX (嘭) =====
  function playSmokeBombSfx() {
    if (!ctx) return;
    const now = ctx.currentTime;
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

  // ===== Death Scream =====
  function playDeathScream() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.linearRampToValueAtTime(280, now + 0.08);
    osc1.frequency.linearRampToValueAtTime(120, now + 2.0);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 2.5);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(155, now);
    osc2.frequency.linearRampToValueAtTime(285, now + 0.08);
    osc2.frequency.linearRampToValueAtTime(125, now + 2.0);
    osc2.frequency.exponentialRampToValueAtTime(55, now + 2.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.8;
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 30) * x / (Math.PI + 30 * Math.abs(x));
    }
    distortion.curve = curve;
    const mix = ctx.createGain();
    mix.gain.value = 0.6;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(distortion);
    distortion.connect(mix);
    mix.connect(gain);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.04);
    gain.gain.setValueAtTime(0.7, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.45, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    gain.connect(sfxGain);
    osc1.start(now);
    osc1.stop(now + 2.8);
    osc2.start(now);
    osc2.stop(now + 2.8);
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
    playDeathScream,
    resetNinjaShout,
  };
})();
