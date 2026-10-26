import numpy as np
fs, frame = 16000, 160
t = np.arange(fs)/fs
x = np.zeros(fs)  # 前后静音，中间是教学正弦，不是真人语音
x[4000:12000] = 0.08*np.sin(2*np.pi*300*t[4000:12000])
rms = np.sqrt(np.mean(x.reshape(-1, frame)**2, axis=1))
truth = ((np.arange(100)>=25)&(np.arange(100)<75)).astype(float)
flags = np.zeros(100); active = False; left = 0
for i, value in enumerate(rms):
    if value >= 0.04: active = True; left = 5
    elif active and value >= 0.025: left = 5
    elif active and left > 0: left -= 1
    else: active = False
    flags[i] = active  # 低电平后仍保留五次判决
frame_time = np.arange(100)*frame/fs
print('帧长/ms:', 1000*frame/fs)
print('活动帧数:', int(flags.sum()))
print('RMS/增益:', round(rms[30], 4), round(0.1/rms[30], 4))
