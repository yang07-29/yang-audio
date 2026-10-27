"""复跑视频里的短推理，不下载资源，不训练，也不覆盖已有目录。

先按对应仓库的 README 准备依赖、固定权重和示例，然后运行：
python project_demo.py gtcrn --project 项目根目录 --output 一个不存在的新目录
项目名还可选择 convtasnet、zipformer。路径含空格时用引号包住。
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys
import time

import numpy as np
import soundfile as sf


def si_sdr(reference, estimate):
    # 去均值，再把预测投影到参考方向；分数对整体增益不敏感。
    s = reference.astype(np.float64) - reference.mean()
    y = estimate.astype(np.float64) - estimate.mean()
    target = np.dot(s, y) / (np.dot(s, s) + 1e-12) * s
    error = y - target
    return float(10 * np.log10((np.dot(target, target) + 1e-12) /
                               (np.dot(error, error) + 1e-12)))


def gtcrn(root, output):
    # 调用项目自己的校验入口：它检查权重哈希、采样率、声道及输出覆盖。
    source = root / 'portable/samples/noisy.wav'
    entry = root / 'portable/enhance.py'
    subprocess.run([sys.executable, str(entry), str(source), str(output/'fixed.wav')], check=True)
    subprocess.run([sys.executable, str(entry), str(source), str(output/'irregular.wav'),
                    '--chunk-samples', '160,256,480,17'], check=True)
    x, rate = sf.read(source)
    reference, ref_rate = sf.read(root/'portable/samples/reference.wav')
    y, out_rate = sf.read(output/'fixed.wav')
    z, _ = sf.read(output/'irregular.wav')
    assert rate == ref_rate == out_rate == 16000
    assert x.shape == reference.shape == y.shape == z.shape
    receipt = json.loads((output/'fixed.wav.json').read_text(encoding='utf-8'))
    return {'model_sha256': receipt['model_sha256'], 'sample_rate': rate,
            'input_samples': len(x), 'output_samples': len(y),
            'input_si_sdr_db': si_sdr(reference, x),
            'output_si_sdr_db': si_sdr(reference, y),
            'irregular_max_abs_difference': float(np.max(np.abs(y-z))),
            'scope': '项目E4短推理；不是三种子重训、全量测试或声卡闭环'}


def convtasnet(root, output):
    import torch
    from speechsep.models import load_model, configure_trainable
    from speechsep.postprocess import process
    from metrics import evaluate_separation
    torch.set_num_threads(2)
    # 明确传入官方权重，不能把它称为用户的最终微调检查点。
    checkpoint = root/'assets/conv_tasnet_base_libri2mix.pt'
    expected = 'ddf97d8341f616c6d8d1a4b20dd51042760392c6543e9eaac276c9f96eba0f0e'
    assert hashlib.sha256(checkpoint.read_bytes()).hexdigest() == expected
    model = load_model(checkpoint).eval()
    selection = configure_trainable(model)  # 只核对参数选择，不执行优化器更新。
    x, rate = sf.read(root/'assets/mixture.wav', dtype='float32')
    references = []
    for index in (1, 2):
        reference, ref_rate = sf.read(root/f'assets/reference_{index}.wav', dtype='float32')
        assert ref_rate == rate == 8000 and reference.shape == x.shape
        references.append(reference)
    references = np.stack(references)
    shapes = {}
    # hook记录真实网络输出形状，不用手算数字代替前向。
    for name in ('encoder', 'mask_generator', 'decoder'):
        getattr(model, name).register_forward_hook(
            lambda module, inputs, result, n=name: shapes.update({n: list(result.shape)}))
    tick = time.perf_counter()
    with torch.inference_mode():
        raw = model(torch.from_numpy(x)[None, None])[0].numpy()
    seconds = time.perf_counter() - tick
    assert raw.shape == (2, len(x)) and np.isfinite(raw).all()
    estimates, _ = process(x, raw, method='gain')
    metrics = evaluate_separation(references, estimates, x)
    # 浮点文件保留数值；直接试听前还应按共同增益防削波，不要逐轨归一化。
    for index, track in enumerate(estimates[metrics['assignment']], 1):
        sf.write(output/f'speaker_{index}_analysis.wav', track, rate, subtype='FLOAT')
    return {'model': '官方预训练，不是最终微调', 'shapes': shapes,
            'output_shape': list(raw.shape), 'trainable_selection': selection,
            'metrics': metrics, 'cold_forward_seconds': seconds,
            'scope': '一次冷前向；不含加载/读盘，不是稳定速度基准或流式模型'}


def zipformer(root, output):
    from mature.decoder import Decoder
    manifest = json.loads((root/'evaluation_manifest.json').read_text(encoding='utf-8'))
    row = manifest['samples'][0]
    source = root/row['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == row['sha256']
    decoder = Decoder(threads=2)
    result = decoder.decode(source)
    assert len(result['tokens']) == len(result['log_probs']) == len(result['timestamps'])
    return {'input': row['path'], 'result': result,
            'reference': row.get('reference', row.get('raw_transcription', row.get('text'))),
            'scope': '冻结声学模型单样例；未重跑V3决策器，不是麦克风墙钟延迟'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project', choices=['gtcrn', 'convtasnet', 'zipformer'])
    parser.add_argument('--project', dest='root', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    # 输出必须是全新的目录；失败时保留已有日志，改用新目录再试。
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    sys.path.insert(0, str(root))
    report = {'gtcrn': gtcrn, 'convtasnet': convtasnet, 'zipformer': zipformer}[args.project](root, output)
    text = json.dumps(report, ensure_ascii=False, indent=2)
    (output/'report.json').write_text(text, encoding='utf-8')
    print(text)


if __name__ == '__main__':
    main()
