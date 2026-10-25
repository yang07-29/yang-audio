"""新手音频实验。无录音、无自动播放、无模型下载；只写 tutorial 内生成产物。"""
from pathlib import Path
import json
import platform
import numpy as np
import scipy
from scipy import signal
from scipy.io import wavfile
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = Path(__file__).resolve().parents[1]
FIG = ROOT / 'figures'
RESULTS = ROOT / 'results'
AUDIO = ROOT / 'audio'


def configure():
    for directory in (FIG, RESULTS, AUDIO):
        directory.mkdir(parents=True, exist_ok=True)
    installed = {font.name for font in font_manager.fontManager.ttflist}
    choices = ['Microsoft YaHei', 'SimHei', 'Noto Sans CJK SC', 'Arial Unicode MS']
    font = next((name for name in choices if name in installed), 'DejaVu Sans')
    plt.rcParams.update({'font.family': font, 'font.size': 11,
                         'axes.unicode_minus': False, 'axes.spines.top': False,
                         'axes.spines.right': False})


def rms(samples):
    """先转浮点，再平方；空数组和非有限值主动报错。"""
    samples = np.asarray(samples, dtype=np.float64)
    if samples.size == 0 or not np.isfinite(samples).all():
        raise ValueError('输入必须为非空有限数值数组')
    return float(np.sqrt(np.mean(samples ** 2)))


def dbfs_rms(samples):
    """本课采用满幅数值 1 为 RMS 参考：满幅正弦约 -3.01 dBFS。"""
    value = rms(samples)
    return float(20 * np.log10(value)) if value > 0 else -float('inf')


def describe_audio(samples, fs):
    samples = np.asarray(samples)
    if samples.ndim not in (1, 2) or fs <= 0:
        raise ValueError('本例要求 [样本] 或 [样本,声道]，采样率为正')
    return {'采样率_Hz': int(fs), '形状': list(samples.shape),
            '时长_s': samples.shape[0] / fs, '数据类型': str(samples.dtype),
            '峰值': float(np.max(np.abs(samples.astype(float)))),
            'RMS': rms(samples)}


def save(fig, filename):
    fig.savefig(FIG / filename, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig)


def first_wave():
    fs = 16000
    t = np.arange(fs) / fs
    wave = 0.5 * np.sin(2 * np.pi * 440 * t)
    pcm16 = np.round(wave * 32767).astype(np.int16)
    wavfile.write(AUDIO / '01_440Hz_低幅度教学音.wav', fs, pcm16)
    saved_fs, saved = wavfile.read(AUDIO / '01_440Hz_低幅度教学音.wav')
    restored = saved.astype(np.float64) / 32767
    assert saved_fs == fs and saved.shape == (16000,)
    assert np.max(np.abs(restored - wave)) <= 0.5 / 32767 + 1e-12
    fig, axes = plt.subplots(2, 2, figsize=(12, 7), layout='constrained')
    milliseconds = t[:160] * 1000
    axes[0, 0].plot(milliseconds, wave[:160], label='四百四十赫兹')
    axes[0, 0].plot(milliseconds, .5*np.sin(2*np.pi*880*t[:160]), alpha=.65, label='八百八十赫兹')
    axes[0, 0].set(title='频率加倍：相同时间内周期更多', xlabel='时间／毫秒', ylabel='数字幅度')
    axes[0, 1].plot(milliseconds, wave[:160], label='幅度零点五')
    axes[0, 1].plot(milliseconds, wave[:160]*.4, label='幅度零点二')
    axes[0, 1].set(title='振幅改变不等于频率改变', xlabel='时间／毫秒', ylabel='数字幅度')
    phase_wave = .5*np.sin(2*np.pi*440*t[:160]+np.pi)
    axes[1, 0].plot(milliseconds, wave[:160], label='原信号')
    axes[1, 0].plot(milliseconds, phase_wave, label='相差半个周期')
    axes[1, 0].plot(milliseconds, phase_wave+wave[:160], '--', label='相加近似零')
    axes[1, 0].set(title='同频反相可以抵消：不是任意噪声都可这样做', xlabel='时间／毫秒', ylabel='数字幅度')
    harmonic = wave[:160]+.15*np.sin(2*np.pi*880*t[:160])
    axes[1, 1].plot(milliseconds, harmonic, label='基频＋二次谐波')
    axes[1, 1].plot(milliseconds, wave[:160], '--', alpha=.6, label='只有基频')
    axes[1, 1].set(title='谐波改变波形形状', xlabel='时间／毫秒', ylabel='数字幅度')
    for ax in axes.flat:
        ax.legend(fontsize=9)
    save(fig, '01_wave_basics.png')
    return {'音频': describe_audio(wave, fs), '量化往返最大误差': float(np.max(np.abs(restored-wave)))}


