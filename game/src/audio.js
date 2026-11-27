// Pardon Run — sound. One job: every noise the game makes, synthesized
// with WebAudio so the game ships no audio files. A tiny two-bar loop
// plays under the run; named effects answer the turkey's fortunes.

export function createAudio() {
  let ctx = null;
  let musicTimer = null;
  let muted = false;
  let musicStep = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, when = 0) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gain = ctx.createGain(); gain.gain.value = vol;
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  // A cheerful plucked loop: C major pentatonic, two bars, repeat.
  const MELODY = [523, 587, 659, 784, 659, 587, 523, 392,
                  440, 523, 587, 659, 587, 523, 440, 392];
  function musicTick() {
    if (muted) return;
    const f = MELODY[musicStep % MELODY.length];
    tone(f, 0.16, "triangle", 0.05);
    if (musicStep % 4 === 0) tone(f / 2, 0.3, "sine", 0.045);
    musicStep++;
  }

  return {
    unlock: () => { ensure(); },
    startMusic: () => {
      if (musicTimer) return;
      musicStep = 0;
      musicTimer = setInterval(musicTick, 210);
    },
    stopMusic: () => {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
    },
    toggleMute: () => { muted = !muted; return muted; },
    get muted() { return muted; },
    click: () => tone(660, 0.07, "square", 0.08),
    gobble: () => {
      for (let i = 0; i < 3; i++)
        tone(300 + Math.random() * 80, 0.09, "sawtooth", 0.07, i * 0.09, 180);
    },
    jump: () => tone(280, 0.16, "sine", 0.12, 0, 620),
    dash: () => { noise(0.22, 0.10); tone(180, 0.2, "sine", 0.08, 0, 420); },
    pickup: () => { tone(880, 0.08, "square", 0.07); tone(1320, 0.12, "square", 0.07, 0.07); },
    pie: () => { [660, 880, 1108, 1318].forEach((f, i) => tone(f, 0.12, "triangle", 0.09, i * 0.07)); },
    stumble: () => { noise(0.15, 0.14); tone(140, 0.18, "square", 0.08, 0, 90); },
    hit: () => { tone(220, 0.25, "sawtooth", 0.14, 0, 60); noise(0.2, 0.12); },
    nearMiss: () => tone(1180, 0.07, "sine", 0.06, 0, 1560),
    spotted: () => { tone(988, 0.09, "square", 0.07); tone(988, 0.09, "square", 0.07, 0.13); },
    caught: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, i * 0.22)); },
    win: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, "triangle", 0.11, i * 0.13)); },
  };
}
