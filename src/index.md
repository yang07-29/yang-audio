---
lang: zh
template: doc
theme: paper
style: off
title: 音频算法中文课程：从基础到实习项目
subtitle: 旧版进阶参考｜18 章讲义＋18 节字幕动画｜原内容日期2026-10-22
---

## A 这套课程怎样用
本页是旧版知识地图，保留作进阶参考，编号与当前教程不同。初学请从[当前学习首页](index.html)进入，沿新版课程顺序学习。

本课程覆盖音频算法就业的主要方向：3A、阵列、增强、ASR、TTS、声纹、分离、语音大模型与部署。属于系统入门，不能穷尽整个声学领域，也不代表看完就掌握全部算法。

每章都有中文原理、例子、工程难点、练习与答案。先看字幕动画形成直觉，再读讲义，最后动手验证。

动画是可播放的 HTML 页面，支持暂停、调速与章节跳转，**没有配音，不是 MP4 文件**。本套材料的解释、图示与字幕均为中文；保留行业缩写、模型名和代码标识，方便对照招聘描述。

讲义与动画可直接打开，课程目录使用本地链接。查看外部招聘页面、论文和开源项目时需要联网。

## B 全部课程入口
| 章 | 内容 | 讲义 | 动画 |
|---|---|---|---|
{{LESSONS}}

## C 招聘要求决定学习深度
| 岗位类型 | 先读 | 再深入 | 项目验收 |
|---|---|---|---|
| 共同基础 | 01—03 | 15、16 | 编程、训练验证、数据与指标 |
| 音频前端与水声迁移 | 04—08 | 15、17 | 增强、AEC 或阵列的完整对照实验 |
| ASR 识别 | 09—10 | 06、14、15 | CER/WER、领域词、鲁棒性与流式时延 |
| TTS 合成 | 11—12 | 03、14、15 | 中文读音、自然度、音色与性能 |
| 声纹与事件 | 13 | 03、08、15 | 阈值、分组评测、边界与重叠 |
| 语音大模型 | 14 | 09—12、15 | 理解、生成、打断与整链路评测 |

课程优先级来自公开招聘样本与能力之间的对应分析，不是技能频率统计。[第 00 章](lessons/00.html)列明官网、平台、搜索索引与已下线历史岗位，避免混淆。

## D 动手实验与自检
[打开 Python 练习源文件](exercises/audio_basics.py)。仅依赖 NumPy；使用合成数据，不需要显卡，不下载模型。

在本目录运行：

```text title="运行四个基础实验"
python exercises/audio_basics.py all
```

| 模式 | 实验 | 对应章节 |
|---|---|---|
| snr | 生成指定信噪比混合，重新计算验证 | 01、05 |
| stft | 分帧、频谱、重叠相加重建 | 02 |
| aec | 理想线性路径上的 NLMS 自适应估计 | 04 |
| ctc | 路径折叠与中文编辑距离 | 09 |

这些是基础数值实验，不是训练好的 ASR/TTS 系统。深度模型项目需要按讲义准备数据、环境与模型，再实际训练或评测。

## E 术语速查
| 缩写 | 中文 | 最容易混淆的点 |
|---|---|---|
| AEC | 声学回声消除 | 通常有远端参考；不是普通降噪 |
| ANS / NS | 噪声抑制 | 处理音频信号；不是 ANC |
| AGC | 自动增益控制 | 稳音量，不直接改善 SNR |
| ANC | 主动噪声控制 | 通过扬声器控制物理声场 |
| VAD / KWS | 语音活动检测 / 关键词唤醒 | 有人讲话不等于说了唤醒词 |
| DOA / BF | 到达方向估计 / 波束形成 | 一个估方向，一个输出空间滤波信号 |
| ASR / TTS | 自动语音识别 / 文本转语音 | 听成文字 / 把文字读出来 |
| CTC | 连接时序分类 | 处理未对齐的序列监督 |
| CER / WER | 字符 / 词错误率 | 分别按字符与词计数 |
| RTF | 实时率 | 不等于首包或整链路时延 |
| PTQ / QAT | 训练后量化 / 量化感知训练 | 量化不自动保证加速 |
| MOS | 主观平均意见分 | 预测分与真人评分要区分 |

## F 可核查的资料入口
课程中的基础推导与例子为教学编写。开源项目只作学习入口，未宣称本机已安装或训练这些模型。

| 主题 | 原始或官方资料 |
|---|---|
| 3A | [WebRTC 音频处理模块](https://webrtc.googlesource.com/src/+/refs/heads/main/modules/audio_processing/g3doc/audio_processing_module.md) |
| 神经降噪 | [RNNoise 作者仓库](https://github.com/xiph/rnnoise)、[DNS 挑战](https://github.com/microsoft/DNS-Challenge) |
| 阵列定位 | [Pyroomacoustics 文档](https://pyroomacoustics.readthedocs.io/en/pypi-release/pyroomacoustics.doa.html) |
| ASR | [CTC 原理图解](https://distill.pub/2017/ctc/)、[Conformer 原论文](https://arxiv.org/abs/2005.08100)、[FunASR](https://github.com/modelscope/FunASR) |
| TTS | [VITS 作者仓库](https://github.com/jaywalnut310/vits)、[CosyVoice 官方仓库](https://github.com/QwenAudio/CosyVoice) |
| 多任务语音 | [SpeechBrain](https://github.com/speechbrain/speechbrain) |
| 神经音频编码 | [EnCodec](https://github.com/facebookresearch/encodec) |

## G 从今天开始
第一轮先学 01—03，运行四个实验中的前两个。第二轮读 04—08，选择增强或阵列主项目。之后根据实际岗位选择 ASR 或 TTS 分支。

每次学习留下四样东西：一个能闭卷解释的概念、一段运行过的代码、一项有条件说明的结果、一个仍然不清楚的问题。第 16 章给出了项目规格与四周起步安排。
