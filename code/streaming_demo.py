"""纯逻辑的语音打断演示，不接麦克风，不调用大模型。"""
from collections import deque
import json

# region session
class VoiceSession:
    def __init__(self):
        self.generation=0
        self.state='等待用户'
        self.audio_queue=deque(maxlen=8)
    def user_starts(self):
        self.generation+=1              # 让旧生成任务失效
        self.audio_queue.clear()        # 清理尚未播放的旧块
        self.state='听用户说话'
        return self.generation
    def user_finishes(self):
        self.state='生成回答'
        return self.generation
    def receive_audio(self,generation,chunk):
        if generation!=self.generation or self.state=='听用户说话':
            return False                # 丢弃延迟到达的旧结果
        if len(self.audio_queue)==self.audio_queue.maxlen:
            raise BufferError('队列满：应实施背压，不能无限积压')
        self.audio_queue.append(chunk)
        self.state='播放回答'
        return True
# endregion

if __name__=='__main__':
    session=VoiceSession();first=session.user_starts();session.user_finishes()
    assert session.receive_audio(first,'旧回答第一块')
    second=session.user_starts()
    assert not session.audio_queue
    assert not session.receive_audio(first,'迟到的旧回答第二块')
    session.user_finishes();assert session.receive_audio(second,'新回答第一块')
    print(json.dumps({'验证':'插话清空队列；旧任务结果被丢弃；新任务继续',
                      '当前轮次':session.generation,'状态':session.state,
                      '队列':list(session.audio_queue)},ensure_ascii=False,indent=2))
