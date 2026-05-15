import wave, math, struct

def generate_game_over(filename):
    sample_rate = 44100
    duration = 1.5
    num_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = float(i) / sample_rate
            
            # Sequence: C4 (0-0.3s), Bb3 (0.3-0.6s), Ab3 (0.6-0.9s), G3 (0.9-1.5s)
            freq = 0
            t_env = 0
            if t < 0.3:
                freq = 261.63 # C4
                t_env = t
            elif t < 0.6:
                freq = 233.08 # Bb3
                t_env = t - 0.3
            elif t < 0.9:
                freq = 207.65 # Ab3
                t_env = t - 0.6
            else:
                freq = 196.00 # G3
                t_env = t - 0.9
                
            # Piano harmonics
            val = math.sin(2.0 * math.pi * freq * t) * 1.0
            val += math.sin(2.0 * math.pi * freq * 2 * t) * 0.4
            val += math.sin(2.0 * math.pi * freq * 3 * t) * 0.15
            
            val /= 1.55
            
            # Envelope per note
            attack_time = 0.01
            if t_env < attack_time:
                envelope = t_env / attack_time
            else:
                envelope = math.exp(-4.0 * (t_env - attack_time))
                
            sample = int(val * 0.7 * 32767.0 * envelope)
            f.writeframes(struct.pack('h', sample))

generate_game_over('src/assets/sounds/gameover.wav')
