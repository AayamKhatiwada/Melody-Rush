import wave, math, struct

notes = {
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25
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

