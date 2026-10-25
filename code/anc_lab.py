"""归一化 FxLMS 合成实验；不控制真实扬声器。"""
from pathlib import Path
import json
import numpy as np
from scipy.signal import lfilter
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from audio_core import fxlms

root=Path(__file__).resolve().parents[1]
rng=np.random.default_rng(991)
fs=4000
x=rng.normal(0,.1,fs*3)
primary=np.zeros(14);primary[8]=.7;primary[11]=.25
secondary=np.array([0,0,0,.8,.1])
disturbance=lfilter(primary,[1],x)+rng.normal(0,.001,len(x))
error,control=fxlms(x,disturbance,secondary,secondary.copy())
late=slice(8000,None)
reduction=10*np.log10(np.mean(disturbance[late]**2)/np.mean(error[late]**2))
assert reduction>10
font=FontProperties(fname='C:/Windows/Fonts/msyh.ttc').get_name()
plt.rcParams.update({'font.family':font,'axes.unicode_minus':False,'font.size':12})
fig,ax=plt.subplots(2,1,figsize=(12,6.5),layout='constrained')
t=np.arange(len(x))/fs
ax[0].plot(t,disturbance,lw=.5,label='控制前干扰');ax[0].plot(t,error,lw=.5,label='误差麦克风残留');ax[0].legend();ax[0].set(xlabel='时间／秒',ylabel='幅度',title='理想线性 ANC 仿真：控制声经过次级路径后抵消干扰')
block=200;starts=np.arange(0,len(x)-block+1,block)
ratio=[10*np.log10((np.mean(disturbance[i:i+block]**2)+1e-15)/(np.mean(error[i:i+block]**2)+1e-15)) for i in starts]
ax[1].plot(starts/fs,ratio);ax[1].set(xlabel='时间／秒',ylabel='干扰衰减／分贝',title='次级路径估计为真值，参考提前量充足；不是耳机产品测试')
fig.savefig(root/'figures'/'12_anc.png',dpi=150,bbox_inches='tight');plt.close(fig)
result={'末一秒衰减_dB':float(reduction),'说明':'线性路径已知、参考提前，含不可预测弱噪声；没有真实扬声器或佩戴变化。'}
(root/'results'/'anc_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
