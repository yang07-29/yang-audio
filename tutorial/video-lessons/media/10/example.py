import numpy as np
rng = np.random.default_rng(10)
earlier = rng.normal(size=2048)
# 第二路晚两点，用补零避免环绕到开头
later = np.r_[np.zeros(2), earlier[:-2]]
N = 4096  # 足够长的FFT用于避免相关混叠
cross = np.fft.rfft(later, N)*np.conj(np.fft.rfft(earlier, N))
cross /= np.maximum(abs(cross), 1e-12)  # PHAT只保留相位关系
corr = np.fft.irfft(cross, N)
lags = np.arange(-4, 5)
values = corr[lags % N]  # 负时延在FFT结果尾部
delay = int(lags[np.argmax(values)])
angle = np.degrees(np.arcsin(delay*343/(16000*0.08)))
print('第二路时延/点:', delay)
print('法线角度/度:', round(angle, 3))
print('最大时差/点:', round(0.08/343*16000, 3))
