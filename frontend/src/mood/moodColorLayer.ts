import { Mood } from './moodDetector';

export class MoodColorLayer {
  static applyMoodStyles(mood: Mood, avatarX: number, avatarY: number) {
    const root = document.documentElement;
    
    root.style.setProperty('--mood-glow-x', `${avatarX}px`);
    root.style.setProperty('--mood-glow-y', `${avatarY}px`);

    switch (mood) {
      case 'focus':
        root.style.setProperty('--mood-hue', '220');
        root.style.setProperty('--mood-intensity', '0.4');
        root.style.setProperty('--mood-sat', '40%');
        break;
      case 'curious':
        root.style.setProperty('--mood-hue', '35');
        root.style.setProperty('--mood-intensity', '0.8');
        root.style.setProperty('--mood-sat', '80%');
        break;
      case 'uncertain':
        root.style.setProperty('--mood-hue', '0');
        root.style.setProperty('--mood-intensity', '0.2');
        root.style.setProperty('--mood-sat', '0%');
        break;
      case 'neutral':
      default:
        root.style.setProperty('--mood-hue', '163'); 
        root.style.setProperty('--mood-intensity', '0.6');
        root.style.setProperty('--mood-sat', '100%');
        break;
    }
  }

  static initialize() {
    window.addEventListener('mood:changed', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.applyMoodStyles(customEvent.detail.mood, window.innerWidth / 2, window.innerHeight / 2);
    });
  }
}
