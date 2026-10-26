import numpy as np
# 用缩小的样点编号观察缓存，不是真实波形
size, hop = 4, 2
buffer = np.empty(0)
frames = []
for chunk in [np.arange(3), np.arange(3, 6), np.arange(6, 9)]:
    buffer = np.concatenate([buffer, chunk])
    while len(buffer) >= size:
        frames.append(buffer[:size].copy())
        buffer = buffer[hop:]  # 只前进帧移，保留重叠
matrix = np.stack(frames)
position = np.arange(size)
first, second, third = matrix
for i, frame in enumerate(matrix):
    print("帧", i+1, frame.astype(int).tolist())
print("余量", buffer.astype(int).tolist())
assert matrix.shape == (3, 4)
