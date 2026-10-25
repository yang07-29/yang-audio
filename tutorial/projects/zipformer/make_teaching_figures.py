"""重绘已发布统计并模拟投递切块；不下载模型，不执行 ASR 推理。"""
from pathlib import Path
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
plt.rcParams.update({"font.family": "Microsoft YaHei", "axes.unicode_minus": False})

# 以下是成熟 V3 报告同一批 39 句的原始整数统计，不跨测试集比较。
names = ["V2", "V3 主门", "旧改善门级联", "固定规则级联"]
calls = [39, 13, 4, 8]
errors = [326, 327, 327, 327]
colors = ["#7185A0", "#297E8B", "#AF7D46", "#856CAC"]
fig, axes = plt.subplots(1, 2, figsize=(10.8, 4.5))
for ax, values, title in zip(axes, (calls, errors), ("二遍解码调用数", "字符编辑错误数")):
    bars = ax.bar(names, values, color=colors)
    ax.bar_label(bars, padding=3)
    ax.set_title(title)
    ax.tick_params(axis="x", rotation=15)
    ax.set_ylim(0, max(values) * 1.15)  # 从零起画，不夸大一字差异。
fig.suptitle("V3 已发布的 39 句测试：计算与错误要一起看")
fig.text(.5, .01, "来源：mature_v3/release/report.md；本图为统计重绘，非本次重新运行 ASR。", ha="center", fontsize=10)
fig.tight_layout(rect=(0, .04, 1, .94))
fig.savefig(ROOT / "v3_tradeoff.png", dpi=160, bbox_inches="tight")
plt.close(fig)

# 一秒输入按 160 ms 切块，再补 0.66 秒静音，只验证投递位置。
rate, audio_seconds, tail_seconds, chunk_ms = 16000, 1.0, .66, 160
samples = round(rate * audio_seconds)
tail = round(rate * tail_seconds)
chunk = round(rate * chunk_ms / 1000)
ends = [min(start + chunk, samples + tail) / rate
        for start in range(0, samples + tail, chunk)]
starts = [0] + ends[:-1]
fig, ax = plt.subplots(figsize=(10.8, 3.3))
for i, (start, end) in enumerate(zip(starts, ends), 1):
    ax.barh(0, end - start, left=start, height=.55, color="#6AA5AC" if end <= 1 else "#DDB47A", edgecolor="white")
    ax.text((start + end) / 2, 0, str(i), ha="center", va="center", fontsize=10)
ax.axvline(1, color="#25374A", linestyle="--", label="原音频结束（不是检测端点）")
ax.set(xlabel="已投递音频位置 / 秒", yticks=[], title="160 ms 投递演示：第7块横跨音频末尾和补零部分")
ax.set_xlim(0, 1.75)
ax.legend(loc="upper left")
fig.tight_layout()
fig.savefig(ROOT / "chunk_delivery.png", dpi=160, bbox_inches="tight")
plt.close(fig)

result = {"kind": "teaching_only_no_asr_inference", "sample_rate": rate,
          "original_samples": samples, "tail_samples": tail, "chunk_samples": chunk,
          "delivery_calls": len(ends), "delivered_end_positions_seconds": ends,
          "v3_published_comparison": {"names": names, "second_pass_calls": calls, "edit_errors": errors}}
assert (samples, tail, chunk, len(ends)) == (16000, 10560, 2560, 11)
assert errors[1] - errors[0] == 1
(ROOT / "teaching_results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False))
