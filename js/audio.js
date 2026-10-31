// チップチューンの 効果音 と BGM (すべて オリジナル曲)
// スーファミっぽさを出すために、25% パルス波 + 三角波ベース + エコー (ディレイ) で鳴らしている
(() => {
  "use strict";

  let ac = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let echoIn = null;
  let noiseBuf = null;
  let pulse25 = null;
  let pulse12 = null;
  let muted = false;
  try { muted = localStorage.getItem("popoquest.muted") === "1"; } catch (e) { /* storage unavailable */ }

  function pulseWave(duty) {
    const n = 32;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      real[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI);
      imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI);
    }
    return ac.createPeriodicWave(real, imag);
  }

  function ensure() {
    if (ac) {
      if (ac.state === "suspended") ac.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.24;
    master.connect(ac.destination);
    // エコー
    echoIn = ac.createGain();
    echoIn.gain.value = 0.28;
    const delay = ac.createDelay(1);
    delay.delayTime.value = 0.21;
    const fb = ac.createGain();
    fb.gain.value = 0.32;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    echoIn.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(master);
    musicGain = ac.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(master);
    musicGain.connect(echoIn);
    sfxGain = ac.createGain();
    sfxGain.gain.value = 0.85;
    sfxGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pulse25 = pulseWave(0.25);
    pulse12 = pulseWave(0.125);
    return true;
  }

  function osc(type) {
    const o = ac.createOscillator();
    if (type === "p25") o.setPeriodicWave(pulse25);
    else if (type === "p12") o.setPeriodicWave(pulse12);
    else o.type = type;
    return o;
  }

  function tone(type, freq, start, dur, vol, dest, slideTo, o = {}) {
    const os = osc(type);
    const g = ac.createGain();
    os.frequency.setValueAtTime(freq, start);
    if (slideTo) os.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    if (o.vib && dur > 0.25) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, start);
      lg.gain.linearRampToValueAtTime(freq * 0.012, start + Math.min(0.3, dur * 0.5));
      lfo.connect(lg);
      lg.connect(os.frequency);
      lfo.start(start);
      lfo.stop(start + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.006);
    if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * o.decay), start + dur);
    else g.gain.setValueAtTime(vol, start + dur * 0.75);
    g.gain.linearRampToValueAtTime(0.0001, start + dur);
    os.connect(g);
    g.connect(dest);
    os.start(start);
    os.stop(start + dur + 0.03);
  }

  function noise(start, dur, vol, dest, hp = 1000, lpf = 0) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    s.connect(f);
    let tail = f;
    if (lpf) {
      const l = ac.createBiquadFilter();
      l.type = "lowpass";
      l.frequency.value = lpf;
      f.connect(l);
      tail = l;
    }
    tail.connect(g);
    g.connect(dest);
    s.start(start, Math.random() * 0.5);
    s.stop(start + dur + 0.02);
  }

  const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freqOf(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return 0;
    const n = NOTE_INDEX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    const midi = (Number(m[3]) + 1) * 12 + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function seq(notes, step, type = "p25", vol = 0.25, o = {}) {
    const t = ac.currentTime + (o.delay || 0);
    notes.forEach((n, i) => {
      if (n && n !== "." && n !== "-") {
        let len = 1;
        while (notes[i + len] === "-") len++;
        tone(type, freqOf(n), t + i * step, step * len * 0.95, vol, o.dest || sfxGain, null, o);
      }
    });
  }

  // ---------------------------------------------------------------- 効果音
  const SFX = {
    talk() { tone("p25", 1100 + Math.random() * 120, ac.currentTime, 0.022, 0.05, sfxGain); },
    cursor() { tone("p25", 1320, ac.currentTime, 0.03, 0.1, sfxGain); },
    select() { const t = ac.currentTime; tone("p25", 990, t, 0.04, 0.14, sfxGain); tone("p25", 1480, t + 0.04, 0.06, 0.14, sfxGain); },
    cancel() { const t = ac.currentTime; tone("p25", 880, t, 0.04, 0.12, sfxGain); tone("p25", 660, t + 0.04, 0.06, 0.12, sfxGain); },
    buzz() { tone("square", 140, ac.currentTime, 0.12, 0.15, sfxGain); },
    bump() { tone("triangle", 110, ac.currentTime, 0.07, 0.3, sfxGain, 70); },
    door() { const t = ac.currentTime; noise(t, 0.12, 0.2, sfxGain, 300, 1400); tone("triangle", 160, t, 0.12, 0.3, sfxGain, 90); },
    stairs() { seq(["C5", "G4", "E4", "C4"], 0.06, "p25", 0.14); },
    chest() { const t = ac.currentTime; tone("triangle", 300, t, 0.08, 0.3, sfxGain, 500); seq([null, null, "C6", "E6", "G6", "C7"], 0.05, "p25", 0.13); },
    item() { seq(["G5", "A5", "B5", "C6", "-", "-", "G6", "-"], 0.07, "p25", 0.16, { dest: musicGain }); },
    gold() { const t = ac.currentTime; tone("p25", 1976, t, 0.05, 0.12, sfxGain); tone("p25", 2637, t + 0.05, 0.15, 0.12, sfxGain); },
    encounter() {
      const t = ac.currentTime;
      for (let i = 0; i < 8; i++) tone("p25", 300 + i * 120, t + i * 0.035, 0.05, 0.12, sfxGain);
      noise(t, 0.4, 0.2, sfxGain, 2000);
      tone("sawtooth", 880, t + 0.2, 0.3, 0.08, sfxGain, 110);
    },
    swing() { noise(ac.currentTime, 0.1, 0.22, sfxGain, 2500); },
    hit() { const t = ac.currentTime; noise(t, 0.09, 0.4, sfxGain, 600); tone("square", 180, t, 0.08, 0.2, sfxGain, 60); },
    crit() { const t = ac.currentTime; noise(t, 0.2, 0.5, sfxGain, 300); tone("square", 400, t, 0.18, 0.25, sfxGain, 50); seq(["C7", "G6"], 0.04, "p25", 0.1); },
    miss() { tone("p25", 600, ac.currentTime, 0.12, 0.1, sfxGain, 1400); },
    hurt() { const t = ac.currentTime; noise(t, 0.15, 0.35, sfxGain, 200, 3000); tone("square", 140, t, 0.15, 0.25, sfxGain, 50); },
    bighurt() { const t = ac.currentTime; noise(t, 0.35, 0.5, sfxGain, 100, 2500); tone("square", 200, t, 0.3, 0.3, sfxGain, 40); },
    magic() { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone("p12", 600 + i * 180, t + i * 0.04, 0.06, 0.1, sfxGain); },
    fire() { const t = ac.currentTime; noise(t, 0.5, 0.35, sfxGain, 300, 2000); tone("sawtooth", 200, t, 0.4, 0.08, sfxGain, 70); },
    ice() { const t = ac.currentTime; for (let i = 0; i < 8; i++) tone("p12", 2000 + Math.random() * 1500, t + i * 0.04, 0.05, 0.08, sfxGain); noise(t, 0.3, 0.15, sfxGain, 5000); },
    thunder() { const t = ac.currentTime; noise(t, 0.6, 0.6, sfxGain, 100); tone("square", 90, t, 0.5, 0.25, sfxGain, 40); },
    beam() { const t = ac.currentTime; tone("sawtooth", 1800, t, 0.5, 0.1, sfxGain, 300); tone("p25", 900, t, 0.5, 0.1, sfxGain, 1800); },
    heal() { seq(["C6", "E6", "G6", "C7", "E7"], 0.06, "triangle", 0.25); },
    buff() { seq(["C5", "G5", "C6", "G6"], 0.06, "p25", 0.14); },
    debuff() { seq(["G5", "C5", "G4", "C4"], 0.07, "p25", 0.14); },
    sleep() { seq(["E6", "C6", "E6", "C6"], 0.12, "triangle", 0.2); },
    poison() { seq(["C5", "C#5", "C5", "C#5"], 0.06, "square", 0.1); },
    death() { const t = ac.currentTime; tone("p25", 800, t, 0.4, 0.15, sfxGain, 80); noise(t + 0.05, 0.4, 0.2, sfxGain, 1000); },
    bossdeath() { const t = ac.currentTime; for (let i = 0; i < 10; i++) { noise(t + i * 0.12, 0.25, 0.4, sfxGain, 100 + i * 50, 2000); tone("square", 120 - i * 6, t + i * 0.12, 0.2, 0.2, sfxGain, 40); } },
    explode() { const t = ac.currentTime; noise(t, 0.8, 0.7, sfxGain, 60, 1800); tone("square", 120, t, 0.6, 0.3, sfxGain, 30); },
    ko() { seq(["G4", "E4", "C4"], 0.12, "square", 0.15); },
    run() { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone("p25", 400 + (i % 2) * 300, t + i * 0.05, 0.04, 0.1, sfxGain); },
    roar() { const t = ac.currentTime; tone("sawtooth", 160, t, 0.8, 0.25, sfxGain, 60); noise(t, 0.8, 0.3, sfxGain, 200, 1200); },
    warp() { const t = ac.currentTime; for (let i = 0; i < 12; i++) tone("p25", 300 + i * 100, t + i * 0.03, 0.05, 0.1, sfxGain); },
    save() { seq(["E6", "C6", "G6", "-", "C7", "-"], 0.08, "triangle", 0.25); },
    ufo() { const t = ac.currentTime; tone("sine", 400, t, 1.2, 0.18, sfxGain, 1200); tone("p25", 800, t, 1.2, 0.05, sfxGain, 2400); },
    quake() { const t = ac.currentTime; noise(t, 0.7, 0.6, sfxGain, 40, 600); tone("triangle", 60, t, 0.6, 0.5, sfxGain, 30); },
    sparkle() { seq(["C7", "G7", "E7", "C8"], 0.04, "p12", 0.08); },
    bomb() { const t = ac.currentTime; tone("p25", 900, t, 0.1, 0.1, sfxGain, 1300); },
  };

  // ---------------------------------------------------------------- BGM
  // 1 トークン = 8分音符 ("-" はのばす / "." は休み)。"|" は小節の区切り (読みやすさ用)
  const SONGS = {
    title: {
      bpm: 126,
      lead: "C5 - - G4 C5 E5 G5 - | A5 - G5 F5 E5 - D5 - | E5 - - C5 E5 G5 C6 - | B5 - A5 B5 G5 - - - | A5 - - F5 A5 C6 F6 - | E6 - D6 C6 B5 - A5 - | G5 - C6 - E5 - D5 - | C5 - - - - - . .",
      harm: "E4 - - . G4 - - . | F4 - - . G4 - - . | G4 - - . G4 - - . | D5 - - . B4 - - . | C5 - - . C5 - - . | C5 - - . F4 - - . | E4 - - . F4 - - . | E4 - - - . . . .",
      bass: "C3 . G3 . C3 . G3 . | F2 . C3 . G2 . D3 . | C3 . G3 . E3 . G3 . | G2 . D3 . G2 . B2 . | F2 . C3 . F3 . A2 . | C3 . G2 . E3 . A2 . | G2 . G3 . G2 . B2 . | C3 . G3 . C3 . . .",
      drums: "k . h . s . h . k k h . s . h h",
    },
    village: {
      bpm: 100,
      lead: "A4 - C5 F5 - E5 | D5 - C5 A4 - - | Bb4 - D5 G5 - F5 | E5 - - C5 - - | A4 - C5 F5 - A5 | G5 - F5 D5 - E5 | F5 - C5 A4 - G4 | F4 - - - - .",
      harm: "F4 - - A4 - - | F4 - - F4 - - | D4 - - Bb4 - - | C4 - - E4 - - | F4 - - C5 - - | Bb4 - - Bb4 - - | A4 - - F4 - - | C4 - - - - .",
      bass: "F2 . C3 A3 . C3 | F2 . C3 A3 . C3 | Bb2 . F3 D3 . F3 | C3 . G3 E3 . G3 | F2 . C3 A3 . C3 | Bb2 . F3 C3 . G3 | F2 . A2 C3 . C3 | F2 . C3 F3 . .",
      drums: "k . h s . h",
    },
    field: {
      bpm: 132,
      lead: "D5 - A4 - D5 E5 F#5 - | G5 - F#5 E5 D5 - A4 - | B4 - D5 - G5 - F#5 E5 | F#5 - - - E5 - - . | D5 - A4 - D5 E5 F#5 - | A5 - G5 F#5 E5 - D5 - | E5 - G5 F#5 E5 - C#5 - | D5 - - - - - . .",
      harm: "F#4 - - . A4 - - . | B4 - - . A4 - - . | G4 - - . B4 - - . | A4 - - . C#5 - - . | F#4 - - . A4 - - . | C#5 - - . D5 - - . | B4 - - . A4 - - . | F#4 - - - . . . .",
      bass: "D3 . A3 . D3 . A3 . | G2 . D3 . A2 . E3 . | G2 . D3 . E2 . B2 . | A2 . E3 . A2 . C#3 . | D3 . A3 . D3 . A3 . | F#2 . C#3 . B2 . F#3 . | G2 . D3 . A2 . E3 . | D3 . A2 . D3 . . .",
      drums: "k . h k s . h h",
    },
    dungeon: {
      bpm: 96,
      lead: "A4 - - C5 B4 - E4 - | F4 - - A4 G#4 - - - | A4 - - C5 E5 - D5 C5 | B4 - - - - - . . | F5 - - E5 D5 - C5 - | D5 - - C5 B4 - A4 - | G#4 - - B4 E5 - D5 - | C5 - B4 - A4 - - .",
      bass: "A2 - - - E3 - - - | D3 - - - E3 - - - | A2 - - - C3 - - - | E2 - - - G#2 - - - | D3 - - - A2 - - - | B2 - - - E2 - - - | E2 - - - E3 - - - | A2 - - - - - - .",
      drums: "k . . h . . s .",
    },
    tower: {
      bpm: 100,
      lead: "C#5 - E5 - A5 - G#5 - | F#5 - - - C#5 - - - | D5 - F#5 - B5 - A5 - | G#5 - - - E5 - - - | C#5 - E5 - A5 - C#6 - | B5 - A5 - G#5 - F#5 - | D5 - E5 - F#5 - G#5 - | A5 - - - G#5 - - -",
      harm: "A4 - - - E5 - - - | C#5 - - - A4 - - - | B4 - - - F#5 - - - | E5 - - - B4 - - - | A4 - - - E5 - - - | F#5 - - - D5 - - - | B4 - - - C#5 - - - | C#5 - - - B4 - - -",
      bass: "F#2 . . . C#3 . . . | F#2 . . . A2 . . . | B1 . . . F#2 . . . | C#2 . . . G#2 . . . | F#2 . . . C#3 . . . | D2 . . . E2 . . . | B1 . . . C#2 . . . | F#2 . . . C#2 . . .",
      drums: "h . . . h . s .",
    },
    battle: {
      bpm: 168,
      lead: "E5 . E5 G5 . E5 B5 . | A5 G5 F#5 G5 E5 - - . | D5 . D5 F#5 . D5 A5 . | G5 F#5 E5 F#5 D5 - - . | C5 . C5 E5 . G5 C6 . | B5 A5 G5 A5 B5 - - . | C6 B5 A5 G5 F#5 G5 A5 B5 | E5 - - - D#5 - - .",
      harm: "B4 - - . B4 - - . | C5 - - . B4 - - . | A4 - - . A4 - - . | B4 - - . A4 - - . | G4 - - . G4 - - . | D5 - - . D5 - - . | E5 - - . D#5 - - . | B4 - - . F#4 - - .",
      bass: "E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 D3 D#3 | D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 D2 D3 B2 C3 | C2 C3 C2 C3 C2 C3 C2 C3 | G2 G3 G2 G3 G2 G3 G2 G3 | A2 A3 A2 A3 A2 A3 A2 A3 | B2 B3 B2 B3 B2 B3 B2 B3",
      drums: "k h s h k k s h",
    },
    boss: {
      bpm: 176,
      lead: "C5 C5 Eb5 C5 G5 . F#5 G5 | Ab5 - G5 F5 Eb5 - D5 . | C5 C5 Eb5 C5 G5 . Bb5 G5 | B5 - - - G5 - - . | Ab5 . G5 . F5 . Eb5 . | F5 . Eb5 . D5 . C5 . | Eb5 D5 C5 D5 Eb5 F5 G5 Ab5 | G5 - - - B4 - D5 .",
      harm: "G4 - - . G4 - - . | C5 - - . B4 - - . | G4 - - . Eb5 - - . | D5 - - . B4 - - . | C5 - - . Bb4 - - . | Ab4 - - . G4 - - . | C5 - - . Eb5 - - . | D5 - - . G4 - - .",
      bass: "C2 C3 C2 C3 C2 C3 C2 C3 | F2 F3 F2 F3 Ab2 Ab3 G2 G3 | C2 C3 C2 C3 C2 C3 C2 C3 | G2 G3 G2 G3 G2 G3 G2 G3 | Ab2 Ab3 Ab2 Ab3 Eb2 Eb3 Eb2 Eb3 | F2 F3 F2 F3 C2 C3 C2 C3 | Ab2 Ab3 Bb2 Bb3 C3 C4 D3 D4 | G2 G3 G2 G3 G2 G3 G2 G3",
      drums: "k s k s k k s s",
    },
    lastboss: {
      bpm: 184,
      lead: "D5 D5 D5 F5 E5 D5 C#5 D5 | A5 - - G5 F5 - E5 - | Bb5 - A5 - G5 - F5 - | E5 F5 G5 A5 C#6 - - . | D6 - C6 - Bb5 - A5 - | G5 - F5 - E5 - D5 - | Bb4 C5 D5 E5 F5 G5 A5 Bb5 | A5 - - - - - G#5 A5",
      harm: "A4 - - . A4 - - . | D5 - - . C5 - - . | D5 - - . D5 - - . | C#5 - - . E5 - - . | F5 - - . F5 - - . | D5 - - . C#5 - - . | D5 - - . E5 - - . | C#5 - - . E5 - - .",
      bass: "D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 C2 C3 C2 C3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | A1 A2 A1 A2 A1 A2 A1 A2 | Bb1 Bb2 Bb1 Bb2 F2 F3 F2 F3 | G1 G2 G1 G2 A1 A2 A1 A2 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 C#2 C#3",
      drums: "k s k s k k s s",
    },
    // さいごの たたかい (しんのすがた): みんなの おうえんで 長調に もどる
    hope: {
      bpm: 160,
      lead: "C5 - G4 - C5 E5 G5 - | A5 - G5 - E5 - C5 - | F5 - E5 - D5 - G5 - | E5 - - - D5 - - . | C5 - G4 - C5 E5 G5 - | C6 - B5 - A5 - G5 - | A5 - B5 - C6 - D6 - | C6 - - - B5 - G5 -",
      harm: "E4 - - . E4 - - . | F4 - - . G4 - - . | A4 - - . B4 - - . | G4 - - . F4 - - . | E4 - - . G4 - - . | E5 - - . C5 - - . | F5 - - . F5 - - . | E5 - - . D5 - - .",
      bass: "C3 C3 G3 C3 C3 C3 G3 C3 | F2 F2 C3 F2 A2 A2 E3 A2 | D3 D3 A3 D3 G2 G2 D3 G2 | C3 C3 G3 C3 G2 G2 D3 G2 | C3 C3 G3 C3 E3 E3 B3 E3 | F2 F2 C3 F2 C3 C3 G3 C3 | F2 F2 C3 F2 G2 G2 D3 G2 | C3 C3 G3 C3 G2 G2 B2 D3",
      drums: "k h s h k k s h",
    },
    castle: {
      bpm: 108,
      lead: "Bb4 - - F4 Bb4 - D5 - | C5 - - Bb4 A4 - F4 - | G4 - - A4 Bb4 - C5 - | D5 - - - C5 - - . | Eb5 - - D5 C5 - Bb4 - | D5 - - C5 Bb4 - A4 - | G4 - Bb4 - A4 - C5 - | Bb4 - - - - - . .",
      harm: "D4 - - . D4 - - . | A4 - - . F4 - - . | Eb4 - - . G4 - - . | F4 - - . A4 - - . | G4 - - . Eb4 - - . | F4 - - . F4 - - . | Eb4 - - . F4 - - . | D4 - - - . . . .",
      bass: "Bb2 . F3 . Bb2 . F3 . | F2 . C3 . F2 . C3 . | Eb2 . Bb2 . G2 . D3 . | F2 . C3 . F2 . A2 . | Eb2 . Bb2 . F2 . C3 . | Bb2 . F3 . F2 . C3 . | Eb2 . Bb2 . F2 . C3 . | Bb2 . F2 . Bb2 . . .",
      drums: "k . . h s . h .",
    },
    snow: {
      bpm: 108,
      lead: "B4 - E5 G5 - F#5 | E5 - B4 - - - | C5 - E5 A5 - G5 | F#5 - - - - - | G5 - F#5 E5 - D5 | E5 - C5 A4 - - | B4 - D#5 F#5 - E5 | E5 - - - - .",
      harm: "G4 - - B4 - - | G4 - - G4 - - | A4 - - C5 - - | A4 - - D5 - - | E5 - - B4 - - | C5 - - E4 - - | F#4 - - B4 - - | G4 - - - - .",
      bass: "E2 . B2 E3 . B2 | E2 . B2 E3 . B2 | A2 . E3 A3 . E3 | D2 . A2 D3 . A2 | C3 . G3 C4 . G3 | A2 . E3 A3 . E3 | B2 . F#3 B3 . F#3 | E2 . B2 E3 . .",
      drums: "k . h . h .",
    },
    island: {
      bpm: 140,
      lead: "D5 - - A4 D5 - F5 - | E5 - D5 - C#5 - A4 - | Bb4 - - D5 G5 - F5 - | E5 - - - A4 - - . | D5 - - F5 A5 - G5 F5 | G5 - - Bb5 A5 - F5 - | E5 - G5 - F5 - E5 - | D5 - - - C#5 - - .",
      bass: "D2 D3 . D2 D3 . D2 D3 | A1 A2 . A1 A2 . A1 A2 | Bb1 Bb2 . Bb1 Bb2 . Bb1 Bb2 | A1 A2 . A1 A2 . C#2 C#3 | D2 D3 . D2 D3 . D2 D3 | G1 G2 . G1 G2 . G1 G2 | A1 A2 . A1 A2 . A1 A2 | D2 D3 . D2 D3 . A1 A2",
      drums: "k . s . k k s .",
    },
    dcastle: {
      bpm: 120,
      lead: "B4 - - D5 C#5 - F#4 - | G4 - - B4 A#4 - - - | B4 - D5 - F#5 - E5 D5 | C#5 - - - - - . . | G5 - - F#5 E5 - D5 - | E5 - - D5 C#5 - B4 - | A#4 - C#5 - F#5 - E5 - | D5 - C#5 - B4 - - .",
      bass: "B1 B2 . B1 B2 . B1 B2 | G1 G2 . G1 G2 . F#1 F#2 | B1 B2 . B1 B2 . B1 B2 | F#1 F#2 . F#1 F#2 . F#1 F#2 | E2 E3 . E2 E3 . E2 E3 | C#2 C#3 . F#1 F#2 . B1 B2 | F#1 F#2 . F#1 F#2 . F#1 F#2 | B1 B2 . B1 B2 . . .",
      drums: "k . . s . k s .",
    },
    ufo: {
      bpm: 150,
      lead: "G5 - D5 - G5 A5 B5 - | C6 - B5 A5 G5 - D5 - | E5 - G5 - C6 - B5 A5 | B5 - - - A5 - - . | G5 - D5 - G5 A5 B5 - | D6 - C6 B5 A5 - G5 - | A5 - C6 - B5 - A5 - | G5 - - - - - . .",
      harm: "B4 - - . D5 - - . | E5 - - . B4 - - . | C5 - - . E5 - - . | D5 - - . F#5 - - . | B4 - - . D5 - - . | F#5 - - . E5 - - . | E5 - - . D5 - - . | B4 - - - . . . .",
      bass: "G2 . D3 . G2 . D3 . | C3 . G3 . G2 . D3 . | C3 . G3 . A2 . E3 . | D3 . A3 . D3 . F#3 . | G2 . D3 . G2 . D3 . | B2 . F#3 . E3 . B2 . | C3 . G3 . D3 . A3 . | G2 . D3 . G2 . . .",
      drums: "k h s h k h s h",
    },
    story: {
      bpm: 84,
      lead: "E5 - - - D5 C5 B4 - | C5 - - - A4 - - - | F5 - - - E5 D5 C5 - | B4 - - - - - - . | E5 - - - D5 C5 B4 - | C5 - - - A4 - G4 - | A4 - B4 - C5 - D5 - | E5 - - - - - - .",
      harm: "C5 - - - B4 - - - | A4 - - - E4 - - - | A4 - - - A4 - - - | G#4 - - - - - - . | C5 - - - B4 - - - | A4 - - - E4 - - - | F4 - - - G#4 - - - | B4 - - - - - - .",
      bass: "A2 . E3 . A3 . E3 . | F2 . C3 . F3 . C3 . | D2 . A2 . D3 . A2 . | E2 . B2 . E3 . B2 . | A2 . E3 . A3 . E3 . | F2 . C3 . F3 . C3 . | D2 . A2 . E2 . B2 . | A2 . E3 . A3 . . .",
      drums: ". . . .",
    },
    ending: {
      bpm: 100,
      lead: "E5 - - D5 C5 - G4 - | A4 - - C5 E5 - D5 - | F5 - - E5 D5 - C5 - | D5 - - - G4 - - . | E5 - - G5 C6 - B5 - | A5 - - G5 F5 - E5 - | F5 - A5 - G5 - D5 - | C5 - - - - - - .",
      harm: "C4 - - . E4 - - . | F4 - - . A4 - - . | A4 - - . G4 - - . | B4 - - . D4 - - . | C5 - - . E5 - - . | C5 - - . A4 - - . | A4 - - . B4 - - . | E4 - - - . . . .",
      bass: "C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | D3 . A3 . G2 . D3 . | G2 . D3 . B2 . D3 . | C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | D3 . A2 . G2 . B2 . | C3 . G3 . C3 . . .",
      drums: "k . h . s . h .",
    },
    // ジングル (1 回だけ)
    victory: {
      bpm: 150, once: true,
      lead: "G4 C5 E5 G5 - - E5 G5 | C6 - - - - - - - | A5 - - B5 - - C6 - | D6 - B5 - G5 - - - | C6 - - - - - . .",
      harm: "E4 G4 C5 E5 - - C5 E5 | G5 - - - - - - - | F5 - - G5 - - A5 - | B5 - G5 - D5 - - - | E5 - - - - - . .",
      bass: "C3 . . . . . . . | C3 . G3 . C4 . G3 . | F2 . . G2 . . A2 . | G2 . . . G2 . . . | C3 . . . . . . .",
      drums: "k . . . k . s . | k . h . s . h . | k . . k . . s . | k . s . k s s s | k . . . . . . .",
    },
    levelup: { bpm: 180, once: true, lead: "C5 E5 G5 C6 - . G5 C6 - - - - . .", harm: "G4 C5 E5 G5 - . E5 G5 - - - - . .", bass: "C3 . . . . . G2 C3 - - - - . .", drums: ". . . ." },
    inn: { bpm: 110, once: true, lead: "C5 - E5 - G5 - E5 - F5 - A5 - G5 - - - | E5 - D5 - C5 - - - - - . .", harm: "E4 - G4 - C5 - G4 - A4 - C5 - B4 - - - | G4 - F4 - E4 - - - - - . .", bass: "C3 . . . C3 . . . F2 . . . G2 . . . | C3 . G2 . C3 . . . . . . .", drums: ". . . ." },
    gameover: { bpm: 80, once: true, lead: "A4 - G4 - F4 - E4 - | D4 - - - E4 - - - | A3 - - - - - - - . . . .", bass: "A2 - - - D2 - - - | Bb1 - - - E2 - - - | A1 - - - - - - - . . . .", drums: ". . . ." },
    fanfare: { bpm: 140, once: true, lead: "G4 . G4 . G4 . C5 - - - - - . . | D5 . D5 . D5 . G5 - - - - - . . | C6 - - - - - - - . . . .", harm: "E4 . E4 . E4 . E4 - - - - - . . | G4 . G4 . G4 . B4 - - - - - . . | E5 - - - - - - - . . . .", bass: "C3 . . . . . C3 - - - - - . . | G2 . . . . . G2 - - - - - . . | C3 - - - - - - - . . . .", drums: "k . k . k . s . . . . . . ." },
  };

  function parseTrack(str) { return (str || ".").replace(/\|/g, " ").trim().split(/\s+/); }

  let current = null;
  let resumeAfter = null;

  function scheduleStep(song, step, time) {
    const eighth = 60 / song.bpm / 2;
    const voices = [["lead", "p25", 0.15, true], ["harm", "square", 0.06, false], ["bass", "triangle", 0.42, false]];
    for (const [key, type, vol, vib] of voices) {
      const track = song[key];
      if (!track) continue;
      const tok = track[step % track.length];
      if (tok === "." || tok === "-") continue;
      let len = 1;
      while (len < track.length && track[(step + len) % track.length] === "-") len++;
      tone(type, freqOf(tok), time, eighth * len * 0.9, vol, musicGain, null, { vib });
    }
    const dr = song.drums[step % song.drums.length];
    if (dr === "k") tone("triangle", 150, time, 0.09, 0.55, musicGain, 45);
    else if (dr === "s") noise(time, 0.1, 0.22, musicGain, 1200, 7000);
    else if (dr === "h") noise(time, 0.03, 0.07, musicGain, 7000);
  }

  function playMusic(name, o = {}) {
    if (!ac || !ensure()) { if (current && current.timer) clearInterval(current.timer); current = SONGS[name] ? { name, pending: true } : null; return; }
    if (current && current.name === name && !current.pending && !o.restart) return;
    const raw = SONGS[name];
    stopMusic();
    if (!raw) return;
    const song = { bpm: raw.bpm, lead: parseTrack(raw.lead), harm: raw.harm ? parseTrack(raw.harm) : null, bass: parseTrack(raw.bass), drums: parseTrack(raw.drums), once: raw.once };
    const total = Math.max(song.lead.length, song.bass.length);
    current = { name, song, step: 0, nextTime: ac.currentTime + 0.06 };
    if (raw.once) resumeAfter = o.then !== undefined ? o.then : resumeAfter;
    const eighth = 60 / song.bpm / 2;
    const me = current;
    current.timer = setInterval(() => {
      if (current !== me) return;
      while (me.nextTime < ac.currentTime + 0.15) {
        if (song.once && me.step >= total) {
          clearInterval(me.timer);
          const next = resumeAfter;
          resumeAfter = null;
          setTimeout(() => { if (current === me) { current = null; if (next) playMusic(next); } }, 400);
          return;
        }
        scheduleStep(song, me.step, me.nextTime);
        me.step++;
        me.nextTime += eighth;
      }
    }, 25);
  }

  function stopMusic() {
    if (current && current.timer) clearInterval(current.timer);
    current = null;
  }

  function play(name) {
    if (!ac || !ensure() || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* ignore */ }
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem("popoquest.muted", m ? "1" : "0"); } catch (e) { /* storage unavailable */ }
    if (master) master.gain.value = m ? 0 : 0.24;
  }

  Q.snd = {
    unlock() {
      const pending = current && current.pending ? current.name : null;
      const ok = ensure();
      if (ok && pending) { current = null; playMusic(pending); }
      return ok;
    },
    play,
    music: playMusic,
    // ジングルを 鳴らして、おわったら then の曲へ
    jingle(name, then) { playMusic(name, { then, restart: true }); },
    stop: stopMusic,
    toggleMute() { setMuted(!muted); return muted; },
    get muted() { return muted; },
    get current() { return current ? current.name : null; },
    SONGS,
  };
})();
