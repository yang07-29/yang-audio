import numpy as np
fs = 16000  # 一秒记录16000个采样点
t = np.arange(fs) / fs  # 一秒的时间坐标
x = 0.5 * np.sin(2 * np.pi * 1000 * t)
# 单独改变幅度，频率与数组长度不变
half = x * 0.5
peak = np.max(np.abs(x))  # 最大绝对值
rms = np.sqrt(np.mean(x ** 2))  # 平方、平均、开根号
t_ms = t * 1000  # 图用毫秒，便于观察周期
print('shape/dtype:', x.shape, x.dtype)
print('时长:', len(x) / fs, '秒')
print('峰值与RMS:', peak, rms)
print('数值全部有限:', np.isfinite(x).all())
print('减半后长度:', len(half))
