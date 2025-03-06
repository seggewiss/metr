// File: metronome-app/src/renderer/core/timing.js
// This implements the core timing engine for the metronome

class MetronomeTiming {
  constructor() {
    // Initialize with default values
    this.tempo = 120; // BPM (beats per minute)
    this.timeSignature = { beats: 4, noteValue: 4 }; // 4/4 time
    this.accentPattern = [1, 0, 0, 0]; // Accent first beat by default
    this.currentBeat = 0;
    this.isPlaying = false;
    this.nextNoteTime = 0;
    this.audioContext = null;
    this.schedulerInterval = null;
    this.scheduleAheadTime = 0.1; // Schedule 100ms ahead
    this.onBeatCallback = null;
    
    // Sounds
    this.clickSounds = {
      high: null, // For accented beats
      low: null   // For regular beats
    };
  }

  // Initialize audio context - must be called after user interaction
  // due to browser autoplay policies
  init() {
    this.audioContext = new window.AudioContext();
    
    // Create click sounds
    this.createClickSounds();
    
    return this;
  }
  
  // Create the click sounds
  createClickSounds() {
    // Create sound for accented beat (higher pitch)
    this.clickSounds.high = (time) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 1000; // Hz
      gain.gain.value = 0.5;
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(time);
      osc.stop(time + 0.05); // Short duration
    };
    
    // Create sound for regular beat (lower pitch)
    this.clickSounds.low = (time) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 800; // Hz
      gain.gain.value = 0.3;
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(time);
      osc.stop(time + 0.05); // Short duration
    };
  }
  
  // Start the metronome
  start() {
    if (this.isPlaying) return;
    
    // Resume audio context if it was suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    // Notify Electron main process
    if (window.metronome) {
      window.metronome.start();
    }
    
    // Start the scheduler
    this.schedulerInterval = setInterval(() => this.scheduler(), 25);
  }
  
  // Stop the metronome
  stop() {
    this.isPlaying = false;
    clearInterval(this.schedulerInterval);
    
    // Notify Electron main process
    if (window.metronome) {
      window.metronome.stop();
    }
  }
  
  // Schedule notes ahead of time for precise timing
  scheduler() {
    // Schedule ahead while there's time remaining and we're playing
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime && 
           this.isPlaying) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.advanceNote();
    }
  }
  
  // Schedule a note to play at the specified time
  scheduleNote(beatNumber, time) {
    // Determine if this beat should be accented
    const isAccent = this.accentPattern[beatNumber % this.accentPattern.length] === 1;
    
    // Play the appropriate sound
    if (isAccent) {
      this.clickSounds.high(time);
    } else {
      this.clickSounds.low(time);
    }
    
    // Notify UI for visual feedback (using setTimeout to sync with audio)
    if (this.onBeatCallback) {
      const secondsToWait = (time - this.audioContext.currentTime) * 1000;
      const waitTime = Math.max(0, secondsToWait);
      
      setTimeout(() => {
        this.onBeatCallback(beatNumber, isAccent);
      }, waitTime);
    }
  }
  
  // Advance to the next beat
  advanceNote() {
    // Calculate beat duration based on tempo (BPM)
    const secondsPerBeat = 60.0 / this.tempo;
    
    // Advance time for next beat
    this.nextNoteTime += secondsPerBeat;
    
    // Advance beat counter within the measure
    this.currentBeat = (this.currentBeat + 1) % this.timeSignature.beats;
  }
  
  // Set the tempo (BPM)
  setTempo(newTempo) {
    // Clamp tempo between reasonable limits
    this.tempo = Math.max(30, Math.min(300, newTempo));
  }
  
  // Set the time signature
  setTimeSignature(beats, noteValue) {
    this.timeSignature = { beats, noteValue };
    
    // Reset accent pattern to match new time signature
    this.accentPattern = Array(beats).fill(0);
    this.accentPattern[0] = 1; // Default accent on first beat
  }
  
  // Set custom accent pattern
  setAccentPattern(pattern) {
    if (pattern.length === this.timeSignature.beats) {
      this.accentPattern = [...pattern];
    }
  }
  
  // Set callback for beat events
  onBeat(callback) {
    this.onBeatCallback = callback;
  }
  
  // Calculate tempo from tapped beats
  tapTempo(tapTime) {
    // Implementation for tap tempo calculation
    // To be added if needed
  }
}

export default MetronomeTiming;