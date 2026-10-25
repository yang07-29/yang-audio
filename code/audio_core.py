"""中文音频课程核心算法。NumPy/SciPy 教学实现；不替代产品库。"""
import itertools
import numpy as np
from scipy.signal import lfilter
from scipy.fft import dct

# region snr
def mix_at_snr(clean, noise, snr_db):
    """对整段均方功率定义 SNR，返回混合信号及缩放后的噪声。"""
    # 原始PCM可能是整数；直接平方会溢出，因此先换成浮点。
    clean = np.asarray(clean, dtype=np.float64)
    noise = np.asarray(noise, dtype=np.float64)
    if clean.shape != noise.shape:
        raise ValueError('语音与噪声形状必须相同')
    ps, pn = np.mean(clean**2), np.mean(noise**2)
    if min(ps, pn) <= 1e-12:
        raise ValueError('静音不能直接用于本例功率比例计算')
    # 功率按10log10计；乘在波形上的系数要再开平方。
    scale = np.sqrt(ps / (pn * 10**(snr_db / 10)))
    scaled = scale * noise
    return clean + scaled, scaled
# endregion

# region stft
def stft(x, size=256, hop=128):
    """返回复数谱[帧,频率]、原长度及补齐长度。"""
    x = np.asarray(x, dtype=np.float64)
    pad = size  # 两侧保护区让原信号首尾也能被重叠窗完整覆盖。
    y = np.pad(x, (pad, pad))
    extra = (-(len(y)-size)) % hop  # 补齐到最后一帧恰好完整。
    y = np.pad(y, (0, extra))
    window = np.hanning(size)
    offsets = range(0, len(y)-size+1, hop)
    # 每一行是一帧；乘窗减轻硬截断的边缘跳变。
    frames = np.stack([y[i:i+size]*window for i in offsets])
    return np.fft.rfft(frames, axis=-1), len(x), len(y)

def istft(spec, length, padded_length, size=256, hop=128):
    window = np.hanning(size)
    out, norm = np.zeros(padded_length), np.zeros(padded_length)
    frames = np.fft.irfft(spec, n=size, axis=-1)  # 复数谱保留了幅度和相位。
    for i, frame in enumerate(frames):
        start = i*hop
        out[start:start+size] += frame*window
        norm[start:start+size] += window**2  # 分析一次窗、合成一次窗，所以是窗平方。
    # 每个样本被多少帧、多少窗权重覆盖不同，要逐点消除叠加增益。
    np.divide(out, norm, out=out, where=norm>1e-12)
    return out[size:size+length]
# endregion

# region nlms
def nlms(reference, microphone, taps=64, mu=0.3, update=None):
    """update 是外部给定的更新许可；本函数不实现双讲检测器。"""
    weights, history = np.zeros(taps), np.zeros(taps)  # 路径系数与最近taps个参考样本。
    estimate, error = np.zeros_like(microphone), np.zeros_like(microphone)
    allowed = np.ones(len(reference), dtype=bool) if update is None else update
    trace = []
    for n, sample in enumerate(reference):
        history[1:] = history[:-1]  # 旧样本后移，新样本放在第零个位置。
        history[0] = sample
        estimate[n] = weights @ history  # 点积预测回声，而不是预测近端语音。
        error[n] = microphone[n] - estimate[n]  # 残差含近端、噪声及未消回声。
        if allowed[n]:
            energy = history @ history + 1e-8  # 防止静音附近分母为零。
            weights += mu * error[n] * history / energy  # 按输入能量归一化梯度。
        if n % 128 == 0:
            trace.append(weights.copy())
    return estimate, error, np.asarray(trace)
# endregion

