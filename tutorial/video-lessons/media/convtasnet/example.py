import numpy as np
# 四点教学波形，z代表已完成公共增益校准的两路
x = np.array([1., 2., -1., 0.])
z = np.array([[0.4, 1., -0.4, 0.2], [0.4, 0.8, -0.4, -0.1]])
raw_sum = z.sum(axis=0)
r = x-raw_sum  # 残差可以为负，不是非负噪声强度
y = z+r[None, :]/2  # 两路各分一半残差
fixed_sum = y.sum(axis=0)
position = np.arange(1, 5)
# 另一个人为评分矩阵：行是参考，列是预测，不由四点波形计算
Q = np.array([[-3., 12.], [11., -4.]])
normal = (Q[0, 0]+Q[1, 1])/2
swapped = (Q[0, 1]+Q[1, 0])/2
print('残差:', np.round(r, 3))
print('求和误差:', round(np.max(abs(fixed_sum-x)), 12))
print('原配对/交换:', normal, swapped)
