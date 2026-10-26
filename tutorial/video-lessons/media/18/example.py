import numpy as np
fs, f0, nfft = 16000, 1000, 512
# 三毫秒波形：一千赫兹应出现三个周期
t = np.arange(48) / fs
wave = np.sin(2*np.pi*f0*t)
double = 2 * wave
rms = np.sqrt(np.mean(wave**2))
rms2 = np.sqrt(np.mean(double**2))
gain_db = 20*np.log10(rms2/rms)
print("10 ms 样点数", int(fs*0.01))
print("周期", 1000/f0, "ms；FFT 间距", fs/nfft, "Hz")
print("幅度翻倍的电平变化", round(gain_db, 2), "dB")
print("48 kHz 双声道 16 bit PCM", 48000*2*16//8, "字节/秒")
