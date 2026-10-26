import numpy as np
fs, target_rt60 = 16000, 0.4
# 理想指数只验证衰减计算，不是真实房间响应
t = np.arange(fs*2)/fs
h = np.exp(-3*np.log(10)*t/target_rt60)
# 反向累计平方：看每个时刻之后还剩多少能量
energy = np.cumsum(h[::-1]**2)[::-1]
edc_db = 10*np.log10(np.maximum(energy/energy[0], 1e-15))
valid = (edc_db <= -5)&(edc_db >= -35)
slope, intercept = np.polyfit(t[valid], edc_db[valid], 1)
fit_db = slope*t + intercept
estimated = -60/slope
print('斜率/dB每秒:', round(slope, 3))
print('外推RT60/秒:', round(estimated, 4))
print('三路径DRR/dB:', round(10*np.log10(1/(0.5**2+0.25**2)), 4))
