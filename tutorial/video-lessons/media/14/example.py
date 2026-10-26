import numpy as np
# 三个单元，每个由二维教学向量表示
units = np.array([[1., 0.], [0., 1.], [1., 1.]])
durations = np.array([2, 1, 3])
assert np.all(durations >= 0)
# 沿单元轴复制，不是复制特征维
expanded = np.repeat(units, durations, axis=0)
frame = np.arange(1, len(expanded) + 1)
feature0, feature1 = expanded[:, 0], expanded[:, 1]
hop, fs = 256, 16000
nominal_ms = len(expanded) * hop / fs * 1000
for row in expanded:
    print(row.astype(int).tolist())
print("形状", expanded.shape)
print("名义时长", nominal_ms, "ms")
assert expanded.shape == (6, 2)
