import numpy as np
fs = 8000  # 每秒8000点，与纯音频率不同
n = np.arange(80)
t = n / fs  # 80点对应10毫秒
x = 0.8 * np.sin(2 * np.pi * 400 * t)
step = 0.25  # 故意用粗刻度，让量化差别可见
q = step * np.rint(x / step)
# 真正的16位整数：先缩放、取整、限幅，再转类型
pcm = np.clip(np.rint(x * 32768), -32768, 32767).astype(np.int16)
y = pcm.astype(float) / 32768  # 还原本课的浮点约定
t_ms = t * 1000
print('时长:', len(x) / fs, '秒')
print('粗量化最大误差:', np.max(np.abs(q - x)))
print('16位最大误差:', np.max(np.abs(y - x)))
print('16位数据字节数:', pcm.nbytes)
