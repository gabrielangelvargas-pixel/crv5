import { expect, it, vi } from "vitest";
import { playNotificationSound } from "./notification-sound";
it("no reproduce si el navegador todavía bloquea el audio", () => {
 expect(playNotificationSound({ state: "suspended" } as AudioContext)).toBe(false);
});
it("produce dos notas cortas con volumen suave y libera sus nodos", () => {
 const oscillator = { type: "", frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null as (() => void) | null };
 const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
 const context = { state: "running", currentTime: 1, destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain) };
 expect(playNotificationSound(context as unknown as AudioContext)).toBe(true);
 expect(context.createOscillator).toHaveBeenCalledTimes(2);
 expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(660, 1);
 expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 1.16);
 oscillator.onended?.();
 expect(oscillator.disconnect).toHaveBeenCalled();
 expect(gain.disconnect).toHaveBeenCalled();
});
