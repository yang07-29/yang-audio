"""PyTorch 核心实验：真实训练一个小掩码网络；其余模块做数值/梯度验证。
训练数据为合成谐波加噪，不是语音数据；不下载任何权重。
"""
from pathlib import Path
import json
import time
import numpy as np
import torch
from torch import nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from audio_core import ctc_log_probability

ROOT=Path(__file__).resolve().parents[1]
torch.set_num_threads(2)
torch.manual_seed(20261022)
np.random.seed(20261022)

# region dataset
class SyntheticMaskDataset(Dataset):
    def __init__(self, count, seed):
        rng=np.random.default_rng(seed)
        self.rows=[]
        t=np.arange(4096)/8000
        for _ in range(count):
            f0=rng.uniform(90,330)
            clean=sum(np.sin(2*np.pi*f0*k*t+rng.uniform(0,6.28))/k
                      for k in range(1,9))*.15
            noise=rng.normal(size=len(t))
            scale=np.sqrt(np.mean(clean**2)/(np.mean(noise**2)*10**(rng.uniform(-5,10)/10)))
            noisy=clean+scale*noise
            spec=lambda v: torch.stft(torch.tensor(v,dtype=torch.float32),128,64,
                                      window=torch.hann_window(128),center=False,return_complex=True)
            s,y=spec(clean),spec(noisy)
            features=torch.log1p(y.abs()).unsqueeze(0)  # [频率,时间]前加通道轴，成为[1,F,T]。
            target=(s.abs()/(y.abs()+1e-5)).clamp(0,1).unsqueeze(0)  # 干净/带噪幅度比作为增益标签。
            length=int(rng.integers(40,features.shape[-1]+1))
            valid=(torch.arange(features.shape[-1])<length).float()[None,None,:]  # [1,1,T]可广播到频率。
            self.rows.append((features*valid,target*valid,valid))
    def __len__(self): return len(self.rows)
    def __getitem__(self,index): return self.rows[index]
# endregion

# region mask_model
class CausalMaskNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1=nn.Conv2d(1,12,(3,3),padding=(1,0))  # 频率轴补齐，时间补齐在forward中单独处理。
        self.conv2=nn.Conv2d(12,12,(3,3),padding=(1,0))
        self.out=nn.Conv2d(12,1,1)
    def forward(self,x):
        # 输入轴：[批次, 通道, 频率, 时间]。只给时间轴左侧补零。
        x=F.relu(self.conv1(F.pad(x,(2,0,0,0))))
        x=F.relu(self.conv2(F.pad(x,(2,0,0,0))))
        return torch.sigmoid(self.out(x))

def masked_mse(prediction,target,valid):
    weight=valid.expand_as(target)  # 补齐帧不参与损失，也不计入分母。
    return ((prediction-target).square()*weight).sum()/weight.sum().clamp_min(1)
# endregion

# region train_step
def train_epoch(model,loader,optimizer):
    model.train()
    total=0.
    for features,target,valid in loader:
        optimizer.zero_grad(set_to_none=True)  # 清空上一批梯度，PyTorch默认会累加梯度。
        predicted_mask=model(features)
        loss=masked_mse(predicted_mask,target,valid)
        loss.backward()  # 链式法则把损失变化传回每个可学习参数。
        nn.utils.clip_grad_norm_(model.parameters(),5.)  # 裁剪总梯度范数，不能替代排查NaN。
        optimizer.step()  # 根据本批梯度更新权重；验证阶段不能调用。
        total+=loss.item()
    return total/len(loader)

@torch.no_grad()
def validate(model,loader):
    model.eval()
    return sum(masked_mse(model(x),y,m).item() for x,y,m in loader)/len(loader)
# endregion

# region torch_ctc
def check_torch_ctc():
    probs=torch.tensor([[.15,.8,.05],[.4,.55,.05],[.7,.15,.15],
                        [.15,.1,.75],[.2,.05,.75]],dtype=torch.float64)
    logits=probs.log().clone().requires_grad_(True)
    log_probs=logits.log_softmax(dim=-1)[:,None,:]  # [时间,批次,类别]
    target=torch.tensor([1,2],dtype=torch.long)
    loss=nn.CTCLoss(blank=0,reduction='sum',zero_infinity=False)(
        log_probs,target,torch.tensor([5]),torch.tensor([2]))
    loss.backward()
    manual,_,_=ctc_log_probability(probs.log().numpy(),[1,2])
    assert abs(loss.item()+manual)<1e-10
    assert torch.isfinite(logits.grad).all()
    return {'PyTorch损失':loss.item(),'梯度有限':True}
# endregion

# region tts_blocks
def duration_expand(features,durations):
    # 单句：[文字单元,特征] → [声学帧,特征]
    return torch.repeat_interleave(features,durations,dim=0)