# region wiener
def wiener_enhance(noisy, noise_only, floor=0.08, size=256, hop=128):
    """用另外给定的纯噪声段估计噪声谱；不偷看干净语音。"""
    spectrum, length, padded = stft(noisy, size, hop)
    noise_spectrum, _, _ = stft(noise_only, size, hop)
    noise_power = np.mean(np.abs(noise_spectrum)**2, axis=0)  # 沿时间平均，每个频点一个值。
    observed_power = np.abs(spectrum)**2
    speech_power = np.maximum(observed_power-noise_power, 0.0)  # 负的功率估计截为零。
    gain = speech_power/(speech_power+noise_power+1e-8)
    gain = np.maximum(gain, floor)
    enhanced = istft(gain*spectrum, length, padded, size, hop)  # 只改增益，保留带噪相位。
    return enhanced, gain
# endregion

# region agc
def frame_agc(x, size=160, target=0.12, gate=0.015, max_gain=8.0):
    """教学帧级 AGC：非语音门限下不提升增益，增益按样本插值。"""
    y, curve = np.zeros_like(x), np.zeros_like(x)
    gain = 1.0
    for start in range(0, len(x), size):
        frame = x[start:start+size]
        rms = np.sqrt(np.mean(frame**2)+1e-12)
        wanted = np.clip(target/rms, 0.1, max_gain) if rms>gate else 1.0
        smooth = 0.2 if wanted < gain else 0.9  # 需要降增益时更快，恢复时更慢。
        end_gain = smooth*gain+(1-smooth)*wanted
        ramp = np.linspace(gain, end_gain, len(frame))  # 不让块边界的增益瞬间跳变。
        y[start:start+size] = np.clip(frame*ramp, -0.95, 0.95)  # 简化硬限幅，不是生产级limiter。
        curve[start:start+size] = ramp
        gain = end_gain
    return y, curve
# endregion

# region vad
def energy_vad(x, size=160, on=0.04, off=0.025, hangover=5):
    """能量迟滞基线；不能可靠区别风声、音乐与语音。"""
    rms = np.array([np.sqrt(np.mean(x[i:i+size]**2)+1e-12)
                    for i in range(0, len(x), size)])
    active, hold, flags = False, 0, []
    for level in rms:
        if level >= on:
            active, hold = True, hangover
        elif active and level >= off:
            hold = hangover
        elif active and hold > 0:  # 能量跌下去后再等几帧，减少尾音被切断。
            hold -= 1
        else:
            active = False
        flags.append(active)
    return rms, np.asarray(flags)
# endregion

# region gcc
def gcc_phat(later, earlier, max_lag):
    """正延迟表示 later 比 earlier 晚；用长度补齐避免循环相关干扰。"""
    nfft = 1 << (len(later)+len(earlier)-1).bit_length()
    cross = np.fft.rfft(later, nfft)*np.conj(np.fft.rfft(earlier, nfft))  # 次序决定延迟正负。
    cross /= np.maximum(np.abs(cross), 1e-10)  # PHAT消除幅度，保留相位关系。
    cc = np.fft.irfft(cross, nfft)
    values = np.r_[cc[-max_lag:], cc[:max_lag+1]]  # 负延迟在循环相关数组尾部。
    lags = np.arange(-max_lag, max_lag+1)
    delay = int(lags[np.argmax(values)])
    return delay, lags, values

def mvdr(noise_cov, steering, loading=1e-3):
    channels = len(steering)
    scale = np.trace(noise_cov).real/channels
    stable = noise_cov+loading*max(scale, 1e-8)*np.eye(channels)
    z = np.linalg.solve(stable, steering)  # 解线性方程比显式求逆更合适。
    return z/(np.vdot(steering, z)+1e-12)  # 归一化，使目标方向响应约为1。
# endregion

# region music
def music_scan(snapshots, positions, frequency, angles, sound_speed=343):
    """单源、窄带、已知几何教学 MUSIC；列为快拍。"""
    covariance = snapshots @ snapshots.conj().T / snapshots.shape[1]
    _, vectors = np.linalg.eigh(covariance)  # 特征值从小到大
    noise_space = vectors[:, :-1]          # 本例假定一个声源
    scan = []
    for angle in angles:
        delay = positions*np.sin(np.deg2rad(angle))/sound_speed
        steering = np.exp(-2j*np.pi*frequency*delay)
        leakage = np.linalg.norm(noise_space.conj().T @ steering)**2
        scan.append(1/max(leakage, 1e-12))
    return np.asarray(scan)
