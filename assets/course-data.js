window.AUDIO_COURSE = {
  "groups": [
    {
      "id": "guide",
      "title": "开始之前"
    },
    {
      "id": "basics",
      "title": "第一阶段 · 声音与数字信号"
    },
    {
      "id": "frontend",
      "title": "第二阶段 · 音频前端与声学"
    },
    {
      "id": "speech",
      "title": "第三阶段 · 训练与语音任务"
    },
    {
      "id": "project",
      "title": "第四阶段 · 做成实习项目"
    },
    {
      "id": "reference",
      "title": "随时查阅"
    }
  ],
  "lessons": [
    {
      "id": "00",
      "number": "导学",
      "short": "环境与学习方法",
      "group": "guide",
      "title": "准备课 · 环境与学习方法",
      "prerequisite": "无；会打开网页即可",
      "outcome": "知道从哪里开始，以及怎样读代码与结果",
      "keywords": "开始 环境 安装 Python",
      "stage": "开始之前",
      "url": "tutorial/chapters/00_start.html",
      "kind": "lesson"
    },
    {
      "id": "01",
      "number": "01",
      "short": "声音、振幅与频率",
      "group": "basics",
      "title": "第01课 · 声音、振幅与频率",
      "prerequisite": "准备课；基础三角函数",
      "outcome": "分清频率、振幅、相位和谐波",
      "keywords": "振动 麦克风 波长",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/01_sound.html",
      "kind": "lesson"
    },
    {
      "id": "02",
      "number": "02",
      "short": "采样、量化与音频文件",
      "group": "basics",
      "title": "第02课 · 采样、量化与音频文件",
      "prerequisite": "第01课",
      "outcome": "解释采样率、位深、声道和重采样",
      "keywords": "PCM WAV 采样率 位深 重采样",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/02_digital.html",
      "kind": "lesson"
    },
    {
      "id": "03",
      "number": "03",
      "short": "分贝、电平与信噪比",
      "group": "basics",
      "title": "第03课 · 分贝、电平与信噪比",
      "prerequisite": "第01—02课；对数的含义",
      "outcome": "分清dBFS、声压级、SNR和响度",
      "keywords": "RMS dBFS SPL LUFS SNR",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/03_decibels.html",
      "kind": "lesson"
    },
    {
      "id": "04",
      "number": "04",
      "short": "用 NumPy 处理音频",
      "group": "basics",
      "title": "第04课 · 用 NumPy 处理音频",
      "prerequisite": "第01—03课；Python变量与循环",
      "outcome": "看懂数组的形状、轴、切片和分帧",
      "keywords": "numpy shape 广播 dtype python",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/04_numpy.html",
      "kind": "lesson"
    },
    {
      "id": "05",
      "number": "05",
      "short": "频谱、窗与 STFT",
      "group": "basics",
      "title": "第05课 · 频谱、窗与 STFT",
      "prerequisite": "第02、04课",
      "outcome": "读懂频谱与声谱图，并解释重建条件",
      "keywords": "FFT STFT 相位 卷积 窗函数",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/05_spectrum.html",
      "kind": "lesson"
    },
    {
      "id": "06",
      "number": "06",
      "short": "Mel、MFCC 与语音特征",
      "group": "basics",
      "title": "第06课 · Mel、MFCC 与语音特征",
      "prerequisite": "第03—05课",
      "outcome": "解释特征的形状、物理含义和配置",
      "keywords": "MFCC Mel F0 共振峰 特征",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/06_features.html",
      "kind": "lesson"
    },
    {
      "id": "07",
      "number": "07",
      "short": "滤波器与流式状态",
      "group": "frontend",
      "title": "第07课 · 滤波器与流式状态",
      "prerequisite": "第04—05课",
      "outcome": "比较FIR/IIR，并解释为何要保留历史状态",
      "keywords": "FIR IIR EQ 群延迟 滤波 流式",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/07_filters.html",
      "kind": "lesson"
    },
    {
      "id": "08",
      "number": "08",
      "short": "AEC：预测并消除回声",
      "group": "frontend",
      "title": "第08课 · AEC：预测并消除回声",
      "prerequisite": "第04、07课；向量内积",
      "outcome": "手算一次NLMS更新，识别双讲与延迟失配",
      "keywords": "AEC LMS NLMS ERLE 回声 双讲",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/08_aec.html",
      "kind": "lesson"
    },
    {
      "id": "09",
      "number": "09",
      "short": "降噪、AGC 与 VAD",
      "group": "frontend",
      "title": "第09课 · 降噪、AGC 与 VAD",
      "prerequisite": "第03、05、07—08课",
      "outcome": "说明3A分工及评价边界",
      "keywords": "ANS NS AGC VAD KWS 3A 语音增强",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/09_enhancement.html",
      "kind": "lesson"
    },
    {
      "id": "10",
      "number": "10",
      "short": "麦克风阵列与波束形成",
      "group": "frontend",
      "title": "第10课 · 麦克风阵列与波束形成",
      "prerequisite": "第04—05、07课；矩阵基础",
      "outcome": "理解时差、方向估计和空间滤波",
      "keywords": "DOA GCC PHAT MVDR MUSIC 波束形成",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/10_arrays.html",
      "kind": "lesson"
    },
    {
      "id": "11",
      "number": "11",
      "short": "混响、测量与水声迁移",
      "group": "frontend",
      "title": "第11课 · 混响、测量与水声迁移",
      "prerequisite": "第02—03、07课；阵列部分先学10",
      "outcome": "区分房间混响、声学测量与水声迁移边界",
      "keywords": "RIR RT60 DRR ANC 水声 混响",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/11_acoustics.html",
      "kind": "lesson"
    },
    {
      "id": "12",
      "number": "12",
      "short": "神经网络与训练基础",
      "group": "speech",
      "title": "第12课 · 神经网络与训练基础",
      "prerequisite": "第04—06课；导数与向量",
      "outcome": "解释梯度、张量、损失和验证集",
      "keywords": "PyTorch 梯度 loss 神经网络 掩码",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/12_pytorch.html",
      "kind": "lesson"
    },
    {
      "id": "13",
      "number": "13",
      "short": "ASR：把语音变成文字",
      "group": "speech",
      "title": "第13课 · ASR：把语音变成文字",
      "prerequisite": "第05—06、12课；基本概率",
      "outcome": "理解CTC路径求和、CER和流式识别",
      "keywords": "ASR CTC CER WER Conformer RNNT 识别",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/13_asr.html",
      "kind": "lesson"
    },
    {
      "id": "14",
      "number": "14",
      "short": "TTS：让文字变成语音",
      "group": "speech",
      "title": "第14课 · TTS：让文字变成语音",
      "prerequisite": "第02、05—06、12课",
      "outcome": "解释中文前端、时长、声码器与评价",
      "keywords": "TTS 合成 声码器 扩散 韵律",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/14_tts.html",
      "kind": "lesson"
    },
    {
      "id": "15",
      "number": "15",
      "short": "声纹与说话人日志",
      "group": "speech",
      "title": "第15课 · 声纹与说话人日志",
      "prerequisite": "第06、12课；分类与相似度",
      "outcome": "区分声纹验证、说话人日志及阈值选择",
      "keywords": "EER DER 说话人 diarization embedding",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/15_speaker.html",
      "kind": "lesson"
    },
    {
      "id": "16",
      "number": "16",
      "short": "实时处理与部署",
      "group": "speech",
      "title": "第16课 · 实时处理与部署",
      "prerequisite": "第04、07、12课；所选任务章节",
      "outcome": "定义时延、状态、量化和部署测试",
      "keywords": "ONNX RTF P95 量化 部署 延迟",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/16_engineering.html",
      "kind": "lesson"
    },
    {
      "id": "17",
      "number": "17",
      "short": "做出一个实习项目",
      "group": "project",
      "title": "第17课 · 做出一个实习项目",
      "prerequisite": "共同基础＋所选方向；先完成一个小实验",
      "outcome": "交付可复现基线、评测、失败分析与真实贡献",
      "keywords": "实习 简历 项目 学习安排",
      "stage": "第四阶段 · 做成实习项目",
      "url": "tutorial/chapters/17_project.html",
      "kind": "lesson"
    },
    {
      "id": "18",
      "number": "18",
      "short": "术语与闭卷自测",
      "group": "reference",
      "title": "第18课 · 术语与闭卷自测",
      "prerequisite": "随用随查，不要求先读完",
      "outcome": "找出概念混淆并回到对应课复习",
      "keywords": "术语 自测 复习",
      "stage": "随时查阅",
      "url": "tutorial/chapters/18_glossary.html",
      "kind": "lesson"
    }
  ],
  "labs": [
    {
      "id": "lab01",
      "title": "随课实验01 · 声音成为数组",
      "parent": "04",
      "url": "tutorial/labs/01_sound.html",
      "source": "01_声音成为数组.md",
      "part": null,
      "goal": "改频率和幅度，预测并比较波形变化",
      "kind": "lab"
    },
    {
      "id": "lab02",
      "title": "随课实验02 · 分贝与配噪",
      "parent": "04",
      "url": "tutorial/labs/02_levels.html",
      "source": "02_分贝不是音量旋钮.md",
      "part": null,
      "goal": "用RMS计算电平，验证指定SNR",
      "kind": "lab"
    },
    {
      "id": "lab03",
      "title": "随课实验03 · 滤波与流式状态",
      "parent": "07",
      "url": "tutorial/labs/03_streaming.html",
      "source": "03_滤波和流式状态.md",
      "part": null,
      "goal": "比较整段处理、保留状态和错误重置",
      "kind": "lab"
    },
    {
      "id": "lab04",
      "title": "随课实验04 · 手写 AEC 更新",
      "parent": "08",
      "url": "tutorial/labs/04_aec.html",
      "source": "04_手写AEC与CTC.md",
      "part": "aec",
      "goal": "看一个系数怎样通过NLMS逐步接近真值",
      "kind": "lab"
    },
    {
      "id": "lab05",
      "title": "随课实验05 · 手算 CTC 路径",
      "parent": "13",
      "url": "tutorial/labs/05_ctc.html",
      "source": "04_手写AEC与CTC.md",
      "part": "ctc",
      "goal": "枚举合法对齐路径，理解概率为什么相加",
      "kind": "lab"
    }
  ],
  "pages": [
    {
      "id": "home",
      "url": "index.html",
      "kind": "home",
      "title": "课程首页"
    },
    {
      "id": "00",
      "number": "导学",
      "short": "环境与学习方法",
      "group": "guide",
      "title": "准备课 · 环境与学习方法",
      "prerequisite": "无；会打开网页即可",
      "outcome": "知道从哪里开始，以及怎样读代码与结果",
      "keywords": "开始 环境 安装 Python",
      "stage": "开始之前",
      "url": "tutorial/chapters/00_start.html",
      "kind": "lesson"
    },
    {
      "id": "01",
      "number": "01",
      "short": "声音、振幅与频率",
      "group": "basics",
      "title": "第01课 · 声音、振幅与频率",
      "prerequisite": "准备课；基础三角函数",
      "outcome": "分清频率、振幅、相位和谐波",
      "keywords": "振动 麦克风 波长",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/01_sound.html",
      "kind": "lesson"
    },
    {
      "id": "02",
      "number": "02",
      "short": "采样、量化与音频文件",
      "group": "basics",
      "title": "第02课 · 采样、量化与音频文件",
      "prerequisite": "第01课",
      "outcome": "解释采样率、位深、声道和重采样",
      "keywords": "PCM WAV 采样率 位深 重采样",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/02_digital.html",
      "kind": "lesson"
    },
    {
      "id": "03",
      "number": "03",
      "short": "分贝、电平与信噪比",
      "group": "basics",
      "title": "第03课 · 分贝、电平与信噪比",
      "prerequisite": "第01—02课；对数的含义",
      "outcome": "分清dBFS、声压级、SNR和响度",
      "keywords": "RMS dBFS SPL LUFS SNR",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/03_decibels.html",
      "kind": "lesson"
    },
    {
      "id": "04",
      "number": "04",
      "short": "用 NumPy 处理音频",
      "group": "basics",
      "title": "第04课 · 用 NumPy 处理音频",
      "prerequisite": "第01—03课；Python变量与循环",
      "outcome": "看懂数组的形状、轴、切片和分帧",
      "keywords": "numpy shape 广播 dtype python",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/04_numpy.html",
      "kind": "lesson"
    },
    {
      "id": "05",
      "number": "05",
      "short": "频谱、窗与 STFT",
      "group": "basics",
      "title": "第05课 · 频谱、窗与 STFT",
      "prerequisite": "第02、04课",
      "outcome": "读懂频谱与声谱图，并解释重建条件",
      "keywords": "FFT STFT 相位 卷积 窗函数",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/05_spectrum.html",
      "kind": "lesson"
    },
    {
      "id": "06",
      "number": "06",
      "short": "Mel、MFCC 与语音特征",
      "group": "basics",
      "title": "第06课 · Mel、MFCC 与语音特征",
      "prerequisite": "第03—05课",
      "outcome": "解释特征的形状、物理含义和配置",
      "keywords": "MFCC Mel F0 共振峰 特征",
      "stage": "第一阶段 · 声音与数字信号",
      "url": "tutorial/chapters/06_features.html",
      "kind": "lesson"
    },
    {
      "id": "07",
      "number": "07",
      "short": "滤波器与流式状态",
      "group": "frontend",
      "title": "第07课 · 滤波器与流式状态",
      "prerequisite": "第04—05课",
      "outcome": "比较FIR/IIR，并解释为何要保留历史状态",
      "keywords": "FIR IIR EQ 群延迟 滤波 流式",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/07_filters.html",
      "kind": "lesson"
    },
    {
      "id": "08",
      "number": "08",
      "short": "AEC：预测并消除回声",
      "group": "frontend",
      "title": "第08课 · AEC：预测并消除回声",
      "prerequisite": "第04、07课；向量内积",
      "outcome": "手算一次NLMS更新，识别双讲与延迟失配",
      "keywords": "AEC LMS NLMS ERLE 回声 双讲",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/08_aec.html",
      "kind": "lesson"
    },
    {
      "id": "09",
      "number": "09",
      "short": "降噪、AGC 与 VAD",
      "group": "frontend",
      "title": "第09课 · 降噪、AGC 与 VAD",
      "prerequisite": "第03、05、07—08课",
      "outcome": "说明3A分工及评价边界",
      "keywords": "ANS NS AGC VAD KWS 3A 语音增强",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/09_enhancement.html",
      "kind": "lesson"
    },
    {
      "id": "10",
      "number": "10",
      "short": "麦克风阵列与波束形成",
      "group": "frontend",
      "title": "第10课 · 麦克风阵列与波束形成",
      "prerequisite": "第04—05、07课；矩阵基础",
      "outcome": "理解时差、方向估计和空间滤波",
      "keywords": "DOA GCC PHAT MVDR MUSIC 波束形成",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/10_arrays.html",
      "kind": "lesson"
    },
    {
      "id": "11",
      "number": "11",
      "short": "混响、测量与水声迁移",
      "group": "frontend",
      "title": "第11课 · 混响、测量与水声迁移",
      "prerequisite": "第02—03、07课；阵列部分先学10",
      "outcome": "区分房间混响、声学测量与水声迁移边界",
      "keywords": "RIR RT60 DRR ANC 水声 混响",
      "stage": "第二阶段 · 音频前端与声学",
      "url": "tutorial/chapters/11_acoustics.html",
      "kind": "lesson"
    },
    {
      "id": "12",
      "number": "12",
      "short": "神经网络与训练基础",
      "group": "speech",
      "title": "第12课 · 神经网络与训练基础",
      "prerequisite": "第04—06课；导数与向量",
      "outcome": "解释梯度、张量、损失和验证集",
      "keywords": "PyTorch 梯度 loss 神经网络 掩码",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/12_pytorch.html",
      "kind": "lesson"
    },
    {
      "id": "13",
      "number": "13",
      "short": "ASR：把语音变成文字",
      "group": "speech",
      "title": "第13课 · ASR：把语音变成文字",
      "prerequisite": "第05—06、12课；基本概率",
      "outcome": "理解CTC路径求和、CER和流式识别",
      "keywords": "ASR CTC CER WER Conformer RNNT 识别",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/13_asr.html",
      "kind": "lesson"
    },
    {
      "id": "14",
      "number": "14",
      "short": "TTS：让文字变成语音",
      "group": "speech",
      "title": "第14课 · TTS：让文字变成语音",
      "prerequisite": "第02、05—06、12课",
      "outcome": "解释中文前端、时长、声码器与评价",
      "keywords": "TTS 合成 声码器 扩散 韵律",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/14_tts.html",
      "kind": "lesson"
    },
    {
      "id": "15",
      "number": "15",
      "short": "声纹与说话人日志",
      "group": "speech",
      "title": "第15课 · 声纹与说话人日志",
      "prerequisite": "第06、12课；分类与相似度",
      "outcome": "区分声纹验证、说话人日志及阈值选择",
      "keywords": "EER DER 说话人 diarization embedding",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/15_speaker.html",
      "kind": "lesson"
    },
    {
      "id": "16",
      "number": "16",
      "short": "实时处理与部署",
      "group": "speech",
      "title": "第16课 · 实时处理与部署",
      "prerequisite": "第04、07、12课；所选任务章节",
      "outcome": "定义时延、状态、量化和部署测试",
      "keywords": "ONNX RTF P95 量化 部署 延迟",
      "stage": "第三阶段 · 训练与语音任务",
      "url": "tutorial/chapters/16_engineering.html",
      "kind": "lesson"
    },
    {
      "id": "17",
      "number": "17",
      "short": "做出一个实习项目",
      "group": "project",
      "title": "第17课 · 做出一个实习项目",
      "prerequisite": "共同基础＋所选方向；先完成一个小实验",
      "outcome": "交付可复现基线、评测、失败分析与真实贡献",
      "keywords": "实习 简历 项目 学习安排",
      "stage": "第四阶段 · 做成实习项目",
      "url": "tutorial/chapters/17_project.html",
      "kind": "lesson"
    },
    {
      "id": "18",
      "number": "18",
      "short": "术语与闭卷自测",
      "group": "reference",
      "title": "第18课 · 术语与闭卷自测",
      "prerequisite": "随用随查，不要求先读完",
      "outcome": "找出概念混淆并回到对应课复习",
      "keywords": "术语 自测 复习",
      "stage": "随时查阅",
      "url": "tutorial/chapters/18_glossary.html",
      "kind": "lesson"
    },
    {
      "id": "lab01",
      "title": "随课实验01 · 声音成为数组",
      "parent": "04",
      "url": "tutorial/labs/01_sound.html",
      "source": "01_声音成为数组.md",
      "part": null,
      "goal": "改频率和幅度，预测并比较波形变化",
      "kind": "lab"
    },
    {
      "id": "lab02",
      "title": "随课实验02 · 分贝与配噪",
      "parent": "04",
      "url": "tutorial/labs/02_levels.html",
      "source": "02_分贝不是音量旋钮.md",
      "part": null,
      "goal": "用RMS计算电平，验证指定SNR",
      "kind": "lab"
    },
    {
      "id": "lab03",
      "title": "随课实验03 · 滤波与流式状态",
      "parent": "07",
      "url": "tutorial/labs/03_streaming.html",
      "source": "03_滤波和流式状态.md",
      "part": null,
      "goal": "比较整段处理、保留状态和错误重置",
      "kind": "lab"
    },
    {
      "id": "lab04",
      "title": "随课实验04 · 手写 AEC 更新",
      "parent": "08",
      "url": "tutorial/labs/04_aec.html",
      "source": "04_手写AEC与CTC.md",
      "part": "aec",
      "goal": "看一个系数怎样通过NLMS逐步接近真值",
      "kind": "lab"
    },
    {
      "id": "lab05",
      "title": "随课实验05 · 手算 CTC 路径",
      "parent": "13",
      "url": "tutorial/labs/05_ctc.html",
      "source": "04_手写AEC与CTC.md",
      "part": "ctc",
      "goal": "枚举合法对齐路径，理解概率为什么相加",
      "kind": "lab"
    },
    {
      "id": "experiments",
      "url": "tutorial/experiments.html",
      "kind": "utility",
      "title": "随课实验"
    },
    {
      "id": "resources",
      "url": "tutorial/resources.html",
      "kind": "utility",
      "title": "资料与内容审查"
    },
    {
      "id": "review_foundation_v4",
      "url": "tutorial/results/review_foundation_v4.html",
      "kind": "utility",
      "title": "内容审查记录"
    },
    {
      "id": "review_frontend_v4",
      "url": "tutorial/results/review_frontend_v4.html",
      "kind": "utility",
      "title": "内容审查记录"
    },
    {
      "id": "review_speech_v4",
      "url": "tutorial/results/review_speech_v4.html",
      "kind": "utility",
      "title": "内容审查记录"
    },
    {
      "id": "章节代码实测输出",
      "url": "tutorial/results/章节代码实测输出.html",
      "kind": "utility",
      "title": "章节代码实际输出"
    },
    {
      "id": "tutorial/study/plan.html",
      "url": "tutorial/study/plan.html",
      "kind": "utility",
      "title": "寒假前学习时间表 · 11周"
    },
    {
      "id": "tutorial/study/projects.html",
      "url": "tutorial/study/projects.html",
      "kind": "utility",
      "title": "三个音频项目 · 从代码到实验"
    },
    {
      "id": "tutorial/study/videos.html",
      "url": "tutorial/study/videos.html",
      "kind": "utility",
      "title": "图文与视频课程目录 · 23课配套讲解"
    },
    {
      "id": "tutorial/study/visuals.html",
      "url": "tutorial/study/visuals.html",
      "kind": "utility",
      "title": "可视化小实验 · 先猜后看"
    },
    {
      "id": "tutorial/projects/gtcrn/lesson.html",
      "url": "tutorial/projects/gtcrn/lesson.html",
      "kind": "project-guide",
      "title": "GTCRN · 语音增强 · 完整项目导读"
    },
    {
      "id": "tutorial/projects/convtasnet/lesson.html",
      "url": "tutorial/projects/convtasnet/lesson.html",
      "kind": "project-guide",
      "title": "Conv-TasNet · 语音分离 · 完整项目导读"
    },
    {
      "id": "tutorial/projects/zipformer/lesson.html",
      "url": "tutorial/projects/zipformer/lesson.html",
      "kind": "project-guide",
      "title": "Zipformer · 流式识别 · 完整项目导读"
    }
  ],
  "aliases": {
    "tutorial/index.html": "index.html",
    "tutorial/01_声音成为数组.html": "tutorial/labs/01_sound.html",
    "tutorial/02_分贝不是音量旋钮.html": "tutorial/labs/02_levels.html",
    "tutorial/03_滤波和流式状态.html": "tutorial/labs/03_streaming.html",
    "tutorial/04_手写AEC与CTC.html": "tutorial/experiments.html"
  }
};
