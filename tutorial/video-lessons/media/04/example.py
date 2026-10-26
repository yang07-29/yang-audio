import numpy as np
# 行是时间、列是声道；右路幅度是左路两倍
audio = np.array([[0.1, 0.2], [0.2, 0.4],
                  [-0.1, -0.2], [-0.2, -0.4]], dtype=float)
gains = np.array([1.0, 0.5])  # 每个声道一个增益
adjusted = audio * gains  # 从最后一维对齐广播
rms = np.sqrt(np.mean(adjusted ** 2, axis=0))
mono = adjusted.mean(axis=1)  # 仅在允许混音时合并声道
index = np.arange(4)
left, right, raw_right = adjusted[:, 0], adjusted[:, 1], audio[:, 1]
# 一个独立的编号示例：窗长4、帧移2，不补零
x = np.arange(10)
frames = np.stack([x[i:i+4] for i in range(0, 7, 2)])
print('输入/输出/单声道:', audio.shape, adjusted.shape, mono.shape)
print('每声道RMS:', rms)
print('切片形状:', audio[:, 0].shape, audio[:, :1].shape)
print('分帧结果:', frames)
