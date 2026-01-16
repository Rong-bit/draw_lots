
export const playSound = (type: 'SOUND_1' | 'SOUND_2') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'SOUND_1') {
      // 科技感開獎音
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(400, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    } else {
      // 傳統叮咚音
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      o1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      o2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      o1.start(); o2.start();
      o1.stop(ctx.currentTime + 0.5); o2.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.error("Audio context error:", e);
  }
};
