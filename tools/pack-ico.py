# 把多尺寸 PNG 打包成 Windows .ico（Vista+ 支持 PNG 负载，不需要额外库）
import struct
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_icon")
SIZES = [256, 128, 64, 48, 32, 24, 16]


def build_ico(paths, out):
    blobs = []
    for px in paths:
        with open(os.path.join(SRC, f"icon-{px}.png"), "rb") as f:
            blobs.append((px, f.read()))

    n = len(blobs)
    header = struct.pack("<HHH", 0, 1, n)      # reserved, type=1(icon), count
    offset = 6 + 16 * n
    entries = b""
    for px, data in blobs:
        w = 0 if px >= 256 else px             # 0 表示 256
        entries += struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    with open(out, "wb") as f:
        f.write(header + entries + b"".join(d for _, d in blobs))
    return n, sum(len(d) for _, d in blobs)


if __name__ == "__main__":
    n, total = build_ico(SIZES, os.path.join(HERE, "icon.ico"))
    build_ico(SIZES, os.path.join(HERE, "icon-timer.ico"))   # 换名避免 Windows 图标缓存
    # 卡片本体用的大图
    with open(os.path.join(SRC, "icon-512.png"), "rb") as f:
        big = f.read()
    with open(os.path.join(HERE, "icon.png"), "wb") as f:
        f.write(big)
    print(f"ico ok: {n} sizes, {total} bytes payload")
    print("icon.ico", os.path.getsize(os.path.join(HERE, "icon.ico")),
          "| icon-timer.ico", os.path.getsize(os.path.join(HERE, "icon-timer.ico")),
          "| icon.png", os.path.getsize(os.path.join(HERE, "icon.png")))
