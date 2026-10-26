import numpy as np
fs = 16000
t = np.arange(fs) / fs
s = 0.5 * np.sin(2 * np.pi * 1000 * t)  # 干净目标
n = np.random.default_rng(7).normal(size=s.shape)
ps, pn = np.mean(s ** 2), np.mean(n ** 2)  # 实际均方值
snr_db = 10.0
alpha = np.sqrt(ps / (pn * 10 ** (snr_db / 10)))
noise = alpha * n  # 保留真正加入的噪声，便于核验
mixed = s + noise
rms = np.sqrt(ps)
t_ms = t * 1000
print('峰值/RMS:', np.max(np.abs(s)), rms)
print('RMS dBFS:', 20 * np.log10(rms))
print('实测SNR:', 10 * np.log10(ps / np.mean(noise ** 2)))
print('混合峰值:', np.max(np.abs(mixed)))
