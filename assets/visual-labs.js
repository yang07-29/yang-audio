/* 小实验只演示数学关系，不加载模型、不录音、不联网。 */
(function(host) {
  'use strict';
  function collapse(tokens) {
    let previous = null; const merged=[];
    for (const token of tokens) { if(token!==previous) merged.push(token); previous=token; }
    return {merged,result:merged.filter(token=>token!=='_')};
  }
  function siSdr(target,estimate) {
    if(target.length!==estimate.length || !target.length) throw new Error('长度不匹配');
    const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
    const a=mean(target), b=mean(estimate);
    const s=target.map(x=>x-a), y=estimate.map(x=>x-b);
    const energy=s.reduce((v,x)=>v+x*x,0);
    if(energy<1e-12) return null;
    const alpha=s.reduce((v,x,i)=>v+x*y[i],0)/energy;
    const signal=alpha*alpha*energy;
    const error=y.reduce((v,x,i)=>v+(x-alpha*s[i])**2,0);
    if(signal<1e-12) return null;
    if(error<1e-12) return Infinity;
    return 10*Math.log10(signal/error);
  }
  host.AudioVisualMath={collapse,siSdr};
  if(typeof module==='object' && module.exports) module.exports=host.AudioVisualMath;
  if(typeof document==='undefined' || !location.pathname.endsWith('/study/visuals.html')) return;
  const article=document.querySelector('.am-doc-body'); if(!article)return;
  const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const section=title=>{const s=make('section');s.className='course-completion';s.append(make('h2',title));article.prepend(s);return s;};
  function slider(parent,label,min,max,value,step) {
    const row=make('label',label+' '), input=make('input'), output=make('output');
    input.type='range';Object.assign(input,{min,max,value,step});input.setAttribute('aria-label',label);
    row.append(input,output);row.style.display='block';row.style.margin='12px 0';parent.append(row);
    const update=()=>{output.textContent=' '+input.value;};input.addEventListener('input',update);update();return input;
  }
  function graph(parent,label) {
    const canvas=make('canvas');canvas.width=900;canvas.height=230;canvas.style.width='100%';canvas.style.height='auto';
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label);parent.append(canvas);return canvas;
  }
  function draw(canvas,series,labels) {
    const c=canvas.getContext('2d');if(!c)return;
    c.fillStyle='#fff';c.fillRect(0,0,900,230);c.strokeStyle='#d7e1e7';c.beginPath();c.moveTo(50,110);c.lineTo(870,110);c.stroke();
    c.fillStyle='#445b69';c.font='14px Microsoft YaHei, sans-serif';c.fillText('归一化幅度',10,20);c.fillText('0',32,115);c.fillText('时间 / ms',780,220);
    const colors=['#09695f','#b34750'];
    series.forEach((samples,j)=>{c.strokeStyle=colors[j];c.lineWidth=2;c.beginPath();samples.forEach((v,i)=>{const x=50+820*i/(samples.length-1),y=110-v*70;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.stroke();c.fillStyle=colors[j];c.fillText(labels[j],60+j*320,28);});
    for(let t=0;t<=20;t+=5){c.fillStyle='#445b69';c.fillText(String(t),45+820*t/20,202);}
  }
  // 反向插入，最终按声音→指标→CTC顺序显示。
  const ctc=section('交互③ · 手动折叠CTC路径');
  ctc.append(make('p','以空格分隔token，下划线是blank。试试“你 _ 你”，它不会变成一个“你”。'));
  const tokenInput=make('input');tokenInput.type='text';tokenInput.value='你 你 _ 好 好';tokenInput.maxLength=200;
  tokenInput.className='course-search';tokenInput.setAttribute('aria-label','CTC路径token');
  const tokenResult=make('p');tokenResult.setAttribute('aria-live','polite');ctc.append(tokenInput,tokenResult);
  function updateTokens(){const t=tokenInput.value.trim().split(/\s+/).filter(Boolean);const r=collapse(t);tokenResult.textContent='① 合并连续重复：'+r.merged.join(' ')+'　② 删除blank：'+r.result.join('');}
  tokenInput.addEventListener('input',updateTokens);updateTokens();
  const metric=section('交互② · 增益、误差和SI-SDR');
  metric.append(make('p','绿色是目标，红色是估计。这里的误差是确定性合成干扰，不是真实噪声评测；计算先去均值。'));
  const gain=slider(metric,'整体增益',0.1,2,0.5,0.1), error=slider(metric,'相对干扰幅度',0,0.8,0.1,0.01);
  const mc=graph(metric,'目标与估计波形对比'), ms=make('p');ms.setAttribute('aria-live','polite');metric.append(ms);
  function updateMetric(){const target=Array.from({length:160},(_,i)=>Math.sin(2*Math.PI*400*i/8000));const estimate=target.map((v,i)=>Number(gain.value)*(v+Number(error.value)*Math.sin(2*Math.PI*730*i/8000)));
    const score=siSdr(target,estimate);draw(mc,[target,estimate],['目标信号','估计信号']);
    ms.textContent=score===Infinity?'无残差：理想SI-SDR趋于正无穷，不显示虚假的有限高分。':score===null?'退化输入，指标未定义。':'SI-SDR = '+score.toFixed(2)+' dB。只改变整体增益，分数应基本不变，但响度会改变。';}
  gain.addEventListener('input',updateMetric);error.addEventListener('input',updateMetric);updateMetric();
  const wave=section('交互① · 把声音变成可见的数组');
  const amp=slider(wave,'幅度',0.1,1,0.5,0.1),freq=slider(wave,'频率 / Hz',100,1000,400,50);
  const wc=graph(wave,'前20毫秒合成正弦波'),ws=make('p');wave.append(ws);
  function updateWave(){const samples=Array.from({length:160},(_,i)=>Number(amp.value)*Math.sin(2*Math.PI*Number(freq.value)*i/8000));
    draw(wc,[samples],['8 kHz采样，前20 ms']);ws.textContent='20 ms内约 '+(Number(freq.value)*0.02).toFixed(1)+' 个周期。理想正弦RMS约 '+(Number(amp.value)/Math.sqrt(2)).toFixed(4)+'；不等于声压级。';}
  amp.addEventListener('input',updateWave);freq.addEventListener('input',updateWave);updateWave();
})(typeof globalThis!=='undefined'?globalThis:this);
