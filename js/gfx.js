// ドット絵の道具箱: すべての絵 (タイル・キャラ・モンスター) はこの道具でコードから描く
// - paint() で描いた絵はアルファを 0/255 に二値化するので、canvas のパスや円弧を使ってもくっきりしたドットになる
// - part() で部品ごとに描いて、影 (atop) やふちどりを部品単位でつけられる
window.Q = window.Q || {};
(() => {
  "use strict";

  const OUT = "#1a1020";

  function canvasOf(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function hardAlpha(c) {
    const g = c.getContext("2d");
    const img = g.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0;
    g.putImageData(img, 0, 0);
    return c;
  }

  // 色の計算
  function rgbOf(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hexOf(r, g, b) {
    const f = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  // k < 1 で暗く (少し青紫に寄せる = スーファミっぽい影)、k > 1 で明るく
  function shade(hex, k) {
    const [r, g, b] = rgbOf(hex);
    if (k < 1) return hexOf(r * k * 0.96, g * k * 0.94, b * k + (1 - k) * 40);
    const t = k - 1;
    return hexOf(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t * 0.9);
  }
  function mix(a, b, t) {
    const A = rgbOf(a);
    const B = rgbOf(b);
    return hexOf(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 透明なところのうち、となりに色があるところをふちどる
  function outline(c, col = OUT, diag = false) {
    const g = c.getContext("2d");
    const w = c.width;
    const h = c.height;
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const mark = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1) ||
          (diag && (solid(x - 1, y - 1) || solid(x + 1, y - 1) || solid(x - 1, y + 1) || solid(x + 1, y + 1)))) mark.push(x, y);
      }
    }
    g.fillStyle = col;
    for (let i = 0; i < mark.length; i += 2) g.fillRect(mark[i], mark[i + 1], 1, 1);
    return c;
  }

  function flipped(c) {
    const f = canvasOf(c.width, c.height);
    const g = f.getContext("2d");
    g.translate(c.width, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    return f;
  }

  // 1 色で塗りつぶした絵 (ダメージの白フラッシュ・影など)
  function silhouette(c, col) {
    const f = canvasOf(c.width, c.height);
    const g = f.getContext("2d");
    g.drawImage(c, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = col;
    g.fillRect(0, 0, c.width, c.height);
    return f;
  }

  // 色の置きかえ (色ちがいモンスター用): map = { "#from": "#to" }
  function recolor(c, map) {
    const f = canvasOf(c.width, c.height);
    const g = f.getContext("2d");
    g.drawImage(c, 0, 0);
    const img = g.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const table = new Map();
    for (const [a, b] of Object.entries(map)) table.set(rgbOf(a).join(","), rgbOf(b));
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const to = table.get(d[i] + "," + d[i + 1] + "," + d[i + 2]);
      if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; }
    }
    g.putImageData(img, 0, 0);
    return f;
  }

  // 色相を回した色ちがい (全体の色調を変える)
  function hueShift(c, deg, sat = 1, light = 1) {
    const f = canvasOf(c.width, c.height);
    const g = f.getContext("2d");
    g.drawImage(c, 0, 0);
    const img = g.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const cos = Math.cos((deg * Math.PI) / 180);
    const sin = Math.sin((deg * Math.PI) / 180);
    // YIQ 回転
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const y = 0.299 * r + 0.587 * gg + 0.114 * b;
      if (y < 40 && Math.abs(r - gg) < 20 && Math.abs(gg - b) < 30) continue; // ふちどりは そのまま
      let I = 0.596 * r - 0.274 * gg - 0.322 * b;
      let Qv = 0.211 * r - 0.523 * gg + 0.312 * b;
      const i2 = (I * cos - Qv * sin) * sat;
      const q2 = (I * sin + Qv * cos) * sat;
      const yy = y * light;
      d[i] = Math.max(0, Math.min(255, yy + 0.956 * i2 + 0.621 * q2));
      d[i + 1] = Math.max(0, Math.min(255, yy - 0.272 * i2 - 0.647 * q2));
      d[i + 2] = Math.max(0, Math.min(255, yy - 1.106 * i2 + 1.703 * q2));
    }
    g.putImageData(img, 0, 0);
    return f;
  }

  // 形にそって自動で影とハイライトを入れる (左上から光が当たる)
  // sd = 影の幅、sl = ハイライトの幅 (px)
  function autoShade(c, sd = 3, sl = 1, o = {}) {
    const g = c.getContext("2d");
    const w = c.width;
    const h = c.height;
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const src = new Uint8ClampedArray(d);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
    const sx = o.dx ?? 0.55;
    const sy = o.dy ?? 0.85;
    const memo = new Map();
    const tone = (i, k) => {
      const key = src[i] * 65536 + src[i + 1] * 256 + src[i + 2] + "|" + k;
      if (!memo.has(key)) memo.set(key, rgbOf(shade(hexOf(src[i], src[i + 1], src[i + 2]), k)));
      return memo.get(key);
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!src[i + 3]) continue;
        if (src[i] + src[i + 1] + src[i + 2] < 90) continue; // 黒っぽい所はそのまま
        let k = 1;
        // 影側の縁までの距離
        for (let s = 1; s <= sd; s++) {
          if (!solid(Math.round(x + sx * s), Math.round(y + sy * s))) { k = s <= Math.max(1, sd * 0.4) ? 0.52 : 0.72; break; }
        }
        if (k === 1) {
          for (let s = 1; s <= sl; s++) {
            if (!solid(Math.round(x - sx * s), Math.round(y - sy * s))) { k = 1.32; break; }
          }
        }
        if (k !== 1) {
          const t = tone(i, k);
          d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2];
        }
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // ---------------------------------------------------------------- 描画の道具箱
  function makeP(c) {
    const g = c.getContext("2d", { willReadFrequently: true });
    const P = {
      g,
      w: c.width,
      h: c.height,
      p(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
      r(x, y, rw, rh, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh)); },
      // 楕円 (走査線で塗るのでギザギザがきれい)
      ell(cx, cy, rx, ry, col) {
        g.fillStyle = col;
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
          const dy = (y + 0.5 - cy) / ry;
          if (Math.abs(dy) > 1) continue;
          const half = rx * Math.sqrt(1 - dy * dy);
          const x0 = Math.round(cx - half);
          const x1 = Math.round(cx + half);
          if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
        }
      },
      line(x0, y0, x1, y1, col, t = 1) {
        g.fillStyle = col;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5));
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n;
          const y = y0 + ((y1 - y0) * i) / n;
          g.fillRect(Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t);
        }
      },
      ring(cx, cy, rad, col) {
        g.fillStyle = col;
        const n = Math.max(16, Math.ceil(rad * 8));
        for (let a = 0; a < n; a++) {
          const t = (a / n) * Math.PI * 2;
          g.fillRect(Math.round(cx + Math.cos(t) * rad - 0.5), Math.round(cy + Math.sin(t) * rad - 0.5), 1, 1);
        }
      },
      // 多角形 (トゲ・ツノ・つばさ)
      poly(pts, col) {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
        g.closePath();
        g.fill();
      },
      // 太さが変わる曲線 (しっぽ・腕・ツタ): pts は [x,y] の列、t0→t1 の太さ
      worm(pts, col, t0, t1 = t0) {
        g.fillStyle = col;
        const total = pts.length - 1;
        for (let s = 0; s < total; s++) {
          const [ax, ay] = pts[s];
          const [bx, by] = pts[s + 1];
          const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
          for (let i = 0; i <= n; i++) {
            const k = (s + i / n) / total;
            const rad = (t0 + (t1 - t0) * k) / 2;
            const x = ax + ((bx - ax) * i) / n;
            const y = ay + ((by - ay) * i) / n;
            g.beginPath();
            g.arc(x, y, Math.max(0.5, rad), 0, Math.PI * 2);
            g.fill();
          }
        }
      },
      // 立体的なボール: 3 段階の影 + つやの点
      ball(cx, cy, rx, ry, col, o = {}) {
        const dark = o.dark || shade(col, 0.68);
        const light = o.light || shade(col, 1.35);
        const lx = o.lx ?? -0.55;
        const ly = o.ly ?? -0.65;
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
          const ny = (y + 0.5 - cy) / ry;
          if (Math.abs(ny) > 1) continue;
          const half = rx * Math.sqrt(1 - ny * ny);
          const x0 = Math.round(cx - half);
          const x1 = Math.round(cx + half);
          for (let x = x0; x < x1; x++) {
            const nx = (x + 0.5 - cx) / rx;
            const d = nx * lx + ny * ly; // 光の向きとの内積
            const rim = nx * nx + ny * ny;
            let c2 = col;
            if (d < -0.38 || (rim > 0.82 && d < 0.1)) c2 = dark;
            else if (d > 0.62 && rim < 0.6) c2 = light;
            g.fillStyle = c2;
            g.fillRect(x, y, 1, 1);
          }
        }
        if (o.shine !== false) {
          const sx = cx + rx * lx * 0.55;
          const sy = cy + ry * ly * 0.55;
          const big = Math.min(rx, ry) > 12;
          const sr = Math.max(1, Math.min(rx, ry) * (big ? 0.1 : 0.16));
          P.ell(sx, sy, sr, sr * 0.8, o.shineCol || (big ? shade(col, 1.5) : "#ffffff"));
        }
      },
      // 目: r = 白目の半径、(px,py) = ひとみの向き -1..1
      eye(cx, cy, rx, ry, px = 0, py = 0, o = {}) {
        P.ell(cx, cy, rx + 1, ry + 1, o.rim || OUT);
        P.ell(cx, cy, rx, ry, o.white || "#ffffff");
        const pr = o.pupil ?? Math.max(1.2, Math.min(rx, ry) * 0.55);
        const ex = cx + px * Math.max(0, rx - pr - 0.9) * 0.8;
        const ey = cy + py * Math.max(0, ry - pr - 0.9) * 0.8;
        P.ell(ex, ey, pr, pr * (o.slit ? 1.6 : 1.1), o.iris || OUT);
        if (o.slit) P.ell(ex, ey, Math.max(0.5, pr * 0.3), pr * 1.3, OUT);
        if (pr >= 2.2) P.p(ex - pr * 0.4, ey - pr * 0.5, "#ffffff");
      },
      // おこった眉 (dir = 1 で右上がり)
      brow(x0, y0, x1, y1, t = 2, col = OUT) { P.line(x0, y0, x1, y1, col, t); },
      // 部品を別キャンバスで描いて重ねる (影やふちどりを部品ごとにつけられる)
      part(fn, o = {}) {
        const c2 = canvasOf(c.width, c.height);
        const P2 = makeP(c2);
        fn(P2);
        hardAlpha(c2);
        if (o.shade) autoShade(c2, o.shade === true ? 3 : o.shade, o.light ?? 1, o);
        if (o.outline) outline(c2, o.outline === true ? OUT : o.outline, !!o.diag);
        if (o.alpha != null) g.globalAlpha = o.alpha;
        g.drawImage(c2, o.dx || 0, o.dy || 0);
        g.globalAlpha = 1;
        return c2;
      },
      // すでに描いた所だけに塗る (影入れ)
      atop(fn) {
        g.save();
        g.globalCompositeOperation = "source-atop";
        fn(P);
        g.restore();
      },
      // 描いた所の外側に塗る
      behind(fn) {
        g.save();
        g.globalCompositeOperation = "destination-over";
        fn(P);
        g.restore();
      },
      // ディザ (市松模様) で塗る
      dither(x, y, rw, rh, col, phase = 0) {
        g.fillStyle = col;
        for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) if ((xx + yy + phase) % 2 === 0) g.fillRect(x + xx, y + yy, 1, 1);
      },
    };
    return P;
  }

  function paint(w, h, fn, o = {}) {
    const c = canvasOf(w, h);
    const P = makeP(c);
    fn(P, P.g);
    hardAlpha(c);
    if (o.shade) autoShade(c, o.shade === true ? 3 : o.shade, o.light ?? 1, o);
    if (o.outline) outline(c, o.outline === true ? OUT : o.outline, !!o.diag);
    return c;
  }

  const cache = new Map();
  function cached(key, make) {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key);
  }

  // ---------------------------------------------------------------- ドット文字 (数字・英字 5x7)
  const GLYPHS = {
    A: "01110100011000111111100011000110001", B: "11110100011000111110100011000111110",
    C: "01110100011000010000100001000101110", D: "11110100011000110001100011000111110",
    E: "11111100001000011110100001000011111", F: "11111100001000011110100001000010000",
    G: "01110100011000010111100011000101111", H: "10001100011000111111100011000110001",
    I: "01110001000010000100001000010001110", J: "00111000100001000010000101001001100",
    K: "10001100101010011000101001001010001", L: "10000100001000010000100001000011111",
    M: "10001110111010110101100011000110001", N: "10001100011100110101100111000110001",
    O: "01110100011000110001100011000101110", P: "11110100011000111110100001000010000",
    Q: "01110100011000110001101011001001101", R: "11110100011000111110101001001010001",
    S: "01111100001000001110000010000111110", T: "11111001000010000100001000010000100",
    U: "10001100011000110001100011000101110", V: "10001100011000110001100010101000100",
    W: "10001100011000110101101011010101010", X: "10001100010101000100010101000110001",
    Y: "10001100010101000100001000010000100", Z: "11111000010001000100010001000011111",
    0: "01110100011001110101110011000101110", 1: "00100011000010000100001000010001110",
    2: "01110100010000100010001000100011111", 3: "11111000100010000010000011000101110",
    4: "00010001100101010010111110001000010", 5: "11111100001111000001000011000101110",
    6: "00110010001000011110100011000101110", 7: "11111000010001000100010000100001000",
    8: "01110100011000101110100011000101110", 9: "01110100011000101111000010001001100",
    "-": "00000000000000011111000000000000000", "!": "00100001000010000100001000000000100",
    ".": "00000000000000000000000000110001100", ":": "00000011000110000000011000110000000",
    "?": "01110100010000100010001000000000100", "/": "00001000010001000100010001000010000",
    "+": "00000001000010011111001000010000000", "'": "00100001000100000000000000000000000",
    "(": "00010001000100001000010000010000010", ")": "01000001000001000010000100010001000",
    "%": "11001110010001000100010001001110011", "*": "00000001001010101110101010010000000",
  };
  const fontCache = new Map();
  function glyph(ch, color) {
    const key = ch + color;
    if (fontCache.has(key)) return fontCache.get(key);
    const bits = GLYPHS[ch];
    const c = canvasOf(5, 7);
    const g = c.getContext("2d");
    g.fillStyle = color;
    if (bits) for (let i = 0; i < 35; i++) if (bits[i] === "1") g.fillRect(i % 5, Math.floor(i / 5), 1, 1);
    fontCache.set(key, c);
    return c;
  }
  function textWidth(text, scale = 1) {
    return String(text).length * 6 * scale - scale;
  }
  function drawText(ctx, text, x, y, color = "#fff", opts = {}) {
    const scale = opts.scale || 1;
    const str = String(text).toUpperCase();
    const width = textWidth(str, scale);
    let sx = x;
    if (opts.align === "center") sx = Math.round(x - width / 2);
    else if (opts.align === "right") sx = x - width;
    const run = (col, ox, oy) => {
      for (let i = 0; i < str.length; i++) {
        if (str[i] === " ") continue;
        ctx.drawImage(glyph(str[i], col), sx + i * 6 * scale + ox, y + oy, 5 * scale, 7 * scale);
      }
    };
    if (opts.outline) {
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) run(opts.outline, ox * scale, oy * scale);
    } else if (opts.shadow) run(opts.shadow, scale, scale);
    run(color, 0, 0);
    return width;
  }

  // 日本語 (ブラウザの丸ゴシックで、高解像度のまま描く)
  const JFONT = '"Hiragino Maru Gothic ProN", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", "IPAPGothic", "IPAGothic", sans-serif';
  function jtext(ctx, text, x, y, color = "#fff", opts = {}) {
    const size = opts.size || 10;
    ctx.save();
    ctx.font = `bold ${size}px ${JFONT}`;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = "top";
    if (opts.shadow !== false) {
      ctx.fillStyle = opts.shadow || "rgba(10,6,30,0.85)";
      ctx.fillText(text, x + 0.8, y + 0.8);
    }
    if (opts.outline) {
      ctx.lineJoin = "round";
      ctx.lineWidth = opts.outlineWidth || 2.5;
      ctx.strokeStyle = opts.outline;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }
  function jwidth(ctx, text, size = 10) {
    ctx.save();
    ctx.font = `bold ${size}px ${JFONT}`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  // ---------------------------------------------------------------- ウインドウ (スーファミ RPG 風の青いグラデーション枠)
  let winTheme = 0;
  const THEMES = [
    { top: "#3a52c8", bot: "#10186a", edge: "#f4f4ff", mid: "#9aa4d8" },
    { top: "#6a3ab0", bot: "#220a50", edge: "#fff0ff", mid: "#c8a0e8" },
    { top: "#2a8a6a", bot: "#0a3028", edge: "#f0fff4", mid: "#90d8b8" },
    { top: "#a84a3a", bot: "#3a1010", edge: "#fff4ec", mid: "#e8a890" },
  ];
  function drawWindow(ctx, x, y, w, h, o = {}) {
    const th = THEMES[o.theme ?? winTheme] || THEMES[0];
    ctx.save();
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, th.top);
    grad.addColorStop(1, th.bot);
    ctx.globalAlpha = o.alpha ?? 0.94;
    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.globalAlpha = 1;
    // 角の丸い 2 重の枠
    ctx.fillStyle = "#0a0818";
    ctx.fillRect(x + 1, y, w - 2, 1); ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
    ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
    ctx.fillStyle = th.edge;
    ctx.fillRect(x + 2, y + 1, w - 4, 1); ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
    ctx.fillRect(x + 1, y + 2, 1, h - 4); ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
    ctx.fillStyle = th.mid;
    ctx.fillRect(x + 3, y + 2, w - 6, 1); ctx.fillRect(x + 2, y + 3, 1, h - 6);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 3, y + h - 3, w - 6, 1); ctx.fillRect(x + w - 3, y + 3, 1, h - 6);
    ctx.restore();
  }

  // 指カーソル (ポポのアンテナ風)
  const cursorImg = () => cached("cursor", () => paint(11, 9, (P) => {
    P.r(0, 3, 6, 3, "#ffffff");
    P.ell(7, 4.5, 3, 3, "#c070ff");
    P.ell(6.5, 3.5, 1, 1, "#f0d0ff");
  }, { outline: true }));
  function drawCursor(ctx, x, y, t = 0) {
    const bob = Math.floor(t * 4) % 2;
    ctx.drawImage(cursorImg(), Math.round(x - 12 + bob), Math.round(y - 1));
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  Q.gfx = {
    OUT, canvasOf, paint, makeP, hardAlpha, outline, autoShade, flipped, silhouette, recolor, hueShift,
    shade, mix, rgbOf, hexOf, rng, cached, drawText, textWidth, jtext, jwidth, JFONT,
    drawWindow, drawCursor, THEMES, clamp,
    setTheme(i) { winTheme = i; },
    get theme() { return winTheme; },
  };
})();
