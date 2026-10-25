"""真实项目评分入口：严格按编号对齐参考和预测，报告总体及分组 CER。
输入 JSONL 每行需包含 id、text，可选 group、speaker、split、audio。
不加载模型、不下载数据。将实际模型输出保存成预测 JSONL 后评分。
"""
import argparse
import json
import unicodedata
from pathlib import Path
from collections import defaultdict
from audio_core import edit_distance

# region normalize
def normalize(text):
    # 本例只统一全半角、大小写与标点空白；不把“十二”改成“12”。
    text=unicodedata.normalize('NFKC',text).lower()
    return ''.join(c for c in text if not c.isspace()
                   and not unicodedata.category(c).startswith('P'))

def read_jsonl(path):
    records={}
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        if not line.strip(): continue
        row=json.loads(line)
        key=str(row['id'])
        if key in records: raise ValueError(f'重复编号：{key}')
        records[key]=row
    return records
# endregion

# region score
def score(reference,predictions):
    if set(reference)!=set(predictions):
        raise ValueError('参考与预测编号不一致；不能静默跳过失败样本')
    groups=defaultdict(lambda:{'错误数':0,'参考字数':0,'句数':0,'空参考插入数':0})
    for key,row in reference.items():
        truth=normalize(row['text'])
        guess=normalize(predictions[key]['text'])
        errors=edit_distance(truth,guess)
        for group in ('总体','分组：'+row.get('group','未标注')):
            item=groups[group]
            item['错误数']+=errors
            item['参考字数']+=len(truth)
            item['句数']+=1
            if not truth: item['空参考插入数']+=len(guess)
    for value in groups.values():
        value['CER']=value['错误数']/value['参考字数'] if value['参考字数'] else None
    return dict(groups)
# endregion

# region split_audit
def audit_speaker_split(rows):
    seen=defaultdict(set)
    for row in rows.values():
        if 'speaker' in row and 'split' in row:
            seen[row['speaker']].add(row['split'])
    leaked={s:sorted(parts) for s,parts in seen.items() if len(parts)>1}
    if leaked: raise ValueError(f'说话人跨集合，需确认评测协议：{leaked}')
    return {'已检查说话人数':len(seen)}
# endregion

if __name__=='__main__':
    parser=argparse.ArgumentParser(description='中文 ASR 项目评测')
    parser.add_argument('reference');parser.add_argument('predictions')
    args=parser.parse_args()
    ref,pred=read_jsonl(args.reference),read_jsonl(args.predictions)
    audit_speaker_split(ref)
    print(json.dumps(score(ref,pred),ensure_ascii=False,indent=2))
