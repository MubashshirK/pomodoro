type SoundName = "work-start" | "break-start" | "resume-session" | "session-end";

class SoundManager {
  private audio: Partial<Record<SoundName, HTMLAudioElement>> = {};
  private muted = false;
  private volume = 0.8;

  preload() {
    if (typeof window === "undefined") return;
    const defs: { name: SoundName; src: string }[] = [
      { name: "work-start", src: "/sounds/work-start.mp3" },
      { name: "break-start", src: "/sounds/break-start.mp3" },
      { name: "resume-session", src: "/sounds/resume-session.mp3" },
      { name: "session-end", src: "/sounds/session-end.mp3" },
    ];
    for (const { name, src } of defs) {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = this.volume;
      this.audio[name] = a;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    for (const a of Object.values(this.audio)) {
      if (a) a.volume = this.volume;
    }
  }

  play(name: SoundName) {
    if (this.muted) return;
    const base = this.audio[name];
    if (!base) return;
    try {
      const clone = base.cloneNode(true) as HTMLAudioElement;
      clone.volume = this.volume;
      void clone.play();
    } catch {
      /* ignore autoplay rejections */
    }
  }
}

export const soundManager = new SoundManager();
