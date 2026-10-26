import numpy as np
Y = 1 + 2j  # 一个带噪频点，实部1、虚部2
M = 0.5 - 0.25j  # 人为教学掩码，不是模型预测
# 复数乘法有交叉项，不能只把实部虚部分别相乘
real = M.real*Y.real - M.imag*Y.imag
imag = M.real*Y.imag + M.imag*Y.real
S = real + 1j*imag
assert np.isclose(S, M*Y)
# 两条线从原点画到复平面的输入/输出向量
real_axis = np.array([0., 1.])
input_path = np.array([0., Y.imag])
output_path = np.array([0., S.imag])
print('输入:', Y)
print('输出:', S)
print('幅度:', round(abs(Y), 4), round(abs(S), 4))
print('相位/度:', round(np.angle(Y, deg=True), 2), round(np.angle(S, deg=True), 2))
