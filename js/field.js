// フィールド: マップの表示・あるく・はなす・たからばこ・エンカウント・UFO での そらの たび (モード7 ふう)
(() => {
  "use strict";
  const G = Q.gfx;
  const TL = Q.tiles;
  const TS = 16;
  const W = Q.W;
  const H = Q.H;
  const WALK = 6.5; // マス / びょう
  const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];

  const F = {
    id: null, map: null, w: 0, h: 0,
    p: { x: 0, y: 0, dir: 0, fx: 0, fy: 0, tx: 0, ty: 0, t: 1, moving: false, anim: 0 },
    fol: [], // ついてくる なかま
    npcs: [],
    enc: 20,
    banner: null,
    vehicle: null,
    ufo: { cx: 0, cy: 0, vx: 0, vy: 0, bob: 0, alt: 1 },
    t: 0,
  };
  Q.field = F;

  // ---------------------------------------------------------------- フラグの じょうけん
  function condOK(c) {
    if (!c) return true;
    if (typeof c === "function") return !!c(Q.S.flags);
    if (c === "never") return false;
    if (c[0] === "!") return !Q.S.flags[c.slice(1)];
    return !!Q.S.flags[c];
  }
  F.condOK = condOK;

  // ---------------------------------------------------------------- マップを ひらく
  function load(id, x, y, dir = 0) {
    const map = Q.MAPS[id];
    F.id = id;
    F.map = map;
    F.rows = map.rows;
    F.h = F.rows.length;
    F.w = F.rows[0].length;
    Object.assign(F.p, { x, y, tx: x, ty: y, fx: x, fy: y, t: 1, moving: false, dir });
    F.fol = [];
    for (let i = 1; i < Q.S.party.length; i++) F.fol.push({ x, y, fx: x, fy: y, tx: x, ty: y, dir });
    F.npcs = (map.npcs || []).map((d) => ({ d, x: d.x, y: d.y, fx: d.x, fy: d.y, tx: d.x, ty: d.y, t: 1, dir: d.dir || 0, wt: 1 + Math.random() * 2 }));
    F.enc = 14 + Math.floor(Math.random() * 18);
    Q.S.map = id;
    Q.S.x = x;
    Q.S.y = y;
    Q.S.dir = dir;
    Q.S.placeName = map.name;
    if (map.town) { Q.S.lastTown = { town: id }; Q.S.flags["visit_" + id] = true; }
    if (F.vehicle !== "ufo") playMapMusic();
    F.banner = { text: map.name, t: 0 };
    worldTex = null;
  }
  F.load = load;
  function playMapMusic() {
    const m = F.map;
    if (F.vehicle === "ufo") { Q.snd.music("ufo"); return; }
    let mus = m.music;
    if (F.id === "world") {
      const z = zoneAt(F.p.x, F.p.y);
      if (z && z.enc === "snow") mus = "snow";
      if (z && z.enc === "island") mus = "island";
    }
    Q.snd.music(mus);
  }
  F.playMapMusic = playMapMusic;

  function tileId(x, y) {
    if (y < 0 || y >= F.h || x < 0 || x >= F.w) return F.map.fill;
    const ch = F.rows[y][x];
    let id = F.map.legend[ch];
    if (F.id === "world" && ch === "X" && Q.S.flags.bridgeFixed) id = "bridgev";
    return id;
  }
  F.tileId = tileId;
  function tileOf(x, y) { return TL.T[tileId(x, y)] || TL.T.void; }
  F.tileOf = tileOf;

  function npcAt(x, y) {
    for (const n of F.npcs) {
      if (!condOK(n.d.cond)) continue;
      const w = n.d.w || 1;
      if (y === n.y && x >= n.x && x < n.x + w) return n;
      if (n.t < 1 && y === n.ty && x >= n.tx && x < n.tx + w) return n;
    }
    return null;
  }
  function chestAt(x, y) {
    for (const c of F.map.chests || []) if (c.x === x && c.y === y) return c;
    return null;
  }
  function ufoAt(x, y) { return F.id === "world" && Q.S.ufo && !F.vehicle && Q.S.ufoPos && Q.S.ufoPos[0] === x && Q.S.ufoPos[1] === y; }
  function blocked(x, y, who) {
    const out = y < 0 || y >= F.h || x < 0 || x >= F.w;
    if (out) return !F.map.exit || who !== "player";
    if (tileOf(x, y).solid) return true;
    if (npcAt(x, y)) return true;
    if (chestAt(x, y)) return true;
    if (who !== "player" && F.p.x === x && F.p.y === y) return true;
    if (who !== "player" && F.p.moving && F.p.tx === x && F.p.ty === y) return true;
    return false;
  }
  F.blocked = blocked;

  function zoneAt(x, y) {
    for (const z of F.map.zones || []) if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z;
    return null;
  }

  // ---------------------------------------------------------------- 更新
  F.update = function (dt) {
    F.t += dt;
    if (F.banner) { F.banner.t += dt; if (F.banner.t > 2.6) F.banner = null; }
    if (F.vehicle === "ufo") { updateUfo(dt); return; }
    const p = F.p;
    // あるいている途中
    if (p.moving) {
      p.t = Math.min(1, p.t + dt * WALK * (p.slide ? 1.6 : 1));
      p.anim += dt * WALK;
      p.fx = p.x + (p.tx - p.x) * p.t;
      p.fy = p.y + (p.ty - p.y) * p.t;
      for (const f of F.fol) { f.fx = f.x + (f.tx - f.x) * p.t; f.fy = f.y + (f.ty - f.y) * p.t; }
      if (p.t >= 1) arrive();
    }
    updateNpcs(dt);
    if (p.moving || Q.busy() || Q.wasBusy) return;
    if (!Q.scene || Q.scene !== F) return;
    // メニュー
    if (Q.In.pressed("b") || Q.In.pressed("menu")) {
      if (!F.map.noMenu) Q.runEvent(Q.menu.fieldMenu());
      return;
    }
    if (Q.In.pressed("a")) { interact(); return; }
    for (let d = 0; d < 4; d++) {
      const key = ["down", "left", "right", "up"][d];
      if (Q.In.held(key)) { tryMove(d); break; }
    }
  };

  function tryMove(d, slide = false) {
    const p = F.p;
    p.dir = d;
    const nx = p.x + DIRS[d][0];
    const ny = p.y + DIRS[d][1];
    if (ufoAt(nx, ny)) { Q.runEvent(boardUfo()); return; }
    if (blocked(nx, ny, "player")) {
      if (!slide && (!p.bumpT || F.t - p.bumpT > 0.3)) { p.bumpT = F.t; Q.snd.play("bump"); }
      p.slide = false;
      return false;
    }
    p.tx = nx;
    p.ty = ny;
    p.t = 0;
    p.moving = true;
    p.slide = slide;
    // なかまは ひとつ まえの ひとの いた場所へ
    for (let i = F.fol.length - 1; i >= 0; i--) {
      const f = F.fol[i];
      const lead = i === 0 ? p : F.fol[i - 1];
      f.x = Math.round(f.fx); f.y = Math.round(f.fy);
      f.tx = lead.x; f.ty = lead.y;
      const ddx = f.tx - f.x;
      const ddy = f.ty - f.y;
      if (ddx || ddy) f.dir = ddy > 0 ? 0 : ddy < 0 ? 3 : ddx < 0 ? 1 : 2;
    }
    return true;
  }

  function arrive() {
    const p = F.p;
    p.x = p.tx;
    p.y = p.ty;
    p.moving = false;
    for (const f of F.fol) { f.x = f.tx; f.y = f.ty; f.fx = f.x; f.fy = f.y; }
    Q.S.x = p.x;
    Q.S.y = p.y;
    Q.S.dir = p.dir;
    Q.S.steps++;
    // マップの そとへ
    if (p.x < 0 || p.y < 0 || p.x >= F.w || p.y >= F.h) {
      const ex = F.map.exit;
      Q.runEvent(F.transfer(ex.to, ex.x, ex.y, p.dir === 3 ? 3 : 0));
      return;
    }
    // ワープ
    for (const wp of F.map.warps || []) {
      if (wp.x === p.x && wp.y === p.y) {
        if (wp.cond && !condOK(wp.cond)) { if (wp.deny) Q.runEvent(Q.EV[wp.deny]()); return; }
        const tile = tileId(p.x, p.y);
        if (tile === "stairsdown" || tile === "stairsup") Q.snd.play("stairs");
        else Q.snd.play("door");
        Q.runEvent(F.transfer(wp.to, wp.tx, wp.ty, wp.dir ?? p.dir));
        return;
      }
    }
    // イベントの マス
    for (const tr of F.map.triggers || []) {
      if (tr.x === p.x && tr.y === p.y && condOK(tr.cond)) { Q.runEvent(Q.EV[tr.ev]()); return; }
    }
    const tile = tileOf(p.x, p.y);
    if (tile.heal) { Q.runEvent(Q.EV.ev_healspot()); return; }
    if (tile.dmg) {
      for (const c of Q.party()) if (c.hp > 1) c.hp = Math.max(1, c.hp - 1);
      Q.flash(0.08, "#a040ff");
    }
    // こおりの ゆか: すべる
    if (tile.slide) {
      if (tryMove(p.dir, true)) return;
    }
    p.slide = false;
    if (F.id === "world") playMapMusic();
    // エンカウント
    checkEncounter(tile);
  }

  function checkEncounter(tile) {
    if (Q.S.flags.noenc) return;
    let table = F.map.enc;
    let bg = F.map.bg;
    if (F.id === "world") {
      if (!tile.enc) return;
      const z = zoneAt(F.p.x, F.p.y);
      if (!z) return;
      table = z.enc;
      bg = z.bg;
      const tid = tileId(F.p.x, F.p.y);
      if (tid === "forest") bg = "forest";
      if (tid === "snow" || tid === "snowforest" || tid === "icefield") bg = "snow";
      if (tid === "ash") bg = "volcano";
    } else if (!tile.enc && !F.map.enc) return;
    if (!table) return;
    if (F.map.noEncY != null && F.p.y < F.map.noEncY) return;
    F.enc -= tile.slow ? 1.5 : 1;
    if (F.enc > 0) return;
    F.enc = 16 + Math.floor(Math.random() * 20);
    Q.runEvent(Q.battle.encounter(table, bg));
  }

  function front() {
    const p = F.p;
    return [p.x + DIRS[p.dir][0], p.y + DIRS[p.dir][1]];
  }

  function interact() {
    let [x, y] = front();
    let n = npcAt(x, y);
    if (!n && tileOf(x, y).counter) { x += DIRS[F.p.dir][0]; y += DIRS[F.p.dir][1]; n = npcAt(x, y); }
    if (n) {
      if (!n.d.obj && !n.d.art && !n.d.tileObj && !n.d.sign) n.dir = [3, 2, 1, 0][F.p.dir];
      const talk = n.d.talk;
      if (!talk) return;
      Q.runEvent(runTalk(talk, n));
      return;
    }
    const c = chestAt(x, y);
    if (c) { Q.runEvent(openChest(c)); return; }
    if (tileOf(x, y).search) { Q.runEvent(searchPot(x, y)); return; }
  }

  function* runTalk(talk, n) {
    if (Array.isArray(talk)) { yield* Q.say(talk.join("\n")); return; }
    if (talk.startsWith("inn:")) { yield* Q.menu.inn(Number(talk.slice(4)), n); return; }
    if (talk.startsWith("shop:")) { yield* Q.menu.shop(talk.slice(5), n); return; }
    if (Q.EV[talk]) { yield* Q.EV[talk](n); return; }
    yield* Q.say(talk);
  }
  F.runTalk = runTalk;

  function* openChest(c) {
    const key = "chest_" + c.id;
    if (Q.S.flags[key]) { yield* Q.say("からっぽだ。"); return; }
    Q.S.flags[key] = true;
    Q.snd.play("chest");
    yield 0.25;
    if (c.gold) {
      Q.S.gold += c.gold;
      yield* Q.say(`たからばこを あけた！\n${c.gold}ゴールドを てにいれた！`);
    } else {
      Q.addItem(c.item);
      Q.snd.jingle("item", Q.snd.current);
      yield* Q.say(`たからばこを あけた！\n${Q.data.ITEMS[c.item].name}を てにいれた！`);
    }
  }
  function* searchPot(x, y) {
    const key = `pot_${F.id}_${x}_${y}`;
    if (Q.S.flags[key]) { yield* Q.say("つぼの なかは からっぽだ。"); return; }
    Q.S.flags[key] = true;
    const item = ["berry", "niboshi", "antidote", "berry"][(x * 7 + y * 3) % 4];
    Q.addItem(item);
    Q.snd.play("chest");
    yield* Q.say(`つぼの なかを しらべた。\n${Q.data.ITEMS[item].name}を みつけた！`);
  }

  function updateNpcs(dt) {
    for (const n of F.npcs) {
      if (n.t < 1) {
        n.t = Math.min(1, n.t + dt * 3.2);
        n.fx = n.x + (n.tx - n.x) * n.t;
        n.fy = n.y + (n.ty - n.y) * n.t;
        if (n.t >= 1) { n.x = n.tx; n.y = n.ty; }
        continue;
      }
      if (n.d.move !== "wander" || Q.busy()) continue;
      n.wt -= dt;
      if (n.wt > 0) continue;
      n.wt = 1.2 + Math.random() * 2.5;
      const d = Math.floor(Math.random() * 4);
      n.dir = d;
      const nx = n.x + DIRS[d][0];
      const ny = n.y + DIRS[d][1];
      if (Math.abs(nx - n.d.x) > 3 || Math.abs(ny - n.d.y) > 3) continue;
      if (nx < 0 || ny < 0 || nx >= F.w || ny >= F.h) continue;
      if (blocked(nx, ny, "npc") || tileOf(nx, ny).door) continue;
      if (F.fol.some((f) => (f.x === nx && f.y === ny) || (f.tx === nx && f.ty === ny))) continue;
      if ((F.map.warps || []).some((w) => w.x === nx && w.y === ny)) continue;
      n.tx = nx; n.ty = ny; n.t = 0;
    }
  }

  // ---------------------------------------------------------------- 移動 (イベントから)
  F.transfer = function* (to, x, y, dir) {
    Q.S.flags._busyWarp = true;
    yield* Q.fadeOut(0.25);
    load(to, x, y, dir);
    yield 0.05;
    yield* Q.fadeIn(0.25);
    delete Q.S.flags._busyWarp;
  };
  // NPC を うごかす (イベント用)
  F.npc = (id) => F.npcs.find((n) => n.d.id === id);
  F.moveNpc = function* (id, steps) {
    const n = F.npc(id);
    if (!n) return;
    for (const d of steps) {
      n.dir = d;
      n.tx = n.x + DIRS[d][0];
      n.ty = n.y + DIRS[d][1];
      n.t = 0;
      yield () => n.t >= 1;
    }
  };
  F.walkPlayer = function* (steps) {
    for (const d of steps) {
      const p = F.p;
      p.dir = d;
      p.tx = p.x + DIRS[d][0];
      p.ty = p.y + DIRS[d][1];
      p.t = 0;
      p.moving = true;
      for (let i = F.fol.length - 1; i >= 0; i--) {
        const f = F.fol[i];
        const lead = i === 0 ? p : F.fol[i - 1];
        f.tx = lead.x; f.ty = lead.y;
        const ddx = f.tx - f.x; const ddy = f.ty - f.y;
        if (ddx || ddy) f.dir = ddy > 0 ? 0 : ddy < 0 ? 3 : ddx < 0 ? 1 : 2;
      }
      yield () => !p.moving;
    }
  };
  F.regroup = () => {
    const p = F.p;
    F.fol = [];
    for (let i = 1; i < Q.S.party.length; i++) F.fol.push({ x: p.x, y: p.y, fx: p.x, fy: p.y, tx: p.x, ty: p.y, dir: p.dir });
  };

  // ---------------------------------------------------------------- UFO
  function* boardUfo() {
    Q.snd.play("ufo");
    F.vehicle = "ufo";
    const [ux, uy] = Q.S.ufoPos;
    F.ufo.cx = ux * TS + 8;
    F.ufo.cy = uy * TS + 8;
    F.ufo.alt = 0;
    Q.snd.music("ufo");
    for (let t = 0; t < 1; t += Q.dt * 1.5) { F.ufo.alt = t; yield; }
    F.ufo.alt = 1;
    if (!Q.S.flags.ufoTip) {
      Q.S.flags.ufoTip = true;
      yield* Q.say("UFOに のった！\nじゅうじキーで そらを とぶ。 A で ちゃくりく、 B で メニュー。");
    }
  }
  function updateUfo(dt) {
    const u = F.ufo;
    u.bob += dt;
    if (Q.busy() || Q.wasBusy || u.alt < 1) return;
    const sp = 120;
    let ax = 0;
    let ay = 0;
    if (Q.In.held("left")) ax -= 1;
    if (Q.In.held("right")) ax += 1;
    if (Q.In.held("up")) ay -= 1;
    if (Q.In.held("down")) ay += 1;
    u.vx += (ax * sp - u.vx) * Math.min(1, dt * 5);
    u.vy += (ay * sp - u.vy) * Math.min(1, dt * 5);
    u.cx = G.clamp(u.cx + u.vx * dt, 8, F.w * TS - 8);
    u.cy = G.clamp(u.cy + u.vy * dt, 8, F.h * TS - 8);
    F.p.x = Math.floor(u.cx / TS);
    F.p.y = Math.floor(u.cy / TS);
    Q.S.x = F.p.x;
    Q.S.y = F.p.y;
    F.p.fx = F.p.x; F.p.fy = F.p.y;
    if (Q.In.pressed("b") || Q.In.pressed("menu")) { Q.runEvent(Q.menu.fieldMenu()); return; }
    if (Q.In.pressed("a")) Q.runEvent(landUfo());
  }
  function landable(x, y) {
    const t = tileOf(x, y);
    if (t.solid) return false;
    return true;
  }
  function* landUfo() {
    const x = F.p.x;
    const y = F.p.y;
    if (!landable(x, y)) { Q.snd.play("buzz"); yield* Q.say("ここには おりられない！", { auto: 0.8 }); return; }
    const u = F.ufo;
    const sx = u.cx;
    const sy = u.cy;
    for (let t = 0; t < 1; t += Q.dt * 1.6) {
      u.alt = 1 - t;
      u.cx = sx + (x * TS + 8 - sx) * t;
      u.cy = sy + (y * TS + 8 - sy) * t;
      yield;
    }
    // となりの あいている マスに おりる
    Q.S.ufoPos = [x, y];
    let px = x;
    let py = y + 1;
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      if (!tileOf(x + dx, y + dy).solid) { px = x + dx; py = y + dy; break; }
    }
    F.vehicle = null;
    Object.assign(F.p, { x: px, y: py, tx: px, ty: py, fx: px, fy: py, moving: false, t: 1, dir: 0 });
    Q.S.x = px;
    Q.S.y = py;
    F.regroup();
    playMapMusic();
    // まちの うえに おりたら そのまま はいる
    for (const wp of F.map.warps || []) {
      if (wp.x === x && wp.y === y && condOK(wp.cond)) { yield* F.transfer(wp.to, wp.tx, wp.ty, wp.dir); return; }
    }
  }

  // ---------------------------------------------------------------- 描画
  function camera() {
    const p = F.p;
    let cx = (p.fx + 0.5) * TS - W / 2;
    let cy = (p.fy + 0.5) * TS - H / 2 - 8;
    // ちいさい へやは まんなかに
    if (F.w * TS <= W) cx = (F.w * TS - W) / 2;
    else if (F.id !== "world") cx = G.clamp(cx, 0, F.w * TS - W);
    if (F.h * TS <= H) cy = (F.h * TS - H) / 2;
    else if (F.id !== "world") cy = G.clamp(cy, 0, F.h * TS - H);
    return [Math.round(cx), Math.round(cy)];
  }
  F.camera = camera;

  function drawTiles(g, cx, cy) {
    const x0 = Math.floor(cx / TS);
    const y0 = Math.floor(cy / TS);
    const af = Math.floor(F.t * 2.5);
    for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) {
      for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
        const id = tileId(tx, ty);
        const fr = TL.frames(id);
        const img = fr[af % fr.length];
        const sx = tx * TS - cx;
        const sy = ty * TS - cy;
        g.drawImage(img, sx, sy);
        // みずべの なみ
        const t = TL.T[id];
        if (t && t.water && F.id === "world") {
          g.fillStyle = (af % 2) ? "#d8f0ff" : "#a8d8ff";
          if (!TL.T[tileId(tx, ty - 1)].water) g.fillRect(sx, sy, TS, 1);
          if (!TL.T[tileId(tx, ty + 1)].water) g.fillRect(sx, sy + TS - 1, TS, 1);
          if (!TL.T[tileId(tx - 1, ty)].water) g.fillRect(sx, sy, 1, TS);
          if (!TL.T[tileId(tx + 1, ty)].water) g.fillRect(sx + TS - 1, sy, 1, TS);
        }
      }
    }
  }

  function walkFrame(moving, anim) {
    if (!moving) return 0;
    return Math.floor(anim * 1.0) % 2 ? 1 : 2;
  }

  F.draw = function (g) {
    if (F.vehicle === "ufo" || (F.id === "world" && F.ufo.alt > 0 && F.vehicle === "ufo")) { drawMode7(g); return; }
    const [cx, cy] = camera();
    drawTiles(g, cx, cy);
    const sprites = [];
    const shadow = TL.obj("shadow");
    // たからばこ
    for (const c of F.map.chests || []) {
      const img = TL.obj(Q.S.flags["chest_" + c.id] ? "chestopen" : "chest");
      sprites.push({ y: c.y * TS, draw: () => g.drawImage(img, c.x * TS - cx, c.y * TS - cy) });
    }
    // UFO (ちじょうに とめてある)
    if (F.id === "world" && Q.S.ufo && Q.S.ufoPos && F.vehicle !== "ufo") {
      const [ux, uy] = Q.S.ufoPos;
      const img = TL.obj(Math.floor(F.t * 4) % 2 ? "ufoship" : "ufoship2");
      sprites.push({ y: uy * TS, draw: () => g.drawImage(img, ux * TS - cx - 8, uy * TS - cy - 8 + Math.round(Math.sin(F.t * 3))) });
    }
    // NPC
    for (const n of F.npcs) {
      if (!condOK(n.d.cond)) continue;
      const d = n.d;
      const sx = Math.round(n.fx * TS - cx);
      const sy = Math.round(n.fy * TS - cy);
      if (d.sign) continue;
      sprites.push({
        y: n.fy * TS,
        draw: () => {
          if (d.tileObj) { g.drawImage(TL.frames(d.tileObj)[0], sx, sy); return; }
          if (d.obj) {
            const img = TL.obj(d.obj);
            if (d.obj === "sparkle") { if (Math.floor(F.t * 3) % 2) g.drawImage(img, sx + 4, sy + 4); return; }
            g.drawImage(img, sx + ((d.w || 1) * TS - img.width) / 2, sy + TS - img.height + 4);
            return;
          }
          if (d.art) {
            const img = Q.monsters.get(d.art);
            const k = d.artScale || 0.5;
            const w = Math.round(img.width * k);
            const h = Math.round(img.height * k);
            const bob = Math.round(Math.sin(F.t * 2.5) * 1.5);
            g.drawImage(img, sx + ((d.w || 1) * TS - w) / 2, sy + TS - h + bob, w, h);
            return;
          }
          const moving = n.t < 1;
          const img = Q.chars.field(d.who, n.dir, moving ? (Math.floor(n.t * 2) % 2 ? 1 : 2) : (d.move === "wander" ? (Math.floor(F.t * 1.5) % 2 ? 0 : 0) : 0));
          g.drawImage(shadow, sx, sy + 12);
          g.drawImage(img, sx, sy - 6);
        },
      });
    }
    // なかま と じぶん
    const party = Q.S.party;
    const p = F.p;
    const frame = walkFrame(p.moving, p.anim);
    F.fol.forEach((f, i) => {
      const who = party[i + 1];
      if (!who) return;
      const sx = Math.round(f.fx * TS - cx);
      const sy = Math.round(f.fy * TS - cy);
      if (Math.abs(f.fx - p.fx) + Math.abs(f.fy - p.fy) < 0.05 && !p.moving) return; // かさなっている ときは かくす
      sprites.push({ y: f.fy * TS - 0.1 - i * 0.01, draw: () => { g.drawImage(shadow, sx, sy + 12); g.drawImage(Q.chars.field(who, f.dir, frame), sx, sy - 6); } });
    });
    if (!F.hidePlayer) {
      const sx = Math.round(p.fx * TS - cx);
      const sy = Math.round(p.fy * TS - cy);
      sprites.push({ y: p.fy * TS + 0.05, draw: () => { g.drawImage(shadow, sx, sy + 12); g.drawImage(Q.chars.field(party[0], p.dir, frame), sx, sy - 6); } });
    }
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.draw();
    if (F.map.tint) { g.fillStyle = F.map.tint; g.fillRect(0, 0, W, H); }
    if (F.extraDraw) F.extraDraw(g, cx, cy);
  };

  F.drawHi = function (c) {
    if (F.banner && !Q.busy()) {
      const a = F.banner.t < 0.3 ? F.banner.t / 0.3 : F.banner.t > 2.2 ? (2.6 - F.banner.t) / 0.4 : 1;
      c.globalAlpha = Math.max(0, a);
      const w = G.jwidth(c, F.banner.text, 10) + 24;
      G.drawWindow(c, W / 2 - w / 2, 10, w, 22);
      G.jtext(c, F.banner.text, W / 2, 15, "#ffffff", { size: 10, align: "center" });
      c.globalAlpha = 1;
    }
    if (F.vehicle === "ufo" && !Q.busy()) {
      G.jtext(c, "A: ちゃくりく", W - 6, H - 14, "#ffffff", { size: 8, align: "right" });
    }
  };

  // ---------------------------------------------------------------- モード7 (UFO で とんでいるとき)
  let worldTex = null;
  let m7img = null;
  const m7 = G.canvasOf(W, H);
  const m7g = m7.getContext("2d");
  function buildWorldTex() {
    const c = G.canvasOf(F.w * TS, F.h * TS);
    const g = c.getContext("2d");
    for (let y = 0; y < F.h; y++) for (let x = 0; x < F.w; x++) g.drawImage(TL.frames(tileId(x, y))[0], x * TS, y * TS);
    if (Q.S.ufoPos) { /* とめてある場所は 空なので なにもしない */ }
    worldTex = { w: c.width, h: c.height, data: new Uint32Array(g.getImageData(0, 0, c.width, c.height).data.buffer) };
  }
  function drawMode7(g) {
    if (!worldTex) buildWorldTex();
    const u = F.ufo;
    const alt = u.alt;
    const HOR = Math.round(36 + (1 - alt) * 60);
    if (!m7img) m7img = m7g.createImageData(W, H);
    const out = new Uint32Array(m7img.data.buffer);
    const tex = worldTex.data;
    const tw = worldTex.w;
    const th = worldTex.h;
    const UFO_Y = 150;
    const base = 110 * (0.4 + 0.6 * alt) + 20 * (1 - alt);
    const sea = 0xffb8522a; // ABGR (deep sea)
    const r0 = UFO_Y - HOR;
    const K = base * (r0 / 110);
    const scale0 = K / r0;
    const FOC = 128;
    for (let sy = HOR + 1; sy < H; sy++) {
      const r = sy - HOR;
      const scale = K / r;
      // 奥ゆき: UFO の 真下の 行を 0 として、うえの 行ほど きたへ
      const yy = Math.floor(u.cy - FOC * (scale - scale0));
      const fog = Math.min(1, Math.max(0, (r - 4) / 40));
      for (let sx = 0; sx < W; sx++) {
        const xx = Math.floor(u.cx + (sx - W / 2) * scale);
        let col = sea;
        if (xx >= 0 && yy >= 0 && xx < tw && yy < th) col = tex[yy * tw + xx];
        if (fog < 1) {
          // とおくは かすむ
          const rr = col & 255, gg = (col >> 8) & 255, bb = (col >> 16) & 255;
          const f = fog;
          col = 0xff000000 | (Math.round(bb * f + 255 * (1 - f)) << 16) | (Math.round(gg * f + 220 * (1 - f)) << 8) | Math.round(rr * f + 200 * (1 - f));
        }
        out[sy * W + sx] = col;
      }
    }
    // そら
    for (let sy = 0; sy <= HOR; sy++) {
      const t = sy / HOR;
      const r = Math.round(60 + 140 * t);
      const gg = Math.round(110 + 110 * t);
      const b = 255;
      const col = 0xff000000 | (b << 16) | (gg << 8) | r;
      for (let sx = 0; sx < W; sx++) out[sy * W + sx] = col;
    }
    m7g.putImageData(m7img, 0, 0);
    g.drawImage(m7, 0, 0);
    // くも
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 70 - u.cx * 0.15) % (W + 80) + W + 80) % (W + 80) - 40;
      const y = 8 + (i % 3) * 9;
      g.beginPath();
      g.ellipse(x, y, 18, 4, 0, 0, Math.PI * 2);
      g.ellipse(x + 10, y - 3, 10, 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    // かげ と UFO
    const sh = TL.obj("shadow");
    const bob = Math.sin(u.bob * 3) * 2;
    g.globalAlpha = 0.8;
    g.drawImage(sh, W / 2 - 16, UFO_Y + 2, 32, 10);
    g.globalAlpha = 1;
    const img = TL.obj(Math.floor(u.bob * 6) % 2 ? "ufoship" : "ufoship2");
    const lift = 8 + alt * 22;
    g.drawImage(img, W / 2 - 16, Math.round(UFO_Y - 12 - lift + bob));
  }

  F.enter = function () {};
  Q.fieldScene = F;
})();
