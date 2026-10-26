import numpy as np
fs = 8000  # 每秒采样八千次
n = np.arange(80)  # 80个整数编号，不是秒
t = n / fs  # 编号换算成秒
f = 1000  # 一千赫兹，每秒振动一千次
tone = 0.4 * np.sin(2 * np.pi * f * t)
# 相位增加π，相当于同频波形上下翻转
opposite = 0.4 * np.sin(2 * np.pi * f * t + np.pi)
summed = tone + opposite  # 逐个时间点相加
# 加入第三谐波，改变形状，不等于整体频率乘三
rich = tone + 0.2 * np.sin(2 * np.pi * 3 * f * t)
t_ms = t * 1000  # 绘图横轴使用毫秒
print('数组形状:', tone.shape)
print('每周期点数:', fs / f)
print('前八点:', np.round(tone[:8], 3))
print('反相残差:', np.max(np.abs(summed)))
