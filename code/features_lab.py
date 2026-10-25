"""梅尔滤波器组与 MFCC 数值实验。"""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from audio_core import log_mel_mfcc,source_filter

root=Path(__file__).resolve().parents[1]
font=FontProperties(fname='C:/Windows/Fonts/msyh.ttc').get_name()
plt.rcParams.update({'font.family':font,'axes.unicode_minus':False,'font.size':12})
x=np.r_[source_filter(140,.5),source_filter(210,.5,formants=(350,1900,2800))]
mel,mfcc,bank,freq=log_mel_mfcc(x)
assert mel.shape[1]==40 and mfcc.shape[1]==13
assert np.isfinite(mel).all() and np.isfinite(mfcc).all()
assert np.all(bank>=0) and np.all(bank<=1+1e-12)
fig,ax=plt.subplots(3,1,figsize=(12,9),layout='constrained')
for row in bank: ax[0].plot(freq,row,lw=.8)
ax[0].set(xlabel='频率／赫兹',ylabel='滤波器权重',title='四十个三角频带：低频密、高频疏')
im=ax[1].imshow(mel.T,origin='lower',aspect='auto',cmap='magma');ax[1].set(xlabel='时间帧',ylabel='梅尔频带编号',title='对数梅尔功率：把线性频率汇聚到较少频带');fig.colorbar(im,ax=ax[1],label='自然对数功率')
im=ax[2].imshow(mfcc.T,origin='lower',aspect='auto',cmap='coolwarm');ax[2].set(xlabel='时间帧',ylabel='倒谱系数编号',title='前十三个倒谱系数：不再是频率轴');fig.colorbar(im,ax=ax[2],label='系数值')
fig.savefig(root/'figures'/'13_features.png',dpi=150,bbox_inches='tight');plt.close(fig)
result={'log_Mel形状':list(mel.shape),'MFCC形状':list(mfcc.shape),'滤波器组形状':list(bank.shape),
        '说明':'教学 HTK 刻度，峰值三角归一化；不包含模型特定预加重、面积归一化或标准化。'}
(root/'results'/'features_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
