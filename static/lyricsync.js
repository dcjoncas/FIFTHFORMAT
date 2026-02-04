// -------------------------------------------------------------
// Fifth Format — Simple Lyric Sync Engine (duration-based)
// -------------------------------------------------------------

export class LyricSync {
  constructor(audioElement, lyrics, onLineChange) {
    this.audio = audioElement;
    this.lyrics = (lyrics || []).filter(
      (line) => line && line.trim() !== ""
    );
    this.onLineChange =
      typeof onLineChange === "function" ? onLineChange : () => {};

    this.currentIndex = -1;
    this.numLines = this.lyrics.length;

    // Tweak these to taste:
    this.startOffset = 1.5;   // seconds before first line appears
    this.tailHold = 1.5;      // seconds to keep last line on screen
    this.leadSeconds = 4.0;   // show lyrics ~2 seconds EARLIER than raw audio time
  }

  async init() {
    // Reserved for future timestamped-lyrics use - this should be fun
    return Promise.resolve();
  }

  reset() {
    this.currentIndex = -1;
    this.onLineChange(-1);
  }

  update() {
    if (!this.audio || this.numLines === 0) return;

    const dur = this.audio.duration;
    if (!dur || !Number.isFinite(dur) || dur <= 0) {
      return;
    }

    // Shift lyrics earlier by leadSeconds
    const effectiveTime = this.audio.currentTime + this.leadSeconds;

    // Before lyrics start
    if (effectiveTime < this.startOffset) {
      if (this.currentIndex !== -1) {
        this.currentIndex = -1;
        this.onLineChange(-1);
      }
      return;
    }

    const start = this.startOffset;
    const end = Math.max(start + 1, dur - this.tailHold);

    const clamped = Math.min(Math.max(effectiveTime, start), end);
    const progress = (clamped - start) / (end - start);

    let idx = Math.floor(progress * this.numLines);
    if (idx >= this.numLines) idx = this.numLines - 1;

    if (idx !== this.currentIndex) {
      this.currentIndex = idx;
      this.onLineChange(idx);
    }
  }
}
