import numpy as np
fs = 16000
# 两个频率一起输入，观察滤波不是整体调小音量
t = np.arange(1600) / fs
x = np.sin(2*np.pi*500*t) + 0.3*np.sin(2*np.pi*6000*t)
h = np.ones(3) / 3  # 三个抽头的增益和为一
y = np.convolve(x, h, mode='full')[:len(x)]
# 按系数直接计算响应，避开开头的初始化暂态
freq = np.array([500., 6000.])
H = np.exp(-2j*np.pi*freq[:, None]*np.arange(3)/fs) @ h
print('500与6000 Hz增益/dB:', np.round(20*np.log10(abs(H)), 3))
print('线性相位延迟/ms:', 1000*(len(h)-1)/(2*fs))
# 一个尖峰经过滤波会扩散到三个采样
print('尖峰输出:', np.convolve([0, 0, 3, 0, 0], h)[:5])