# endregion

# region sisdr
def si_sdr(estimate, reference):
    estimate = np.asarray(estimate)-np.mean(estimate)
    reference = np.asarray(reference)-np.mean(reference)
    projection = reference*(estimate@reference)/(reference@reference+1e-12)  # 最佳尺度的参考投影。
    residual = estimate-projection
    return 10*np.log10((projection@projection+1e-12)/(residual@residual+1e-12))

def pit_scores(estimates, references):
    """仅用于小源数教学：枚举排列，最大化平均 SI-SDR。"""
    choices = []
    for order in itertools.permutations(range(len(references))):
        score = np.mean([si_sdr(estimates[i], references[j])
                         for i,j in enumerate(order)])
        choices.append((float(score), order))
    return max(choices, key=lambda item:item[0])
# endregion

# region ctc
def ctc_log_probability(log_probs, target, blank=0):
    """单样本前向递推，输入[时间,类别]，返回目标序列总对数概率。"""
    extended = [blank]
    for label in target:
        extended += [label, blank]
    steps, states = len(log_probs), len(extended)
    alpha = np.full((steps, states), -np.inf)  # log(0)代表不可到达状态。
    alpha[0, 0] = log_probs[0, blank]
    if states>1:
        alpha[0, 1] = log_probs[0, extended[1]]
    for t in range(1, steps):
        for s, label in enumerate(extended):
            parents = [alpha[t-1, s]]  # 上一时刻停在同一扩展状态。
            if s>0:
                parents.append(alpha[t-1, s-1])  # 从紧邻的前一状态走来。
            if s>1 and label != blank and label != extended[s-2]:
                parents.append(alpha[t-1, s-2])  # 只有非空白且不同标签才允许跨过空白。
            # logaddexp在对数域求概率和；最后乘当前发射概率，对数中变成加法。
            alpha[t,s] = np.logaddexp.reduce(parents)+log_probs[t,label]
    # 合法结尾可以是最后一个标签，也可以是最后一个空白。
    final = alpha[-1,-1] if states==1 else np.logaddexp(alpha[-1,-1],alpha[-1,-2])
    return float(final), alpha, extended
# endregion

# region cer
def ctc_collapse(path, blank=0):
    output, previous = [], None
    for token in path:
        if token != previous and token != blank:
            output.append(token)
        previous = token  # 空白也要更新，否则“字-空白-字”会被错误合并。
    return output

def edit_distance(reference, prediction):
    row = list(range(len(prediction)+1))
    for i, truth in enumerate(reference, 1):
        new = [i]
        for j, guess in enumerate(prediction, 1):
            new.append(min(new[-1]+1, row[j]+1, row[j-1]+(truth!=guess)))
        row = new
    return row[-1]
# endregion

# region tts_duration
def length_regulator(token_features, durations):
    """把每个音素向量复制相应帧数；不包含学习到的时长预测器。"""
    durations = np.asarray(durations)
    if len(token_features) != len(durations):
        raise ValueError('向量数与时长数不一致')
    if np.any(durations<0) or not np.all(durations==np.floor(durations)):
        raise ValueError('时长必须为非负整数帧')
    return np.repeat(token_features, durations.astype(int), axis=0)  # 重复时间轴，不重复特征轴。

def source_filter(f0, seconds, fs=16000, formants=(700,1200,2500)):
    """声源—滤波教学合成音：没有文本理解，不是完整 TTS。"""
    t = np.arange(int(fs*seconds))/fs
    source = sum(np.sin(2*np.pi*f0*k*t)/k for k in range(1,30))
    output = source.copy()
    for center in formants:
        radius = np.exp(-np.pi*100/fs)
        denominator = [1, -2*radius*np.cos(2*np.pi*center/fs), radius**2]
        output = lfilter([1-radius], denominator, output)
    output *= np.minimum(t/.04,1)*np.minimum((seconds-t)/.06,1)
    output *= .7/(np.max(np.abs(output))+1e-12)
    return output
