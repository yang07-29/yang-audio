# 第 13 章｜语音识别 ASR：机器怎样把长声音对齐成短文字

[返回教程目录](../README.md)

先修：[第06课的 Mel 特征](06_features.md)和[第12课的模型输入输出](12_pytorch.md)。本章不要求你从零训练大型识别器。目标是理解对齐、亲手算出一个 CTC 损失、正确评价识别结果，然后设计一个真实的领域转写项目。第一次阅读先完成第1—3节和第6节；动态规划与模型差异可在第二次阅读时补齐。

## 1. “声音变文字”中最难解释的一步：谁对应谁

一秒录音若每 10 ms 取一帧，大约有一百个时间位置；“打开空调”只有四个汉字。你不能规定每个字都占 25 帧：有人拖长“开”，有人在“空调”前停顿，同一字的发音内部也会变化。

识别系统通常先把波形变为特征，再由编码器提取与语音内容相关的信息，最后产生文字单元。文字单元可能是汉字、子词或其他符号，不必与“一个汉字”严格一一对应。编码器还能做时间下采样，因此要区分原始样点数、特征帧数和模型输出步数。

例如 100 帧特征经过近似 4 倍下采样，可能只剩约 25 个输出步；精确长度要按卷积核、步幅和填充公式计算。把原始 100 填进只输出 25 步的损失函数，是常见错误。

CTC 解决的是：只知道整句转写，不知道每一帧对应哪个字时，怎样训练序列模型。它不是音频特征，也不是某一种固定网络架构。

## 2. 先懂 blank，再懂重复字

假设词表只有“啊”和一个特殊空白符 `_`。CTC 路径在每个时间步都选一个符号，然后遵守两步规则：先合并相邻重复，再删除空白。

```text
啊 啊 _ 啊  →  啊 _ 啊  →  啊啊
啊 啊 啊    →  啊        →  啊
_ 啊 _      →  _ 啊 _    →  啊
```

顺序不能反过来。若先删空白，第一条路径会变成连续三个“啊”，再合并就错误地只剩一个。blank 表示这个输出步不发出新文字，不应简单理解为真实录音中的静音；有声音的帧也可能输出 blank。

