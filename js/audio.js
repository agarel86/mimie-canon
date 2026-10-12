(function () {
  const bus = {
    ctx: null,
    muted: false,
    ensure() {
      if (this.muted) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, when, dur, type, gain) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime + (when || 0);
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(gain || 0.05, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    shoot() { this.tone(540, 0, 0.07, "triangle", 0.04); },
    ok() {
      this.tone(523, 0, 0.07, "triangle", 0.06);
      this.tone(659, 0.05, 0.08, "triangle", 0.055);
      this.tone(784, 0.1, 0.09, "triangle", 0.05);
      this.tone(1046, 0.16, 0.14, "sine", 0.04);
    },
    spare() { this.tone(698, 0, 0.1, "sine", 0.04); },
    bad() {
      this.tone(330, 0, 0.12, "sine", 0.04);
      this.tone(220, 0.08, 0.16, "sine", 0.035);
    },
    power() { this.tone(880, 0, 0.09, "triangle", 0.045); },
    level() {
      this.tone(523, 0, 0.1, "triangle", 0.05);
      this.tone(659, 0.09, 0.1, "triangle", 0.05);
      this.tone(784, 0.18, 0.1, "triangle", 0.05);
      this.tone(1046, 0.28, 0.24, "triangle", 0.055);
    },
    fanfare() {
      this.tone(523, 0, 0.12, "triangle", 0.05);
      this.tone(659, 0.12, 0.12, "triangle", 0.05);
      this.tone(784, 0.24, 0.18, "triangle", 0.05);
    }
  };
  window.MimieAudio = bus;
})();
