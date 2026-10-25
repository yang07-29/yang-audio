"""生成可核验的中文实验图。运行：python code/run_experiments.py。
数据均为数学合成信号/合成向量，不冒充真人语音或业务评测。
"""
from pathlib import Path
import itertools
import json
import numpy as np
import scipy
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from audio_core import *

ROOT = Path(__file__).resolve().parents[1]
FIG = ROOT/'figures'
OUT = ROOT/'results'
FIG.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)
font = FontProperties(fname='C:/Windows/Fonts/msyh.ttc').get_name()
plt.rcParams.update({'font.family':font,'axes.unicode_minus':False,'font.size':12,
                     'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':120})
rng=np.random.default_rng(20261022)
report={}

def save(name, fig):
    fig.savefig(FIG/f'{name}.png',dpi=150,bbox_inches='tight',facecolor='white')
    plt.close(fig)

def db(x): return 10*np.log10(np.maximum(x,1e-12))
def mse(x): return float(np.mean(x*x))
def write_wav(name, x, fs):
    peak=max(1.,float(np.max(np.abs(x)))/.95)
    wavfile.write(ROOT/'audio'/f'{name}.wav',fs,(x/peak).astype(np.float32))

# 01：采样、窗函数、频谱与时频表示。
fs=16000
t=np.arange(fs)/fs
x=.4*np.sin(2*np.pi*440*t)+.2*np.sin(2*np.pi*1000*t)
spec,ln,pad=stft(x)
rebuilt=istft(spec,ln,pad)
report['stft']={'最大重建误差':float(np.max(np.abs(x-rebuilt))),'形状':list(spec.shape)}
assert np.max(np.abs(x-rebuilt))<1e-10
fig,ax=plt.subplots(2,1,figsize=(12,7),layout='constrained')
dense=np.linspace(0,.002,2000)
samples=np.arange(17)/8000
ax[0].plot(dense*1000,np.cos(2*np.pi*1000*dense),label='一千赫兹余弦')
ax[0].plot(dense*1000,np.cos(2*np.pi*7000*dense),alpha=.5,label='七千赫兹余弦')
ax[0].scatter(samples*1000,np.cos(2*np.pi*1000*samples),color='#e8752c',label='八千赫兹采样：两条曲线取值相同',zorder=3)
ax[0].set(xlabel='时间／毫秒',ylabel='归一化幅度',title='混叠：不同连续信号可以留下同样的样本');ax[0].legend(fontsize=10)
ax[1].plot(t[:160]*1000,x[:160]);ax[1].set(xlabel='时间／毫秒',ylabel='幅度',title='双频合成信号：时域中不容易直接数出两个频率')
save('01_sampling',fig)
fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
size=512
freq=np.fft.rfftfreq(4096,1/fs)
for win,label in [(np.ones(size),'矩形窗'),(np.hanning(size),'汉宁窗')]:
    z=np.abs(np.fft.rfft(x[:size]*win,4096))/sum(win)
    ax[0].plot(freq,20*np.log10(z+1e-8),label=label)
ax[0].set(xlim=(0,1800),ylim=(-100,0),xlabel='频率／赫兹',ylabel='幅度／分贝',title='加窗改变泄漏与主瓣宽度');ax[0].legend()
chirp=np.sin(2*np.pi*(200*t+1200*t*t))*.4
cs,_,_=stft(chirp)
image=ax[1].imshow(db(np.abs(cs.T)**2),origin='lower',aspect='auto',extent=[-256/fs,(len(cs)*128-256)/fs,0,fs/2],vmin=-50,vmax=25)
ax[1].set(ylim=(0,3500),xlabel='时间／秒（含边缘补零）',ylabel='频率／赫兹',title='扫频信号：声谱图中的上升轨迹');fig.colorbar(image,ax=ax[1],label='功率／分贝（未校准）')
save('01_spectrum',fig)

# 02：AEC 路径改变和双讲控制。控制掩码来自仿真真值，非检测算法。
fs=8000;n=fs*6;t=np.arange(n)/fs
ref=rng.normal(0,.15,n)
h1=np.zeros(48);h1[[3,12,31]]=[.7,.25,-.12]
h2=np.zeros(48);h2[[5,18,40]]=[.5,-.3,.18]
echo1=lfilter(h1,[1],ref);echo2=lfilter(h2,[1],ref)
echo=np.where(t<3,echo1,echo2)
near=np.where((t>1.5)&(t<2.4),.14*np.sin(2*np.pi*173*t),0)
microphone=echo+near+rng.normal(0,1e-4,n)
oracle=np.abs(near)<1e-12
est_a,err_a,trace_a=nlms(ref,microphone,taps=48,mu=.4)
est_b,err_b,trace_b=nlms(ref,microphone,taps=48,mu=.4,update=oracle)
block=400
time_blocks=np.arange(0,n-block+1,block)/fs
def block_erle(estimate):
    return np.array([10*np.log10((mse(echo[i:i+block])+1e-12)/(mse(echo[i:i+block]-estimate[i:i+block])+1e-12)) for i in range(0,n-block+1,block)])