# endregion

# region speaker
def cosine_scores(left, right):
    left = left/(np.linalg.norm(left,axis=-1,keepdims=True)+1e-12)
    right = right/(np.linalg.norm(right,axis=-1,keepdims=True)+1e-12)
    return np.sum(left*right, axis=-1)

def verification_curve(genuine, impostor):
    thresholds = np.linspace(-1.01,1.01,501)
    far = np.array([np.mean(impostor>=t) for t in thresholds])
    frr = np.array([np.mean(genuine<t) for t in thresholds])
    index = np.argmin(np.abs(far-frr))
    return thresholds, far, frr, float((far[index]+frr[index])/2)
# endregion

# region quantize
def symmetric_quantize(x, bits=8, clip=None):
    """对称逐张量量化的数值模拟；不测真实低位算子速度。"""
    bound = float(np.max(np.abs(x))) if clip is None else float(clip)
    qmax = 2**(bits-1)-1
    scale = max(bound,1e-12)/qmax
    quantized = np.clip(np.round(x/scale), -qmax, qmax).astype(np.int32)
    reconstructed = quantized.astype(np.float64)*scale
    return reconstructed, scale
# endregion

# region fxlms
def fxlms(reference, disturbance, secondary, estimated_secondary, taps=24, mu=.05):
    """归一化 FxLMS 教学仿真；误差定义为干扰加控制声。"""
    filtered_reference = lfilter(estimated_secondary,[1],reference)  # 权重影响误差还要经过次级路径。
    weights = np.zeros(taps)
    raw_history, filtered_history = np.zeros(taps), np.zeros(taps)
    control_history = np.zeros(len(secondary))
    error, control = np.zeros_like(reference), np.zeros_like(reference)
    for n, sample in enumerate(reference):
        raw_history[1:] = raw_history[:-1]
        raw_history[0] = sample
        filtered_history[1:] = filtered_history[:-1]
        filtered_history[0] = filtered_reference[n]
        control[n] = weights @ raw_history
        control_history[1:] = control_history[:-1]
        control_history[0] = control[n]
        at_error_microphone = secondary @ control_history
        error[n] = disturbance[n] + at_error_microphone
        energy = filtered_history @ filtered_history + 1e-8
        weights -= mu*error[n]*filtered_history/energy  # 本例误差为d+控制声，因此负梯度使用减号。
    return error, control
# endregion

# region mel
def log_mel_mfcc(waveform, fs=16000, size=512, hop=160, bands=40, cepstra=13):
    """HTK 风格梅尔刻度，三角峰值归一化；不保证匹配任意预训练模型。"""
    spectrum, _, _ = stft(waveform, size=size, hop=hop)
    frequencies = np.fft.rfftfreq(size, 1/fs)
    mel_max = 2595*np.log10(1+(fs/2)/700)
    edges = 700*(10**(np.linspace(0,mel_max,bands+2)/2595)-1)
    bank = np.zeros((bands,len(frequencies)))
    for b in range(bands):
        left, center, right = edges[b:b+3]
        rising = (frequencies-left)/(center-left)
        falling = (right-frequencies)/(right-center)
        bank[b] = np.maximum(0,np.minimum(rising,falling))
    power = np.abs(spectrum)**2
    mel_power = power @ bank.T  # [帧,频点]乘[频点,Mel带]，得到[帧,Mel带]。
    log_mel = np.log(np.maximum(mel_power,1e-8))  # 下界防止log(0)，自然对数不是dB。
    mfcc = dct(log_mel,type=2,norm='ortho',axis=-1)[:,:cepstra]  # 沿Mel轴变换并截取低阶系数。
    return log_mel, mfcc, bank, frequencies
# endregion
