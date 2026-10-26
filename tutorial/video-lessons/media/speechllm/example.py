import numpy as np
# 一维教学 RVQ：每级表示当前剩余误差
target = 0.73
books = [np.array([0., 0.5, 1.]), np.array([-0.25, 0., 0.25]), np.array([-0.04, 0., 0.04])]
residual, reconstruction = target, 0.
values = [0.]
for book in books:
    chosen = book[np.argmin(np.abs(residual-book))]
    reconstruction += chosen
    residual = target-reconstruction
    values.append(reconstruction)
    print("选", round(chosen, 2), "残差", round(residual, 2))
stage = np.arange(4)
estimate = np.array(values)
truth = np.full(4, target)
print("示例码率", 50*8*10, "bit/s")