这像把多个粗略时间标记折叠成一句话，但类比有边界：CTC 在训练时不先指定唯一的时间标记，而是把所有能得到正确文本的合法路径一起考虑。细节可参阅 [CTC 原论文](https://www.cs.toronto.edu/~graves/icml_2006.pdf)。

## 3. 两个时间步，完整手算一个 CTC 损失

现在目标只有一个“啊”，两步网络输出如下：

| 时间 | blank 的概率 | “啊”的概率 |
|---|---:|---:|
| 第 1 步 | 0.4 | 0.6 |
| 第 2 步 | 0.5 | 0.5 |

一共有四条路径。`__` 概率 $0.4\times0.5=0.2$，折叠为空文本，不符合目标。`_啊` 概率 0.2，`啊_` 概率 0.3，`啊啊` 概率 0.3，后三条都折叠为“啊”。因此目标文本概率为 $0.2+0.3+0.3=0.8$，损失为 $-\ln(0.8)\approx0.22314$。

关键是“先对合法路径求和，再取负对数”，不是只挑概率最高的那条路径。本例单条路径最高只有 0.3，但整个目标文本概率是 0.8。

下面用 Python 标准库枚举检查，再用 Matplotlib 绘图。0 表示 blank，1 表示“啊”；这是概率计算演示，不含语音模型。从课程根目录 `audio-course-zh` 运行，图保存在 `tutorial/figures/ch13_ctc_paths.png`。

```python
from itertools import product
from math import log, prod

def collapse(path):
    result = []
    previous = None
    for token in path:
        if token != previous and token != 0:
            result.append(token)
        previous = token                 # 即使是 blank 也必须更新
    return tuple(result)

probabilities = [[0.4, 0.6], [0.5, 0.5]] # [时间=2, 类别=2]
total = 0.0
valid_paths = []                         # 保存每条合法路径，供下面绘图
for path in product(range(2), repeat=2):
    probability = prod(probabilities[t][token]
                       for t, token in enumerate(path))
    if collapse(path) == (1,):
        total += probability
        name = "".join("空" if token == 0 else "啊" for token in path)
        valid_paths.append((name, probability))
print(total, -log(total))                 # 0.8，约 0.22314
assert abs(total - 0.8) < 1e-12

# 绘制刚才枚举得到的三条合法路径，不凭空填写概率。
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.family": "Microsoft YaHei", "axes.unicode_minus": False})
fig, ax = plt.subplots(figsize=(7, 3.8))
bars = ax.bar([p[0] for p in valid_paths], [p[1] for p in valid_paths], color="#398795")
ax.bar_label(bars, labels=[f"{p[1]:.2f}" for p in valid_paths])
ax.set(ylabel="路径概率", xlabel="空表示 blank", ylim=(0, 0.4),
       title=f"三条合法路径相加：目标文本概率为 {total:.2f}")
Path("tutorial/figures").mkdir(parents=True, exist_ok=True)
fig.savefig("tutorial/figures/ch13_ctc_paths.png", dpi=150, bbox_inches="tight")
plt.close(fig)
```

![上方代码实际运行结果：三条合法路径概率 0.2、0.3、0.3，相加为 0.8](../figures/ch13_ctc_paths.png)

三根柱子都折叠为同一个“啊”。读图时先指出每根柱子对应哪条路径，再将高度相加；不能只拿最高柱子当作目标文本概率。

`product(...,repeat=2)` 枚举两步所有选择；`enumerate` 同时给出时间下标和该步符号。`previous` 不能只记录上一个非空白字符，否则“啊 blank 啊”会被错误折叠。

为什么损失要取负对数？目标概率越接近 1，负对数越接近 0；目标概率越接近 0，惩罚越大。多个独立样本的概率连乘也可以变成对数相加，更便于优化。它不是把概率变成百分数，而是把“提高正确答案概率”改写成“降低一个标量损失”。

推理时最简单的贪心解码是每步取最大概率符号再折叠。这样找到的是一条高概率路径，不保证是总概率最高的文本，因为另一个文本可能有很多条各自较小、加起来更大的路径。束搜索保留若干候选并累积相应分数，通常以更多计算换更充分的搜索；是否有效仍要在固定数据与时延条件下测试。

## 4. 时间步一多，为什么需要动态规划

如果有 100 步、1000 类，直接枚举需要考虑 $1000^{100}$ 条路径，不现实。动态规划的想法是：许多不同路径在同一时刻到达同一个目标位置后，后续计算相同，可以先把这些概率合起来。

以目标“你好”为例，扩展目标为 `[blank,你,blank,好,blank]`。定义 $\alpha_{t,s}$ 为到第 $t$ 步、走到扩展位置 $s$ 的所有合法路径总概率。当前状态可以从自己停留、从前一位置前进，特定情况下还能跨过中间 blank。

“跨两格”只在当前字符不是 blank、且与前两格字符不相同时允许。如果目标是“你你”，必须经过中间 blank 才能区分两个“你”。第一步只有开头 blank 和第一个字可达；最后把最后一个字状态与末尾 blank 状态求和。

![五步 CTC 的输出概率与前向递推](../../figures/07_ctc.png)

这张图由已经执行的 [run_experiments.py](../../code/run_experiments.py) 生成。左图画每一步输出什么符号的概率；右图画“所有走到某个目标位置的路径累计了多少概率”。两个图不是一回事。前几步右图后面的状态不可达，所以非常暗。课程五步例子的总概率为 0.6674596875，与全部 243 条路径穷举一致；它和上面的两步短代码使用不同输入，不应期待数字相同，也不是该短代码直接生成的图。

长序列概率相乘可能小到计算机难以表示，所以 [原核心代码](../../code/audio_core.py) 的 `ctc_log_probability` 在对数域累加。对数域的“相加概率”需要 `logaddexp`，不能直接相加对数，因为后者对应原概率相乘。

## 5. 怎样接到 PyTorch，哪些形状最容易弄错

网络未归一化输出称为 logits。先沿类别维做 `log_softmax`，再传给 `CTCLoss`。典型输入是 `[T,B,C]`：输出时间步、批次、含 blank 的类别数；不是所有网络常用的 `[B,T,C]`。目标字符不应把 blank 写进去；有效输入长度必须是下采样后的长度。

[已验证模块](../../code/neural_lab.py) 中的 `check_torch_ctc` 使用 `[5,1,3]` 输入、两个目标字，与手写结果对齐。`reduction='sum'` 让单条负对数似然方便比较；其他归一化口径可能给出不同数字。API 细节以 [PyTorch 官方 CTCLoss 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.CTCLoss.html) 为准。

如果目标是“啊啊”，至少需要三步：`啊 blank 啊`。更一般地，目标有 $U$ 个符号、其中有 $R$ 对相邻重复符号，就至少需要 $U+R$ 个有效输出步。这个长度约束针对模型下采样后的输出，不是原始音频帧数。时间不足会产生零目标概率和无穷大损失。先查长度、重复字和下采样，不要把 `zero_infinity=True` 当万能修复键；它将无穷损失及相关梯度置零，会让坏样本不再贡献正常训练信号，并没有修复对齐条件。

## 6. 识别“错几个字”，要用编辑距离而不是逐位置比较

参考文本是“打开空调”，预测为“打空调啊”。逐位置比较会把后面的字全判错，但实际只需删除“开”、末尾插入“啊”两个操作。最少编辑次数是 2，参考长 4，所以 CER 为 $\frac{2}{4}=50\%$。

编辑距离允许替换 $S$、删除 $D$、插入 $I$。设参考字数为 $N_{\mathrm{ref}}$，则：

$$
\mathrm{CER}=\frac{S+D+I}{N_{\mathrm{ref}}}
$$

插入很多时可以超过 100%。下面只用标准 Python 实现核心递推：

```python
def edit_distance(reference, hypothesis):
    row = list(range(len(hypothesis) + 1))
    for i, ref_char in enumerate(reference, start=1):
        new = [i]
        for j, hyp_char in enumerate(hypothesis, start=1):
            deletion = row[j] + 1
            insertion = new[j-1] + 1
            substitution = row[j-1] + (ref_char != hyp_char)
            new.append(min(deletion, insertion, substitution))
        row = new
    return row[-1]

ref, hyp = "打开空调", "打空调啊"
errors = edit_distance(ref, hyp)
print(errors, errors / len(ref))         # 2，0.5
```

`row[j]` 来自上一行，表示已处理更短参考文本的最佳成本；`new[j-1]` 来自当前行左边，表示刚插入一个预测字符。每格取三种操作的最低成本，才不会被整体错位误导。

真实评测应先固定全半角、标点、大小写、数字等规范。“十二”与“12”是否等价是评测选择，不能对某个模型临时放宽。CER 按规范化后的字符计数；WER 按词计数，中文如果使用 WER，还必须固定分词规则。不要把词错误率与字错误率直接比较。[课程评分器](../../code/asr_evaluate.py) 按编号对齐、拒绝漏样本、输出分组 CER。纯静音没有参考字，单独报告插入字数，不伪造分母；还要保留模型超时和失败的记录。

## 7. CTC、注意力与 RNN-T，先理解解决问题的方式

CTC 通常把给定输入后的路径概率分解到输出时间步，再折叠路径。编码器仍能利用上下文，所以条件独立假设不意味着网络只能看孤立一帧。

注意力编码器—解码器在生成下一个文字时，会利用之前生成的文字与输入表示。RNN-T 则结合声学时间状态与历史输出状态，在推进音频和发出文字之间建模。它们不是“旧→新→一定更好”的排行榜；数据、模型、解码和目标时延都影响选择。

流式能力也不是模型名字保证的。编码器若每次都读取整句未来，即使损失是 CTC，也不能直接当作低延迟流式系统。需要有限右上下文、跨块缓存，并区分暂定文字、稳定文字、句末结果。最终 CER 不会告诉你字幕在过程中修改了多少次。

## 8. 把基础转成可投实习的领域项目

你可以选“海洋与信号处理术语转写”，但只能使用获授权且可公开或脱敏的资料。先固定预训练模型、推理参数和语料划分，标出“波束形成、混响、水听器”等术语错误。热词是给解码增加领域偏好，不是把测试答案塞进去；要同时检查不含热词的负例会不会被误识成热词。

微调或 LoRA 之前先完成基线、归一化和错误分析。LoRA 减少可训练参数，并不自动保证少量数据不会过拟合。保留通用回归集，检查领域提升是否以通用识别退化为代价。

练习一：`啊 blank 啊啊` 折叠成什么？答案：“啊啊”。练习二：参考 100 字、编辑错误 12；另一段参考 10 字、错误 5，总体 CER 是多少？答案：$\frac{17}{110}\approx15.45\%$，不是简单平均 12% 与 50%。练习三：流式最终 CER 不变但首字晚 500 ms，是不是没有退化？答案：识别质量可能相近，交互体验已经退化。

排错时先检查采样率和声道，再检查 VAD 是否截断首尾、下采样长度是否正确、文本规范是否一致，最后才讨论模型大小。就业交付应包括逐句预测、分组 CER、领域词召回和误触发、首字/句末延迟、至少五类错误，以及一次可复现的单因素改进。只展示“成功调用模型转写一段音频”还不足以体现算法能力。
