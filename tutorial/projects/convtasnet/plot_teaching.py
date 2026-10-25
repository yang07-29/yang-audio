"""运行 mini_lab.py 的原四点教学算例并绘图，不加载 Conv-TasNet。"""
from pathlib import Path
import runpy

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
# 直接执行已有算例，图使用同一次运行产生的变量，不手工填写输出。
lab = runpy.run_path(str(ROOT / "mini_lab.py"), run_name="__main__")
scores = lab["scores"]
assignment = lab["assignment"]
mixture = lab["mixture"]
calibrated = lab["calibrated"]
residual = lab["residual"]
output = lab["output"]
identity_mean = (scores[0][0] + scores[1][1]) / 2
swapped_mean = (scores[0][1] + scores[1][0]) / 2
assert assignment == [1, 0]
plt.rcParams.update({"font.family": "Microsoft YaHei", "axes.unicode_minus": False})

# 图一：单个格子不是完整匹配，要比较两条合法排列的整句平均分。
fig, axes = plt.subplots(1, 2, figsize=(10.7, 4.6), gridspec_kw={"width_ratios": [1.15, 1]})
matrix = axes[0].imshow(scores, cmap="RdYlGn", vmin=-5, vmax=13)
axes[0].set(xticks=[0, 1], xticklabels=["预测 1", "预测 2"],
            yticks=[0, 1], yticklabels=["参考 A", "参考 B"], title="每个参考与每个预测的教学分数")
for i, row in enumerate(scores):
    for j, value in enumerate(row):
        selected = assignment[i] == j
        axes[0].text(j, i, f"{value:g} dB" + ("\n选中" if selected else ""),
                     ha="center", va="center", fontsize=14, fontweight="bold" if selected else "normal")
fig.colorbar(matrix, ax=axes[0], shrink=.85, label="人为给定的教学分数 / dB")
bars = axes[1].bar(["原顺序\nA→1，B→2", "交换顺序\nA→2，B→1"],
                   [identity_mean, swapped_mean], color=["#AF8774", "#278D86"])
axes[1].bar_label(bars, labels=[f"{identity_mean:.1f} dB", f"{swapped_mean:.1f} dB"], padding=4)
axes[1].axhline(0, color="#677585", linewidth=.8)
axes[1].set(title="比较完整排列，选择较高平均分", ylabel="整句两路平均分 / dB", ylim=(-6, 15))
fig.suptitle("PIT 配对教学：输出顺序交换，不代表分离失败")
fig.text(.5, .01, "直接运行 mini_lab.py 后绘制；分数为人为算例，不是模型推理或项目测试指标。", ha="center", fontsize=10)
fig.tight_layout(rect=(0, .05, 1, .94))
fig.savefig(ROOT / "pit_teaching.png", dpi=160, bbox_inches="tight")
plt.close(fig)

# 图二：将同一残差的一半加回两路，验证求和约束，不能证明分离正确。
points = [1, 2, 3, 4]
sum_before = [a + b for a, b in zip(*calibrated)]
sum_after = [a + b for a, b in zip(*output)]
half_residual = [value / 2 for value in residual]
error = max(abs(x - total) for x, total in zip(mixture, sum_after))
assert error < 1e-12
fig, axes = plt.subplots(2, 2, figsize=(11.5, 7.1))
axes[0, 0].plot(points, mixture, "o-", color="#283C54", label="输入混音")
axes[0, 0].plot(points, sum_before, "s--", color="#C19055", label="校准两路相加")
axes[0, 0].set_title("① 校准后，求和仍有缺口")
axes[0, 0].legend()
bars = axes[0, 1].bar(points, residual, color=["#418E97" if r >= 0 else "#C78668" for r in residual])
axes[0, 1].bar_label(bars, labels=[f"{r:+.2f}" for r in residual], padding=3)
axes[0, 1].set(title="② 残差 = 输入减去两路之和", ylim=(-.31, .31))
for index, (ax, before, after) in enumerate(zip(axes[1], calibrated, output), 1):
    ax.plot(points, before, "o--", color="#A9B4BF", label="分配前")
    ax.plot(points, after, "s-", color="#297E8B" if index == 1 else "#8D6CAE", label="分配后")
    for point, old, new, correction in zip(points, before, after, half_residual):
        ax.annotate("", xy=(point, new), xytext=(point, old), arrowprops={"arrowstyle": "->", "color": "#33465E"})
        ax.annotate(f"{correction:+.2f}", (point, new), xytext=(5, 8), textcoords="offset points", fontsize=10)
    ax.set_title(f"③ 输出 {index}：每个点添加同一份半残差")
    ax.set_ylim(-.7, 1.4)  # 为箭头标注留空间，也让两路使用同一幅度尺度。
    ax.legend()
for ax in axes.flat:
    ax.axhline(0, color="#BCC4CD", linewidth=.7)
    ax.set(xlabel="四点教学样本的位置", ylabel="幅度", xticks=points, xlim=(.7, 4.5))
fig.suptitle("等权残差分配：两路都分一半，只保证相加还原输入")
fig.text(.5, .015, f"运行后求和最大误差：{error:.2e}；四点人为算例，无语音模型推理。求和正确不等于每路语音正确。", ha="center", fontsize=10)
fig.tight_layout(rect=(0, .055, 1, .95))
fig.savefig(ROOT / "residual_teaching.png", dpi=160, bbox_inches="tight")
plt.close(fig)
print(f"Generated pit_teaching.png and residual_teaching.png; sum error={error:.3e}")