ea,eb=block_erle(est_a),block_erle(est_b)
fig,ax=plt.subplots(2,1,figsize=(12,7),layout='constrained')
ax[0].plot(t,microphone,linewidth=.4,label='麦克风：回声＋近端＋微弱噪声');ax[0].plot(t,near,linewidth=.8,label='已知近端真值');ax[0].legend();ax[0].set(xlabel='时间／秒',ylabel='幅度',title='教学条件：一点五至二点四秒双讲；三秒改变回声路径')
ax[1].plot(time_blocks,ea,label='始终更新');ax[1].plot(time_blocks,eb,label='真值双讲区间冻结：理想参考上界')
ax[1].axvspan(1.5,2.4,alpha=.12,color='orange');ax[1].axvline(3,color='red',linestyle='--',label='路径变化')
ax[1].set(xlabel='时间／秒',ylabel='回声衰减／分贝',title='残余回声使用合成真值计算；不能等同于真实双讲检测性能');ax[1].legend(fontsize=10)
save('02_aec',fig)
report['aec']={'末段真值冻结方案回声衰减_dB':float(np.mean(eb[time_blocks>4])),
               '双讲始终更新衰减_dB':float(np.mean(ea[(time_blocks>1.6)&(time_blocks<2.3)])),
               '双讲真值冻结衰减_dB':float(np.mean(eb[(time_blocks>1.6)&(time_blocks<2.3)])),
               '说明':'真值冻结仅作理想控制对照，不是已实现的双讲检测器。'}
assert np.mean(eb[time_blocks>4])>20
write_wav('aec_microphone',microphone,fs);write_wav('aec_output',err_b,fs)

