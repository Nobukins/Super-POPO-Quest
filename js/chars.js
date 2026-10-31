// キャラクターのドット絵: フィールド用 (16x22, 4 方向 × 歩き) と バトル用 (横向き・ポーズつき)
(() => {
  "use strict";
  const G = Q.gfx;
  const { paint, shade, OUT, cached } = G;

  // ---------------------------------------------------------------- 見た目の定義
  // style: short / cap / witch / mohawk / bald / long / bun / crown / helmet / hachimaki / hood / spiky / twin
  const LOOKS = {
    yuta: { skin: "#f6c8a0", hair: "#2a1a10", style: "cap", cap: "#e8343a", shirt: "#ff9a2a", stripe: "#ffe070", pants: "#3a5ab0", shoes: "#ffffff", weapon: "bat" },
    meru: { skin: "#fbd8c0", hair: "#ff8a3a", style: "witch", hat: "#2a5aa8", band: "#ffd040", shirt: "#9a4ad8", pants: "#9a4ad8", shoes: "#7a3a1a", cape: "#e83a5a", skirt: true, weapon: "wand" },
    gantetsu: { skin: "#e8a070", hair: "#2a1a1a", style: "mohawk", beard: "#3a2216", shirt: "#e8a070", pants: "#4a3a6a", shoes: "#5a3a2a", belt: "#ffd030", big: true, weapon: "hammer", bare: true },
    elder: { skin: "#f0c8a0", hair: "#f4f4f4", style: "bald", beard: "#f4f4f4", shirt: "#5a8a3a", pants: "#5a8a3a", shoes: "#6a4a2a", robe: true, staff: true },
    king: { skin: "#f6c8a0", hair: "#c8a080", style: "crown", beard: "#e8e0d0", shirt: "#c8283a", pants: "#c8283a", shoes: "#3a2a1a", robe: true, cape: "#e8e0f0" },
    princess: { skin: "#fbd8c0", hair: "#ffd860", style: "long", tiara: true, shirt: "#ff8ac8", pants: "#ff8ac8", shoes: "#ffffff", skirt: true, robe: true },
    soldier: { skin: "#f0c090", hair: "#5a3a1a", style: "helmet", shirt: "#3a5ad8", pants: "#5a5a7a", shoes: "#3a2a2a", spear: true },
    man: { skin: "#f0c090", hair: "#5a3a1a", style: "short", shirt: "#3a9a5a", pants: "#6a4a2a", shoes: "#3a2a1a" },
    man2: { skin: "#d8a070", hair: "#1a1a1a", style: "spiky", shirt: "#e8c040", pants: "#3a4a8a", shoes: "#3a2a1a" },
    woman: { skin: "#fbd0b0", hair: "#a04a2a", style: "long", shirt: "#e85a7a", pants: "#e85a7a", shoes: "#6a3a2a", skirt: true },
    woman2: { skin: "#f0c8a0", hair: "#3a2a5a", style: "bun", shirt: "#4aa8c8", pants: "#4aa8c8", shoes: "#3a2a2a", skirt: true, apron: "#ffffff" },
    granny: { skin: "#f0c8a0", hair: "#d8d8e0", style: "bun", shirt: "#8a5aa8", pants: "#8a5aa8", shoes: "#3a2a2a", skirt: true },
    kid: { skin: "#f6c8a0", hair: "#6a3a1a", style: "short", shirt: "#ff6a3a", pants: "#3a6ad8", shoes: "#ffffff", small: true },
    girl: { skin: "#f6c8a0", hair: "#3a1a0a", style: "twin", shirt: "#ffd040", pants: "#ffd040", shoes: "#e83a3a", skirt: true, small: true },
    uomasa: { skin: "#e8b080", hair: "#2a2a2a", style: "hachimaki", band: "#ffffff", shirt: "#ffffff", apron: "#3a6ad8", pants: "#3a4a6a", shoes: "#2a2a2a", beard: null },
    innkeep: { skin: "#f0c090", hair: "#8a5a2a", style: "short", shirt: "#ffffff", apron: "#7a4a2a", pants: "#4a3a2a", shoes: "#3a2a1a", mustache: true },
    priest: { skin: "#f0c8a0", hair: "#e8e0c0", style: "hood", hood: "#f4f4ff", shirt: "#f4f4ff", pants: "#f4f4ff", shoes: "#c8a040", robe: true },
    miner: { skin: "#d8a070", hair: "#3a2a1a", style: "helmet", helm: "#ffc020", shirt: "#8a6a4a", pants: "#4a4a5a", shoes: "#2a2a2a", mustache: true },
    snowman: { skin: "#f6d0b0", hair: "#e8f0ff", style: "hood", hood: "#e8f4ff", shirt: "#3a7ad8", pants: "#2a3a6a", shoes: "#6a4a2a" },
    fubukina: { skin: "#f4e0f0", hair: "#7ad0ff", style: "witch", hat: "#1a2a6a", band: "#7affff", shirt: "#3a5ad8", pants: "#3a5ad8", shoes: "#e8f4ff", skirt: true, robe: true, cape: "#ffffff" },
    garm: { skin: "#e8b890", hair: "#3a3a58", style: "helmet", helm: "#3a3a58", horns: "#d8a830", shirt: "#3a3a58", pants: "#3a3a58", shoes: "#2a2a3a", cape: "#8a1a2a" },
    yamisoldier: { skin: "#4ab06a", hair: "#8a5a3a", style: "helmet", helm: "#8a5a3a", shirt: "#8a5a3a", pants: "#4ab06a", shoes: "#2a2a2a", spear: true },
  };

  // ---------------------------------------------------------------- フィールド用 16x22 (dir: 0 下 1 左 2 右 3 上, f: 0 立ち 1/2 歩き)
  function fieldPerson(L, dir, f) {
    const big = !!L.big;
    const small = !!L.small;
    return paint(16, 22, (P) => {
      const yo = small ? 2 : 0; // こどもは少し小さく
      const bob = f ? -1 : 0;
      const side = dir === 1 || dir === 2;
      // ---- あし
      const legC = L.pants;
      const shoe = L.shoes;
      if (!L.robe) {
        if (side) {
          const a = f === 1 ? 2 : f === 2 ? -2 : 0;
          P.r(7 + a, 17 + bob, 3, 3, shade(legC, 0.8)); P.r(6 + a, 20 + bob + 0, 4, 2, shade(shoe, 0.8));
          P.r(7 - a, 17 + bob, 3, 3, legC); P.r(6 - a, 20 + bob, 4, 2, shoe);
        } else {
          const l = f === 1 ? -1 : 0;
          const r = f === 2 ? -1 : 0;
          P.r(5, 17 + bob, 3, 3 + l, legC); P.r(5, 20 + bob + l, 3, 2, shoe);
          P.r(9, 17 + bob, 3, 3 + r, legC); P.r(9, 20 + bob + r, 3, 2, shoe);
        }
      } else {
        P.poly([[3.5, 14 + bob], [12.5, 14 + bob], [13.5, 21], [2.5, 21]], L.pants);
        P.r(3, 20, 10, 2, shade(L.pants, 0.75));
        if (f) P.r(f === 1 ? 4 : 9, 21, 3, 1, shoe);
      }
      // ---- からだ
      const bw = big ? 12 : 8;
      const bx = 8 - bw / 2;
      const by = 11 + yo + bob;
      const bh = big ? 7 : 6 - yo / 2;
      if (L.cape && dir !== 0) P.r(bx - 1, by, bw + 2, bh + 2, L.cape);
      P.r(bx, by, bw, bh, L.shirt);
      if (L.skirt && !L.robe) P.poly([[bx - 1, by + bh], [bx + bw + 1, by + bh], [bx + bw, by + bh - 3], [bx, by + bh - 3]], L.pants);
      if (L.stripe && dir !== 3) P.r(bx, by + 2, bw, 1, L.stripe);
      if (L.apron && dir !== 3) P.r(bx + 1, by + 1, bw - 2, bh + 1, L.apron);
      if (L.belt) P.r(bx, by + bh - 2, bw, 2, L.belt);
      if (L.cape && dir === 0) { P.r(bx - 1, by, 2, bh, L.cape); P.r(bx + bw - 1, by, 2, bh, L.cape); }
      // ---- うで
      const armC = L.bare ? L.skin : L.shirt;
      const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
      if (!side) {
        P.r(bx - 2, by + 1 + sw, 2, 4, shade(armC, 0.9)); P.p(bx - 2, by + 5 + sw, L.skin);
        P.r(bx + bw, by + 1 - sw, 2, 4, shade(armC, 0.9)); P.p(bx + bw + 1, by + 5 - sw, L.skin);
      } else {
        const ax = dir === 1 ? 8 + sw : 7 - sw;
        P.r(ax, by + 1, 2, 4, shade(armC, 0.85)); P.p(ax, by + 5, L.skin);
      }
      if (L.staff) { const sx = dir === 1 ? 2 : 13; P.r(sx, 6 + bob, 1, 16, "#8a5a2a"); P.r(sx - 1, 5 + bob, 3, 2, "#a07040"); }
      if (L.spear) { const sx = dir === 1 ? 2 : 13; P.r(sx, 3 + bob, 1, 19, "#8a6a4a"); P.poly([[sx - 1, 4 + bob], [sx + 0.5, 0 + bob], [sx + 2, 4 + bob]], "#d8e0f0"); }
      // ---- あたま
      const hy = 6.5 + yo + bob;
      const hr = big ? 6 : 5.5;
      P.ell(8, hy, hr + 0.5, hr, L.skin);
      if (big) P.ell(8, hy + 1, hr, hr - 0.5, L.skin);
      const hair = L.hair;
      const st = L.style;
      // 顔
      const eyeY = Math.round(hy + 1);
      if (dir === 0) {
        P.r(5, eyeY, 1, 2, OUT); P.r(10, eyeY, 1, 2, OUT);
        if (!L.beard && !L.mustache) P.p(4, eyeY + 2, "#ff9a9a"), P.p(11, eyeY + 2, "#ff9a9a");
      } else if (side) {
        const ex = dir === 2 ? 11 : 4;
        P.r(ex, eyeY, 1, 2, OUT);
        P.p(dir === 2 ? 13 : 2, eyeY + 1, L.skin);
      }
      if (L.beard && dir !== 3) {
        if (dir === 0) P.ell(8, hy + 4, 4.5, 2.6, L.beard);
        else P.ell(dir === 2 ? 10 : 6, hy + 4, 3.5, 2.5, L.beard);
      }
      if (L.mustache && dir !== 3) P.r(dir === 2 ? 9 : dir === 1 ? 4 : 6, eyeY + 2, dir === 0 ? 4 : 3, 1, hair);
      // 髪型
      const top = hy - hr;
      const back = dir === 2 ? 0 : dir === 1 ? 1 : -1; // 横向きのとき後頭部の側
      const hairCap = (h) => { P.ell(8, top + h / 2 + 1, hr + 0.5, h / 2 + 1, hair); };
      if (dir === 3 && st !== "bald" && st !== "witch" && st !== "helmet" && st !== "hood") P.ell(8, hy, hr + 0.5, hr, hair);
      if (st === "short" || st === "spiky" || st === "twin" || st === "long" || st === "bun" || st === "crown" || st === "hachimaki") {
        hairCap(4);
        if (side) P.r(back === 0 ? 2 : 10, top + 2, 4, 5, hair);
        if (st === "spiky") { P.poly([[3, top + 3], [4, top - 2], [7, top + 1], [8, top - 3], [10, top + 1], [12, top - 2], [13, top + 3]], hair); }
        if (st === "long") { P.r(2, hy - 1, 3, 9, hair); P.r(11, hy - 1, 3, 9, hair); if (dir === 3) P.r(3, hy, 10, 9, hair); }
        if (st === "twin") { P.ell(2, hy + 1, 2, 3, hair); P.ell(14, hy + 1, 2, 3, hair); }
        if (st === "bun") P.ell(8, top - 1, 3, 2.2, hair);
        if (st === "hachimaki") { P.r(2, top + 3, 12, 2, L.band); if (dir !== 0) P.r(back === 0 ? 1 : 13, top + 4, 2, 3, L.band); }
      }
      if (st === "cap") {
        hairCap(4);
        P.ell(8, top + 2, hr + 0.5, 3, L.cap);
        P.r(2, top + 3, 12, 2, L.cap);
        if (dir === 0) P.r(4, top + 4, 8, 1, shade(L.cap, 0.7));
        if (dir === 2) P.r(11, top + 4, 4, 1, shade(L.cap, 0.7));
        if (dir === 1) P.r(1, top + 4, 4, 1, shade(L.cap, 0.7));
        if (dir === 3) P.r(5, top + 5, 6, 3, hair);
      }
      if (st === "mohawk") {
        P.r(6, top - 3, 4, 5, hair);
        if (dir === 3) P.r(6, top - 3, 4, 10, hair);
      }
      if (st === "crown") {
        P.r(3, top - 1, 10, 3, "#ffd030");
        P.p(3, top - 2, "#ffd030"); P.p(8, top - 3, "#ffd030"); P.p(7, top - 2, "#ffd030"); P.p(9, top - 2, "#ffd030"); P.p(12, top - 2, "#ffd030");
        P.p(8, top, "#ff3a5a");
      }
      if (L.tiara) { P.r(4, top + 1, 8, 1, "#ffe060"); P.p(8, top, "#7affff"); }
      if (st === "helmet") {
        P.ell(8, top + 3, hr + 1, 4, L.helm || "#a0a8b8");
        P.r(2, top + 4, 12, 2, L.helm || "#a0a8b8");
        if (dir === 3) P.ell(8, hy, hr + 0.5, hr, L.helm || "#a0a8b8");
        if (L.horns) { P.poly([[3, top + 2], [0, top - 4], [5, top + 1]], L.horns); P.poly([[13, top + 2], [16, top - 4], [11, top + 1]], L.horns); }
        else P.r(7, top - 2, 2, 3, L.helm ? "#ffffff" : "#e83a3a");
      }
      if (st === "hood") {
        P.ell(8, hy - 1, hr + 1.5, hr + 0.5, L.hood);
        if (dir === 0) P.ell(8, hy + 1, hr - 1.5, hr - 1.5, L.skin), P.r(5, eyeY, 1, 2, OUT), P.r(10, eyeY, 1, 2, OUT);
        if (side) P.ell(dir === 2 ? 10 : 6, hy + 1, hr - 2.5, hr - 2, L.skin), P.r(dir === 2 ? 11 : 4, eyeY, 1, 2, OUT);
      }
      if (st === "witch") {
        // おさげ
        P.ell(3, hy + 4, 1.6, 3, hair); P.ell(13, hy + 4, 1.6, 3, hair);
        hairCap(3);
        if (dir === 3) P.ell(8, hy, hr + 0.5, hr, hair);
        P.ell(8, top + 3, 8, 2, L.hat);
        P.poly([[3, top + 3], [7, top - 5], [11, top - 7], [10, top - 4], [13, top + 3]], L.hat);
        P.r(4, top + 1, 8, 2, L.band);
        if (dir !== 3) P.p(8, top + 1, "#ffffff");
      }
    }, { outline: true, shade: 2, light: 0 });
  }

  // ポポ (フィールド用): ピンクの ひとつめ。うしろすがたは アンテナと まるい せなか
  function fieldPopo(dir, f, pal = {}) {
    const pink = pal.body || "#ff69b4";
    const dark = pal.dark || "#d6468c";
    const ant = pal.ant || "#8c3cc8";
    return paint(16, 22, (P) => {
      const bob = f ? -1 : 0;
      // あし (たこあし 4 本)
      const step = f === 1 ? 1 : f === 2 ? -1 : 0;
      for (let i = 0; i < 4; i++) {
        const lx = 3 + i * 3;
        const up = (i % 2 === 0 ? step : -step) > 0 ? 1 : 0;
        P.r(lx, 17 - up, 2, 4 - (dir === 1 || dir === 2 ? 0 : 0), i >= 2 ? dark : pink);
      }
      // からだ
      P.ell(8, 12 + bob, 7, 6.5, pink);
      P.ell(8, 16 + bob, 6.5, 3.5, pink);
      P.ell(11, 15 + bob, 3, 3, dark);
      // アンテナ
      const ax = dir === 1 ? -1 : dir === 2 ? 1 : 0;
      P.r(5 + ax, 2 + bob, 1, 5, OUT); P.r(10 + ax, 2 + bob, 1, 5, OUT);
      P.ell(5.5 + ax, 2 + bob, 1.8, 1.8, ant); P.ell(10.5 + ax, 2 + bob, 1.8, 1.8, ant);
      if (dir === 3) return;
      // 目
      const ex = dir === 1 ? 5.5 : dir === 2 ? 10.5 : 8;
      P.ell(ex, 10.5 + bob, 3.6, 3.6, OUT);
      P.ell(ex, 10.5 + bob, 2.8, 2.8, "#ffffff");
      P.r(Math.round(ex + (dir === 1 ? -1.5 : dir === 2 ? 0.5 : -0.5)), 9 + bob, 1, 3, OUT);
      if (dir === 0) P.r(7, 15 + bob, 2, 2, "#eb4632");
    }, { outline: true, shade: 2, light: 0 });
  }

  // ねこ (フィールドのどうぶつ)
  function fieldCat(dir, f, col = "#f0a040") {
    return paint(16, 16, (P) => {
      const bob = f ? -1 : 0;
      P.ell(8, 11 + bob, 5, 3.5, col);
      P.r(4, 13, 2, 2 + (f === 1 ? -1 : 0), col); P.r(10, 13, 2, 2 + (f === 2 ? -1 : 0), col);
      const hx = dir === 1 ? 4 : dir === 2 ? 12 : 8;
      P.ell(hx, 7 + bob, 4, 3.5, col);
      P.poly([[hx - 4, 6 + bob], [hx - 3, 1 + bob], [hx - 1, 4 + bob]], col);
      P.poly([[hx + 4, 6 + bob], [hx + 3, 1 + bob], [hx + 1, 4 + bob]], col);
      const tx = dir === 1 ? 13 : dir === 2 ? 3 : 13;
      P.line(tx, 11 + bob, tx + (dir === 1 ? 2 : -2), 6 + bob, col, 2);
      if (dir !== 3) { P.p(hx - 2, 7 + bob, OUT); P.p(hx + 1, 7 + bob, OUT); }
    }, { outline: true, shade: 1, light: 0 });
  }

  const FIELD_CACHE = new Map();
  function field(who, dir, f) {
    const key = who + "|" + dir + "|" + f;
    if (!FIELD_CACHE.has(key)) {
      let c;
      if (who === "popo") c = fieldPopo(dir, f);
      else if (who === "yamipopo") c = fieldPopo(dir, f, { body: "#4a2a6a", dark: "#2a1440", ant: "#ff2a3a" });
      else if (who === "cat") c = fieldCat(dir, f);
      else if (who === "cat2") c = fieldCat(dir, f, "#5a5a6a");
      else if (who === "cat3") c = fieldCat(dir, f, "#f4f4f4");
      else c = fieldPerson(LOOKS[who] || LOOKS.man, dir, f);
      FIELD_CACHE.set(key, c);
    }
    return FIELD_CACHE.get(key);
  }

  // ---------------------------------------------------------------- バトル用 (左向き)
  // pose: idle / step / atk / cast / hurt / ko / win / guard
  function battler(L, pose, f) {
    const W = L.big ? 40 : 32;
    const H = L.big ? 40 : 34;
    return paint(W, H, (P) => {
      const k = L.big ? 1.25 : 1;
      const bx = L.big ? 4 : 2;
      const base = H - 2;
      const sk = L.skin;
      if (pose === "ko") {
        // たおれている (よこに ねている)
        const y = base - 6;
        P.r(bx + 10, y + 1, 14 * k, 5, L.shirt);
        P.r(bx + 22 * k, y + 2, 7, 4, L.pants);
        P.ell(bx + 7, y + 2, 6 * k, 4.5, sk);
        P.ell(bx + 5, y, 5 * k, 3, L.style === "cap" ? L.cap : L.style === "witch" ? L.hat : L.hair);
        P.r(bx + 6, y + 3, 2, 1, OUT); P.p(bx + 5, y + 2, OUT); P.p(bx + 7, y + 2, OUT);
        return;
      }
      const lean = pose === "atk" ? -4 : pose === "hurt" ? 3 : 0;
      const crouch = pose === "guard" || pose === "hurt" ? 2 : 0;
      const jump = pose === "win" && f % 2 ? -3 : 0;
      const step = pose === "step" ? (f % 2 ? 1 : -1) : 0;
      const legX = bx + 12 * k;
      const y0 = base + jump;
      // ---- うしろの うで (武器を もつ手)
      const hipY = y0 - 10 * k + crouch;
      const shY = y0 - 17 * k + crouch;
      const cx = legX + 3 + lean * 0.6;
      // ---- マント
      if (L.cape) P.poly([[cx + 1, shY], [cx + 9 * k, y0 - 2], [cx + 2, y0 - 2]], L.cape);
      // ---- あし
      if (pose === "atk") {
        P.r(legX - 5, hipY, 4 * k, 9 * k, L.pants); P.r(legX - 6, y0 - 2, 5 * k, 2, L.shoes);
        P.r(legX + 5, hipY, 4 * k, 9 * k, shade(L.pants, 0.8)); P.r(legX + 5, y0 - 2, 5 * k, 2, L.shoes);
      } else {
        P.r(legX + step, hipY, 4 * k, 10 * k - crouch, shade(L.pants, 0.8)); P.r(legX - 1 + step, y0 - 2, 5 * k, 2, L.shoes);
        P.r(legX + 4 - step, hipY, 4 * k, 10 * k - crouch, L.pants); P.r(legX + 3 - step, y0 - 2, 5 * k, 2, L.shoes);
      }
      // ---- どう
      if (L.robe || L.skirt) P.poly([[cx - 6 * k, hipY + 6], [cx + 7 * k, hipY + 6], [cx + 5 * k, shY], [cx - 4 * k, shY]], L.skirt ? L.pants : L.shirt);
      P.r(cx - 5 * k, shY, 10 * k, 9 * k, L.shirt);
      if (L.big) P.ell(cx - 1, shY + 6, 7, 6, L.shirt);
      if (L.stripe) P.r(cx - 5 * k, shY + 3, 10 * k, 1, L.stripe);
      if (L.belt) P.r(cx - 6 * k, hipY - 2, 12 * k, 3, L.belt);
      // ---- あたま
      const hx = cx - 2 + (pose === "atk" ? -2 : 0);
      const hy = shY - 6 * k + (pose === "hurt" ? 1 : 0);
      const hr = 6.5 * k;
      P.ell(hx, hy, hr, hr - 0.5, sk);
      const hair = L.hair;
      // 顔 (左向き)
      const eyeX = Math.round(hx - hr + 3);
      if (pose === "hurt") { P.line(eyeX - 1, hy - 1, eyeX + 1, hy + 1, OUT); P.line(eyeX - 1, hy + 1, eyeX + 1, hy - 1, OUT); }
      else if (pose === "win" || pose === "cast") { P.r(eyeX - 1, hy, 3, 1, OUT); P.p(eyeX - 1, hy - 1, OUT); }
      else { P.r(eyeX, hy - 1, 2, 3, OUT); P.p(eyeX, hy - 1, "#ffffff"); }
      if (L.beard) P.ell(hx - 2, hy + 4, 5 * k, 3.5, L.beard);
      else {
        P.p(eyeX + 2, hy + 2, "#ff9a9a");
        if (pose === "atk" || pose === "win") P.r(eyeX - 1, hy + 3, 3, 2, "#a02030");
        else P.r(eyeX - 1, hy + 3, 2, 1, "#a02030");
      }
      const top = hy - hr + 0.5;
      if (L.style === "cap") {
        P.ell(hx + 1, top + 3, hr, 3.5, hair);
        P.r(hx + 1, top + 3, hr, 6, hair);
        P.ell(hx, top + 2, hr, 3, L.cap);
        P.r(hx - hr - 4, top + 3, 8, 2, L.cap);
      } else if (L.style === "witch") {
        P.ell(hx + 1, top + 3, hr, 3.5, hair);
        P.ell(hx + hr - 1, hy + 4, 2.5, 4, hair);
        P.ell(hx, top + 3, hr + 4, 2.4, L.hat);
        P.poly([[hx - hr + 1, top + 3], [hx + 1, top - 7], [hx + 8, top - 11], [hx + 6, top - 6], [hx + hr, top + 3]], L.hat);
        P.r(hx - hr + 1, top + 1, hr * 2 - 2, 2, L.band);
        P.p(hx, top - 3, "#ffffff");
      } else if (L.style === "mohawk") {
        P.r(hx - 2, top - 4, 6, 6, hair);
        P.ell(hx + hr - 2, hy, 2, 2.5, sk);
      } else {
        P.ell(hx + 1, top + 3, hr, 3.5, hair);
        P.r(hx + 1, top + 3, hr, 6, hair);
      }
      // ---- まえの うで と 武器
      const armC = L.bare ? sk : L.shirt;
      const sx = cx - 3;
      const sy = shY + 2;
      let hand;
      if (pose === "atk") hand = [sx - 10 * k, sy + 1];
      else if (pose === "cast") hand = [sx - 4, sy - 10 * k];
      else if (pose === "win") hand = [sx - 1, sy - 11 * k];
      else if (pose === "guard") hand = [sx - 6, sy + 1];
      else if (pose === "hurt") hand = [sx + 4, sy + 6];
      else hand = [sx - 4, sy + 6];
      P.line(sx, sy, hand[0], hand[1], armC, 3 * k);
      P.ell(hand[0], hand[1], 1.8 * k, 1.8 * k, sk);
      const wp = L.weapon;
      if (wp === "bat") {
        let tip;
        if (pose === "atk") tip = [hand[0] - 13, hand[1] + 4];
        else if (pose === "win" || pose === "cast") tip = [hand[0] + 3, hand[1] - 12];
        else tip = [hand[0] + 7, hand[1] - 10];
        P.worm([hand, tip], "#c88a4a", 2, 4);
      } else if (wp === "wand") {
        const tip = pose === "atk" ? [hand[0] - 9, hand[1] - 3] : pose === "cast" || pose === "win" ? [hand[0] - 1, hand[1] - 10] : [hand[0] - 2, hand[1] - 9];
        P.line(hand[0], hand[1] + 2, tip[0], tip[1], "#8a5a2a", 1);
        P.ell(tip[0], tip[1], 2.2, 2.2, "#ff6ad8");
      } else if (wp === "hammer") {
        const tip = pose === "atk" ? [hand[0] - 12, hand[1] + 6] : pose === "win" || pose === "cast" ? [hand[0] + 2, hand[1] - 13] : [hand[0] + 6, hand[1] - 12];
        P.line(hand[0], hand[1], tip[0], tip[1], "#8a5a2a", 2);
        const ang = Math.atan2(tip[1] - hand[1], tip[0] - hand[0]);
        const nx = -Math.sin(ang) * 6;
        const ny = Math.cos(ang) * 6;
        P.poly([[tip[0] + nx - Math.cos(ang) * 3, tip[1] + ny - Math.sin(ang) * 3], [tip[0] + nx + Math.cos(ang) * 4, tip[1] + ny + Math.sin(ang) * 4],
          [tip[0] - nx + Math.cos(ang) * 4, tip[1] - ny + Math.sin(ang) * 4], [tip[0] - nx - Math.cos(ang) * 3, tip[1] - ny - Math.sin(ang) * 3]], "#9a9aaa");
      }
      if (L.big) {
        // ガンテツの うでわ
        P.r(hand[0] - 2, hand[1] - 3, 4, 2, "#e83a3a");
      }
    }, { outline: true, shade: 2, light: 1 });
  }

  // ポポの バトル用 (本物のドット絵を そのまま使う)
  function popoFrame(name, pal = null) {
    const POPO = window.POPO_SPRITES;
    return cached("popo|" + name + "|" + JSON.stringify(pal), () => paint(POPO.size, POPO.size, (P) => {
      const cols = POPO.palette.slice();
      if (pal) Object.entries(pal).forEach(([i, c]) => { cols[+i] = c; });
      const rows = POPO.frames[name];
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < POPO.size; x++) {
        const ch = rows[y][x];
        if (ch !== ".") P.p(x, y, cols[+ch]);
      }
    }));
  }
  function popoBattle(pose, f) {
    switch (pose) {
      case "step": return popoFrame(f % 2 ? "walk_left1" : "walk_left2");
      case "atk": return popoFrame("left1");
      case "cast": return popoFrame("jump", { 4: "#ffe040" });
      case "win": return popoFrame(f % 2 ? "jump" : "idle");
      case "hurt": return popoFrame("crouch", { 0: "#ff8ac0" });
      case "guard": return popoFrame("crouch");
      case "ko": return cached("popo|ko", () => {
        const src = popoFrame("crouch", { 0: "#b07a9a", 2: "#8a5a7a", 4: "#6a5a7a" });
        const c = G.canvasOf(32, 32);
        const g = c.getContext("2d");
        g.drawImage(src, 0, 8, 32, 24);
        return c;
      });
      default: return popoFrame("walk_left1");
    }
  }

  const BATTLE_CACHE = new Map();
  function battle(who, pose, f = 0) {
    if (who === "popo") return popoBattle(pose, f);
    const key = who + "|" + pose + "|" + (f % 2);
    if (!BATTLE_CACHE.has(key)) BATTLE_CACHE.set(key, battler(LOOKS[who], pose, f % 2));
    return BATTLE_CACHE.get(key);
  }

  // かおグラフィック (メッセージの となりに 出す 32x32)
  function face(who) {
    return cached("face|" + who, () => {
      if (who === "popo") {
        const src = popoFrame("idle");
        const c = G.canvasOf(32, 32);
        c.getContext("2d").drawImage(src, 0, 2);
        return c;
      }
      // フィールド用の正面を 2 倍に
      const src = field(who, 0, 0);
      const c = G.canvasOf(32, 32);
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, 16, 16, 0, 2, 32, 32);
      return c;
    });
  }

  Q.chars = { LOOKS, field, battle, popoFrame, face };
})();
