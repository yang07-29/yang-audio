import numpy as np
rng = np.random.default_rng(8)
x = rng.normal(0, 0.1, 4000)
h = np.zeros(16); h[[2, 7]] = [0.7, 0.2]
d = np.convolve(x, h)[:len(x)]  # 无近端的理想回声
w = np.zeros(16); history = np.zeros(16)
residual = np.zeros(len(x)); path_error = np.zeros(len(x))
for n in range(len(x)):
    history[1:] = history[:-1].copy(); history[0] = x[n]
    residual[n] = d[n] - w @ history  # 先预测再求残差
    w += 0.3*residual[n]*history/(history @ history + 1e-8)
    path_error[n] = np.sum((w-h)**2)  # 仿真才知道真实h
step = np.arange(len(x))
error_db = 10*np.log10(path_error/np.sum(h*h) + 1e-12)
print('前段RMS:', round(np.sqrt(np.mean(residual[:100]**2)), 6))
print('后段RMS:', round(np.sqrt(np.mean(residual[-100:]**2)), 6))
print('路径系数:', np.round(w[[2, 7]], 6))