def quantization():
    t = np.linspace(0, .004, 1000)
    dense = .75*np.sin(2*np.pi*500*t)
    sampled_t = np.arange(33) / 8000
    sampled = .75*np.sin(2*np.pi*500*sampled_t)
    step = .25
    quantized = np.clip(np.round(sampled/step)*step, -1, 1-step)
    fig, axes = plt.subplots(2, 1, figsize=(11, 7), layout='constrained')
    axes[0].plot(t*1000, dense, label='用于示意的连续曲线')
    axes[0].stem(sampled_t*1000, sampled, linefmt='C1-', markerfmt='C1o', basefmt=' ')
    axes[0].set(title='采样：决定何时记录', xlabel='时间／毫秒', ylabel='幅度')
    axes[0].legend()
    axes[1].step(sampled_t*1000, quantized, where='mid', label='八级量化值')
    axes[1].scatter(sampled_t*1000, sampled, s=15, label='量化前的采样值')
    for value in np.arange(-1, 1, step):
        axes[1].axhline(value, color='gray', alpha=.15)
    axes[1].set(title='量化：决定数值记得多细；台阶连线只是显示方式', xlabel='时间／毫秒', ylabel='幅度')
    axes[1].legend()
    save(fig, '02_pcm_quantization.png')
    return {'量化步长': step, '最大误差': float(np.max(np.abs(quantized-sampled)))}


def levels():
    fs = 16000
    t = np.arange(fs)/fs
    wave = .5*np.sin(2*np.pi*1000*t)
    scaled = wave*2
    clipped = np.clip(wave*3, -.8, .8)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5), layout='constrained')
    for values, label in [(wave, '原始'), (scaled, '幅度乘二'), (clipped, '过载后削波')]:
        axes[0].plot(t[:64]*1000, values[:64], label=label)
        spec = np.abs(np.fft.rfft(values))/len(values)*2
        frequency = np.fft.rfftfreq(len(values), 1/fs)
        axes[1].plot(frequency, 20*np.log10(np.maximum(spec, 1e-6)), label=label)
    axes[0].set(title='削波把波峰截平，产生非线性失真', xlabel='时间／毫秒', ylabel='数字幅度')
    axes[1].set(title='失真会产生原信号没有的谐波', xlabel='频率／赫兹', ylabel='相对幅度／分贝', ylim=(-100, 5))
    for ax in axes:
        ax.legend()
    save(fig, '03_levels.png')
    gain_db = dbfs_rms(scaled)-dbfs_rms(wave)
    assert abs(gain_db-6.020599913)<1e-8
    return {'半幅正弦RMS_dBFS': dbfs_rms(wave), '满幅正弦RMS_dBFS': dbfs_rms(scaled),
            '幅度翻倍增量_dB': gain_db, '参考约定': '数值1作为RMS参考，不作声压校准'}


def filter_and_room():
    fs = 16000
    coefficients = np.ones(9)/9
    frequencies, response = signal.freqz(coefficients, worN=2048, fs=fs)
    # 连续包络振幅在 RT60 秒衰减至千分之一，能量衰减至百万分之一。
    rt60 = .4
    t = np.arange(fs*2)/fs
    impulse = np.exp(-3*np.log(10)*t/rt60)
    energy_tail = np.cumsum(impulse[::-1]**2)[::-1]
    edc_db = 10*np.log10(np.maximum(energy_tail/energy_tail[0], 1e-20))
    select = (edc_db >= -35) & (edc_db <= -5)
    slope = np.polyfit(t[select], edc_db[select], 1)[0]
    estimated_rt60 = -60/slope
    room = np.zeros(1601)
    room[[0, 480, 1200]] = [1, .5, .25]
    fig, axes = plt.subplots(2, 2, figsize=(12, 7), layout='constrained')
    axes[0, 0].stem(np.arange(9), coefficients)
    axes[0, 0].set(title='九点滑动平均：每个历史样本都有权重', xlabel='抽头索引', ylabel='权重')
    axes[0, 1].plot(frequencies, 20*np.log10(np.maximum(np.abs(response), 1e-6)))
    axes[0, 1].set(title='低通倾向不等于理想低通', xlabel='频率／赫兹', ylabel='幅度响应／分贝', ylim=(-80, 5))
    axes[1, 0].stem(np.arange(len(room))/fs*1000, room)
    axes[1, 0].set(title='简化房间：直达声、三十毫秒和七十五毫秒反射', xlabel='时间／毫秒', ylabel='脉冲响应')
    axes[1, 1].plot(t, edc_db, label='理想指数尾音的反向累计能量')
    axes[1, 1].axhline(-60, color='C1', linestyle='--')
    axes[1, 1].axvline(rt60, color='C1', linestyle='--', label='设置的零点四秒')
    axes[1, 1].set(title='混响时间：不是最后一个非零样本的时间', xlabel='时间／秒', ylabel='归一化能量／分贝', xlim=(0, .7), ylim=(-100, 0))
    axes[1, 1].legend(fontsize=8)
    save(fig, '04_filter_room.png')
    assert abs(estimated_rt60-rt60)<1e-6
    return {'移动平均群延迟_采样': 4, '理想包络RT60_s': rt60,
            '由负5至负35dB斜率外推RT60_s': float(estimated_rt60),
            '边界': '理想指数包络，不是真实房间测量；三反射例与指数例是两个独立模型'}


