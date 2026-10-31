// マップチップ (16x16) と バトルの背景。すべてコードで描く
(() => {
  "use strict";
  const G = Q.gfx;
  const { paint, shade, mix, OUT, rng, canvasOf } = G;
  const TS = 16;

  const T = {}; // id → { frames: [canvas], solid, water, counter, enc, over }
  function tile(id, props, ...draws) {
    T[id] = Object.assign({ id, solid: false }, props, { draws, frames: null });
  }
  function frames(id) {
    const t = T[id];
    if (!t.frames) t.frames = t.draws.map((fn, i) => paint(TS, TS, (P) => fn(P, i)));
    return t.frames;
  }

  // ---------------------------------------------------------------- 共通の下地
  const GR = "#58b848";
  function grass(P, seed = 1, base = GR) {
    P.r(0, 0, 16, 16, base);
    const R = rng(seed);
    for (let i = 0; i < 7; i++) {
      const x = Math.floor(R() * 15);
      const y = Math.floor(R() * 14);
      P.p(x, y, shade(base, 0.78)); P.p(x + 1, y + 1, shade(base, 0.78));
      if (R() < 0.4) P.p(x, y + 1, shade(base, 1.2));
    }
  }
  function speckle(P, base, seed, n = 10, k1 = 0.85, k2 = 1.12) {
    P.r(0, 0, 16, 16, base);
    const R = rng(seed);
    for (let i = 0; i < n; i++) P.p(Math.floor(R() * 16), Math.floor(R() * 16), R() < 0.5 ? shade(base, k1) : shade(base, k2));
  }
  function tree(P, x, y, s, leaf, trunk = "#7a4a2a") {
    P.r(x - 1, y + s * 0.5, 3, s * 0.6, trunk);
    P.ell(x, y, s * 0.75, s * 0.62, shade(leaf, 0.7));
    P.ell(x - 0.5, y - 1, s * 0.68, s * 0.52, leaf);
    P.ell(x - 2, y - 2.5, s * 0.28, s * 0.2, shade(leaf, 1.3));
  }
  function pine(P, x, y, leaf, snow) {
    P.r(x - 1, y + 5, 2, 3, "#6a4a2a");
    P.poly([[x - 6, y + 6], [x, y - 7], [x + 6, y + 6]], shade(leaf, 0.75));
    P.poly([[x - 5, y + 5], [x, y - 7], [x + 3, y + 5]], leaf);
    if (snow) { P.poly([[x - 3, y - 1], [x, y - 7], [x + 3, y - 1]], "#ffffff"); P.r(x - 5, y + 3, 4, 1, "#ffffff"); }
  }
  function brickWall(P, base, mortar) {
    P.r(0, 0, 16, 16, mortar);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let c = -1; c < 3; c++) {
        const x = c * 8 + off;
        P.r(x + 1, row * 4 + 1, 7, 3, base);
        P.r(x + 1, row * 4 + 1, 7, 1, shade(base, 1.2));
      }
    }
  }

  // ================================================================ ワールドマップ
  tile("grass", { enc: true }, (P) => grass(P, 3));
  tile("grass2", { enc: true }, (P) => { grass(P, 9); P.p(4, 5, "#ffffff"); P.p(3, 5, "#ffe040"); P.p(11, 10, "#ff7aa8"); P.p(12, 11, "#ffffff"); });
  tile("forest", { enc: true, slow: true }, (P) => {
    grass(P, 5, "#3a8a3a");
    tree(P, 4, 5, 7, "#2a9a3a"); tree(P, 12, 6, 7, "#2a9a3a"); tree(P, 8, 11, 7, "#3aa848");
  });
  tile("hill", { enc: true }, (P) => {
    grass(P, 7);
    P.ell(8, 10, 7, 5, shade(GR, 0.85)); P.ell(7, 9, 6, 4, shade(GR, 1.12)); P.ell(5, 8, 2, 1.5, shade(GR, 1.3));
  });
  tile("mountain", { solid: true }, (P) => {
    grass(P, 11);
    P.poly([[0, 15], [8, 1], [16, 15]], "#8a7a6a");
    P.poly([[8, 1], [16, 15], [10, 15], [9, 8]], "#6a5a4a");
    P.poly([[5, 6.5], [8, 1], [11, 6.5], [9, 5], [7, 7]], "#ffffff");
    P.line(0, 15, 8, 1, OUT); P.line(8, 1, 16, 15, OUT);
  });
  tile("water", { solid: true, water: true },
    (P) => { P.r(0, 0, 16, 16, "#3a7ae8"); P.r(2, 4, 4, 1, "#7ab0ff"); P.r(9, 10, 5, 1, "#7ab0ff"); P.r(11, 3, 2, 1, "#a8d0ff"); },
    (P) => { P.r(0, 0, 16, 16, "#3a7ae8"); P.r(3, 5, 4, 1, "#7ab0ff"); P.r(8, 11, 5, 1, "#7ab0ff"); P.r(12, 4, 2, 1, "#a8d0ff"); },
    (P) => { P.r(0, 0, 16, 16, "#3a7ae8"); P.r(4, 4, 3, 1, "#7ab0ff"); P.r(9, 10, 4, 1, "#7ab0ff"); P.r(2, 12, 2, 1, "#a8d0ff"); });
  tile("deep", { solid: true, water: true },
    (P) => { P.r(0, 0, 16, 16, "#2a52b8"); P.r(3, 6, 3, 1, "#4a7ae0"); P.r(10, 11, 3, 1, "#4a7ae0"); },
    (P) => { P.r(0, 0, 16, 16, "#2a52b8"); P.r(4, 6, 3, 1, "#4a7ae0"); P.r(9, 11, 3, 1, "#4a7ae0"); },
    (P) => { P.r(0, 0, 16, 16, "#2a52b8"); P.r(5, 6, 2, 1, "#4a7ae0"); P.r(10, 12, 3, 1, "#4a7ae0"); });
  tile("sand", { enc: true }, (P) => speckle(P, "#ecd690", 4, 14));
  tile("road", {}, (P) => { grass(P, 13); P.r(0, 3, 16, 10, "#d8b878"); P.r(0, 3, 16, 1, "#b8985a"); P.r(0, 12, 16, 1, "#b8985a"); P.p(4, 7, "#b8985a"); P.p(11, 9, "#b8985a"); });
  tile("roadv", {}, (P) => { grass(P, 14); P.r(3, 0, 10, 16, "#d8b878"); P.r(3, 0, 1, 16, "#b8985a"); P.r(12, 0, 1, 16, "#b8985a"); P.p(7, 4, "#b8985a"); P.p(9, 11, "#b8985a"); });
  tile("bridge", {}, (P) => {
    P.r(0, 0, 16, 16, "#3a7ae8");
    P.r(0, 2, 16, 12, "#a87040");
    for (let x = 0; x < 16; x += 4) P.r(x, 2, 1, 12, "#7a4a2a");
    P.r(0, 2, 16, 1, "#5a3a1a"); P.r(0, 13, 16, 1, "#5a3a1a");
  });
  tile("bridgev", {}, (P) => {
    P.r(0, 0, 16, 16, "#3a7ae8");
    P.r(2, 0, 12, 16, "#a87040");
    for (let y = 0; y < 16; y += 4) P.r(2, y, 12, 1, "#7a4a2a");
    P.r(2, 0, 1, 16, "#5a3a1a"); P.r(13, 0, 1, 16, "#5a3a1a");
  });
  tile("brokenbridge", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a7ae8");
    P.r(2, 0, 12, 4, "#a87040"); P.r(2, 12, 12, 4, "#a87040");
    P.r(2, 4, 3, 2, "#a87040"); P.r(10, 11, 3, 1, "#a87040");
    P.r(2, 0, 1, 6, "#5a3a1a"); P.r(13, 0, 1, 4, "#5a3a1a"); P.r(2, 12, 1, 4, "#5a3a1a"); P.r(13, 11, 1, 5, "#5a3a1a");
    P.r(6, 8, 3, 1, "#7ab0ff");
  });
  tile("snow", { enc: true }, (P) => speckle(P, "#eef4ff", 21, 10, 0.88, 1.0));
  tile("snowforest", { enc: true, slow: true }, (P) => {
    speckle(P, "#eef4ff", 22, 8, 0.88, 1.0);
    pine(P, 4, 6, "#2a7a5a", true); pine(P, 12, 7, "#2a7a5a", true); pine(P, 8, 10, "#3a8a6a", true);
  });
  tile("snowmountain", { solid: true }, (P) => {
    speckle(P, "#eef4ff", 23, 6, 0.88, 1.0);
    P.poly([[0, 15], [8, 1], [16, 15]], "#a8b8d8");
    P.poly([[8, 1], [16, 15], [10, 15], [9, 8]], "#8090b8");
    P.poly([[3, 9.5], [8, 1], [13, 9.5], [10, 8], [8, 10], [6, 8]], "#ffffff");
    P.line(0, 15, 8, 1, OUT); P.line(8, 1, 16, 15, OUT);
  });
  tile("boulder", { solid: true }, (P) => {
    speckle(P, "#6a5a50", 83, 10);
    P.ell(8, 9, 7, 6, "#8a7a6a"); P.ell(7, 7, 5, 4, "#a89888"); P.ell(5, 6, 1.5, 1, "#c8b8a8"); P.line(9, 10, 12, 13, "#5a4a3a");
  });
  tile("icefield", { enc: true }, (P) => { P.r(0, 0, 16, 16, "#b8e8ff"); P.line(2, 3, 7, 3, "#e8f8ff"); P.line(9, 11, 14, 11, "#e8f8ff"); P.p(12, 5, "#ffffff"); });
  tile("ice", { solid: true, water: true },
    (P) => { P.r(0, 0, 16, 16, "#8ad0f0"); P.line(2, 3, 7, 3, "#d8f4ff"); P.line(9, 11, 14, 11, "#d8f4ff"); },
    (P) => { P.r(0, 0, 16, 16, "#8ad0f0"); P.line(3, 3, 8, 3, "#d8f4ff"); P.line(8, 11, 13, 11, "#d8f4ff"); });
  tile("ash", { enc: true }, (P) => speckle(P, "#6a5a5a", 31, 16, 0.75, 1.2));
  tile("volcano", { solid: true }, (P) => {
    speckle(P, "#6a5a5a", 32, 8);
    P.poly([[0, 15], [6, 2], [10, 2], [16, 15]], "#4a3a3a");
    P.poly([[8, 2], [10, 2], [16, 15], [11, 15]], "#3a2a2a");
    P.r(6, 1, 4, 2, "#ff6a2a"); P.r(7, 3, 2, 4, "#ff8a2a"); P.p(8, 7, "#ff8a2a");
    P.line(0, 15, 6, 2, OUT); P.line(10, 2, 16, 15, OUT);
  });
  tile("lava", { solid: true, water: true },
    (P) => { P.r(0, 0, 16, 16, "#e8401a"); P.ell(4, 4, 2.5, 1.5, "#ffb030"); P.ell(11, 11, 3, 1.5, "#ffd040"); P.p(12, 3, "#ffd040"); },
    (P) => { P.r(0, 0, 16, 16, "#e8401a"); P.ell(5, 5, 2.5, 1.5, "#ffd040"); P.ell(10, 11, 3, 1.5, "#ffb030"); P.p(3, 12, "#ffd040"); });
  tile("swamp", { enc: true, dmg: 1 }, (P) => { speckle(P, "#7a4a9a", 41, 14, 0.8, 1.2); P.ell(5, 5, 2, 1, "#c08ae0"); P.ell(11, 11, 2, 1, "#c08ae0"); });
  tile("darkgrass", { enc: true }, (P) => grass(P, 51, "#4a6a4a"));
  tile("cloud", { solid: true }, (P) => { P.r(0, 0, 16, 16, "#2a52b8"); P.ell(8, 9, 7, 4, "#ffffff"); P.ell(6, 7, 4, 3, "#ffffff"); P.ell(11, 7, 3, 3, "#e8f0ff"); });

  // 町・城などのアイコン
  tile("village", {}, (P) => {
    grass(P, 61);
    const house = (x, y, roof) => {
      P.r(x, y + 3, 6, 4, "#f4e0b8"); P.r(x + 2, y + 5, 2, 2, "#7a4a2a");
      P.poly([[x - 1, y + 4], [x + 3, y], [x + 7, y + 4]], roof);
    };
    house(1, 1, "#e8503a"); house(9, 3, "#3a7ad8"); house(4, 8, "#e8a030");
  });
  tile("castle", {}, (P) => {
    grass(P, 62);
    P.r(2, 5, 12, 10, "#d8d8e8"); P.r(2, 5, 12, 1, "#ffffff");
    for (let x = 2; x < 14; x += 3) P.r(x, 4, 2, 1, "#d8d8e8");
    P.r(1, 2, 4, 13, "#c8c8d8"); P.r(11, 2, 4, 13, "#c8c8d8");
    P.poly([[0, 3], [3, -1], [6, 3]], "#3a5ad8"); P.poly([[10, 3], [13, -1], [16, 3]], "#3a5ad8");
    P.r(6, 10, 4, 5, "#5a3a2a"); P.ell(8, 10, 2, 2, "#5a3a2a");
    P.r(7, 7, 2, 2, "#3a3a5a");
    P.line(1, 15, 15, 15, OUT);
  });
  tile("cave", {}, (P) => {
    grass(P, 63);
    P.poly([[0, 15], [3, 4], [8, 1], [13, 4], [16, 15]], "#8a7a6a");
    P.poly([[8, 1], [13, 4], [16, 15], [10, 15]], "#6a5a4a");
    P.ell(8, 12, 4, 5, "#1a1020"); P.r(4, 12, 8, 4, "#1a1020");
  });
  tile("snowcave", {}, (P) => {
    speckle(P, "#eef4ff", 64, 6, 0.88, 1.0);
    P.poly([[0, 15], [3, 4], [8, 1], [13, 4], [16, 15]], "#a8b8d8");
    P.ell(8, 12, 4, 5, "#1a1030"); P.r(4, 12, 8, 4, "#1a1030");
  });
  tile("tower", {}, (P) => {
    speckle(P, "#eef4ff", 65, 6, 0.88, 1.0);
    P.r(4, 2, 8, 14, "#9ad8f8"); P.r(4, 2, 2, 14, "#d8f4ff"); P.r(10, 2, 2, 14, "#6aa8d8");
    P.poly([[3, 3], [8, -1], [13, 3]], "#5a8ad8");
    P.r(7, 5, 2, 2, "#3a5a8a"); P.r(7, 12, 2, 4, "#3a5a8a");
  });
  tile("ufo", {}, (P) => {
    grass(P, 66, "#3a8a3a");
    P.ell(8, 10, 7, 3, "#a8b0c8"); P.ell(8, 9, 7, 2, "#d8e0f0");
    P.ell(8, 7, 4, 3, "#8ae0ff"); P.ell(7, 6, 1.5, 1, "#ffffff");
    P.p(2, 10, "#ffd040"); P.p(8, 11, "#ffd040"); P.p(13, 10, "#ffd040");
    P.line(10, 12, 13, 15, "#5a5a6a");
  });
  tile("dcastle", {}, (P) => {
    speckle(P, "#6a5a5a", 67, 8);
    P.r(2, 5, 12, 10, "#3a2a4a");
    P.r(1, 1, 4, 14, "#2a1a3a"); P.r(11, 1, 4, 14, "#2a1a3a");
    P.poly([[0, 2], [3, -2], [6, 2]], "#8a1a3a"); P.poly([[10, 2], [13, -2], [16, 2]], "#8a1a3a");
    P.poly([[5, 6], [8, 1], [11, 6]], "#5a1a4a");
    P.r(6, 10, 4, 5, "#ff3a3a"); P.r(7, 11, 2, 4, "#1a0a1a");
    P.p(2, 6, "#ffd040"); P.p(13, 6, "#ffd040");
  });
  tile("shrine", {}, (P) => {
    grass(P, 68);
    P.r(3, 6, 10, 9, "#e8e0d0"); P.poly([[1, 7], [8, 1], [15, 7]], "#c83a3a");
    P.r(4, 7, 1, 8, "#ffffff"); P.r(11, 7, 1, 8, "#ffffff"); P.r(7, 10, 2, 5, "#5a3a2a");
  });
  tile("port", {}, (P) => {
    grass(P, 69);
    P.r(0, 9, 16, 7, "#3a7ae8"); P.r(1, 8, 9, 3, "#a87040");
    P.r(10, 2, 1, 9, "#5a3a1a"); P.poly([[11, 2], [15, 6], [11, 8]], "#ffffff");
    P.ell(12, 12, 4, 2, "#8a5a2a");
    P.r(1, 2, 5, 5, "#f4e0b8"); P.poly([[0, 3], [3.5, 0], [7, 3]], "#3a7ad8");
  });

  // ================================================================ 町・城の中
  tile("tgrass", {}, (P) => grass(P, 71));
  tile("flowers", {}, (P) => {
    grass(P, 72);
    for (const [x, y, c] of [[3, 3, "#ff5a7a"], [10, 4, "#ffe040"], [6, 9, "#ffffff"], [12, 12, "#ff5a7a"], [2, 12, "#c07aff"]]) {
      P.p(x, y, c); P.p(x - 1, y, c); P.p(x + 1, y, c); P.p(x, y - 1, c); P.p(x, y, "#ffe080"); P.p(x, y + 1, "#3a8a3a");
    }
  });
  tile("stone", {}, (P) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    for (const [x, y, w, h] of [[0, 0, 7, 7], [8, 0, 8, 5], [0, 8, 5, 8], [6, 8, 10, 8], [8, 6, 8, 1]]) {
      P.r(x + 1, y + 1, w - 1, h - 1, "#d0c8b8");
      P.r(x + 1, y + 1, w - 1, 1, "#e0d8c8");
    }
  });
  tile("path", {}, (P) => { speckle(P, "#d8b878", 73, 12, 0.88, 1.08); });
  tile("wood", {}, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    for (let y = 0; y < 16; y += 4) { P.r(0, y, 16, 1, "#8a5a2a"); P.r((y * 3) % 16, y + 1, 1, 3, "#8a5a2a"); }
    P.r(0, 1, 16, 1, "#d8a068");
    P.r(0, 9, 16, 1, "#d8a068");
  });
  tile("carpet", {}, (P) => {
    P.r(0, 0, 16, 16, "#c8283a");
    P.r(0, 0, 16, 1, "#e85a6a"); P.p(4, 6, "#a01a2a"); P.p(11, 11, "#a01a2a");
  });
  tile("carpetedge", {}, (P) => {
    P.r(0, 0, 16, 16, "#c8283a");
    P.r(0, 0, 2, 16, "#ffd040"); P.r(14, 0, 2, 16, "#ffd040");
  });
  tile("tile", {}, (P) => {
    P.r(0, 0, 16, 16, "#d8d0e0");
    P.r(0, 0, 8, 8, "#e8e0f0"); P.r(8, 8, 8, 8, "#e8e0f0");
    P.r(0, 15, 16, 1, "#b8b0c8"); P.r(15, 0, 1, 16, "#b8b0c8");
  });
  // 壁: 上の面 (wtop) と 正面 (wall)
  tile("wall", { solid: true }, (P) => brickWall(P, "#c8b898", "#8a7a68"));
  tile("wtop", { solid: true }, (P) => { P.r(0, 0, 16, 16, "#5a4a3a"); P.r(1, 1, 14, 14, "#6a5a48"); P.r(1, 1, 14, 1, "#7a6a58"); });
  tile("woodwall", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#a06a3a");
    for (let x = 0; x < 16; x += 4) P.r(x, 0, 1, 16, "#6a4020");
    P.r(0, 0, 16, 2, "#7a4a28"); P.r(0, 14, 16, 2, "#5a3418");
  });
  tile("window", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#a06a3a");
    for (let x = 0; x < 16; x += 4) P.r(x, 0, 1, 16, "#6a4020");
    P.r(3, 3, 10, 8, "#5a3418"); P.r(4, 4, 8, 6, "#8ad0ff"); P.r(7, 4, 1, 6, "#5a3418"); P.r(4, 6, 8, 1, "#5a3418");
    P.p(5, 5, "#ffffff");
  });
  tile("roof", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c8402a");
    for (let y = 0; y < 16; y += 4) { P.r(0, y + 3, 16, 1, "#8a2a1a"); for (let x = (y / 4) % 2 ? 2 : 6; x < 16; x += 8) P.r(x, y, 1, 3, "#8a2a1a"); }
    P.r(0, 0, 16, 1, "#e8604a");
  });
  tile("roof2", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a6ac8");
    for (let y = 0; y < 16; y += 4) { P.r(0, y + 3, 16, 1, "#2a4a8a"); for (let x = (y / 4) % 2 ? 2 : 6; x < 16; x += 8) P.r(x, y, 1, 3, "#2a4a8a"); }
  });
  tile("castlewall", { solid: true }, (P) => brickWall(P, "#d8d8e8", "#9898b0"));
  tile("cwtop", { solid: true }, (P) => { P.r(0, 0, 16, 16, "#7878a0"); P.r(1, 1, 14, 14, "#8a8ab0"); P.r(1, 1, 14, 1, "#a8a8c8"); });
  tile("door", { door: true }, (P) => {
    brickWall(P, "#c8b898", "#8a7a68");
    P.r(3, 2, 10, 14, "#5a3418"); P.r(4, 3, 8, 13, "#8a5a2a"); P.r(8, 3, 1, 13, "#5a3418"); P.p(10, 9, "#ffd040"); P.p(6, 9, "#ffd040");
  });
  tile("opendoor", {}, (P) => {
    brickWall(P, "#c8b898", "#8a7a68");
    P.r(3, 2, 10, 14, "#2a1a10"); P.r(3, 2, 2, 14, "#8a5a2a");
  });
  tile("counter", { solid: true, counter: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    P.r(0, 2, 16, 10, "#a06a3a"); P.r(0, 2, 16, 2, "#d8a068"); P.r(0, 12, 16, 3, "#6a4020");
  });
  tile("table", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    for (let y = 0; y < 16; y += 4) P.r(0, y, 16, 1, "#8a5a2a");
    P.r(1, 2, 14, 9, "#e8d8c0"); P.r(1, 2, 14, 1, "#ffffff"); P.r(2, 11, 2, 4, "#6a4020"); P.r(12, 11, 2, 4, "#6a4020");
    P.ell(6, 6, 2, 1.5, "#ffffff"); P.ell(11, 6, 1.5, 2, "#e85a3a");
  });
  tile("bed", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    P.r(2, 0, 12, 16, "#6a4020"); P.r(3, 1, 10, 4, "#ffffff"); P.r(3, 5, 10, 10, "#3a7ad8"); P.r(3, 5, 10, 1, "#5a9af8");
  });
  tile("shelf", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#6a4020");
    for (let y = 1; y < 16; y += 5) {
      P.r(1, y, 14, 4, "#3a2010");
      const cs = ["#e83a3a", "#3a7ad8", "#ffd040", "#3ab05a", "#a05ad8"];
      for (let i = 0; i < 6; i++) P.r(2 + i * 2, y + (i % 2), 2, 4 - (i % 2), cs[(i + y) % 5]);
    }
  });
  tile("barrel", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    P.ell(8, 9, 6, 6.5, "#a06a3a"); P.r(2, 5, 12, 1, "#5a5a6a"); P.r(2, 12, 12, 1, "#5a5a6a"); P.ell(8, 4, 5, 2, "#c89060"); P.ell(6, 8, 1, 3, "#c89060");
  });
  tile("pot", { solid: true, search: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    P.ell(8, 10, 5.5, 5, "#c87a4a"); P.r(5, 3, 6, 3, "#c87a4a"); P.ell(8, 3, 3.5, 1.5, "#4a2a1a"); P.ell(6, 9, 1.5, 2, "#e8a070");
  });
  tile("stairsdown", {}, (P) => {
    P.r(0, 0, 16, 16, "#2a2028");
    for (let i = 0; i < 4; i++) { P.r(1 + i * 1, 1 + i * 4, 14 - i * 2, 3, shade("#b8b0a0", 1 - i * 0.18)); }
  });
  tile("stairsup", {}, (P) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    for (let i = 0; i < 4; i++) { P.r(1, 12 - i * 4, 14, 3, shade("#d0c8b8", 1 - i * 0.12)); P.r(1, 15 - i * 4, 14, 1, "#6a6050"); }
  });
  tile("fence", { solid: true }, (P) => {
    grass(P, 74);
    P.r(0, 6, 16, 2, "#e8d0a0"); P.r(0, 10, 16, 2, "#e8d0a0"); P.r(2, 3, 2, 11, "#f4e0b8"); P.r(11, 3, 2, 11, "#f4e0b8");
  });
  tile("well", { solid: true }, (P) => {
    grass(P, 75);
    P.ell(8, 10, 6, 4.5, "#a8a0a0"); P.ell(8, 9, 4, 2.5, "#1a2a5a"); P.r(2, 2, 1, 8, "#6a4020"); P.r(13, 2, 1, 8, "#6a4020"); P.r(1, 1, 14, 2, "#a8402a");
  });
  tile("tree", { solid: true }, (P) => { grass(P, 76); tree(P, 8, 7, 11, "#3aa848"); });
  tile("pinetree", { solid: true }, (P) => { speckle(P, "#eef4ff", 77, 6, 0.88, 1.0); pine(P, 8, 7, "#2a7a5a", true); });
  tile("sign", { solid: true, sign: true }, (P) => {
    grass(P, 78);
    P.r(7, 8, 2, 8, "#6a4020"); P.r(2, 2, 12, 7, "#c08850"); P.r(2, 2, 12, 1, "#d8a068"); P.r(4, 4, 8, 1, "#6a4020"); P.r(4, 6, 6, 1, "#6a4020");
  });
  tile("fountain", { solid: true }, (P, i) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    P.ell(8, 9, 7.5, 6, "#d0c8b8"); P.ell(8, 9, 6, 4.5, "#3a7ae8"); P.r(7, 2, 2, 7, "#d0c8b8");
    P.p(6 + i, 2, "#a8d0ff"); P.p(10 - i, 3, "#a8d0ff"); P.ell(8, 2, 2, 1, "#ffffff");
  }, (P, i) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    P.ell(8, 9, 7.5, 6, "#d0c8b8"); P.ell(8, 9, 6, 4.5, "#3a7ae8"); P.r(7, 2, 2, 7, "#d0c8b8");
    P.p(5, 3, "#a8d0ff"); P.p(11, 2, "#a8d0ff"); P.ell(8, 1.5, 2, 1, "#ffffff");
  });
  tile("torch", { solid: true }, (P) => {
    brickWall(P, "#c8b898", "#8a7a68");
    P.r(7, 8, 2, 5, "#6a4020"); P.ell(8, 6, 2, 3, "#ff8a2a"); P.ell(8, 6.5, 1, 1.5, "#ffe060");
  }, (P) => {
    brickWall(P, "#c8b898", "#8a7a68");
    P.r(7, 8, 2, 5, "#6a4020"); P.ell(8, 5.5, 2.5, 3, "#ff6a2a"); P.ell(8, 6, 1, 2, "#ffe060");
  });
  tile("throne", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c8283a");
    P.r(2, 0, 12, 13, "#ffd040"); P.r(4, 2, 8, 8, "#a01a2a"); P.r(1, 8, 14, 6, "#e8b830"); P.r(3, 9, 10, 3, "#c8283a");
  });
  tile("pillar", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#d8d0e0");
    P.r(3, 0, 10, 16, "#e8e8f4"); P.r(3, 0, 2, 16, "#ffffff"); P.r(11, 0, 2, 16, "#b8b8c8"); P.r(2, 0, 12, 2, "#c8c8d8"); P.r(2, 14, 12, 2, "#c8c8d8");
  });
  tile("statue", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#d8d0e0");
    P.r(3, 11, 10, 5, "#a8a8b8");
    // ひとつめの ゆうしゃの ぞう
    P.ell(8, 7, 5, 5, "#c8c8d8"); P.ell(8, 6, 2.5, 2.5, "#ffffff"); P.p(8, 6, "#5a5a6a");
    P.r(5, 0, 1, 3, "#a8a8b8"); P.r(10, 0, 1, 3, "#a8a8b8");
  });
  tile("plant", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#c08850");
    P.r(5, 10, 6, 5, "#c87a4a"); P.ell(8, 7, 5, 4, "#3aa848"); P.ell(6, 5, 2, 2, "#5ac868"); P.p(10, 4, "#ff5a7a");
  });

  // ================================================================ ダンジョン
  tile("cavefloor", { enc: true }, (P) => speckle(P, "#6a5a50", 81, 14, 0.8, 1.15));
  tile("cavewall", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a3038");
    P.ell(4, 5, 4, 3, "#4a4048"); P.ell(12, 11, 4, 3, "#4a4048"); P.ell(11, 3, 3, 2, "#544a52"); P.ell(4, 13, 3, 2, "#544a52");
  });
  tile("cavewallf", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#5a4a48");
    P.r(0, 0, 16, 4, "#3a3038"); P.r(2, 5, 5, 4, "#6a5a58"); P.r(9, 8, 6, 5, "#6a5a58"); P.r(0, 14, 16, 2, "#2a2028");
  });
  tile("rail", { enc: true }, (P) => {
    speckle(P, "#6a5a50", 82, 10);
    for (let y = 1; y < 16; y += 4) P.r(1, y, 14, 2, "#6a4020");
    P.r(3, 0, 1, 16, "#a8a8b8"); P.r(12, 0, 1, 16, "#a8a8b8");
  });
  tile("crystalwall", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a3038");
    P.poly([[2, 14], [4, 3], [7, 14]], "#7ae0ff"); P.poly([[8, 14], [11, 6], [13, 14]], "#c07aff"); P.line(4, 4, 4, 12, "#ffffff");
  });
  tile("icefloor", { enc: true }, (P) => {
    P.r(0, 0, 16, 16, "#b8e0f8");
    P.line(1, 2, 6, 7, "#e8f8ff"); P.line(9, 10, 14, 14, "#e8f8ff"); P.p(12, 3, "#ffffff");
  });
  tile("icewall", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#4a7ab8");
    P.r(1, 1, 14, 14, "#6a9ad8"); P.poly([[2, 14], [5, 2], [8, 14]], "#9ad0f8"); P.poly([[9, 14], [12, 5], [14, 14]], "#8ac0f0"); P.line(5, 3, 5, 12, "#e8f8ff");
  });
  tile("icewallf", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#7ab0e0");
    P.r(0, 0, 16, 3, "#4a7ab8"); P.r(1, 4, 6, 10, "#9ad0f8"); P.r(9, 4, 6, 10, "#9ad0f8"); P.r(2, 5, 1, 7, "#e8f8ff"); P.r(10, 5, 1, 7, "#e8f8ff");
  });
  tile("slippery", { enc: true, slide: true }, (P) => {
    P.r(0, 0, 16, 16, "#d8f4ff");
    P.line(0, 4, 16, 4, "#ffffff"); P.line(0, 11, 16, 11, "#ffffff"); P.p(4, 7, "#a8d8f0"); P.p(12, 14, "#a8d8f0");
  });
  tile("dfloor", { enc: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a2a3a");
    P.r(0, 0, 8, 8, "#4a3448"); P.r(8, 8, 8, 8, "#4a3448"); P.r(0, 15, 16, 1, "#2a1a28"); P.r(15, 0, 1, 16, "#2a1a28");
  });
  tile("dwall", { solid: true }, (P) => brickWall(P, "#5a3a5a", "#2a1a2a"));
  tile("dwtop", { solid: true }, (P) => { P.r(0, 0, 16, 16, "#1a0a1a"); P.r(1, 1, 14, 14, "#2a1a2a"); });
  tile("dcarpet", {}, (P) => { P.r(0, 0, 16, 16, "#6a0a2a"); P.r(0, 0, 2, 16, "#c8a030"); P.r(14, 0, 2, 16, "#c8a030"); P.p(7, 7, "#8a1a3a"); });
  tile("dtorch", { solid: true }, (P) => {
    brickWall(P, "#5a3a5a", "#2a1a2a");
    P.r(7, 8, 2, 5, "#2a1a1a"); P.ell(8, 6, 2, 3, "#c03aff"); P.ell(8, 6.5, 1, 1.5, "#ffc0ff");
  }, (P) => {
    brickWall(P, "#5a3a5a", "#2a1a2a");
    P.r(7, 8, 2, 5, "#2a1a1a"); P.ell(8, 5.5, 2.5, 3, "#a02aff"); P.ell(8, 6, 1, 2, "#ffc0ff");
  });
  tile("dlava", { solid: true, water: true },
    (P) => { P.r(0, 0, 16, 16, "#c8301a"); P.ell(5, 5, 3, 1.5, "#ff8a2a"); P.ell(12, 12, 2, 1, "#ffd040"); },
    (P) => { P.r(0, 0, 16, 16, "#c8301a"); P.ell(6, 6, 3, 1.5, "#ffb030"); P.ell(11, 12, 2, 1, "#ff8a2a"); });
  tile("forestfloor", { enc: true }, (P) => grass(P, 91, "#4a9a3a"));
  tile("bigtree", { solid: true }, (P) => {
    grass(P, 92, "#2a6a2a");
    tree(P, 5, 5, 8, "#2a8a3a"); tree(P, 12, 9, 8, "#3a9a48"); tree(P, 4, 13, 6, "#2a8a3a");
  });
  tile("mushroom", { solid: true }, (P) => {
    grass(P, 93, "#4a9a3a");
    P.r(7, 8, 3, 6, "#f4e8d0"); P.ell(8.5, 7, 6, 4, "#e83a3a"); P.ell(6, 6, 1.5, 1, "#ffffff"); P.ell(11, 6.5, 1.2, 1, "#ffffff");
  });
  tile("void", { solid: true }, (P) => P.r(0, 0, 16, 16, "#000000"));
  tile("dark", { solid: true }, (P) => P.r(0, 0, 16, 16, "#0a0810"));
  tile("altar", { solid: true }, (P) => {
    P.r(0, 0, 16, 16, "#3a2a3a");
    P.r(1, 4, 14, 11, "#8a8aa0"); P.r(1, 4, 14, 2, "#b8b8d0"); P.ell(8, 9, 3, 3, "#ffd040");
  });
  tile("seal", {}, (P, i) => {
    P.r(0, 0, 16, 16, "#3a2a3a");
    P.ring(8, 8, 6, i ? "#ff6af0" : "#c03aff");
    P.ring(8, 8, 3, i ? "#c03aff" : "#ff6af0");
  }, (P, i) => {
    P.r(0, 0, 16, 16, "#3a2a3a");
    P.ring(8, 8, 6, "#ff6af0");
    P.ring(8, 8, 3, "#c03aff");
  });
  tile("healspot", { heal: true }, (P) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    P.ell(8, 8, 7, 6, "#7ae0b0"); P.ell(8, 8, 5, 4, "#c0fff0"); P.r(7, 4, 2, 8, "#ffffff"); P.r(4, 7, 8, 2, "#ffffff");
  }, (P) => {
    P.r(0, 0, 16, 16, "#b8b0a0");
    P.ell(8, 8, 7, 6, "#5ac898"); P.ell(8, 8, 5, 4, "#a0f0e0"); P.r(7, 4, 2, 8, "#ffffff"); P.r(4, 7, 8, 2, "#ffffff");
  });

  // ring は makeP に無いので、ここで足す
  // (P.ring を使うタイルより前に定義済みの関数で描くため、frames() で遅延生成している)

  // ---------------------------------------------------------------- 宝箱など (オブジェクト用)
  const objCache = new Map();
  function obj(name) {
    if (objCache.has(name)) return objCache.get(name);
    let c;
    if (name === "chest" || name === "chestopen") {
      c = paint(16, 16, (P) => {
        P.r(1, 5, 14, 10, "#c8702a"); P.r(1, 5, 14, 1, "#e8904a"); P.r(1, 9, 14, 1, "#ffd040");
        P.r(1, 5, 1, 10, "#ffd040"); P.r(14, 5, 1, 10, "#ffd040");
        if (name === "chest") { P.ell(8, 5, 7, 3.5, "#d8803a"); P.r(1, 4, 14, 2, "#d8803a"); P.r(7, 8, 2, 3, "#ffe060"); }
        else { P.r(2, 2, 12, 4, "#5a2a10"); P.r(1, 0, 14, 3, "#d8803a"); P.ell(8, 6, 4, 1.5, "#ffe060"); }
      }, { outline: true });
    } else if (name === "orbG" || name === "orbR" || name === "orbB") {
      const col = { orbG: "#3ae07a", orbR: "#ff4a4a", orbB: "#4a9aff" }[name];
      c = paint(16, 16, (P) => { P.ball(8, 8, 5.5, 5.5, col); }, { outline: true });
    } else if (name === "shadow") {
      c = paint(16, 6, (P) => { P.ell(8, 3, 6, 2.2, "rgba(0,0,0,0.35)"); });
      // hardAlpha で 0/255 になってしまうので 作り直す
      c = canvasOf(16, 6);
      const g = c.getContext("2d");
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.beginPath(); g.ellipse(8, 3, 6, 2.2, 0, 0, Math.PI * 2); g.fill();
    } else if (name === "ufoship" || name === "ufoship2") {
      c = paint(32, 24, (P) => {
        P.ell(16, 11, 7, 6, "#8ae0ff"); P.ell(14, 9, 2.5, 2, "#ffffff");
        P.ell(16, 15, 15, 5, "#b8c0d8"); P.ell(16, 14, 15, 3.5, "#e0e8f8");
        for (let i = 0; i < 5; i++) P.ell(5 + i * 5.5, 16, 1.5, 1.2, (i + (name === "ufoship2" ? 1 : 0)) % 2 ? "#ffd040" : "#ff6a8a");
        P.ell(16, 20, 6, 2, "#8a90a8");
      }, { outline: true });
    } else if (name === "sparkle") {
      c = paint(8, 8, (P) => { P.r(3, 0, 2, 8, "#ffffff"); P.r(0, 3, 8, 2, "#ffffff"); P.r(3, 3, 2, 2, "#ffe060"); });
    }
    objCache.set(name, c);
    return c;
  }

  // ================================================================ バトル背景 (256 x 152)
  const BW = 256;
  const BH = 152;
  function sky(g, top, bot, y0 = 0, y1 = BH) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bot);
    g.fillStyle = gr;
    g.fillRect(0, y0, BW, y1 - y0);
  }
  // 横じま (スーファミの グラデーションっぽく 色数を減らす)
  function bands(P, y0, y1, c0, c1, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = y0 + ((y1 - y0) * i) / n;
      const b = y0 + ((y1 - y0) * (i + 1)) / n;
      P.r(0, Math.floor(a), BW, Math.ceil(b - a) + 1, mix(c0, c1, i / (n - 1)));
    }
  }
  function ground(P, y, c0, c1, seed) {
    bands(P, y, BH, c0, c1, 6);
    const R = rng(seed);
    for (let i = 0; i < 90; i++) {
      const yy = y + Math.pow(R(), 1.4) * (BH - y);
      const w = 2 + ((yy - y) / (BH - y)) * 10;
      P.r(R() * BW, yy, w, 1, shade(mix(c0, c1, (yy - y) / (BH - y)), R() < 0.5 ? 0.85 : 1.15));
    }
  }
  const BG = {
    grass(P) {
      bands(P, 0, 70, "#5a9aff", "#c8e8ff", 8);
      P.ell(40, 30, 18, 6, "#ffffff"); P.ell(56, 27, 12, 6, "#ffffff"); P.ell(190, 18, 20, 5, "#ffffff"); P.ell(206, 15, 10, 5, "#ffffff");
      for (let x = -10; x < BW; x += 46) P.ell(x + 20, 72, 34, 16, "#6ab87a");
      for (let x = 0; x < BW; x += 30) P.ell(x + 8, 76, 20, 10, "#4aa05a");
      ground(P, 76, "#6ac850", "#3a8a3a", 1);
    },
    forest(P) {
      bands(P, 0, 80, "#2a6a5a", "#7ac08a", 8);
      const R = rng(7);
      for (let i = 0; i < 9; i++) {
        const x = i * 32 + R() * 10;
        P.r(x + 8, 20, 10, 64, "#4a3020"); P.r(x + 8, 20, 3, 64, "#6a4830");
        P.ell(x + 12, 18 + R() * 10, 22, 18, "#1a5a2a"); P.ell(x + 8, 14 + R() * 8, 14, 10, "#2a7a3a");
      }
      ground(P, 82, "#5a9a3a", "#2a5a2a", 2);
      for (let i = 0; i < 6; i++) { const x = R() * BW; P.ell(x, 90 + R() * 30, 8, 4, "#3a7a2a"); }
    },
    cave(P) {
      bands(P, 0, 90, "#1a1018", "#4a3a40", 6);
      const R = rng(11);
      for (let i = 0; i < 14; i++) { const x = R() * BW; const h = 10 + R() * 30; P.poly([[x - 8, 0], [x, h], [x + 8, 0]], "#2a2028"); }
      for (let i = 0; i < 8; i++) { const x = R() * BW; P.ell(x, 86, 20 + R() * 20, 10 + R() * 10, "#3a3034"); }
      ground(P, 88, "#6a5a50", "#3a3030", 3);
      for (let i = 0; i < 5; i++) { const x = R() * BW; const y = 30 + R() * 40; P.poly([[x, y + 10], [x + 3, y], [x + 6, y + 10]], "#7ae0ff"); }
    },
    mine(P) {
      BG.cave(P);
      for (let x = 0; x < BW; x += 64) { P.r(x + 20, 30, 6, 60, "#8a5a2a"); P.r(x + 4, 28, 40, 6, "#a06a3a"); }
      P.r(0, 112, BW, 3, "#8a8a9a"); P.r(0, 124, BW, 3, "#8a8a9a");
      for (let x = 0; x < BW; x += 10) P.r(x, 110, 4, 19, "#5a3a20");
      P.r(0, 112, BW, 2, "#b8b8c8"); P.r(0, 124, BW, 2, "#b8b8c8");
    },
    snow(P) {
      bands(P, 0, 70, "#7aa8e8", "#e0f0ff", 8);
      P.poly([[0, 70], [40, 20], [90, 70]], "#c8d8f0"); P.poly([[60, 70], [120, 10], [180, 70]], "#d8e4f8"); P.poly([[150, 70], [210, 26], [260, 70]], "#c0d0ec");
      P.poly([[28, 35], [40, 20], [52, 35], [44, 32], [40, 36], [34, 32]], "#ffffff");
      P.poly([[104, 26], [120, 10], [136, 26], [126, 23], [120, 28], [112, 23]], "#ffffff");
      ground(P, 70, "#f4f8ff", "#b8c8e8", 4);
    },
    ice(P) {
      bands(P, 0, 90, "#2a4a8a", "#8ac8f0", 8);
      const R = rng(13);
      for (let i = 0; i < 10; i++) { const x = i * 28 + R() * 8; const h = 40 + R() * 40; P.poly([[x, 90], [x + 10, 90 - h], [x + 20, 90]], "#9ad8f8"); P.line(x + 10, 92 - h, x + 6, 88, "#e8f8ff"); }
      ground(P, 90, "#d8f0ff", "#7ab0e0", 5);
    },
    volcano(P) {
      bands(P, 0, 80, "#3a0a1a", "#c84a2a", 8);
      P.poly([[40, 80], [100, 20], [130, 20], [200, 80]], "#3a2a2a"); P.r(100, 18, 30, 4, "#ff8a2a");
      P.poly([[108, 22], [114, 22], [104, 70], [100, 70]], "#ff6a2a");
      ground(P, 80, "#5a4040", "#2a1a1a", 6);
      const R = rng(17);
      for (let i = 0; i < 6; i++) { const x = R() * BW; P.ell(x, 100 + R() * 40, 14, 3, "#ff5a1a"); P.ell(x, 100 + R() * 40, 6, 1.5, "#ffd040"); }
    },
    castle(P) {
      bands(P, 0, 96, "#1a0a20", "#4a2a4a", 6);
      for (let x = 0; x < BW; x += 48) {
        P.r(x + 16, 0, 18, 96, "#3a2a40"); P.r(x + 16, 0, 4, 96, "#5a4060"); P.r(x + 30, 0, 4, 96, "#2a1a2a");
        P.ell(x + 0, 40, 5, 8, "#c03aff"); P.ell(x, 41, 2, 4, "#ffc0ff");
      }
      ground(P, 96, "#4a3448", "#1a0a1a", 7);
      P.r(96, 96, 64, 56, "#6a0a2a"); P.r(96, 96, 3, 56, "#c8a030"); P.r(157, 96, 3, 56, "#c8a030");
    },
    dragon(P) {
      bands(P, 0, BH, "#0a0010", "#3a0a3a", 10);
      const R = rng(19);
      for (let i = 0; i < 60; i++) P.p(R() * BW, R() * 80, R() < 0.3 ? "#ffffff" : "#a07ad8");
      P.ell(200, 30, 14, 14, "#ff4a6a"); P.ell(196, 26, 12, 12, "#0a0010");
      ground(P, 100, "#3a1a3a", "#0a000a", 8);
      for (let i = 0; i < 4; i++) { const x = 20 + i * 70; P.poly([[x, 100], [x + 6, 60], [x + 12, 100]], "#2a0a2a"); }
    },
    space(P) {
      bands(P, 0, BH, "#000010", "#1a0a3a", 10);
      const R = rng(23);
      for (let i = 0; i < 120; i++) P.p(R() * BW, R() * BH, R() < 0.3 ? "#ffffff" : R() < 0.5 ? "#ffd0f0" : "#8ab0ff");
      P.ell(60, 110, 50, 50, "#1a1a4a"); P.ell(50, 100, 46, 46, "#2a2a6a");
    },
    town(P) {
      BG.grass(P);
      for (let x = 0; x < BW; x += 52) { P.r(x + 4, 50, 30, 26, "#f4e0b8"); P.poly([[x, 52], [x + 19, 34], [x + 38, 52]], "#c8402a"); P.r(x + 15, 62, 8, 14, "#7a4a2a"); }
    },
  };
  const bgCache = new Map();
  function battleBg(name) {
    if (!bgCache.has(name)) {
      const c = canvasOf(BW, BH);
      const P = G.makeP(c);
      (BG[name] || BG.grass)(P, c.getContext("2d"));
      bgCache.set(name, c);
    }
    return bgCache.get(name);
  }

  Q.tiles = { TS, T, frames, obj, battleBg, BG_W: BW, BG_H: BH };
})();
