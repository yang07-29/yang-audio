"""教学算例：只演示 PIT 配对与等权残差分配，不加载模型或真实语音。"""
import json


def choose_assignment(scores):
    # 行是参考说话人，列是模型输出；必须比较完整的两种排列。
    identity = (scores[0][0] + scores[1][1]) / 2
    swapped = (scores[0][1] + scores[1][0]) / 2
    # 分数相等时优先原顺序，与仓库约定一致。
    return [0, 1] if identity >= swapped else [1, 0]


def uniform_projection(mixture, calibrated):
    # calibrated 表示已经完成公共增益校准的两路波形。
    residual = [x - a - b for x, a, b in zip(mixture, *calibrated)]
    # 同一个残差，平均分给两路；这只保证和等于输入。
    output = [[sample + r / 2 for sample, r in zip(source, residual)]
              for source in calibrated]
    return residual, output


if __name__ == "__main__":
    # 以下全是人为构造的四点算例，数值不是实验指标。
    scores = [[-3.0, 12.0], [11.0, -4.0]]
    mixture = [1.0, 2.0, -1.0, 0.0]
    calibrated = [[0.4, 1.0, -0.4, 0.2], [0.4, 0.8, -0.4, -0.1]]
    residual, output = uniform_projection(mixture, calibrated)
    error = max(abs(x - a - b) for x, a, b in zip(mixture, *output))
    assignment = choose_assignment(scores)
    assert assignment == [1, 0]
    assert error < 1e-12
    result = {
        "scope": "illustrative arithmetic, not Conv-TasNet inference",
        "assignment": assignment,
        "identity_mean_db": -3.5,
        "swapped_mean_db": 11.5,
        "residual": [round(x, 6) for x in residual],
        "outputs": [[round(x, 6) for x in source] for source in output],
        "sum_error_below_1e_12": error < 1e-12,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
