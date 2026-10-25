"""NumPy 教学实验：复数掩码、STFT重建、指标对增益的反应。

不加载 GTCRN，不下载音频，不训练网络。所有信号均为明确的合成信号。
生成的 PNG 和 JSON 仅用于理解运算，不能当成模型跑分或真实语音效果。
"""
from pathlib import Path
import hashlib
import json

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
RATE, N_FFT, HOP = 16000, 512, 256
plt.rcParams.update({"font.family": "Microsoft YaHei", "axes.unicode_minus": False})


def multiply_complex_parts(real, imag, mask_real, mask_imag):
    # 复数相乘：不能把实部和虚部分别相乘后直接拼起来。
    enhanced_real = mask_real * real - mask_imag * imag
    enhanced_imag = mask_real * imag + mask_imag * real
    return enhanced_real, enhanced_imag


def roundtrip_stft(wave):
    # 只演示较长输入：本实验长度16000点，允许中心反射填充。
    assert len(wave) > N_FFT // 2
    window = np.sqrt(0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N_FFT) / N_FFT))
    padded = np.pad(wave, (N_FFT // 2, N_FFT // 2), mode="reflect")
    frames = np.lib.stride_tricks.sliding_window_view(padded, N_FFT)[::HOP].copy()
    spectrum = np.fft.rfft(frames * window, axis=-1)
    # 恒等掩码为1：测试前后端本身，不声称完成降噪。
    enhanced = spectrum * (1.0 + 0.0j)
    reconstructed_frames = np.fft.irfft(enhanced, n=N_FFT, axis=-1) * window
    numerator, denominator = np.zeros_like(padded), np.zeros_like(padded)
    for index, frame in enumerate(reconstructed_frames):
        start = index * HOP
        numerator[start:start + N_FFT] += frame
        denominator[start:start + N_FFT] += window ** 2
    # 先裁去padding，再除窗平方和；避免无效边界上除零。
    valid = slice(N_FFT // 2, N_FFT // 2 + len(wave))
    assert np.all(denominator[valid] > 0)
    output = numerator[valid] / denominator[valid]
    return output, spectrum


def metric_demo(reference, estimate):
    # 本教学例子只有非静音、非完美重建输入；退化情形直接拒绝。
    s = reference - reference.mean()
    y = estimate - estimate.mean()
    assert np.dot(s, s) > 0
    # 投影到参考方向，整体增益变化会同时缩放目标和残差。
    target = np.dot(y, s) / np.dot(s, s) * s
    residual = y - target
    assert np.dot(target, target) > 0 and np.dot(residual, residual) > 0
    si_sdr = 10 * np.log10(np.dot(target, target) / np.dot(residual, residual))
    # 这个误差比较原幅度，因此会惩罚过小或过大的整体增益。
    mse = np.mean((estimate - reference) ** 2)
    gain_sdr = 10 * np.log10(np.mean(reference ** 2) / mse)
    return float(si_sdr), float(gain_sdr), float(mse)


def main():
    rng = np.random.default_rng(17)
    time = np.arange(RATE) / RATE
    # 合成“有谐波的目标”和干扰；不是人声，也不模拟完整耳机声学。
    reference = 0.5 * np.sin(2 * np.pi * 330 * time)
    reference += 0.18 * np.sin(2 * np.pi * 660 * time)
    noise = 0.15 * np.sin(2 * np.pi * 1100 * time) + rng.normal(0, 0.07, RATE)
    mixture = reference + noise
    reconstructed, spectrum = roundtrip_stft(mixture)
    reconstruction_error = float(np.max(np.abs(reconstructed - mixture)))
    enhanced_real, enhanced_imag = multiply_complex_parts(1.0, 2.0, 0.5, -0.25)
    expected_complex = (1 + 2j) * (0.5 - 0.25j)
    assert complex(enhanced_real, enhanced_imag) == expected_complex == complex(1, 0.75)
    assert reconstructed.shape == mixture.shape
    assert spectrum.shape == (63, 257)
    assert reconstruction_error < 1e-12

    gains = np.array([0.25, 0.5, 1.0, 2.0])
    rows = []
    for gain in gains:
        score, gain_score, mse = metric_demo(reference, gain * mixture)
        rows.append({"gain": float(gain), "si_sdr_db": score,
                     "gain_sensitive_sdr_db": gain_score, "mse": mse})
    si_scores = np.array([row["si_sdr_db"] for row in rows])
    assert float(np.ptp(si_scores)) < 1e-10

    # 图1：由真实算出的复数结果绘图，不手工绘制箭头坐标或伪造结果。
    fig, ax = plt.subplots(figsize=(8.0, 5.1))
    for value, name, color in [(1 + 2j, "输入频点：1 + 2j", "#416F9C"),
                               (expected_complex, "掩码后：1 + 0.75j", "#CC7854")]:
        ax.quiver(0, 0, value.real, value.imag, angles="xy", scale_units="xy",
                  scale=1, color=color, width=.012, label=name)
        ax.scatter(value.real, value.imag, color=color, s=35)
    ax.axhline(0, color="#9DA9B4", linewidth=1)
    ax.axvline(0, color="#9DA9B4", linewidth=1)
    ax.set(xlim=(-.2, 2.3), ylim=(-.2, 2.4), xlabel="实部", ylabel="虚部",
           title="复数掩码会同时改变幅度与相位")
    ax.set_aspect("equal", adjustable="box")
    ax.grid(alpha=.2)
    ax.legend(loc="upper right")
    fig.text(.5, .02, "固定教学掩码：0.5 − 0.25j；本图不是 GTCRN 的预测结果。", ha="center")
    fig.tight_layout(rect=(0, .05, 1, 1))
    fig.savefig(ROOT / "complex_mask_demo.png", dpi=160, bbox_inches="tight")
    plt.close(fig)

    # 图2：同一输入，仅改变整体增益；所有分数由本次运行计算。
    fig, axes = plt.subplots(2, 2, figsize=(11, 7))
    sample_slice = slice(0, 320)
    milliseconds = time[sample_slice] * 1000
    axes[0, 0].plot(milliseconds, reference[sample_slice], label="合成目标", color="#416F9C")
    axes[0, 0].plot(milliseconds, mixture[sample_slice], label="目标＋干扰", color="#CC7854", alpha=.7)
    axes[0, 0].set(title="输入：不是语音，而是可复现的合成信号", xlabel="时间 / 毫秒", ylabel="幅度")
    axes[0, 0].legend(loc="upper right")
    axes[0, 1].plot(milliseconds, mixture[sample_slice], label="STFT前", color="#416F9C")
    axes[0, 1].plot(milliseconds, reconstructed[sample_slice], "--", label="恒等掩码＋iSTFT后", color="#CC7854")
    axes[0, 1].set(title=f"重建最大绝对误差：{reconstruction_error:.2e}", xlabel="时间 / 毫秒", ylabel="幅度")
    axes[0, 1].legend(loc="upper right")
    axes[1, 0].plot(gains, si_scores, "o-", color="#416F9C")
    axes[1, 0].set(title="SI-SDR：整体缩放，分数基本不变", xlabel="整体增益", ylabel="SI-SDR / dB")
    axes[1, 0].set_ylim(float(si_scores.min()) - 1, float(si_scores.max()) + 1)
    axes[1, 1].plot(gains, [row["gain_sensitive_sdr_db"] for row in rows], "o-", color="#CC7854")
    axes[1, 1].set(title="增益敏感SDR：音量不匹配会受惩罚", xlabel="整体增益", ylabel="增益敏感SDR / dB")
    for ax in axes.flat:
        ax.grid(alpha=.2)
    fig.suptitle("真实运行的 NumPy 教学实验：重建正确不等于降噪成功")
    fig.text(.5, .012, "seed=17；16 kHz；512点平方根Hann窗／256点步长；无模型、无训练、无人声。", ha="center", fontsize=10)
    fig.tight_layout(rect=(0, .035, 1, .95))
    fig.savefig(ROOT / "reconstruction_gain_demo.png", dpi=160, bbox_inches="tight")
    plt.close(fig)

    result = {
        "scope": "Actual NumPy teaching run; synthetic signals only; no GTCRN inference, training or real-speech score.",
        "numpy_version": np.__version__, "matplotlib_version": matplotlib.__version__,
        "seed": 17, "sample_rate": RATE, "n_fft": N_FFT, "hop": HOP,
        "samples": len(mixture), "spectrum_shape_time_frequency": list(spectrum.shape),
        "complex_input": [1.0, 2.0], "complex_mask": [0.5, -0.25],
        "complex_output": [enhanced_real, enhanced_imag],
        "identity_reconstruction_max_abs_error": reconstruction_error,
        "gain_results": rows, "si_sdr_spread_db": float(np.ptp(si_scores)),
        "checks": {"complex_multiplication": True, "length_preserved": True,
                   "spectrum_shape": True, "reconstruction_below_1e_12": True,
                   "gain_invariant_si_sdr": True},
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "figures": ["complex_mask_demo.png", "reconstruction_gain_demo.png"],
    }
    (ROOT / "mini_lab_result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
