<!-- File: metronome-app/src/renderer/components/Metronome.vue -->
<template>
    <div class="metronome-container">
        <h1 class="title">Metr</h1>

        <!-- Beat visualization -->
        <div class="beat-display">
            <div v-for="(_, index) in timeSignature.beats" :key="index" :class="[
                'beat-indicator',
                { 'active': isPlaying && currentBeat === index },
                { 'accent': accentPattern[index] === 1 }
            ]" @click="toggleAccent(index)"></div>
        </div>

        <!-- Tempo control -->
        <div class="tempo-control">
            <div class="tempo-display">{{ tempo }} BPM</div>

            <div class="tempo-slider">
                <input type="range" min="30" max="250" step="1" v-model.number="tempo" @input="updateTempo">
            </div>

            <div class="tempo-buttons">
                <button class="tempo-button" @click="adjustTempo(-5)">-5</button>
                <button class="tempo-button" @click="adjustTempo(-1)">-1</button>
                <button class="tempo-button" @click="adjustTempo(1)">+1</button>
                <button class="tempo-button" @click="adjustTempo(5)">+5</button>
            </div>
        </div>

        <!-- Time signature selector -->
        <div class="time-signature-control">
            <label for="time-signature">Time Signature:</label>
            <select id="time-signature" v-model="timeSignature.beats" @change="updateTimeSignature">
                <option v-for="beats in [2, 3, 4, 5, 6, 7, 8, 9, 12]" :key="beats" :value="beats">
                    {{ beats }}/{{ timeSignature.noteValue }}
                </option>
            </select>
        </div>

        <!-- Playback controls -->
        <div class="playback-controls">
            <button class="play-button" :class="{ 'playing': isPlaying }" @click="togglePlayback">
                {{ isPlaying ? 'Stop' : 'Start' }}
            </button>

            <button class="tap-button" @click="tapTempo">
                Tap
            </button>
        </div>
    </div>
</template>

<script>
import MetronomeTiming from '../core/timing.js';

export default {
    name: 'Metronome',

    data() {
        return {
            metronome: null,
            isPlaying: false,
            tempo: 120,
            timeSignature: { beats: 4, noteValue: 4 },
            accentPattern: [1, 0, 0, 0],
            currentBeat: 0,
            tapTimes: [],
            initialSetupDone: false
        };
    },

    mounted() {
        // Setup metronome with a user interaction
        this.setupMetronome();
    },

    methods: {
        // Initialize the metronome engine (requires user interaction)
        setupMetronome() {
            if (this.initialSetupDone) return;

            // Initialize the metronome timing engine
            this.metronome = new MetronomeTiming().init();

            // Setup beat callback
            this.metronome.onBeat((beatNumber, isAccent) => {
                this.currentBeat = beatNumber;
            });

            // Set initial values
            this.metronome.setTempo(this.tempo);
            this.metronome.setTimeSignature(this.timeSignature.beats, this.timeSignature.noteValue);
            this.metronome.setAccentPattern(this.accentPattern);

            this.initialSetupDone = true;
        },

        // Start or stop the metronome
        togglePlayback() {
            // Ensure metronome is initialized
            this.setupMetronome();

            if (!this.isPlaying) {
                this.metronome.start();
                this.isPlaying = true;
            } else {
                this.metronome.stop();
                this.isPlaying = false;
            }
        },

        // Update tempo when slider changes
        updateTempo() {
            if (this.metronome) {
                this.metronome.setTempo(this.tempo);
            }
        },

        // Adjust tempo by a specific amount
        adjustTempo(amount) {
            this.tempo = Math.max(30, Math.min(250, this.tempo + amount));
            this.updateTempo();
        },

        // Update time signature
        updateTimeSignature() {
            // Reset accent pattern for new time signature
            this.accentPattern = Array(this.timeSignature.beats).fill(0);
            this.accentPattern[0] = 1; // Default accent on first beat

            if (this.metronome) {
                this.metronome.setTimeSignature(this.timeSignature.beats, this.timeSignature.noteValue);
                this.metronome.setAccentPattern(this.accentPattern);
            }
        },

        // Toggle accent on a specific beat
        toggleAccent(beatIndex) {
            this.accentPattern[beatIndex] = this.accentPattern[beatIndex] === 1 ? 0 : 1;

            if (this.metronome) {
                this.metronome.setAccentPattern(this.accentPattern);
            }
        },

        // Calculate tempo from taps
        tapTempo() {
            // Ensure metronome is initialized
            this.setupMetronome();

            const now = Date.now();

            // Add current tap time
            this.tapTimes.push(now);

            // Only keep the last 3 taps
            if (this.tapTimes.length > 3) {
                this.tapTimes.shift();
            }

            // Calculate tempo if we have at least 2 taps
            if (this.tapTimes.length >= 2) {
                // Calculate time differences between taps
                const intervals = [];
                for (let i = 1; i < this.tapTimes.length; i++) {
                    intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
                }

                // Average the intervals
                const averageInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

                // Convert to BPM
                const newTempo = Math.round(60000 / averageInterval);

                // Update if in valid range
                if (newTempo >= 30 && newTempo <= 250) {
                    this.tempo = newTempo;
                    this.updateTempo();
                }
            }
        }
    },

    beforeUnmount() {
        // Clean up
        if (this.metronome && this.isPlaying) {
            this.metronome.stop();
        }
    }
}
</script>

<style scoped>
.metronome-container {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.title {
    text-align: center;
    margin-bottom: 10px;
    color: #333;
}

.beat-display {
    display: flex;
    justify-content: space-around;
    margin: 10px 0;
}

.beat-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #e0e0e0;
    cursor: pointer;
    transition: all 0.1s ease;
}

.beat-indicator.accent {
    border: 2px solid #2196F3;
}

.beat-indicator.active {
    transform: scale(1.2);
    background-color: #2196F3;
}

.tempo-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.tempo-display {
    font-size: 1.5rem;
    font-weight: bold;
}

.tempo-slider {
    width: 100%;
}

.tempo-slider input {
    width: 100%;
    height: 8px;
}

.tempo-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.tempo-button {
    background-color: #e0e0e0;
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    font-weight: bold;
}

.tempo-button:hover {
    background-color: #d0d0d0;
}

.time-signature-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.time-signature-control select {
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.playback-controls {
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
}

.play-button,
.tap-button {
    padding: 12px 24px;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
}

.play-button {
    background-color: #4CAF50;
    color: white;
}

.play-button.playing {
    background-color: #f44336;
}

.tap-button {
    background-color: #2196F3;
    color: white;
}

.play-button:hover,
.tap-button:hover {
    opacity: 0.9;
}
</style>