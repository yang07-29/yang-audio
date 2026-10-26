import numpy as np
fs, N, B = 16000, 512, 20  # 一帧32毫秒，20个频带
t = np.arange(N) / fs
x = 0.5*np.sin(2*np.pi*500*t) + 0.2*np.sin(2*np.pi*1500*t)
freq = np.fft.rfftfreq(N, 1/fs)
p = np.abs(np.fft.rfft(x * np.hanning(N))) ** 2
m = np.linspace(0, 2595*np.log10(1+8000/700), B+2)
hz = 700 * (10 ** (m/2595) - 1)  # Mel端点映射回Hz
a, b, c = hz[:-2, None], hz[1:-1, None], hz[2:, None]
bank = np.maximum(0, np.minimum((freq-a)/(b-a), (c-freq)/(c-b)))
energy = bank @ p  # (20,257)乘(257,)，每带一个加权和
log_mel = np.log(np.maximum(energy, 1e-10))
band = np.arange(B)
k = np.arange(13)[:, None]  # 保留13个倒谱系数
dct = np.cos(np.pi*(band+0.5)*k/B) * np.sqrt(2/B)
mfcc = (dct * np.where(k == 0, 1/np.sqrt(2), 1)) @ log_mel
print('谱/Mel/MFCC:', p.shape, log_mel.shape, mfcc.shape)
print('前四个MFCC:', np.round(mfcc[:4], 2))
