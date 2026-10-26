import numpy as np
steps = np.arange(10)
curves = []
for lr in [0.1, 0.3]:
    w = 0.5; losses = []  # 同一起点，只改变学习率
    for _ in steps:
        prediction = w*2.0
        losses.append((prediction-3.0)**2)
        grad = 2*(prediction-3.0)*2.0  # 链式法则的两项
        w -= lr*grad  # 沿负梯度方向移动
    curves.append(np.array(losses))
# 对数仅用于绘图，训练优化的仍是原平方误差
stable_db = 10*np.log10(curves[0]+1e-12)
large_db = 10*np.log10(curves[1]+1e-12)
print('初始损失:', curves[0][0])
print('一步后lr=0.1:', round(curves[0][1], 4))
print('一步后lr=0.3:', round(curves[1][1], 4))