# 03：传统降噪，已知独立纯噪声校准段。
fs=16000;t=np.arange(fs*2)/fs
envelope=(.5+.5*np.sin(2*np.pi*2*t))*(np.sin(2*np.pi*.8*t)**2)
clean=sum(np.sin(2*np.pi*170*k*t)/k for k in range(1,12))*.16*envelope
noisy,noise=mix_at_snr(clean,rng.normal(size=len(t)),0)
noise_only=rng.normal(0,np.std(noise),fs//2)
denoised,gain=wiener_enhance(noisy,noise_only)
report['wiener']={'输入SI_SDR_dB':float(si_sdr(noisy,clean)),'输出SI_SDR_dB':float(si_sdr(denoised,clean))}
fig,ax=plt.subplots(3,1,figsize=(12,9),layout='constrained')
for axis,signal,title in zip(ax,[clean,noisy,denoised],['合成谐波目标：不是真人语音','零分贝信噪比混合','维纳式增益基线：纯噪声段估计噪声谱']):
    s,_,_=stft(signal)
    axis.imshow(db(np.abs(s.T)**2),origin='lower',aspect='auto',extent=[0,2,0,8000],vmin=-50,vmax=15)
    axis.set(xlabel='时间／秒（示意对齐）',ylabel='频率／赫兹',ylim=(0,4000),title=title)
save('03_denoise',fig)
write_wav('denoise_clean',clean,fs);write_wav('denoise_noisy',noisy,fs);write_wav('denoise_output',denoised,fs)

# 04：AGC 与能量 VAD。
truth=((t>.15)&(t<.65))|((t>.9)&(t<1.35))|((t>1.5)&(t<1.9))
level=np.select([t<.8,t<1.4],[.06,.28],default=.025)
voice=np.sin(2*np.pi*210*t)*level*truth+rng.normal(0,.003,len(t))
leveled,curve=frame_agc(voice)
rms,flags=energy_vad(voice,on=.03,off=.02)
ref_flags=np.array([np.mean(truth[i:i+160])>.5 for i in range(0,len(t),160)])
tp=np.sum(flags&ref_flags);fp=np.sum(flags&~ref_flags);fn=np.sum(~flags&ref_flags)
f1=2*tp/max(2*tp+fp+fn,1)
fig,ax=plt.subplots(3,1,figsize=(12,8),layout='constrained')
ax[0].plot(t,voice,linewidth=.6,label='输入');ax[0].plot(t,leveled,linewidth=.6,alpha=.6,label='自动增益输出');ax[0].legend();ax[0].set(xlabel='时间／秒',ylabel='幅度',title='不同强弱的合成声音：增益调节不能替代降噪')
ax[1].plot(t,curve);ax[1].set(xlabel='时间／秒',ylabel='增益倍数',title='增益平滑：避免每一帧突然跳变')
ax[2].plot(np.arange(len(rms))*.01,rms,label='帧均方根');ax[2].step(np.arange(len(flags))*.01,flags*.1,label='能量检测结果');ax[2].step(np.arange(len(ref_flags))*.01,ref_flags*.08,label='已知活动真值',linestyle='--');ax[2].legend();ax[2].set(xlabel='时间／秒',ylabel='幅度／活动标记',title='弱音漏检与挂起尾巴：能量阈值不是完整语音检测器')
save('04_agc_vad',fig);report['vad']={'F1':float(f1),'误检帧数':int(fp),'漏检帧数':int(fn)}

# 05：GCC 符号、MUSIC 和 MVDR 约束。
fs=16000;size=4096
base=sosfilt(butter(4,1800,fs=fs,output='sos'),rng.normal(size=size))
later=np.r_[np.zeros(2),base[:-2]]
estimated,lags,cc=gcc_phat(later,base,3)
assert estimated==2
positions=np.arange(4)*.04;true_angle=25;frequency=1000
steer=np.exp(-2j*np.pi*frequency*positions*np.sin(np.deg2rad(true_angle))/343)
sources=rng.normal(size=512)+1j*rng.normal(size=512)
snap=steer[:,None]*sources+.2*(rng.normal(size=(4,512))+1j*rng.normal(size=(4,512)))
angles=np.linspace(-80,80,641)
spectrum=music_scan(snap,positions,frequency,angles)
peak=float(angles[np.argmax(spectrum)])
weights=mvdr(np.eye(4),steer)
assert abs(np.vdot(weights,steer)-1)<1e-8
assert abs(peak-true_angle)<1
fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
ax[0].stem(lags,cc);ax[0].set(xlabel='相对延迟／采样点',ylabel='相位归一化相关',title='延后两点的通道：相关峰在正二点')
ax[1].plot(angles,db(spectrum/np.max(spectrum)));ax[1].axvline(true_angle,linestyle='--',color='red',label='真实方向');ax[1].legend();ax[1].set(xlabel='相对阵列法线的角度／度',ylabel='归一化空间谱／分贝',title='四阵元窄带单源：多重信号分类定位')
save('05_array',fig);report['array']={'GCC估计延迟_点':estimated,'MUSIC真值_度':true_angle,'MUSIC估计_度':peak,'MVDR无失真约束误差':float(abs(np.vdot(weights,steer)-1))}

# 06：PIT 匹配矩阵。
s1=rng.normal(size=4000);s2=rng.normal(size=4000)
references=np.array([s1,s2]);estimates=np.array([s2+.05*rng.normal(size=4000),s1+.05*rng.normal(size=4000)])
matrix=np.array([[si_sdr(e,r) for r in references] for e in estimates])
best,order=pit_scores(estimates,references)
assert order==(1,0)
fig,ax=plt.subplots(figsize=(7,5),layout='constrained')
im=ax.imshow(matrix,cmap='Blues');ax.set_xticks([0,1],['参考甲','参考乙']);ax.set_yticks([0,1],['输出一','输出二']);ax.set_title('输出顺序交换：正确对应在非对角线')
for i in range(2):
    for j in range(2): ax.text(j,i,f'{matrix[i,j]:.1f} 分贝',ha='center',va='center',color='white' if matrix[i,j]>0 else 'black')
fig.colorbar(im,ax=ax,label='尺度不变信号失真比');save('06_pit',fig)
report['pit']={'最佳排列':list(order),'平均SI_SDR_dB':best,'矩阵':matrix.tolist()}

# 07：CTC 前向递推与穷举验证。
probs=np.array([[.15,.8,.05],[.4,.55,.05],[.7,.15,.15],[.15,.1,.75],[.2,.05,.75]])
lp,alpha,extended=ctc_log_probability(np.log(probs),[1,2])
brute=0.
for path in itertools.product(range(3),repeat=5):
    if ctc_collapse(path)==[1,2]: brute+=np.prod([probs[t,token] for t,token in enumerate(path)])
assert abs(np.exp(lp)-brute)<1e-12
fig,ax=plt.subplots(1,2,figsize=(12,5),layout='constrained')
im=ax[0].imshow(probs.T,aspect='auto',vmin=0,vmax=1,cmap='Blues');ax[0].set_yticks([0,1,2],['空白','你','好']);ax[0].set(xlabel='时间步',ylabel='输出类别',title='每帧概率：不是每帧必须输出一个字');fig.colorbar(im,ax=ax[0],label='概率')
display=np.where(np.isfinite(alpha),alpha,-12)
im=ax[1].imshow(display.T,aspect='auto',vmin=-8,vmax=0,cmap='viridis');ax[1].set_yticks(range(5),['空白','你','空白','好','空白']);ax[1].set(xlabel='时间步',ylabel='扩展目标状态',title='前向递推：累加所有合法对齐路径');fig.colorbar(im,ax=ax[1],label='累计对数概率（极小值截断）')
save('07_ctc',fig);report['ctc']={'前向总概率':float(np.exp(lp)),'穷举总概率':float(brute),'负对数似然':float(-lp)}

# 08：时长展开与声源—滤波模型。
expanded=length_regulator(np.eye(3),[5,3,7])
assert expanded.shape==(15,3)
fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
ax[0].imshow(expanded.T,aspect='auto',cmap='Blues',vmin=0,vmax=1);ax[0].set_yticks([0,1,2],['单元一','单元二','单元三']);ax[0].set(xlabel='展开后的声学帧',ylabel='示意单元',title='时长五、三、七：三个单元展开为十五帧')
for f0,formants,label in [(140,(700,1200,2500),'基频一百四十，元音形状甲'),(230,(700,1200,2500),'基频二百三十，元音形状甲'),(140,(350,1900,2800),'基频一百四十，元音形状乙')]:
    voice=source_filter(f0,.6,formants=formants)
    f=np.fft.rfftfreq(len(voice),1/16000);power=np.abs(np.fft.rfft(voice*np.hanning(len(voice))))
    ax[1].plot(f,20*np.log10(power/np.max(power)+1e-8),label=label,alpha=.8)
    write_wav(f'tts_demo_{f0}_{formants[0]}',voice,16000)
ax[1].set(xlim=(0,3500),ylim=(-65,3),xlabel='频率／赫兹',ylabel='相对幅度／分贝',title='基频与共振峰：不是同一个参数');ax[1].legend(fontsize=8)
save('08_tts',fig);report['tts']={'展开后形状':list(expanded.shape),'说明':'仅时长展开与声源滤波实验，不是自然语言 TTS 模型。'}

# 09：合成嵌入的阈值曲线，不代表真实声纹模型成绩。
centers=rng.normal(size=(1000,16));left=centers+rng.normal(0,1.6,size=centers.shape)
right=centers+rng.normal(0,1.6,size=centers.shape)
other=np.roll(centers,1,axis=0)+rng.normal(0,1.6,size=centers.shape)
genuine=cosine_scores(left,right);impostor=cosine_scores(left,other)
thresholds,far,frr,eer=verification_curve(genuine,impostor)
fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
ax[0].hist(genuine,bins=40,alpha=.6,label='合成同类对');ax[0].hist(impostor,bins=40,alpha=.6,label='合成异类对');ax[0].legend();ax[0].set(xlabel='余弦相似度',ylabel='样本数量',title='分布重叠：没有完全分开的阈值')
ax[1].plot(thresholds,far,label='误接受率');ax[1].plot(thresholds,frr,label='误拒绝率');ax[1].legend();ax[1].set(xlabel='判断阈值',ylabel='错误比例',title='阈值移动会改变两类错误')
save('09_speaker',fig);report['speaker']={'合成向量近似EER':eer,'说明':'只有评分与阈值教学，不含声纹模型训练。'}

# 10：位宽与离群点。
values=rng.normal(0,.2,3000);values[0]=5
curves={};metrics={}
for bits in (4,8):
    restored,scale=symmetric_quantize(values,bits)
    curves[bits]=restored;metrics[str(bits)]={'均方误差':mse(restored-values),'步长':scale}
fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
ax[0].plot(values[1:100],label='原始浮点',linewidth=2);ax[0].plot(curves[4][1:100],label='四位模拟',alpha=.7);ax[0].plot(curves[8][1:100],label='八位模拟',alpha=.7);ax[0].legend();ax[0].set(xlabel='样本位置',ylabel='数值',title='离群点扩大范围，低位表示丢失小幅度细节')
ax[1].bar(['四位','八位'],[metrics['4']['均方误差'],metrics['8']['均方误差']]);ax[1].set(xlabel='量化位宽',ylabel='重建均方误差',title='这里只比较数值误差；没有测真实低位推理速度')
save('10_quantize',fig);report['quantization']=metrics

report['environment']={'numpy':np.__version__,'scipy':scipy.__version__,'matplotlib':matplotlib.__version__}
(OUT/'dsp_results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
print('通过：重建、AEC收敛、时延符号、定位、无失真约束、排列匹配、CTC穷举、时长展开。')
