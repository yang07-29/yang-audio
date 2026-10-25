# 前端与声学章节内容审查记录

审查日期：2026-10-23。范围：第07—11章全部正文、公式、手算例子、代码段、图注与练习答案。仅修订这五份 Markdown；未修改网站构建器、HTML、核心算法源码、图片或实验参数。

## 逐章结果

| 章节 | 发现与修正 | 核验依据 |
|---|---|---|
| 07 滤波器 | 修复上一课指向目录的问题；补充 `firwin` 截止为半幅度约 −6 dB，不可与半功率 −3 dB 混用；补充 `filtfilt` 不只去延迟，还会改变幅度响应及等效阶数 | SciPy `firwin`、`filtfilt` 官方文档；核对已存参数与图注 |
| 08 AEC | 移除把真值活动冻结称为通用“上界”的表述；说明它只是理想机制对照，双讲伴随路径变化时可能不占优；补充恒定输入手算例子不能代表所有不相关近端语音情形 | 检查 `nlms` 更新式、误差定义和原始六秒实验说明；用梯度与相关性区分单样本反例和统计模型 |
| 09 ANS/AGC/VAD/KWS | 标题四个部门改为五个模块；明确3A为AEC/ANS/AGC；给神经降噪设置第12课先修提示；RMS阈值不再混称平方能量；挂起时长按判决更新间隔而非窗长计算 | 逐行核对 `frame_agc`、`energy_vad`，确认本例不重叠160点分帧与五帧挂起 |
| 10 阵列 | 明确 $\tau=t_2-t_1$ 与正角度约定；说明取整搜索上界不等于物理上限；修正相关噪声须在对齐之后比较；限定MVDR“更吵通道更小权重”只是玩具例子；补足MUSIC空间白噪声假设 | 核对 `gcc_phat`、`mvdr`、`music_scan`；MathWorks MUSIC官方模型说明 |
| 11 专业声学 | 补下一课导航；区分RIR互不重叠脉冲的平方和与任意语音多路径相干叠加；说明全正指数序列只是EDC公式校验，不是真实RIR；提醒多段衰减下各拟合口径可能不同 | 重新核对DRR算式、EDC定义和RT60指数系数；未更改原公式与图 |

## 代码与图的边界

- 本轮未修改这五章任何 Python 代码块，也未改生成图的参数，因此原先保存的代码—图对应关系保持不变。
- 原有 `frontend_snippets.json` 记录了此前12个代码块独立运行通过及5张新图的人工检查。本轮是内容复核，不把历史执行冒充为重新运行。
- 本轮另外实际运行了四项小型数值复核：65抽头、16 kHz、2000 Hz的 `firwin` 截止幅度为0.500481、约−6.01224 dB；MVDR手算输出噪声功率为0.8；8 cm双麦的最大时差为3.73178采样；三路径DRR为5.05150 dB。截止点的数值断言通过。这些复核不重生成图片，也不替代全套实验回归。
- 新补充的滤波器与MUSIC说明通过官方资料交叉核验；不是声学硬件验收、真实语音指标复测或新模型训练。
- 未评价导师具体项目、招聘在招状态、薪资或真实房间/麦克风性能。

## 本轮查阅的一手资料

- [SciPy firwin](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.firwin.html)：半幅度截止点与线性相位。
- [SciPy filtfilt](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.filtfilt.html)：双向滤波、零相位与等效阶数。
- [MathWorks MUSIC Super-Resolution DOA Estimation](https://www.mathworks.com/help/phased/ug/music-super-resolution-doa-estimation.html)：信号模型、空间白噪声与子空间条件。
