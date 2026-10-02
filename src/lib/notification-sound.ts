export function playNotificationSound(context: AudioContext) {
  if (context.state !== "running") return false;
  // Two short, soft notes; no external audio file or network request is needed.
  for (const [offset, frequency] of [[0, 660], [0.16, 880]]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + offset!;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency!, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + 0.22);
  }
  return true;
}
