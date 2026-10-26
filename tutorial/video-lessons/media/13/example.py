import numpy as np
# 行是时间步；列依次为 blank、啊
p = np.array([[0.4, 0.6], [0.5, 0.5]])
paths = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
# 每条路径的两步概率相乘
prob = p[0, paths[:, 0]] * p[1, paths[:, 1]]
valid = np.array([False, True, True, True])
mass = prob * valid  # 非法路径对目标文本贡献为零
total = mass.sum()
loss = -np.log(total)
idx = np.arange(1, 5)
print("路径概率", prob.round(3).tolist())
print("目标概率", round(total, 3), "损失", round(loss, 5))
assert np.isclose(total, 0.8)
