import wave, math, struct

def generate_wav(filename, frequency, duration, volume=0.5, wave_type='sine'):
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = float(i) / sample_rate
            if wave_type == 'sine':
                value = math.sin(2.0 * math.pi * frequency * t)
            elif wave_type == 'square':
                value = 1.0 if math.sin(2.0 * math.pi * frequency * t) > 0 else -1.0
            elif wave_type == 'sawtooth':
                value = 2.0 * (t * frequency - math.floor(t * frequency + 0.5))
            
            # envelope to avoid clicking
            envelope = 1.0
            if i < 441: envelope = i / 441.0
            elif num_samples - i < 441: envelope = (num_samples - i) / 441.0
                
            sample = int(value * volume * 32767.0 * envelope)
            f.writeframes(struct.pack('h', sample))

# Tap: high ping
generate_wav('src/assets/sounds/tap.wav', 880, 0.1, 0.5, 'sine')
# Miss: low buzz
generate_wav('src/assets/sounds/miss.wav', 150, 0.3, 0.6, 'sawtooth')
# Game Over: descending
generate_wav('src/assets/sounds/gameover.wav', 100, 1.0, 0.6, 'square')
# Background loop: a very simple loop (or we can skip generating a huge background file and use a remote URL for background)
