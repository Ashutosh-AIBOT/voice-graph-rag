export class SpatialAudioEngine {
  private static ctx: AudioContext | null = null;
  private static panner: PannerNode | null = null;
  private static source: MediaElementAudioSourceNode | null = null;
  private static convolver: ConvolverNode | null = null;
  private static masterGain: GainNode | null = null;
  private static initialized: boolean = false;

  private static panRange = 1.0;
  private static reverbThresholdZ = -1.0;
  private static distanceGainRolloff = 0.3;

  public static init() {
    if (this.initialized) return;
    
    const audioElement = document.getElementById('agent-audio') as HTMLAudioElement;
    if (!audioElement) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.source = this.ctx.createMediaElementSource(audioElement);
      
      this.panner = this.ctx.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 1;
      this.panner.maxDistance = 10000;
      this.panner.rolloffFactor = 1;

      // Create a convolver for reverb (simplified impulse response)
      this.convolver = this.ctx.createConvolver();
      this.createImpulseResponse();

      this.masterGain = this.ctx.createGain();

      // Audio Graph: Source -> Panner -> (Convolver branch) -> MasterGain -> Destination
      this.source.connect(this.panner);
      this.panner.connect(this.masterGain);
      
      // Initially disconnect convolver (dry signal)
      // We will route Panner -> Convolver -> MasterGain when deep in Z
      
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      
      // Listen for position updates
      window.addEventListener('audio:spatial-update', this.onPositionUpdate.bind(this) as EventListener);
      
      // Auto-resume AudioContext on user interaction
      const resumeAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      };
      window.addEventListener('click', resumeAudio, { once: true });
      window.addEventListener('touchstart', resumeAudio, { once: true });
      
    } catch (e) {
      console.error("Failed to initialize spatial audio:", e);
    }
  }

  private static createImpulseResponse() {
    if (!this.ctx || !this.convolver) return;
    const rate = this.ctx.sampleRate;
    const length = rate * 2; // 2 seconds
    const impulse = this.ctx.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Simple exponential decay white noise for reverb illusion
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    this.convolver.buffer = impulse;
  }

  private static onPositionUpdate(e: CustomEvent) {
    if (!this.panner || !this.ctx || !this.masterGain || !this.convolver) return;
    
    const { x, y, z, isBrowseMode } = e.detail;

    if (isBrowseMode) {
      // Centered, dry audio
      this.panner.positionX.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      this.panner.positionY.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      this.panner.positionZ.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.1);
      
      // Disconnect reverb
      try { this.panner.disconnect(this.convolver); } catch(e){}
      return;
    }

    // Map screen X [-1, 1] to pan X
    this.panner.positionX.setTargetAtTime(x * this.panRange, this.ctx.currentTime, 0.1);
    
    // Z depth mapping
    this.panner.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.1);

    if (z < this.reverbThresholdZ) {
      // Push into background: lower gain and add reverb
      const depth = Math.abs(z - this.reverbThresholdZ);
      const gainDrop = Math.max(0.3, 1.0 - (depth * this.distanceGainRolloff));
      this.masterGain.gain.setTargetAtTime(gainDrop, this.ctx.currentTime, 0.2);
      
      // Route through convolver
      try { 
        this.panner.connect(this.convolver);
        this.convolver.connect(this.masterGain);
      } catch(e){}
    } else {
      // Foreground: full gain, dry
      this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.2);
      try { 
        this.panner.disconnect(this.convolver); 
        this.convolver.disconnect(this.masterGain);
      } catch(e){}
    }
  }
}
