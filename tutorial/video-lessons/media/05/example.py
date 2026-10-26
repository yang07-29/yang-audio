import numpy as np
fs, N = 8000, 256  # 观察32毫秒
t = np.arange(N) / fs
x = 0.3*np.sin(2*np.pi*500*t) + 0.1*np.sin(2*np.pi*1800*t)
spec = np.fft.rfft(x)  # 保留复数幅度与相位
window = np.hanning(N)
win_spec = np.fft.rfft(x * window)
freq = np.fft.rfftfreq(N, 1/fs)
amp = 2 * np.abs(spec) / N  # 单边幅度谱
amp[[0, -1]] /= 2  # DC和奈奎斯特点不翻倍
win_amp = 2 * np.abs(win_spec) / window.sum()
win_amp[[0, -1]] /= 2
restored = np.fft.irfft(spec, n=N)  # 保留相位的回环
wrong = np.fft.irfft(np.abs(spec), n=N)  # 故意丢相位
print('频率间隔:', fs/N, 'Hz')
print('FFT形状:', spec.shape)
print('正确回环误差:', np.max(np.abs(restored-x)))
print('丢相位误差:', np.max(np.abs(wrong-x)))
