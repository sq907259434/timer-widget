# 生成几版"到点提示音"：纯 Python 合成，输出 44.1k / 16bit / 单声道 WAV
# 不用 numpy，直接算采样点。
import math
import os
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
os.makedirs(OUT, exist_ok=True)


def tone(freq, dur, amp=0.5, decay=6.0, attack=0.004, partials=((1, 1.0), (2, 0.28), (3, 0.12))):
    """一个带指数衰减的复合音，返回 float 采样列表"""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-decay * t)
        if t < attack:
            env *= t / attack
        v = 0.0
        for mult, w in partials:
            v += w * math.sin(2 * math.pi * freq * mult * t)
        out.append(amp * env * v)
    return out


def silence(dur):
    return [0.0] * int(SR * dur)


def mix_at(buf, clip, at):
    """把 clip 叠加到 buf 的 at 秒处（越界就截断）"""
    start = int(SR * at)
    for i, v in enumerate(clip):
        j = start + i
        if 0 <= j < len(buf):
            buf[j] += v
    return buf


def norm(buf, peak=0.85):
    m = max(1e-9, max(abs(v) for v in buf))
    return [v / m * peak for v in buf]


def save(name, buf):
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32767)) for v in buf)
        w.writeframes(frames)
    print("  ", name, f"{len(buf)/SR:.2f}s", os.path.getsize(path), "bytes")


# ---------- A. 叮咚：两个清亮的钟音（最"提醒"的一版） ----------
a = silence(1.9)
mix_at(a, tone(1318.5, 0.9, amp=0.55, decay=4.2), 0.00)   # E6
mix_at(a, tone(1046.5, 1.1, amp=0.55, decay=3.6), 0.26)   # C6
save("alarm-a-dingdong.wav", norm(a))

# ---------- B. 柔和三连：上行三音，木琴感 ----------
b = silence(1.7)
for i, f in enumerate((523.3, 659.3, 784.0)):             # C5 E5 G5
    mix_at(b, tone(f, 0.8, amp=0.5, decay=5.5,
                   partials=((1, 1.0), (2, 0.18), (4, 0.06))), i * 0.22)
save("alarm-b-soft.wav", norm(b, 0.8))

# ---------- C. 电子表：三声短促方波，最不容易漏 ----------
c = silence(1.2)
for i in range(3):
    n = int(SR * 0.085)
    seg = []
    for k in range(n):
        t = k / SR
        env = math.exp(-28 * t) if t > 0.01 else t / 0.01
        sq = 1.0 if math.sin(2 * math.pi * 1980 * t) >= 0 else -1.0
        seg.append(0.34 * env * sq)
    mix_at(c, seg, i * 0.17)
save("alarm-c-beep.wav", norm(c, 0.75))

# ---------- D. 低钟：沉稳，适合安静环境 ----------
d = silence(2.2)
mix_at(d, tone(392.0, 2.0, amp=0.6, decay=1.9,
               partials=((1, 1.0), (2.0, 0.5), (2.76, 0.25), (5.4, 0.1))), 0.0)
save("alarm-d-bell.wav", norm(d, 0.85))

# ---------- E. 木质叩击：短、干净、"嗒嗒"两下 ----------
e = silence(1.1)
for i in range(2):
    n = int(SR * 0.12)
    seg = []
    for k in range(n):
        t = k / SR
        env = math.exp(-42 * t)
        noise = math.sin(2 * math.pi * 720 * t) * 0.6 + math.sin(2 * math.pi * 1450 * t) * 0.3
        seg.append(0.5 * env * noise)
    mix_at(e, seg, i * 0.18)
save("alarm-e-wood.wav", norm(e, 0.8))

print("done →", OUT)
