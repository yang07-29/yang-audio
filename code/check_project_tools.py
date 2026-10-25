"""检查 ASR 评测和打断状态的边界行为，不连接模型。"""
from pathlib import Path
from asr_evaluate import read_jsonl,score,audit_speaker_split
from streaming_demo import VoiceSession

root=Path(__file__).resolve().parents[1]
ref=read_jsonl(root/'results'/'asr_reference.jsonl')
pred=read_jsonl(root/'results'/'asr_prediction.jsonl')
result=score(ref,pred)
assert result['分组：安静']['CER']==0
assert result['分组：领域词']['错误数']==1
assert result['分组：静音']['CER'] is None
assert result['分组：静音']['空参考插入数']==2
try:
    score(ref,{'001':pred['001']})
except ValueError: pass
else: raise AssertionError('缺失预测没有报错')
try:
    audit_speaker_split({'a':{'speaker':'甲','split':'train'},'b':{'speaker':'甲','split':'test'}})
except ValueError: pass
else: raise AssertionError('跨集合说话人没有报错')
s=VoiceSession();old=s.user_starts();s.user_finishes();assert s.receive_audio(old,'片段')
new=s.user_starts();assert len(s.audio_queue)==0;assert not s.receive_audio(old,'旧结果')
s.user_finishes();assert s.receive_audio(new,'新结果')
for _ in range(7): assert s.receive_audio(new,'填充')
try: s.receive_audio(new,'超量')
except BufferError: pass
else: raise AssertionError('队列没有背压')
print('通过：CER、静音插入、缺失样本、说话人泄漏、旧轮次取消、队列上限。')
