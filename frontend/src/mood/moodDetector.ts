export type Mood = 'neutral' | 'focus' | 'curious' | 'uncertain';

export class MoodDetector {
  private static keywordMap = {
    focus: ['explain', 'how', 'why', 'detail', 'understand'],
    curious: ['more', 'also', 'connected', 'related', 'interesting'],
    uncertain: ['maybe', 'not sure', 'perhaps', 'unclear', 'dont know', "don't know"]
  };

  private static history: Mood[] = [];
  private static currentMood: Mood = 'neutral';
  private static readonly DEBOUNCE_COUNT = 3;
  private static baselineMood: Mood = 'neutral';

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('personality:changed', (e: Event) => {
        const ce = e as CustomEvent;
        if (ce.detail?.persona?.preferredMood) {
          this.baselineMood = ce.detail.persona.preferredMood;
          this.forceMood(this.baselineMood);
        }
      });
    }
  }

  static analyzeText(text: string): Mood {
    const lowerText = text.toLowerCase();
    
    let detectedMood: Mood = this.baselineMood;
    
    if (this.keywordMap.focus.some(kw => lowerText.includes(kw))) detectedMood = 'focus';
    else if (this.keywordMap.curious.some(kw => lowerText.includes(kw))) detectedMood = 'curious';
    else if (this.keywordMap.uncertain.some(kw => lowerText.includes(kw))) detectedMood = 'uncertain';
    
    this.history.push(detectedMood);
    if (this.history.length > this.DEBOUNCE_COUNT) {
      this.history.shift();
    }

    if (this.history.length === this.DEBOUNCE_COUNT && this.history.every(m => m === detectedMood)) {
      if (this.currentMood !== detectedMood) {
        this.currentMood = detectedMood;
        this.emitMoodChange(this.currentMood);
      }
    } else if (detectedMood === 'uncertain') {
      this.currentMood = detectedMood;
      this.emitMoodChange(this.currentMood);
    }

    return this.currentMood;
  }

  static forceMood(mood: Mood) {
    this.currentMood = mood;
    this.emitMoodChange(mood);
  }

  private static emitMoodChange(mood: Mood) {
    window.dispatchEvent(new CustomEvent('mood:changed', { detail: { mood } }));
    
    // Phase 19: Emit particle effect for mood shift
    if (typeof window !== 'undefined' && mood !== 'neutral') {
      // Need 3D position of avatar, but moodDetector doesn't have it directly.
      // VRMScene should listen to mood:changed or we just emit it with null and let the engine handle it.
      // Wait, we can just emit it and let whoever has the 3D position fill it in.
      // For now, emit it at origin, VRMScene handles the translation usually.
      window.dispatchEvent(new CustomEvent('fx:trigger', { 
        detail: { effect: 'mood_shift', position: { x: 0, y: 1.0, z: 0 } } 
      }));
    }
  }
}
