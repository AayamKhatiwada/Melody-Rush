import wave, math, struct

# Equal temperament frequencies from C4 to E5
notes = {
    'C4': 261.63,
    'Db4': 277.18,
    'D4': 293.66,
    'Eb4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'Gb4': 369.99,
    'G4': 392.00,
    'Ab4': 415.30,
    'A4': 440.00,
    'Bb4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'Db5': 554.37,
    'D5': 587.33,
    'Eb5': 622.25,
    'E5': 659.25
}

def generate_piano_wav(filename, frequency, duration, volume=0.5):
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for i in range(num_samples):
            t = float(i) / sample_rate
            val = math.sin(2.0 * math.pi * frequency * t) * 1.0
            val += math.sin(2.0 * math.pi * frequency * 2 * t) * 0.4
            val += math.sin(2.0 * math.pi * frequency * 3 * t) * 0.15
            val += math.sin(2.0 * math.pi * frequency * 4 * t) * 0.05
            val /= 1.6
            attack_time = 0.01
            if t < attack_time: envelope = t / attack_time
            else: envelope = math.exp(-7.0 * (t - attack_time))
            sample = int(val * volume * 32767.0 * envelope)
            f.writeframes(struct.pack('h', sample))

for name, freq in notes.items():
    generate_piano_wav(f'src/assets/sounds/{name}.wav', freq, 0.5, 0.8)