def resampling():
    fs = 48000
    t = np.arange(fs)/fs
    wave = .35*np.sin(2*np.pi*1000*t)+.35*np.sin(2*np.pi*10000*t)
    wrong = wave[::3]
    correct = signal.resample_poly(wave, up=1, down=3)
    new_fs = 16000
    # 去掉边缘，避免有限长滤波过渡影响稳态幅度比较。
    def amplitude_at(values, hz):
        values = values[800:-800]
        phase = np.exp(-2j*np.pi*hz*np.arange(len(values))/new_fs)
        return float(2*np.abs(values @ phase)/len(values))
    fig, ax = plt.subplots(figsize=(11, 4.5), layout='constrained')
    for values, label in [(wrong, '直接每三点取一点'), (correct, '先低通再降采样')]:
        spectrum = np.abs(np.fft.rfft(values*np.hanning(len(values))))
        spectrum /= spectrum.max()
        ax.plot(np.fft.rfftfreq(len(values), 1/new_fs), 20*np.log10(np.maximum(spectrum, 1e-8)), label=label)
    ax.set(title='一万赫兹分量在错误降采样后混叠至六千赫兹', xlabel='频率／赫兹', ylabel='各自峰值归一化幅度／分贝', ylim=(-110, 5))
    ax.legend()
    save(fig, '05_resampling.png')
    assert len(correct) == len(wrong) == 16000
    aliased = amplitude_at(wrong, 6000)
    suppressed = amplitude_at(correct, 6000)
    assert suppressed < aliased/100
    return {'错误降采样的6kHz幅度': aliased, '滤波降采样的6kHz幅度': suppressed,
            '时长保持_s': len(correct)/new_fs}


def frames_and_stream():
    samples = np.arange(10)
    frames = np.stack([samples[i:i+4] for i in range(0, 7, 2)])
    expected = np.array([[0,1,2,3], [2,3,4,5], [4,5,6,7], [6,7,8,9]])
    assert np.array_equal(frames, expected)
    fig, ax = plt.subplots(figsize=(10, 4), layout='constrained')
    ax.imshow(frames, cmap='Blues', vmin=0, vmax=9, aspect='auto')
    for i in range(4):
        for j in range(4):
            ax.text(j, i, str(frames[i,j]), ha='center', va='center', color='white' if frames[i,j]>5 else 'black')
    ax.set_xticks(range(4), ['帧内位置零','帧内位置一','帧内位置二','帧内位置三'])
    ax.set_yticks(range(4), ['第一帧','第二帧','第三帧','第四帧'])
    ax.set_title('十个样本、窗长四、帧移二：样本会出现在多帧中')
    save(fig, '06_frames.png')
    rng = np.random.default_rng(20261022)
    x = rng.normal(size=1031)
    b = np.ones(9)/9
    whole = signal.lfilter(b, [1], x)
    state = np.zeros(len(b)-1)
    parts, broken = [], []
    for start in range(0, len(x), 160):
        block = x[start:start+160]
        y, state = signal.lfilter(b, [1], block, zi=state)
        parts.append(y)
        broken.append(signal.lfilter(b, [1], block))
    streamed, reset = np.concatenate(parts), np.concatenate(broken)
    fig, ax = plt.subplots(figsize=(11, 4), layout='constrained')
    axis = np.arange(140, 190)
    ax.plot(axis, whole[140:190], label='整段处理')
    ax.plot(axis, streamed[140:190], '--', label='流式且保留滤波状态')
    ax.plot(axis, reset[140:190], ':', linewidth=2, label='每块错误清零状态')
    ax.axvline(160, color='gray', alpha=.6)
    ax.set(title='切块本身不必改变结果，丢失历史状态才会造成边界问题', xlabel='样本索引', ylabel='输出幅度')
    ax.legend()
    save(fig, '07_stream_state.png')
    error = float(np.max(np.abs(streamed-whole)))
    assert error < 1e-12 and len(streamed) == len(x)
    assert np.max(np.abs(reset-whole)) > .01
    return {'分帧矩阵': frames.tolist(), '正确流式最大误差': error,
            '错误重置最大误差': float(np.max(np.abs(reset-whole))), '最后一块长度': len(x)%160}


def main():
    configure()
    report = {'波形与文件': first_wave(), '量化': quantization(), '电平': levels(),
              '滤波与房间': filter_and_room(), '重采样': resampling(),
              '分帧与流式': frames_and_stream(),
              '环境': {'Python': platform.python_version(), 'NumPy': np.__version__,
                       'SciPy': scipy.__version__, 'Matplotlib': matplotlib.__version__},
              '数据': '全部为数学合成，没有录音、自动播放或真人语音采集'}
    (RESULTS/'beginner_results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
