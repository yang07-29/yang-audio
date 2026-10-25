# 第12—18课内容审查记录

审查日期：2026-10-23。范围：七份正文 Markdown 的全文、其12段 Python 代码与旧网页代码文本、相关历史运行记录和指定官方资料。只修改讲解、术语、先修提示和学习安排，未改动核心 Python 代码或实验图片。

## 逐章结论

| 章节 | 审查重点 | 发现与修订 |
|---|---|---|
| 12 神经网络与训练 | 梯度符号、掩码目标、张量形状、填充损失、因果性、集合划分 | 原文“负梯度”容易同时指“梯度为负”和“梯度取反”，现明确区分；补第04、05课的先修链接；说明全空批次不能除以零后继续训练。保留单参数手算、63帧形状、原合成训练图的边界。 |
| 13 ASR | CTC折叠顺序、路径求和、动态规划、PyTorch输入形状、编辑距离、流式 | 增加首次阅读范围；补输出步数至少为目标长度加相邻重复对数；明确 zero_infinity 将无穷损失及梯度置零而非修复数据；区分 CER/WER 的计数单元和中文分词协议。 |
| 14 TTS | 中文前端、F0与音色、时长展开、声码器长度、生成方法、评测 | 补直接先修链接与核心/拓展阅读范围；说明转置卷积不是数值逆卷积或简单矩阵转置，并链接官方长度公式。保留随机声码器仅验证形状、人工类元音不是自然 TTS 成果的标记。 |
| 15 声纹与日志 | 任务边界、余弦分数、FAR/FRR分母、EER、DER、事件检测 | 去掉“四个任务”的不准确计数；实质澄清 EER 的扫描评价与上线固定阈值的选择不同，避免把规定的测试集 EER 计算误称为数据泄漏；补 collar 是排除边界区域而非吸附预测边界。 |
| 16 实时工程 | 波形缓存、RTF、端到端时延、量化、ONNX一致性、打断状态 | 补学习顺序；明确延迟的起止事件以及收到音频包/实际播放的差别；定义 P95 而非“最慢5%的均值”；补四位窄范围 `[-7,7]` 的约定及全零张量刻度边界。 |
| 17 实习项目 | 项目范围、基线对照、数据许可、教学顺序、就业承诺 | 项目A/B改成“项目方向一/二”；原计划在第04课NumPy前就要求运行配噪与改图，现先读图和手算、补数组，再运行实验；把传统基线与神经网络明确分阶段，避免新手一开始并行训练；保留不保证岗位/薪资的边界。 |
| 18 术语与自测 | 定义是否过度简化、单位题、与主课定位关系 | 明确这是随用随查的附录，不是第二套主线；MFCC具体到常见DCT步骤；补 CER/WER、EER、DER、P95，并细化首包延迟定义。 |

## 代码与数值核验

1. 从第12—16课提取12段 `python` 围栏，全部通过 `ast.parse` 语法检查。
2. 解析修订前已有 HTML 中的 `.am-ln` 代码行，逐段核对：12段代码与修订后 Markdown 完全一致，包含原有中文注释。
3. 读取 `speech_snippets.json`，确认这些章节代码曾于2026-10-22逐段执行；读取 `neural_results.json`，并核对 `neural_lab.py` 的 `train_epoch`、掩码维度、CTC与声码器检查入口。
4. 本轮没有改算法或重跑原绘图，因此沿用原实验图与其条件说明，没有把文字审查写成“重新训练或重新测试真实模型”。

代码块分布：第12课3段、第13课2段、第14课2段、第15课2段、第16课3段；第17—18课无 Python 围栏。

## 官方资料核验

- [PyTorch CTCLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CTCLoss.html)：输入为对数概率、时间/批次/类别形状、目标不含 blank、归约方式、zero_infinity 行为。
- [PyTorch ConvTranspose1d](https://docs.pytorch.org/docs/stable/generated/torch.nn.ConvTranspose1d.html)：输出长度公式及其不等同数值逆运算的边界。
- [SpeechBrain EER](https://speechbrain.readthedocs.io/en/latest/API/speechbrain.utils.metric_stats.html#speechbrain.utils.metric_stats.EER)：从同人/异人分数计算 EER 并返回对应阈值。
- [pyannote.metrics](https://pyannote.github.io/pyannote-metrics/reference.html)：说话人标签最优映射、评价区域、重叠与 collar。
- [ONNX Runtime 量化](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)：动态/静态量化、标定、量化可能影响准确率及性能依赖硬件。

## 未覆盖事项

本轮没有训练真实语音 ASR/TTS/声纹模型，没有执行新的 GPU、ONNX 或 INT4 性能测试，没有刷新招聘名额与薪资，也没有审查00—11课或修改网页构建逻辑。网页目录、渲染和全站链接由主任务另行验证。
