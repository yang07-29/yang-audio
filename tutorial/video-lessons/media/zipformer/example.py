import numpy as np
# 固定仓库报告数字重绘，不重新运行识别模型
method = np.arange(1, 5)
calls = np.array([39, 13, 4, 8])
errors = np.array([326, 327, 327, 327])
reference_chars = 1683
cer = errors / reference_chars * 100
# 两条线分别相对同批 V2=1，便于同轴观察
call_ratio = calls / calls[0]
error_ratio = errors / errors[0]
for i in range(4):
    print(i+1, "二遍", calls[i], "错字", errors[i])
print("主门 CER", round(cer[1], 3), "%")
print("主门多错", int(errors[1]-errors[0]), "字")
