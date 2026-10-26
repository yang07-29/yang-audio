import numpy as np
rng = np.random.default_rng(7)  # 固定随机数便于复现
fs = 16000
t = np.arange(1600) / fs
clean = np.sin(2*np.pi*300*t)
noise = rng.normal(size=len(t)) * 0.5
mixture = clean + noise
# 五点对称平均只作离线教学基线
filtered = np.convolve(mixture, np.ones(5)/5, mode="same")
snr_in = 10*np.log10(np.sum(clean**2)/np.sum((mixture-clean)**2))
snr_out = 10*np.log10(np.sum(clean**2)/np.sum((filtered-clean)**2))
print("输入 SNR", round(snr_in, 2), "dB")
print("处理后 SNR", round(snr_out, 2), "dB")
print("仅为合成单音；不是语音模型成绩")