class TinyVocoder(nn.Module):
    """形状与梯度教学模块；随机权重不能生成自然语音。"""
    def __init__(self):
        super().__init__()
        self.net=nn.Sequential(
            nn.Conv1d(80,32,3,padding=1),nn.LeakyReLU(.1),
            nn.ConvTranspose1d(32,16,8,stride=4,padding=2),nn.LeakyReLU(.1),  # 长度变为原来的4倍。
            nn.ConvTranspose1d(16,1,8,stride=4,padding=2),nn.Tanh())
    def forward(self,mel): return self.net(mel)

def spectral_loss(prediction,target):
    loss=prediction.new_zeros(())
    for size in (32,64,128):
        window=torch.hann_window(size,device=prediction.device)
        spec=lambda x: torch.stft(x,size,size//4,window=window,
                                  return_complex=True).abs()
        p,t=spec(prediction),spec(target)
        loss+=(torch.log(p+1e-5)-torch.log(t+1e-5)).abs().mean()
    return loss/3
# endregion

def main():
    started=time.perf_counter()
    font=FontProperties(fname='C:/Windows/Fonts/msyh.ttc').get_name()
    plt.rcParams.update({'font.family':font,'axes.unicode_minus':False,'font.size':12})
    train=DataLoader(SyntheticMaskDataset(96,101),batch_size=12,shuffle=True,num_workers=0)
    val=DataLoader(SyntheticMaskDataset(24,202),batch_size=12,shuffle=False,num_workers=0)
    model=CausalMaskNet()
    optimizer=torch.optim.Adam(model.parameters(),lr=.002)
    history=[{'轮次':0,'训练损失':validate(model,train),'验证损失':validate(model,val)}]
    for epoch in range(1,17):
        training=train_epoch(model,train,optimizer)
        validation=validate(model,val)
        history.append({'轮次':epoch,'训练损失':training,'验证损失':validation})
        print(f'第 {epoch} 轮：训练 {training:.5f}，验证 {validation:.5f}',flush=True)
    assert history[-1]['验证损失']<history[0]['验证损失']
    torch.save({'state_dict':model.state_dict(),'data':'合成谐波，不是真人语音','seed':20261022},ROOT/'results'/'teaching_mask.pt')
    fig,ax=plt.subplots(1,2,figsize=(12,4.5),layout='constrained')
    ax[0].plot([r['轮次'] for r in history],[r['训练损失'] for r in history],label='训练集')
    ax[0].plot([r['轮次'] for r in history],[r['验证损失'] for r in history],label='独立随机种子验证集')
    ax[0].set(xlabel='训练轮次',ylabel='有效位置掩码均方误差',title='实际训练结果：合成数据上的最小训练闭环');ax[0].legend()
    x,y,m=next(iter(val))
    with torch.no_grad(): predicted=model(x)
    ax[1].imshow(predicted[0,0].numpy(),origin='lower',aspect='auto',vmin=0,vmax=1,cmap='magma')
    ax[1].set(xlabel='时间帧（右侧包含补齐区域）',ylabel='频率格点',title='网络预测的零到一频谱增益')
    fig.savefig(ROOT/'figures'/'11_neural_train.png',dpi=150,bbox_inches='tight');plt.close(fig)
    # 严格验证网络在帧层面不读取未来位置。
    probe=torch.randn(1,1,65,30);changed=probe.clone();changed[:,:,:,20:]+=10
    with torch.no_grad(): causal_error=(model(probe)[:,:,:,:20]-model(changed)[:,:,:,:20]).abs().max().item()
    assert causal_error<1e-7
    ctc=check_torch_ctc()
    feature=torch.randn(3,8,requires_grad=True)
    expanded=duration_expand(feature,torch.tensor([5,3,7]))
    expanded.square().mean().backward();assert torch.isfinite(feature.grad).all()
    vocoder=TinyVocoder();wave=vocoder(torch.randn(2,80,10))
    loss=spectral_loss(wave[:,0],torch.randn(2,160)*.1)
    loss.backward();assert wave.shape==(2,1,160)
    vocoder_gradients_finite=all(p.grad is not None and torch.isfinite(p.grad).all().item()
                                 for p in vocoder.parameters())
    assert torch.isfinite(loss) and vocoder_gradients_finite
    result={'历史':history,'模型参数量':sum(p.numel() for p in model.parameters()),
            'CTC':ctc,'时长展开形状':list(expanded.shape),'声码器输出形状':list(wave.shape),
            '声码器频谱损失有限':bool(torch.isfinite(loss)),
            '声码器全部参数梯度有限':vocoder_gradients_finite,
            '帧级因果测试最大差':causal_error,'耗时_秒':time.perf_counter()-started,
            'PyTorch':torch.__version__,'设备':'CPU，两个计算线程',
            '限制':'增强只在合成数据训练；声码器只测前向、损失与梯度，没有训练为自然语音模型。'}
    (ROOT/'results'/'neural_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='历史'},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
