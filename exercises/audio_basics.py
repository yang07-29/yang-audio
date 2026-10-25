"""四个可离线运行的中文音频基础实验，仅依赖 NumPy。

运行：python audio_basics.py all
也可单独运行：snr、stft、aec、ctc。
使用合成数据；不下载模型，不需要显卡，不录音。
"""
import argparse
import json
import numpy as np


def snr_demo():
    rng = np.random.default_rng(2026)
    fs = 16000
    t = np.arange(fs) / fs
    clean = 0.3 * np.sin(2 * np.pi * 440 * t)
    noise = rng.normal(size=clean.size)
    ps, pn = np.mean(clean**2), np.mean(noise**2)
    result = []
    for target in (0.0, 5.0, 10.0):
        scale = np.sqrt(ps / (pn * 10**(target / 10)))
        mixed = clean + scale * noise
        actual = 10 * np.log10(ps / np.mean((mixed - clean)**2))
        assert abs(actual-target) < 1e-10
        result.append({'目标信噪比_分贝':target, '实测信噪比_分贝':float(actual),
                       '混合峰值':float(np.max(np.abs(mixed)))})
    return result


def stft_demo():
    fs, size, hop = 8000, 256, 128
    time = np.arange(fs) / fs
    x = 0.3*np.sin(2*np.pi*440*time) + 0.2*np.sin(2*np.pi*1000*time)
    padded = np.pad(x, (size, size))
    window = np.hanning(size)
    offsets = list(range(0, len(padded)-size+1, hop))
    frames = np.stack([padded[i:i+size]*window for i in offsets])
    spec = np.fft.rfft(frames, axis=-1)
    rebuilt = np.zeros_like(padded)
    weight = np.zeros_like(padded)
    for start, frame in zip(offsets, np.fft.irfft(spec, n=size, axis=-1)):
        rebuilt[start:start+size] += frame*window
        weight[start:start+size] += window**2
    np.divide(rebuilt, weight, out=rebuilt, where=weight>1e-12)
    restored = rebuilt[size:size+len(x)]
    error = float(np.max(np.abs(x-restored)))
    assert error < 1e-10
    assert spec.shape[1] == size//2+1
    return {'采样率':fs, '帧长':size, '帧移':hop, '频谱形状_帧数乘频点数':list(spec.shape),
            '最大重建误差':error,
            '说明':'使用边缘补零和窗平方归一化；这里只验证重建，不是降噪算法。'}


def aec_demo():
    rng = np.random.default_rng(2026)
    reference = rng.normal(0, 0.15, size=12000)
    true_path = np.zeros(12)
    true_path[[0, 3, 8]] = [0.6, 0.25, -0.1]
    echo = np.convolve(reference, true_path)[:len(reference)]
    coefficients = np.zeros(12)
    history = np.zeros(12)
    error = np.zeros_like(echo)
    rate = 0.25
    for n in range(len(reference)):
        history[1:] = history[:-1]
        history[0] = reference[n]
        prediction = coefficients @ history
        error[n] = echo[n] - prediction
        coefficients += rate*error[n]*history/(history@history+1e-8)
    early = float(np.mean(error[:256]**2))
    late = float(np.mean(error[-1000:]**2))
    coefficient_error = float(np.max(np.abs(coefficients-true_path)))
    assert late < early*1e-3
    assert coefficient_error < 1e-3
    return {'开始阶段误差功率':early,'结束阶段误差功率':late,
            '路径系数最大误差':coefficient_error,
            '说明':'理想线性短路径、白噪声参考、没有近端语音；不能外推为真实通话成绩。'}


def ctc_collapse(path, blank='_'):
    output = []
    previous = None
    for symbol in path:
        if symbol != previous and symbol != blank:
            output.append(symbol)
        previous = symbol
    return ''.join(output)


def edit_distance(reference, prediction):
    previous = list(range(len(prediction)+1))
    for i, a in enumerate(reference, 1):
        current = [i]
        for j, b in enumerate(prediction, 1):
            current.append(min(current[-1]+1, previous[j]+1, previous[j-1]+(a!=b)))
        previous = current
    return previous[-1]


def ctc_demo():
    one = ctc_collapse(['你','你','_','好','好'])
    two = ctc_collapse(['哈','_','哈'])
    three = ctc_collapse(['哈','哈'])
    reference, prediction = '今天天气好', '今天天气号'
    cer = edit_distance(reference, prediction)/len(reference)
    assert (one,two,three) == ('你好','哈哈','哈')
    assert abs(cer-0.2) < 1e-12
    return {'折叠结果':[one,two,three], '参考':reference, '识别':prediction,
            '字符错误率':cer,
            '说明':'演示路径折叠与编辑距离，不包含声学模型，也没有实现完整 CTC 损失。'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='中文音频基础实验')
    parser.add_argument('mode', choices=['all','snr','stft','aec','ctc'], nargs='?', default='all')
    args = parser.parse_args()
    demos = {'snr':snr_demo, 'stft':stft_demo, 'aec':aec_demo, 'ctc':ctc_demo}
    results = {name: fn() for name,fn in demos.items() if args.mode in ('all',name)}
    print(json.dumps(results,ensure_ascii=False,indent=2))
    print('通过：所有选定实验的数值自检。')
