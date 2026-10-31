#!/usr/bin/env python3
"""ワールドマップ (64x48) を作って js/world.js に書き出す。

    python3 tools/gen_world.py

地形は だ円 と 線 を かさねて 描いている。町やダンジョンの いちを かえたいときは
下の FEATURES を へんしゅうする。
"""
import math
import random
from pathlib import Path

W, H = 64, 48
R = random.Random(7)
g = [["w"] * W for _ in range(H)]


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def get(x, y):
    return g[y][x] if 0 <= x < W and 0 <= y < H else "w"


def blob(cx, cy, rx, ry, c, jitter=0.18, only=None):
    for y in range(H):
        for x in range(W):
            d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            n = (math.sin(x * 1.3 + y * 0.7) + math.cos(x * 0.6 - y * 1.1)) * jitter
            if d < 1 + n and (only is None or g[y][x] in only):
                g[y][x] = c


def line(x0, y0, x1, y1, c, only=None):
    n = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(n + 1):
        x = round(x0 + (x1 - x0) * i / n)
        y = round(y0 + (y1 - y0) * i / n)
        if only is None or g[y][x] in only:
            put(x, y, c)


def rect(x0, y0, x1, y1, c, only=None):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if only is None or get(x, y) in only:
                put(x, y, c)


LAND = set(".,hTsPA*Mai")

# ---- たいりく
blob(13, 33, 13, 13, ".")
blob(30, 31, 14, 13, ".")
blob(45, 33, 9, 11, ".")
blob(28, 10, 23, 9, ".")
blob(30, 20, 12, 6, ".")
blob(8, 12, 7, 6, ".")
# まりゅうの しま と ほこらの しま
blob(58.5, 11, 5, 8.5, "a", 0.1)
blob(57.5, 40.5, 3.2, 2.4, ".", 0.05)

# ---- きた (ゆきぐに)
for y in range(0, 18):
    for x in range(0, 54):
        if g[y][x] == ".":
            g[y][x] = "*"
blob(12, 6, 5, 3, "P", only="*")
blob(20, 13, 4, 2.5, "P", only="*")
blob(46, 12, 4, 3, "P", only="*")
blob(35, 4, 6, 2.5, "A", only="*")
blob(5, 13, 3, 3, "A", only="*")
blob(42, 7, 4, 2.6, "i", 0.05, only="*P")

# ---- かわ (ひがし-にし): きたと みなみを わける
for x in range(3, 53):
    y = 17 + (1 if 14 < x < 30 else 0)
    if get(x, y) in LAND:
        put(x, y, "~")
    if get(x, y + 1) in LAND and x % 7 == 3:
        put(x, y + 1, "~")
# かわぞいの やま (はし の ところ だけ あいている)
for x in range(3, 52):
    for y in (15, 16):
        if get(x, y) in LAND and abs(x - 36) > 2:
            put(x, y, "A")
    for y in (19, 20):
        if get(x, y) in LAND and abs(x - 36) > 2 and not (12 <= x <= 16):
            put(x, y, "M")
# こわれた はし
put(36, 17, "X")
for y in (15, 16):
    put(35, y, "*"); put(36, y, "*"); put(37, y, "*")
for y in (18, 19, 20):
    put(36, y, ".")

# ---- にしの もり
blob(10, 25.5, 9, 5.5, "T")
rect(7, 24, 9, 26, ".")
blob(17, 27, 2.5, 2, "T")

# ---- たて の かわ (にし と まんなかを わける)
for y in range(19, 46):
    x = 22 + (1 if y > 38 else 0)
    if get(x, y) in LAND:
        put(x, y, "~")

# ---- ひがしの やまなみ (とうげ あり)
for y in range(21, 43):
    for x in (40, 41):
        if get(x, y) in LAND and y != 33:
            put(x, y, "M")
blob(51, 27, 4, 4, "M", only=".")
blob(26, 44, 3, 1.5, "h", only=".")
blob(33, 24, 3, 2, "h", only=".")
blob(4, 40, 2.5, 3, "h", only=".")
blob(36, 40, 3, 2, "T", only=".")
blob(46, 41, 3, 2, "T", only=".")
blob(28, 37, 2, 1.5, "T", only=".")
# すな はま
for y in range(H):
    for x in range(W):
        if g[y][x] == "." and any(get(x + dx, y + dy) == "w" for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[y][x] = "s"

# ---- まりゅうの しま
for y in range(H):
    for x in range(53, W):
        if g[y][x] == "a" and any(get(x + dx, y + dy) == "w" for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[y][x] = "v"
blob(58.5, 9, 2.5, 2, "L", only="a")
rect(56, 15, 60, 17, "a", only="avL")
put(58, 18, "a")

# ---- みち
line(12, 37, 22, 37, "=", only=".s,T")
line(23, 37, 26, 37, "=", only=".s,T")
line(26, 37, 26, 32, "|", only=".s,hT")
line(26, 32, 30, 32, "=", only=".s,h")
line(31, 33, 31, 35, "|", only=".s,h")
line(31, 35, 39, 35, "=", only=".s,hT")
line(39, 33, 45, 33, "=", only=".s,hTM")
line(45, 33, 45, 35, "|", only=".s,hT")
line(36, 21, 36, 30, "|", only=".s,hT")
line(32, 31, 35, 31, "=", only=".s,hT")
put(36, 31, "=")
put(22, 37, "b")
put(36, 17, "X")
put(41, 33, "=")
put(40, 33, "=")

# ---- しせつ
FEATURES = {
    "village": (12, 37, "V"),
    "ufo": (8, 25, "U"),
    "forestcave": (14, 21, "c"),
    "castle": (31, 32, "C"),
    "mintown": (45, 36, "V"),
    "mine": (50, 30, "c"),
    "snowvillage": (24, 9, "V"),
    "icetower": (42, 6, "t"),
    "dcastle": (58, 10, "D"),
    "shrine": (57, 40, "S"),
}
for name, (x, y, c) in FEATURES.items():
    put(x, y, c)
# もりの どうくつの まわり
for x, y in ((13, 21), (15, 21), (14, 20), (13, 20), (15, 20)):
    put(x, y, "M")
for x, y in ((14, 22), (14, 23)):
    put(x, y, "T")
# こうざんの いりぐち
put(50, 31, "."); put(49, 31, ".")
for x, y in ((49, 29), (51, 29), (50, 29), (51, 30), (49, 30)):
    put(x, y, "M")
# いろどり
for y in range(H):
    for x in range(W):
        if g[y][x] == "." and R.random() < 0.08:
            g[y][x] = ","

rows = ["".join(r) for r in g]
out = Path(__file__).resolve().parent.parent / "js" / "world.js"
body = ",\n".join(f'    "{r}"' for r in rows)
feat = ",\n".join(f'    {k}: [{x}, {y}]' for k, (x, y, _) in FEATURES.items())
out.write_text(
    "// じどう生成: python3 tools/gen_world.py で つくりなおせます\n"
    "Q.WORLD = {\n  rows: [\n" + body + "\n  ],\n  at: {\n" + feat + "\n  },\n};\n",
    encoding="utf-8",
)
print("\n".join(rows))
