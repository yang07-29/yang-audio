---
lang: zh
template: doc
theme: paper
style: off
title: 音频算法实习实战课｜中文图解、核心代码与真实实验
subtitle: 深化版 · 2026-10-22 · 从读懂代码到能交付项目
---

## A 这一版怎样学
本页是旧版进阶参考，不是当前教程的第二个起点。[当前主教程](index.html)按准备课和连续课程安排学习；需要补充实战细节时，再查下方“实战详解”。每讲把岗位任务、公式或模型、真实源码、中文实验图、失败分析与项目验收连起来，正文代码直接取自随课程提供的文件，行号可核对。

更早的 18 章概览和短动画保留为查词材料，入口在[旧版知识地图](overview.html)。它们与本页都属于归档参考，编号不对应当前主教程。

本次实际运行了 DSP 实验、一个 PyTorch 小型掩码网络训练、CTC 数值与梯度核对、TTS 核心模块前向与梯度检查、评测工具和打断逻辑测试。合成数据、模块验证与真实项目任务在各章分别注明，不把它们混称为已经训练好的 ASR/TTS 系统。

## B 实战详解：按顺序或岗位选择
| 讲次 | 学什么 | 交付什么 |
|---|---|---|
| [01 波形、SNR、STFT](deep/01.html) | 采样、频谱、加窗、重建，逐段代码解释 | 配噪与重建实验 |
| [15 Mel 与 MFCC](deep/15.html) | 自己构造滤波器组、特征与形状 | 前处理一致性检查 |
| [02 PyTorch 训练](deep/02.html) | 数据集、变长掩码、因果卷积、梯度与验证 | 可运行训练记录 |
| [03 AEC](deep/03.html) | 从梯度推 NLMS，双讲与路径变化 | 收敛与失配消融 |
| [04 ANS / 语音增强](deep/04.html) | 维纳式基线、神经掩码、相位与指标 | 真实语音增强项目规格 |
| [05 AGC、VAD 与唤醒](deep/05.html) | 电平平滑、迟滞、挂起、误检漏检 | 状态与阈值实验 |
| [06 阵列算法](deep/06.html) | GCC-PHAT、MUSIC、MVDR | 几何与定位验证 |
| [07 分离与去混响](deep/07.html) | SI-SDR、PIT、目标定义与 WPE 思路 | 对齐与匹配评测 |
| [08 ASR 核心 CTC](deep/08.html) | 手写动态规划，与穷举及 PyTorch 核对 | 损失与梯度验证 |
| [09 ASR 项目](deep/09.html) | JSONL 数据、CER、热词、微调与分组 | 可复用评测器 |
| [10 TTS 核心](deep/10.html) | 中文前端、时长、声源滤波、神经声码器 | 核心模块与中文测试集规格 |
| [11 声纹与日志](deep/11.html) | 相似度、FAR/FRR/EER、日志与事件 | 阈值与分组分析 |
| [12 语音交互与部署](deep/12.html) | 打断状态、旧任务取消、量化与延迟 | 工程边界测试 |
| [14 ANC 与常见音频](deep/14.html) | FxLMS、音效、空间音频、编码传输 | 主动控制仿真 |
| [13 就业项目与面试](deep/13.html) | 项目规格、面试要点、学习验收 | 一页简历的真实证据 |

## C 先看一张实际实验图
![AEC 在双讲与路径改变时的行为：用中文曲线解释为什么不能盲目更新。](figures/02_aec.png)

这张图的双讲冻结使用合成真值，仅是理想对照。对应[实战 03](deep/03.html)会解释信号模型、梯度推导、逐行更新、结果含义和怎么改成更真实的实验。

本版还包括采样与混叠、频谱与声谱图、降噪、AGC/VAD、阵列、PIT、CTC、TTS、声纹、量化、神经网络训练、ANC 和 Mel/MFCC 的中文图。

## D 一次把核心实验跑起来
本机已验证环境为 NumPy 2.4.4、SciPy 1.16.3、Matplotlib 3.10.6、PyTorch 2.11.0，使用 CPU。系统已有这些库，没有为本课安装或下载模型。

进入解压后的课程目录，按顺序运行：

```text title="在有对应 Python 库的环境中运行"
python code/run_experiments.py
python code/features_lab.py
python code/neural_lab.py
python code/anc_lab.py
python code/check_project_tools.py
python code/asr_evaluate.py results/asr_reference.jsonl results/asr_prediction.jsonl
```

其他电脑需要 NumPy、SciPy、Matplotlib 和 PyTorch。绘图脚本默认使用 Windows 微软雅黑字体，非 Windows 环境需替换为可用中文字体。所有实验使用课程内合成数据，不录音、不调用付费接口。

[DSP 实测结果](results/dsp_results.json) · [训练日志与模块检查](results/neural_results.json) · [ANC 结果](results/anc_results.json) · [特征结果](results/features_results.json)

[运行说明](README.md) · [本版核验记录](results/实战版核验记录.md) · [页面与源码检查](results/practical_verification.json)

## E 从学习实验到就业项目还差哪一步
| 现在已经提供并验证 | 你需要继续完成的真实项目工作 |
|---|---|
| 合成音频中的核心算法与可视化 | 合法真实语音、噪声、设备或阵列数据 |
| 小掩码网络的训练闭环 | 未知说话人、未知环境与基线比较 |
| CTC 损失与评分代码 | 预训练 ASR 推理、领域适配与真实测试 |
| TTS 模块形状和梯度检查 | 真实合成模型复现与中文听评 |
| 打断状态和量化数值实验 | 实际播放取消、推理后端与性能测量 |

不用等所有方向都精通才投递。结合你的背景，先完成增强或阵列主项目，再补一条 ASR 应用线。具体项目规格、面试验收和用时建议见[实战 13](deep/13.html)。

## F 招聘依据与资料
课程对应数字信号处理、Python/PyTorch、阵列、3A、ASR/TTS、数据清洗、评测和部署等公开招聘要求。[岗位样本与状态说明](lessons/00.html)保留了官网、平台、搜索索引和历史岗位的区别，不把已下线岗位当作当前机会。

技术参考：[WebRTC APM](https://webrtc.googlesource.com/src/+/refs/heads/main/modules/audio_processing/g3doc/audio_processing_module.md)、[PyTorch CTC](https://docs.pytorch.org/docs/stable/generated/torch.nn.CTCLoss.html)、[FunASR](https://github.com/modelscope/FunASR)、[CosyVoice](https://github.com/QwenAudio/CosyVoice)、[Pyroomacoustics](https://pyroomacoustics.readthedocs.io/en/pypi-release/pyroomacoustics.doa.html)。这些链接帮助查正式实现；课程代码是独立教学实现，不声称复现全部产品能力。

## G 本周先交什么
先读 01 与 15，运行数据处理和特征实验；再读 02，复跑训练并改一次参数。最终交一页说明：输入是什么、数组形状是什么、改了什么、结果怎样、哪里还不懂。

之后进入 AEC 或阵列，不急着同时训练 ASR 和 TTS。每一步都留下可运行代码、实验配置和失败分析，这些会成为你实习简历的依据。
