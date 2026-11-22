// Nightshift Heist — synthesized sound effects. No audio files, no network:
// every sound is an oscillator (and one filtered noise burst) through WebAudio.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    alarmTimer: 0,
  };

  function ensure() {
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio.ctx = new AC();
    }
    if (audio.ctx.state === 'suspended') void audio.ctx.resume();
    return audio.ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (audio.muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, gain) {
    if (audio.muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { audio.muted = !audio.muted; return audio.muted; },
    get muted() { return audio.muted; },
    pickup() { tone(880, 0.09, 'sine', 0.16); tone(1318, 0.14, 'sine', 0.14, 0.07); },
    sapphire() {
      tone(1046, 0.12, 'sine', 0.16);
      tone(1318, 0.12, 'sine', 0.16, 0.09);
      tone(1568, 0.2, 'sine', 0.16, 0.18);
    },
    coin() { tone(2093, 0.07, 'triangle', 0.14); tone(1568, 0.1, 'triangle', 0.1, 0.05); },
    smoke() { noiseBurst(0.45, 0.22); tone(220, 0.4, 'sine', 0.08, 0, 70); },
    click() { tone(660, 0.05, 'square', 0.06); },
    alarmTick() { tone(1175, 0.06, 'square', 0.07); },
    caught() {
      tone(392, 0.25, 'sawtooth', 0.14);
      tone(311, 0.25, 'sawtooth', 0.14, 0.2);
      tone(233, 0.5, 'sawtooth', 0.14, 0.4);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
    },
    // Called every frame while playing; pulses a quiet tick when the alarm is hot.
    updateAlarm(dt, alarm) {
      if (alarm < 60 || audio.muted) return;
      audio.alarmTimer -= dt;
      if (audio.alarmTimer <= 0) {
        audio.alarmTimer = 0.55;
        this.alarmTick();
      }
    },
  };
}
