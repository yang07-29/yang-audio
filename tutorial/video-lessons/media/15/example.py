import numpy as np
# 分数来自教学例子，不是声纹模型实测
same = np.array([0.9, 0.8, 0.6, 0.4])
different = np.array([0.7, 0.5, 0.3, 0.1])
threshold = np.linspace(0, 1, 101)
# 分数大于等于阈值，接受为同人
far = (different[None, :] >= threshold[:, None]).mean(axis=1)
frr = (same[None, :] < threshold[:, None]).mean(axis=1)
for value in [0.6, 0.8]:
    a = np.mean(different >= value)
    r = np.mean(same < value)
    print("阈值", value, "FAR", a, "FRR", r)
assert np.isclose(np.mean(different >= 0.6), 0.25)
