// バトル: よこから見た ターンせい。 コマンド → すばやさ順に こうどう → けいけんち
(() => {
  "use strict";
  const G = Q.gfx;
  const D = Q.data;
  const W = Q.W;
  const H = Q.H;
  const FIELD_H = 152;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let B = null; // いまの バトル
  const scene = { update, draw, drawHi };

  // ================================================================ はじめる
  function makeEnemy(id, idx) {
    const d = D.E[id];
    const img = Q.monsters.get(d.art);
    return {
      side: "e", id, d, name: d.name, img, scale: d.scale || 1,
      hp: d.hp, maxhp: d.hp, mp: 99, atk: d.atk, def: d.def, mag: d.mag || 0, spd: d.spd,
      alive: true, status: {}, buffs: {}, flash: 0, shake: 0, lunge: 0, dieT: -1, appearT: 0, idx, x: 0, y: 0, turns: 0,
    };
  }
  function layoutEnemies() {
    const list = B.enemies.filter((e) => e.alive || e.dieT >= 0);
    const ws = list.map((e) => e.img.width * e.scale);
    const total = ws.reduce((a, b) => a + b, 0) + (list.length - 1) * 4;
    const left = 4;
    const right = 168;
    let x = left + Math.max(0, (right - left - total) / 2);
    const big = list.some((e) => e.d.boss);
    list.forEach((e, i) => {
      const w = ws[i];
      e.x = Math.round(x + w / 2);
      e.y = big ? 136 : 118 + (list.length > 2 ? (i % 2 ? -10 : 6) : 0);
      x += w + Math.max(2, Math.min(14, (right - left - total) / Math.max(1, list.length)));
    });
  }
  function nameEnemies() {
    const count = {};
    for (const e of B.enemies) count[e.id] = (count[e.id] || 0) + 1;
    const seen = {};
    for (const e of B.enemies) {
      if (count[e.id] > 1) { seen[e.id] = (seen[e.id] || 0) + 1; e.name = e.d.name + "ABCD"[seen[e.id] - 1]; } else e.name = e.d.name;
    }
  }
  function makeParty() {
    return Q.party().map((c, i) => ({
      side: "p", c, id: c.id, idx: i, status: {}, buffs: {}, flash: 0, shake: 0, ox: 0, pose: "idle", poseT: 0,
      homeX: 202 + i * 11, homeY: 54 + i * 28 + (4 - Q.S.party.length) * 14,
      get name() { return D.PARTY[this.id].name; },
      get alive() { return this.c.hp > 0; },
    }));
  }
  function st(m) { return Q.statsOf(m.c); }

  // encounter: フィールドで てきに であった とき
  function* encounter(table, bg) {
    const list = D.ENC[table];
    const total = list.reduce((a, [w]) => a + w, 0);
    let r = Math.random() * total;
    let form = list[0][1];
    for (const [w, f] of list) { r -= w; if (r <= 0) { form = f; break; } }
    const res = yield* fight(form, { bg });
    if (res === "lose") yield* Q.EV.gameover();
    return res;
  }

  // fight: どこからでも よべる バトル本体
  function* fight(form, opts = {}) {
    const prevScene = Q.scene;
    const prevMusic = Q.snd.current;
    if (B && !B.over) console.error("fight started while another fight is running", new Error().stack);
    B = {
      opts, bg: opts.bg || "grass", enemies: form.map((id, i) => makeEnemy(id, i)), party: makeParty(),
      msg: null, msgT: 0, pops: [], fx: [], t: 0, turn: 0, cursor: null, active: null, over: false,
      boss: form.some((id) => D.E[id].boss), shakeBg: 0, dark: 0, aura: 0,
    };
    nameEnemies();
    layoutEnemies();
    // 図鑑: であった
    for (const e of B.enemies) { const b = Q.S.book[e.id] || (Q.S.book[e.id] = { seen: 0, won: 0 }); b.seen++; }
    // いりぐちの えんしゅつ (モザイク)
    Q.snd.play("encounter");
    Q.snd.music(opts.music || (B.boss ? "boss" : "battle"), { restart: true });
    for (let t = 0; t < 0.45; t += Q.dt) { Q.fx.mosaic = 1 + t * 40; yield; }
    Q.setScene(scene);
    for (let t = 0.45; t > 0; t -= Q.dt) { Q.fx.mosaic = 1 + t * 40; yield; }
    Q.fx.mosaic = 1;
    if (opts.intro) yield* msg(opts.intro, 1.4);
    else {
      const names = [...new Set(B.enemies.map((e) => e.d.name))];
      yield* msg(B.enemies.length > 1 && names.length === 1 ? `${names[0]}たちが あらわれた！` : `${names.join("と ")}が あらわれた！`, 1.0);
    }
    if (opts.onStart) yield* opts.onStart(B);
    let result = null;
    while (!result) {
      B.turn++;
      // ---- コマンド
      const cmds = yield* inputCommands();
      if (cmds === "run") {
        result = yield* tryRun();
        if (result) break;
      }
      // ---- てきの こうどう
      const acts = [];
      for (const m of B.party) if (cmds && cmds[m.idx] && m.alive) acts.push({ who: m, cmd: cmds[m.idx], spd: speedOf(m, cmds[m.idx]) });
      for (const e of B.enemies) {
        if (!e.alive) continue;
        // ボスは 1ターンに 2かい うごく ことが ある (extra = 2かいめの かくりつ)
        let extra = e.d.extra || 0;
        if (e.d.ai === "fubukina" && e.hp < e.maxhp * 0.5) extra = 0.6;
        const n = Math.random() < extra ? 2 : 1;
        for (let i = 0; i < n; i++) acts.push({ who: e, cmd: null, spd: e.spd * rnd(0.75, 1.25) * (i ? 0.6 : 1) });
      }
      acts.sort((a, b) => b.spd - a.spd);
      for (const a of acts) {
        if (!a.who.alive) continue;
        if (a.who.side === "p") yield* partyAct(a.who, a.cmd);
        else yield* enemyAct(a.who);
        result = yield* checkEnd();
        if (result) break;
        if (B.fled) { result = "run"; break; }
      }
      if (result) break;
      yield* endOfRound();
      result = yield* checkEnd();
    }
    // ---- おわり
    B.over = true;
    if (result === "win") yield* victory();
    else if (result === "lose") {
      Q.snd.stop();
      yield* msg("ポポたちは ぜんめつ してしまった…", 1.8);
    }
    for (const m of B.party) { m.c.poison = !!m.status.poison && m.alive ? true : m.c.poison && m.alive; }
    yield* Q.fadeOut(0.4);
    Q.setScene(prevScene);
    const keepMusic = opts.keepMusic;
    B = null;
    if (result !== "lose") {
      if (prevScene === Q.field) Q.field.playMapMusic();
      else if (prevMusic && !keepMusic) Q.snd.music(prevMusic);
    }
    yield* Q.fadeIn(0.3);
    return result;
  }

  function speedOf(m, cmd) {
    let s = st(m).spd * rnd(0.8, 1.2);
    const sk = cmd.skill && D.SKILLS[cmd.skill];
    if (sk && sk.first) s += 999;
    if (cmd.type === "guard") s += 500;
    return s;
  }

  function* checkEnd() {
    if (B.enemies.every((e) => !e.alive)) {
      if (B.opts.phase2 && !B.phase2Done) { yield* phase2(); return null; }
      return "win";
    }
    if (B.party.every((m) => !m.alive)) return "lose";
    return null;
  }

  // ================================================================ メッセージ
  function* msg(text, wait = 0.9) {
    B.msg = text;
    B.msgT = 0;
    let t = 0;
    while (t < wait) {
      t += Q.dt;
      if (t > 0.25 && (Q.In.pressed("a") || Q.In.held("a"))) t += Q.dt * 2.5;
      yield;
    }
  }
  function setMsg(text) { B.msg = text; B.msgT = 0; }

  // ================================================================ コマンド入力
  function* inputCommands() {
    const cmds = [];
    let i = 0;
    const alive = () => B.party.filter((m) => m.alive);
    if (!alive().length) return cmds;
    while (i < B.party.length) {
      const m = B.party[i];
      if (!m.alive || m.status.sleep || m.status.stun || m.status.slip) { cmds[i] = { type: "skip" }; i++; continue; }
      B.active = m;
      setMsg(null);
      if (Q.autoBattle) { cmds[i] = Q.autoBattle(m, B); i++; continue; } // テスト用の じどう せんとう
      const r = yield* commandFor(m, i === firstAble());
      if (r === "back") {
        // ひとつ まえの ひとへ
        let j = i - 1;
        while (j >= 0 && cmds[j] && cmds[j].type === "skip") j--;
        if (j >= 0) i = j;
        continue;
      }
      if (r === "run") { B.active = null; return "run"; }
      cmds[i] = r;
      i++;
    }
    B.active = null;
    return cmds;
  }
  function firstAble() { return B.party.findIndex((m) => m.alive && !m.status.sleep && !m.status.stun && !m.status.slip); }

  function* commandFor(m, isFirst) {
    const skillLabel = m.id === "meru" ? "まほう" : m.id === "popo" ? "わざ" : "とくぎ";
    const items = [
      { label: "たたかう", value: "fight" },
      { label: skillLabel, value: "skill", disabled: !Q.skillsOf(m.c).filter((s) => !D.SKILLS[s].hidden || m.c.extraSkills).length },
      { label: "どうぐ", value: "item" },
      { label: "ぼうぎょ", value: "guard" },
      { label: "にげる", value: "run", disabled: !!B.opts.noRun },
    ];
    const menu = Q.push(new Q.Menu(items, { x: 4, y: FIELD_H + 2, w: 74, rowH: 12, size: 10, cancel: true, cur: m.lastCmd || 0 }));
    try {
      for (;;) {
        const v = yield menu.choose();
        if (v === null) { if (!isFirst) return "back"; continue; }
        m.lastCmd = items.findIndex((it) => it.value === v);
        if (v === "fight") {
          const t = yield* chooseTarget("enemy", m);
          if (t != null) return { type: "fight", target: t };
        } else if (v === "guard") {
          return { type: "guard" };
        } else if (v === "run") {
          return "run";
        } else if (v === "skill") {
          const r = yield* chooseSkill(m);
          if (r) return r;
        } else if (v === "item") {
          const r = yield* chooseItem(m);
          if (r) return r;
        }
      }
    } finally {
      menu.close();
    }
  }

  function* chooseSkill(m) {
    const list = Q.skillsOf(m.c);
    const items = list.map((id) => {
      const s = D.SKILLS[id];
      return { label: s.name, value: id, right: s.mp, disabled: s.mp > m.c.mp };
    });
    const menu = Q.push(new Q.Menu(items, {
      x: 4, y: 40, w: 248, cols: 2, rows: 6, rowH: 14, title: `${m.name}の ${m.id === "meru" ? "まほう" : "わざ"}（MP ${m.c.mp}）`, pageLR: false,
      onMove: (it) => setMsg(D.SKILLS[it.value].desc),
    }));
    setMsg(D.SKILLS[items[0].value].desc);
    try {
      for (;;) {
        const v = yield menu.choose();
        if (v === null) { setMsg(null); return null; }
        const s = D.SKILLS[v];
        menu.o.hidden = true;
        const t = yield* chooseTarget(s.target, m);
        menu.o.hidden = false;
        if (t != null) { setMsg(null); return { type: "skill", skill: v, target: t }; }
      }
    } finally { menu.close(); }
  }

  function* chooseItem(m) {
    const ids = Object.keys(Q.S.items).filter((id) => D.ITEMS[id].type === "use" && !D.ITEMS[id].fieldOnly);
    if (!ids.length) { yield* msg("つかえる どうぐが ない！", 0.8); return null; }
    const items = ids.map((id) => ({ label: D.ITEMS[id].name, value: id, right: "×" + Q.S.items[id] }));
    const menu = Q.push(new Q.Menu(items, { x: 4, y: 40, w: 248, cols: 2, rows: 6, rowH: 14, title: "どうぐ", onMove: (it) => setMsg(D.ITEMS[it.value].desc) }));
    setMsg(D.ITEMS[ids[0]].desc);
    try {
      for (;;) {
        const v = yield menu.choose();
        if (v === null) { setMsg(null); return null; }
        const it = D.ITEMS[v];
        menu.o.hidden = true;
        const t = it.target === "none" ? 0 : yield* chooseTarget(it.target, m);
        menu.o.hidden = false;
        if (t != null) { setMsg(null); return { type: "item", item: v, target: t }; }
      }
    } finally { menu.close(); }
  }

  // ねらいを えらぶ: enemy / enemies / ally / allies / self / ko
  function* chooseTarget(kind, m) {
    if (kind === "self") return m.idx;
    if (kind === "enemies" || kind === "allies") {
      B.cursor = { kind, all: true };
      const r = yield* waitConfirm();
      B.cursor = null;
      return r ? "all" : null;
    }
    const pool = kind === "enemy" ? B.enemies.filter((e) => e.alive) : kind === "ko" ? B.party.filter((p) => !p.alive) : B.party.filter((p) => p.alive);
    if (!pool.length) { Q.snd.play("buzz"); return null; }
    let i = 0;
    if (kind === "ally") { i = Math.max(0, pool.indexOf(m)); let lo = 0; pool.forEach((p, j) => { if (p.c.hp / st(p).maxhp < pool[lo].c.hp / st(pool[lo]).maxhp) lo = j; }); i = lo; }
    for (;;) {
      B.cursor = { kind, target: pool[i] };
      yield;
      if (Q.In.rep("left") || Q.In.rep("up")) { i = (i + pool.length - 1) % pool.length; Q.snd.play("cursor"); }
      if (Q.In.rep("right") || Q.In.rep("down")) { i = (i + 1) % pool.length; Q.snd.play("cursor"); }
      if (Q.In.pressed("a")) { Q.snd.play("select"); B.cursor = null; return pool[i].side === "e" ? B.enemies.indexOf(pool[i]) : pool[i].idx; }
      if (Q.In.pressed("b")) { Q.snd.play("cancel"); B.cursor = null; return null; }
    }
  }
  function* waitConfirm() {
    for (;;) {
      yield;
      if (Q.In.pressed("a")) { Q.snd.play("select"); return true; }
      if (Q.In.pressed("b")) { Q.snd.play("cancel"); return false; }
    }
  }

  function* tryRun() {
    const ps = B.party.filter((m) => m.alive).reduce((a, m) => a + st(m).spd, 0) / Math.max(1, B.party.filter((m) => m.alive).length);
    const es = B.enemies.filter((e) => e.alive).reduce((a, e) => a + e.spd, 0) / Math.max(1, B.enemies.filter((e) => e.alive).length);
    const ch = G.clamp(0.55 + (ps - es) / 80, 0.3, 0.95);
    yield* msg("ポポたちは にげだした！", 0.6);
    if (Math.random() < ch) {
      Q.snd.play("run");
      for (const m of B.party) m.pose = "step";
      for (let t = 0; t < 0.4; t += Q.dt) { for (const m of B.party) m.ox = t * 120; yield; }
      return "run";
    }
    yield* msg("しかし まわりこまれて しまった！", 0.9);
    // てきだけ こうどう
    const acts = B.enemies.filter((e) => e.alive).map((e) => ({ who: e, spd: e.spd * Math.random() })).sort((a, b) => b.spd - a.spd);
    for (const a of acts) {
      if (!a.who.alive) continue;
      yield* enemyAct(a.who);
      const r = yield* checkEnd();
      if (r) return r;
    }
    yield* endOfRound();
    return null;
  }

  // ================================================================ けいさん
  function buffK(u, stat) {
    let k = 1;
    const b = u.buffs[stat];
    if (b && b.turns > 0) k += b.amount;
    const d = u.buffs["-" + stat];
    if (d && d.turns > 0) k -= d.amount;
    return k;
  }
  function atkOf(u) { return (u.side === "p" ? st(u).atk : u.atk) * buffK(u, "atk"); }
  function defOf(u) { return (u.side === "p" ? st(u).def : u.def) * buffK(u, "def"); }
  function magOf(u) { return u.side === "p" ? st(u).mag : u.mag; }

  function physDamage(a, t, mult, o = {}) {
    const atk = atkOf(a) * (a.tame ? 2.2 : 1);
    const def = o.pierce ? defOf(t) * 0.2 : defOf(t);
    let crit = false;
    if (a.side === "p" && !o.noCrit && Math.random() < st(a).crit) crit = true;
    let dmg;
    if (t.side === "e" && t.d.metal) {
      dmg = crit ? t.hp : Math.random() < 0.55 ? 1 : 0;
      return { dmg, crit };
    }
    if (crit) dmg = atk * 1.45 * mult;
    else {
      const base = Math.max(atk - def * 0.55, atk * 0.1);
      dmg = base * mult * rnd(0.88, 1.12);
    }
    if (t.guard) dmg *= 0.5;
    if (o.elem && t.side === "e") dmg *= elemK(t, o.elem);
    return { dmg: Math.max(crit ? 1 : 0, Math.round(dmg)) || (Math.random() < 0.7 ? 1 : 0), crit };
  }
  function elemK(t, elem) {
    if (!elem) return 1;
    if (t.side === "e") {
      if (t.d.weak.includes(elem)) return 1.5;
      if (t.d.resist.includes(elem)) return t.d.metal ? 0 : 0.5;
      return 1;
    }
    if (st(t).resist.includes(elem)) return 0.6;
    return 1;
  }
  function magDamage(a, t, power, k, elem) {
    let dmg = (power + magOf(a) * k * (a.side === "p" ? 0.8 : 1)) * rnd(0.9, 1.1);
    if (t.side === "p") dmg *= 1 - Math.min(0.35, defOf(t) / 400);
    if (t.side === "e" && t.d.metal) return Math.random() < 0.2 ? 1 : 0;
    dmg *= elemK(t, elem);
    if (t.guard) dmg *= 0.6;
    return Math.max(1, Math.round(dmg));
  }

  // ================================================================ ダメージ / かいふく の ひょうじ
  function centerOf(u) {
    if (u.side === "e") return [u.x, u.y - (u.img.height * u.scale) / 2];
    return [u.homeX + u.ox, u.homeY - 14];
  }
  function pop(u, text, color = "#ffffff", big = false) {
    const [x, y] = centerOf(u);
    B.pops.push({ x: Math.round(x), y: Math.round(y - 6), text: String(text), color, t: 0, big });
  }
  function* hurt(t, dmg, o = {}) {
    if (t.side === "e") {
      t.hp = Math.max(0, t.hp - dmg);
      t.flash = 0.3;
      t.shake = 0.3;
      pop(t, dmg, o.crit ? "#ffe040" : "#ffffff", o.crit);
      Q.snd.play(o.crit ? "crit" : dmg ? "hit" : "miss");
      if (t.status.sleep && Math.random() < 0.5) { delete t.status.sleep; }
      if (t.hp <= 0) yield* killEnemy(t);
    } else {
      // かばう
      if (t.protectedBy && t.protectedBy.alive && t.protectedBy !== t) {
        const g = t.protectedBy;
        yield* msg(`${g.name}が ${t.name}を かばった！`, 0.6);
        t = g;
        dmg = Math.round(dmg * 0.75);
      }
      t.c.hp = Math.max(0, t.c.hp - dmg);
      t.flash = 0.3;
      t.shake = 0.35;
      t.pose = "hurt";
      t.poseT = 0.5;
      pop(t, dmg, "#ffffff", o.crit);
      Q.snd.play(dmg > st(t).maxhp * 0.3 ? "bighurt" : "hurt");
      if (dmg > st(t).maxhp * 0.25) Q.shake(0.25, 3);
      if (t.status.sleep && Math.random() < 0.5) delete t.status.sleep;
      if (t.c.hp <= 0) {
        t.pose = "ko";
        t.status = {};
        t.buffs = {};
        yield 0.2;
        Q.snd.play("ko");
        yield* msg(`${t.name}は たおれた！`, 0.7);
      }
    }
  }
  function* heal(t, n, mp = false) {
    if (t.side === "e") {
      t.hp = Math.min(t.maxhp, t.hp + n);
      pop(t, n, "#7aff9a");
      return;
    }
    const s = st(t);
    if (mp) { t.c.mp = Math.min(s.maxmp, t.c.mp + n); pop(t, n, "#7ad0ff"); }
    else { t.c.hp = Math.min(s.maxhp, t.c.hp + n); pop(t, n, "#7aff9a"); }
    yield 0;
  }
  function* killEnemy(e) {
    e.alive = false;
    e.dieT = 0;
    const b = Q.S.book[e.id] || (Q.S.book[e.id] = { seen: 1, won: 0 });
    b.won++;
    if (e.d.boss) {
      Q.snd.play("bossdeath");
      for (let i = 0; i < 14; i++) {
        const [cx, cy] = centerOf(e);
        addFx(fxBurst(cx + rnd(-30, 30), cy + rnd(-30, 30), pick(["#ffffff", "#ffe040", "#ff8a3a"]), 0.5));
        Q.shake(0.2, 4);
        yield 0.12;
      }
      e.dieDur = 1.6;
    } else {
      Q.snd.play("death");
      e.dieDur = 0.55;
    }
    yield e.dieDur * 0.6;
    yield* msg(`${e.name}を たおした！`, 0.55);
  }

  // ================================================================ なかまの こうどう
  function targetsOf(kind, tgt, m) {
    if (kind === "enemy") {
      let e = B.enemies[tgt];
      if (!e || !e.alive) e = B.enemies.find((x) => x.alive);
      return e ? [e] : [];
    }
    if (kind === "enemies") return B.enemies.filter((e) => e.alive);
    if (kind === "allies") return B.party.filter((p) => p.alive);
    if (kind === "ally") { const p = B.party[tgt]; return p && p.alive ? [p] : [B.party.find((x) => x.alive)]; }
    if (kind === "ko") { const p = B.party[tgt]; return p && !p.alive ? [p] : []; }
    if (kind === "self") return [m];
    return [];
  }

  function* stepForward(m) {
    m.pose = "step";
    for (let t = 0; t < 0.14; t += Q.dt) { m.ox = -t / 0.14 * 16; yield; }
    m.ox = -16;
  }
  function* stepBack(m) {
    m.pose = "step";
    for (let t = 0; t < 0.12; t += Q.dt) { m.ox = -16 + t / 0.12 * 16; yield; }
    m.ox = 0;
    m.pose = "idle";
  }

  function* partyAct(m, cmd) {
    m.guard = false;
    if (statusSkip(m)) { yield* statusMsg(m); return; }
    if (cmd.type === "skip") return;
    if (cmd.type === "guard") { m.guard = true; m.pose = "guard"; yield* msg(`${m.name}は みを まもっている。`, 0.5); return; }
    if (cmd.type === "fight") {
      const [t] = targetsOf("enemy", cmd.target, m);
      if (!t) return;
      yield* stepForward(m);
      m.pose = "atk";
      setMsg(`${m.name}の こうげき！`);
      Q.snd.play("swing");
      yield* playFx(m.id === "popo" ? "slash" : m.id === "yuta" ? "punch" : m.id === "meru" ? "pebble" : "smash", m, [t]);
      if (Math.random() < 0.04 && !t.status.sleep) { Q.snd.play("miss"); pop(t, "MISS", "#c8c8ff"); yield* msg("ミス！ ダメージを あたえられない！", 0.6); }
      else {
        const r = physDamage(m, t, 1);
        m.tame = false;
        if (r.crit) { Q.flash(0.12); yield* msg("かいしんの いちげき！", 0.35); }
        yield* hurt(t, r.dmg, r);
        if (t.alive && r.dmg) yield* msg(`${t.name}に ${r.dmg}の ダメージ！`, 0.5);
        yield* counterThorns(m, t);
      }
      yield 0.15;
      yield* stepBack(m);
      return;
    }
    if (cmd.type === "skill") { yield* useSkill(m, cmd.skill, cmd.target); return; }
    if (cmd.type === "item") { yield* useItem(m, cmd.item, cmd.target); return; }
  }

  function* counterThorns(m, t) {
    if (!t.d || !t.d.counter || !m.alive) return;
    const dmg = Math.max(1, Math.round(st(m).maxhp * t.d.counter * rnd(0.8, 1.2)));
    yield* msg(`トゲが ささった！`, 0.3);
    yield* hurt(m, dmg);
  }

  function* useSkill(m, id, tgt) {
    const s = D.SKILLS[id];
    if (m.c.mp < s.mp) { yield* msg(`${m.name}は ${s.name}を つかおうとした！\nしかし MPが たりない！`, 0.9); return; }
    m.c.mp -= s.mp;
    let targets = targetsOf(s.target, tgt, m);
    yield* stepForward(m);
    m.pose = s.kind === "phys" ? "atk" : "cast";
    setMsg(`${m.name}の ${s.name}！`);
    if (s.kind !== "phys") { Q.snd.play("magic"); yield* playFx("charge", m, [m], 0.3); }
    if (!targets.length) { yield* msg("しかし なにも おこらなかった。", 0.6); yield* stepBack(m); return; }
    if (s.kind === "dmg") {
      yield* playFx(s.anim, m, targets);
      for (const t of targets) {
        if (!t.alive) continue;
        const power = s.useAtk ? s.power + atkOf(m) * s.k : s.power;
        const dmg = s.useAtk ? Math.max(1, Math.round((power) * rnd(0.9, 1.1) * elemK(t, s.elem))) : magDamage(m, t, s.power, s.k, s.elem);
        yield* hurt(t, dmg);
        const k = elemK(t, s.elem);
        if (t.alive) yield* msg(`${t.name}に ${dmg}の ダメージ！${k > 1 ? " こうかは ばつぐんだ！" : k < 1 && k > 0 ? " あまり きいていない…" : ""}`, 0.45);
      }
    } else if (s.kind === "phys") {
      yield* playFx(s.anim, m, targets);
      for (const t of targets) {
        for (let h = 0; h < (s.hits || 1); h++) {
          if (!t.alive) break;
          if (!s.sure && Math.random() > (s.hit || 0.96)) { Q.snd.play("miss"); pop(t, "MISS", "#c8c8ff"); yield* msg(id === "homerun" ? "からぶり！" : "ミス！", 0.5); continue; }
          const r = physDamage(m, t, s.mult, { noCrit: false });
          if (r.crit) { Q.flash(0.12); }
          yield* hurt(t, r.dmg, r);
          if (t.alive) yield* msg(`${t.name}に ${r.dmg}の ダメージ！`, 0.4);
          if (t.alive && s.stun && Math.random() < s.stun && !t.d.boss) { t.status.stun = 1; yield* msg(`${t.name}は うごけなくなった！`, 0.5); }
          if (!s.hits || h === s.hits - 1) yield* counterThorns(m, t);
          if (s.hits > 1) yield* playFx(s.anim, m, [t]);
        }
      }
      m.tame = false;
    } else if (s.kind === "heal") {
      yield* playFx("heal", m, targets);
      Q.snd.play("heal");
      for (const t of targets) {
        if (!t.alive) continue;
        const n = Math.round((s.power + magOf(m) * s.k) * rnd(0.9, 1.1));
        yield* heal(t, n);
      }
      yield* msg(targets.length > 1 ? "みんなの HPが かいふくした！" : `${targets[0].name}の HPが かいふくした！`, 0.6);
    } else if (s.kind === "revive") {
      const t = targets[0];
      yield* playFx("heal", m, [t]);
      Q.snd.play("heal");
      t.c.hp = Math.round(st(t).maxhp * s.power);
      t.pose = "idle";
      pop(t, t.c.hp, "#7aff9a");
      yield* msg(`${t.name}は いきかえった！`, 0.8);
    } else if (s.kind === "buff") {
      yield* playFx(s.anim, m, targets);
      Q.snd.play("buff");
      for (const t of targets) {
        if (s.stat === "both") { t.buffs.atk = { amount: s.amount, turns: s.turns }; t.buffs.def = { amount: s.amount, turns: s.turns }; }
        else t.buffs[s.stat] = { amount: s.amount, turns: s.turns };
      }
      yield* msg(s.stat === "atk" ? "みんなの こうげきりょくが あがった！" : s.stat === "def" ? "みんなの しゅびりょくが あがった！" : "みんなの ちからが みなぎった！", 0.8);
    } else if (s.kind === "status") {
      yield* playFx(s.anim, m, targets);
      Q.snd.play("sleep");
      let any = false;
      for (const t of targets) {
        if (!t.alive) continue;
        if (t.d.sleepImmune || Math.random() > s.chance) continue;
        t.status.sleep = 1;
        any = true;
        yield* msg(`${t.name}は ねむってしまった！`, 0.45);
      }
      if (!any) yield* msg("しかし きかなかった！", 0.6);
    } else if (s.kind === "special") {
      if (id === "kabau") {
        const t = targets[0];
        if (t && t !== m) {
          t.protectedBy = m;
          m.protecting = t;
          yield* playFx("shield", m, [t]);
          yield* msg(`${m.name}は ${t.name}を まもっている！`, 0.7);
        } else yield* msg(`${m.name}は かまえた！`, 0.6);
      } else if (id === "tame") {
        m.tame = true;
        yield* playFx("charge", m, [m], 0.6);
        Q.snd.play("buff");
        yield* msg(`${m.name}は ちからを ためている…！`, 0.7);
      }
    } else if (s.kind === "dmg" || s.anim === "nova") {
      // (ここには こない)
    }
    yield 0.1;
    yield* stepBack(m);
  }

  function* useItem(m, id, tgt) {
    const it = D.ITEMS[id];
    if (!Q.S.items[id]) { yield* msg(`${it.name}は もう ない！`, 0.7); return; }
    Q.addItem(id, -1);
    yield* stepForward(m);
    m.pose = "cast";
    yield* msg(`${m.name}は ${it.name}を つかった！`, 0.5);
    const k = m.id === "yuta" ? 1.5 : 1;
    if (it.escape) {
      B.fled = true;
      Q.snd.play("run");
      yield* msg("けむりに まぎれて にげだした！", 0.8);
      return;
    }
    if (it.bomb) {
      const targets = B.enemies.filter((e) => e.alive);
      yield* playFx("explode", m, targets);
      for (const t of targets) { yield* hurt(t, Math.round(it.bomb * rnd(0.9, 1.1))); }
      yield* stepBack(m);
      return;
    }
    const targets = it.target === "allies" ? B.party.filter((p) => p.alive) : targetsOf(it.target, tgt, m);
    for (const t of targets) {
      if (it.revive) {
        t.c.hp = Math.round(st(t).maxhp * it.revive);
        t.pose = "idle";
        yield* playFx("heal", m, [t]);
        Q.snd.play("heal");
        yield* msg(`${t.name}は いきかえった！`, 0.7);
      } else if (it.heal) {
        yield* playFx("heal", m, [t]);
        Q.snd.play("heal");
        yield* heal(t, Math.round(it.heal * k));
      } else if (it.mpheal) {
        Q.snd.play("heal");
        yield* heal(t, Math.round(it.mpheal * k), true);
      } else if (it.cure) {
        delete t.status.poison;
        t.c.poison = false;
        Q.snd.play("heal");
        yield* msg(`${t.name}の どくが きえた！`, 0.6);
      }
    }
    yield 0.3;
    yield* stepBack(m);
  }

  // ================================================================ てきの こうどう
  function chooseAct(e) {
    const ai = e.d.ai;
    e.turns++;
    if (ai === "bomb") {
      if (e.fuse == null && (e.turns >= 2 || Math.random() < 0.4)) { e.fuse = 2; return "fuse"; }
      if (e.fuse != null) { e.fuse--; if (e.fuse <= 0) return "explode"; return "nothing"; }
    }
    if (ai === "kingtoge" && e.hp < e.maxhp * 0.5 && !e.raged) { e.raged = true; return "rage"; }
    if (ai === "gantetsu" && e.hp < e.maxhp * 0.35 && !e.raged) { e.raged = true; return "rage"; }
    if (ai === "golem") {
      if (e.charged) { e.charged = false; return "rocket"; }
      if (e.turns % 3 === 0) { e.charged = true; return "charge"; }
    }
    if (ai === "fubukina" && e.hp < e.maxhp * 0.4 && !e.armored) { e.armored = true; return "icearmor"; }
    if (ai === "garm" && e.hp < e.maxhp * 0.5 && !e.raged) { e.raged = true; return "warcry"; }
    if (ai === "dragzard2" && !B.cheered) {
      // しんのすがたの 2ターンめ、 または ピンチの ときに みんなの おうえんが とどく
      const alive = B.party.filter((p) => p.alive);
      const ratio = alive.reduce((a, p) => a + p.c.hp / st(p).maxhp, 0) / B.party.length;
      if (B.turn - (B.phase2Turn || 0) >= 2 || ratio < 0.45 || e.hp < e.maxhp * 0.7) return "CHEER";
    }
    if (ai === "dragzard2" && e.hp < e.maxhp * 0.3 && !e.regened && Math.random() < 0.5) { e.regened = true; return "regen"; }
    let acts = e.d.acts;
    if (e.d.ai === "dragzard2" && B.cheered) acts = acts.filter(([, a]) => a !== "darkstare");
    const total = acts.reduce((a, [w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [w, a] of acts) { r -= w; if (r <= 0) return a; }
    return acts[0][1];
  }
  function randomTarget() {
    const alive = B.party.filter((p) => p.alive);
    // まえの ひとが すこし ねらわれやすい
    const ws = alive.map((p, i) => 1.4 - i * 0.12 + (p.id === "gantetsu" ? 0.3 : 0));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < alive.length; i++) { r -= ws[i]; if (r <= 0) return alive[i]; }
    return alive[0];
  }

  function* enemyAct(e) {
    if (statusSkip(e)) { yield* statusMsg(e); return; }
    const aid = chooseAct(e);
    if (aid === "CHEER") { yield* cheerEvent(e); return; }
    const a = D.EACTS[aid];
    const name = a.name;
    // こうげきの まえの うごき
    yield* enemyLunge(e);
    if (a.kind === "none") { yield* msg(`${e.name}は ${name}。`, 0.7); return; }
    if (a.kind === "flee") {
      Q.snd.play("run");
      yield* msg(`${e.name}は ${name}`, 0.6);
      e.alive = false;
      e.dieT = 0;
      e.dieDur = 0.4;
      e.fled = true;
      return;
    }
    if (a.kind === "call") {
      const alive = B.enemies.filter((x) => x.alive);
      yield* msg(`${e.name}は ${name}`, 0.6);
      if (alive.length < 4 && Math.random() < 0.7) {
        const n = makeEnemy(e.id, B.enemies.length);
        n.appearT = 0.5;
        B.enemies = B.enemies.filter((x) => x.alive || x.dieT < (x.dieDur || 1));
        B.enemies.push(n);
        nameEnemies();
        layoutEnemies();
        Q.snd.play("magic");
        yield* msg(`${n.name}が あらわれた！`, 0.6);
      } else yield* msg("しかし だれも こなかった。", 0.6);
      return;
    }
    if (a.kind === "fuse") { Q.snd.play("bomb"); yield* msg(`${e.name}の ${name}`, 0.8); return; }
    if (a.kind === "explode") {
      yield* msg(`${e.name}は ${name}`, 0.4);
      yield* playFx("explode", e, B.party.filter((p) => p.alive));
      e.alive = false; e.dieT = 0; e.dieDur = 0.3; e.fled = true;
      for (const t of B.party.filter((p) => p.alive)) yield* hurt(t, Math.round(e.atk * a.power * rnd(0.85, 1.1)));
      return;
    }
    if (a.kind === "heal") {
      let t = e;
      if (a.target === "ally") { const hurtOnes = B.enemies.filter((x) => x.alive && x.hp < x.maxhp); t = hurtOnes.sort((x, y) => x.hp / x.maxhp - y.hp / y.maxhp)[0] || e; }
      yield* msg(`${e.name}の ${name}！`, 0.4);
      yield* playFx(a.anim, e, [t]);
      Q.snd.play("heal");
      const n = Math.round((a.power + e.mag * a.k) * rnd(0.9, 1.1));
      yield* heal(t, n);
      yield* msg(`${t.name}の きずが ふさがった！`, 0.6);
      return;
    }
    if (a.kind === "buff") {
      yield* msg(`${e.name}は ${name}`, 0.5);
      yield* playFx(a.anim, e, [e]);
      Q.snd.play("buff");
      e.buffs[a.stat] = { amount: a.amount, turns: a.turns };
      return;
    }
    if (a.kind === "debuff") {
      yield* msg(`${e.name}は ${name}`, 0.5);
      yield* playFx(a.anim, e, B.party.filter((p) => p.alive));
      Q.snd.play("debuff");
      for (const p of B.party) if (p.alive) p.buffs["-" + a.stat] = { amount: a.amount, turns: a.turns };
      yield* msg("ポポたちの しゅびりょくが さがった！", 0.6);
      return;
    }
    const targets = a.target === "all" ? B.party.filter((p) => p.alive) : [randomTarget()];
    if (!targets.length || !targets[0]) return;
    setMsg(name ? `${e.name}の ${name}` : `${e.name}の こうげき！`);
    if (a.kind === "status") {
      yield* playFx(a.anim, e, targets);
      let any = false;
      for (const t of targets) {
        if (!t.alive) continue;
        if (a.status === "sleep" && st(t).nosleep) { yield* msg(`${t.name}は ねこのすずで めを さました！`, 0.5); continue; }
        if (Math.random() > a.chance) continue;
        any = true;
        t.status[a.status] = a.status === "sleep" ? 2 : 1;
        Q.snd.play(a.status === "sleep" ? "sleep" : "debuff");
        yield* msg(a.status === "sleep" ? `${t.name}は ねむってしまった！` : `${t.name}は すべって ころんだ！`, 0.55);
      }
      if (!any) yield* msg("しかし うまく きまらなかった！", 0.6);
      return;
    }
    yield* playFx(a.anim, e, targets);
    for (const t of targets) {
      if (!t.alive) continue;
      for (let h = 0; h < (a.hits || 1); h++) {
        if (!t.alive) break;
        let dmg;
        if (a.kind === "phys") {
          if (Math.random() < 0.035 && !e.d.boss) { Q.snd.play("miss"); pop(t, "MISS", "#c8c8ff"); yield* msg(`${t.name}は ひらりと みを かわした！`, 0.5); continue; }
          dmg = physDamage(e, t, a.mult, { pierce: a.pierce, elem: a.elem }).dmg;
          if (a.elem) dmg = Math.round(dmg * elemK(t, a.elem));
        } else dmg = magDamage(e, t, a.power, a.k, a.elem);
        yield* hurt(t, dmg);
        if (t.alive) yield* msg(`${t.name}は ${dmg}の ダメージを うけた！`, targets.length > 1 ? 0.35 : 0.5);
        if (t.alive && a.status === "poison" && Math.random() < a.chance) { t.status.poison = 1; t.c.poison = true; Q.snd.play("poison"); yield* msg(`${t.name}は どくに おかされた！`, 0.5); }
      }
    }
  }

  function* enemyLunge(e) {
    e.flash = 0.25;
    for (let t = 0; t < 0.12; t += Q.dt) { e.lunge = (t / 0.12) * 8; yield; }
    for (let t = 0; t < 0.1; t += Q.dt) { e.lunge = 8 - (t / 0.1) * 8; yield; }
    e.lunge = 0;
  }

  function statusSkip(u) { return u.status.sleep || u.status.stun || u.status.slip; }
  function* statusMsg(u) {
    if (u.status.sleep) {
      if (Math.random() < (u.side === "p" ? 0.45 : 0.33)) { delete u.status.sleep; yield* msg(`${u.name}は めを さました！`, 0.6); return; }
      yield* msg(`${u.name}は ねむっている…`, 0.6);
      return;
    }
    if (u.status.stun) { delete u.status.stun; yield* msg(`${u.name}は うごけない！`, 0.6); return; }
    if (u.status.slip) { delete u.status.slip; yield* msg(`${u.name}は すべって おきあがれない！`, 0.6); }
  }

  function* endOfRound() {
    for (const u of [...B.party, ...B.enemies]) {
      for (const k of Object.keys(u.buffs)) { u.buffs[k].turns--; if (u.buffs[k].turns <= 0) delete u.buffs[k]; }
      u.guard = false;
      u.protectedBy = null;
      u.protecting = null;
    }
    for (const m of B.party) {
      if (m.alive && (m.status.poison || m.c.poison)) {
        const dmg = Math.max(1, Math.round(st(m).maxhp / 14));
        Q.snd.play("poison");
        yield* hurt(m, dmg);
        if (m.alive) yield* msg(`${m.name}は どくで ${dmg}の ダメージ！`, 0.5);
      }
      if (m.alive && m.pose !== "ko") m.pose = "idle";
    }
  }

  // ================================================================ しょうり
  function* victory() {
    const killed = B.enemies.filter((e) => !e.fled);
    const exp = killed.reduce((a, e) => a + e.d.exp, 0);
    const gold = killed.reduce((a, e) => a + e.d.gold, 0);
    B.won = true;
    Q.snd.jingle("victory", null);
    for (const m of B.party) if (m.alive) m.pose = "win";
    yield 0.4;
    if (B.opts.winMsg) yield* msg(B.opts.winMsg, 1.4);
    else yield* msg(killed.length ? "まものたちを やっつけた！" : "せんとうに しょうりした！", 0.9);
    if (exp) yield* msg(`ポポたちは ${exp}ポイントの けいけんちを かくとく！`, 1.0);
    if (gold) { Q.S.gold += gold; Q.snd.play("gold"); yield* msg(`${gold}ゴールドを てにいれた！`, 0.8); }
    for (const m of B.party) {
      if (!m.alive) continue;
      const lv = Q.gainExp(m.c, exp);
      if (lv.length) Q.snd.jingle("levelup", null);
      for (const line of lv) yield* msg(line, 1.5);
    }
    for (const e of killed) {
      if (e.d.drop && Math.random() < e.d.drop[1]) {
        Q.addItem(e.d.drop[0]);
        Q.snd.play("chest");
        yield* msg(`${e.name}は ${D.ITEMS[e.d.drop[0]].name}を おとしていった！`, 1.0);
      }
    }
    Q.S.wins++;
    yield 0.3;
  }

  // ================================================================ ラスボス: だい2けいたい と みんなの おうえん
  function* phase2() {
    B.phase2Done = true;
    B.phase2Turn = B.turn;
    const old = B.enemies[0];
    old.dieT = -1;
    old.alive = true;
    old.hp = 1;
    Q.snd.stop();
    yield* msg("ドラグザード「…ぐ… ぐおおお…！」", 1.4);
    yield* msg("ドラグザード「まだだ… まだ おわらぬ！\nこれが わたしの… ほんとうの すがただ！！」", 2.0);
    Q.snd.play("roar");
    for (let i = 0; i < 20; i++) { Q.flash(0.08, i % 2 ? "#ffffff" : "#a02aff"); Q.shake(0.1, 5); old.flash = 0.1; yield 0.08; }
    const e = makeEnemy(B.opts.phase2, 0);
    e.appearT = 1.2;
    B.enemies = [e];
    B.aura = 1;
    nameEnemies();
    layoutEnemies();
    Q.snd.music("lastboss", { restart: true });
    yield 1.0;
    yield* msg("まりゅうの しんのすがたが あらわれた！", 1.4);
    yield* msg("ちいさく なった その からだから、\nおそろしい ちからが あふれだしている…！", 1.6);
  }

  function* cheerEvent(e) {
    B.cheered = true;
    yield* enemyLunge(e);
    yield* msg("ドラグザード「きえろ！ ほしの ひかりよ！\n—— ダークノヴァ・ゼロ！！」", 1.8);
    Q.snd.play("explode");
    yield* playFx("darknova", e, B.party);
    for (const p of B.party) { p.c.hp = Math.min(p.c.hp, 1) || 1; p.pose = "hurt"; p.status = {}; pop(p, 9999, "#ff6a8a", true); }
    Q.shake(1.0, 6);
    B.dark = 1;
    Q.snd.stop();
    yield 1.0;
    yield* msg("ポポたちは ちからつき かけている…", 1.6);
    yield* msg("…………", 1.2);
    yield* msg("（どこからか こえが きこえる……）", 1.6);
    const voices = [
      ["yuta", "ユウタ「ポポーーっ！！ まけるなーーっ！！\nいつも みたいに、 ぶっちぎれーー！！」"],
      ["meru", "メル「ポポ！ わたしの まほう、\nぜんぶ あなたに あげる！ だから…！」"],
      ["gantetsu", "ガンテツ「たてよ、 ちびすけ！\nおめえの アンテナは そんな もんじゃ ねえだろ！」"],
      [null, "ポロじい「ほしの ゆうしゃよ… たちあがるのじゃ！」"],
      [null, "うおまさ「タコ…じゃなかった！ ポポ！ いけーっ！！」"],
      [null, "キングトゲ「ふん…！ おれさま いがいに まけるなよ、 ポポ！」"],
    ];
    for (const [who, line] of voices) {
      if (who && !Q.S.party.includes(who)) continue;
      yield* msg(line, 2.2);
    }
    // ひかり
    Q.snd.music("hope", { restart: true });
    B.dark = 0;
    for (let i = 0; i < 16; i++) { Q.flash(0.1, ["#ffffff", "#ffe040", "#ff69b4", "#7ad0ff"][i % 4]); yield 0.07; }
    for (const p of B.party) {
      const s = st(p);
      p.c.hp = s.maxhp;
      p.c.mp = s.maxmp;
      p.pose = "win";
      pop(p, s.maxhp, "#7aff9a");
    }
    yield 0.6;
    yield* msg("みんなの きもちが ひとつになり、\nポポの アンテナが にじいろに かがやいた！", 2.0);
    yield* msg("ポポたちの HPと MPが ぜんかいふく！", 1.2);
    const popo = Q.member("popo");
    popo.extraSkills = ["supernova"];
    Q.snd.play("buff");
    yield* msg("ポポは 「スーパーポポノヴァ」を ひらめいた！", 1.8);
    for (const p of B.party) p.pose = "idle";
  }

  // ================================================================ えんしゅつ (エフェクト)
  function addFx(f) { B.fx.push(f); return f; }
  function fxBurst(x, y, col, dur = 0.35, r = 14) {
    return { t: 0, dur, draw(g, t) {
      const k = t / dur;
      g.fillStyle = col;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const d = r * k;
        g.fillRect(Math.round(x + Math.cos(a) * d) - 1, Math.round(y + Math.sin(a) * d) - 1, 3, 3);
      }
      if (k < 0.4) { g.beginPath(); g.arc(x, y, r * 0.5 * (1 - k), 0, Math.PI * 2); g.fill(); }
    } };
  }
  function* playFx(type, src, targets, durOverride) {
    const [sx, sy] = centerOf(src);
    const T = targets.filter(Boolean).map((t) => centerOf(t));
    let dur = 0.4;
    const add = (draw, d = dur) => addFx({ t: 0, dur: d, draw });
    switch (type) {
      case "slash": case "bigslash": case "claw": {
        dur = type === "bigslash" ? 0.45 : 0.3;
        for (const [x, y] of T) add((g, t) => {
          const k = t / dur;
          g.strokeStyle = type === "claw" ? "#ff5a5a" : "#ffffff";
          g.lineWidth = type === "bigslash" ? 3 : 2;
          const n = type === "claw" ? 3 : type === "bigslash" ? 2 : 1;
          for (let i = 0; i < n; i++) {
            g.beginPath();
            const o = (i - (n - 1) / 2) * 6;
            g.moveTo(x - 14 + o, y - 14);
            g.lineTo(x - 14 + o + 28 * Math.min(1, k * 2), y - 14 + 28 * Math.min(1, k * 2));
            g.stroke();
          }
        });
        if (type === "bigslash") Q.shake(0.2, 3);
        break;
      }
      case "punch": case "bite": case "smash": case "homerun": case "drill": case "rocket": case "pebble": case "banana": case "snowball": {
        const proj = type === "pebble" || type === "banana" || type === "snowball" || type === "rocket";
        dur = proj ? 0.4 : 0.28;
        for (const [x, y] of T) {
          if (proj) add((g, t) => {
            const k = Math.min(1, t / (dur * 0.7));
            const px = sx + (x - sx) * k;
            const py = sy + (y - sy) * k - Math.sin(k * Math.PI) * (type === "rocket" ? 4 : 20);
            g.fillStyle = type === "banana" ? "#ffe040" : type === "snowball" ? "#ffffff" : type === "rocket" ? "#8a9ab8" : "#c8c0b0";
            const r = type === "rocket" ? 6 : 2.5;
            g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
            if (type === "rocket") { g.fillStyle = "#ff8a2a"; g.fillRect(px - 12 * Math.sign(x - sx || 1), py - 2, 6, 4); }
          });
          addFx(Object.assign(fxBurst(x, y, type === "smash" || type === "homerun" ? "#ffe040" : "#ffffff", 0.3, type === "smash" ? 22 : 14), { delay: proj ? dur * 0.7 : 0 }));
        }
        if (type === "smash" || type === "homerun") Q.shake(0.2, 3);
        break;
      }
      case "fire": case "bigfire": case "firecracker": case "breath": case "steam": {
        dur = type === "bigfire" ? 0.8 : type === "breath" ? 0.9 : 0.55;
        const col = type === "steam" ? ["#ffffff", "#d8d8e8"] : ["#ff5a1a", "#ffb030", "#ffe060"];
        if (type === "breath") {
          add((g, t) => {
            const k = t / dur;
            for (let i = 0; i < 26; i++) {
              const q = (k * 1.6 - i / 26);
              if (q < 0 || q > 1) continue;
              const tx = T[i % T.length][0];
              const ty = T[i % T.length][1];
              const x = sx + (tx - sx) * q;
              const y = sy + (ty - sy) * q + Math.sin(i * 2.1) * 8;
              g.fillStyle = col[i % 3];
              g.beginPath(); g.arc(x, y, 3 + q * 5, 0, Math.PI * 2); g.fill();
            }
          });
        }
        for (const [x, y] of T) add((g, t) => {
          const k = t / dur;
          const n = type === "bigfire" ? 14 : 8;
          for (let i = 0; i < n; i++) {
            const a = i * 2.4;
            const rr = (type === "bigfire" ? 18 : 10) * Math.min(1, k * 1.5);
            const px = x + Math.cos(a) * rr * 0.7;
            const py = y + 6 - k * 22 + Math.sin(a) * rr * 0.4 - (i % 3) * 3;
            g.fillStyle = col[i % col.length];
            g.globalAlpha = Math.max(0, 1 - k);
            g.beginPath(); g.arc(px, py, 2 + (1 - k) * 4, 0, Math.PI * 2); g.fill();
            g.globalAlpha = 1;
          }
        }, dur);
        if (type === "bigfire") Q.flash(0.15, "#ff8a3a");
        break;
      }
      case "ice": case "bigice": {
        dur = type === "bigice" ? 0.8 : 0.55;
        for (const [x, y] of T) add((g, t) => {
          const n = type === "bigice" ? 9 : 5;
          for (let i = 0; i < n; i++) {
            const k = Math.min(1, (t / dur) * 1.6 - i * 0.08);
            if (k <= 0) continue;
            const px = x + (i - n / 2) * 5;
            const py = y - 40 + k * 40;
            g.fillStyle = i % 2 ? "#c8f4ff" : "#7ad0ff";
            g.beginPath(); g.moveTo(px - 2, py - 8); g.lineTo(px + 2, py - 8); g.lineTo(px, py + 3); g.fill();
          }
        });
        if (type === "bigice") Q.flash(0.15, "#c8f4ff");
        break;
      }
      case "thunder": case "bigthunder": {
        dur = 0.5;
        for (const [x, y] of T) add((g, t) => {
          if (Math.floor(t * 30) % 2) return;
          g.strokeStyle = "#ffffa0";
          g.lineWidth = type === "bigthunder" ? 3 : 2;
          g.beginPath();
          let px = x;
          g.moveTo(px, 0);
          for (let yy = 0; yy < y; yy += 10) { px = x + (Math.random() - 0.5) * 12; g.lineTo(px, yy); }
          g.lineTo(x, y);
          g.stroke();
        });
        Q.flash(0.1, "#ffffc0");
        Q.shake(0.25, 2);
        break;
      }
      case "beam": case "bigbeam": case "darkbeam": case "nova": {
        dur = type === "nova" ? 1.6 : type === "bigbeam" ? 0.8 : 0.5;
        const w0 = type === "nova" ? 14 : type === "bigbeam" ? 7 : 3;
        const cols = type === "darkbeam" ? ["#a02aff", "#ffc0ff"] : type === "nova" ? ["#ff69b4", "#ffe040", "#7ad0ff", "#7aff9a", "#ffffff"] : ["#ff69b4", "#ffffff"];
        for (const [x, y] of T) add((g, t) => {
          const k = Math.min(1, t / (dur * 0.35));
          const ex = sx + (x - sx) * k;
          const ey = sy + (y - sy) * k;
          const wob = Math.sin(t * 60) * (w0 * 0.3);
          for (let i = 0; i < (type === "nova" ? 5 : 2); i++) {
            g.strokeStyle = cols[(i + Math.floor(t * 20)) % cols.length];
            g.lineWidth = Math.max(1, (w0 + wob) * (1 - i * 0.18));
            g.beginPath(); g.moveTo(sx - 4, sy - 4); g.lineTo(ex, ey); g.stroke();
          }
          if (k >= 1) { g.fillStyle = cols[Math.floor(t * 20) % cols.length]; g.beginPath(); g.arc(x, y, w0 * 1.6 + Math.sin(t * 40) * 2, 0, Math.PI * 2); g.fill(); }
        });
        Q.snd.play("beam");
        if (type !== "beam") Q.shake(dur * 0.7, type === "nova" ? 6 : 3);
        if (type === "nova") { Q.flash(0.4, "#ffffff"); }
        break;
      }
      case "heal": case "cheer": case "shield": case "charge": case "buff": {
        dur = durOverride || 0.55;
        for (const [x, y] of T) add((g, t) => {
          const k = t / dur;
          if (type === "shield") {
            g.strokeStyle = "#7ad0ff"; g.lineWidth = 2;
            g.beginPath(); g.arc(x, y, 6 + k * 12, 0, Math.PI * 2); g.stroke();
            return;
          }
          for (let i = 0; i < 8; i++) {
            const a = i * 0.8 + t * 6;
            const rr = type === "charge" ? 18 * (1 - k) : 10;
            const px = x + Math.cos(a) * rr;
            const py = type === "charge" ? y + Math.sin(a) * rr : y + 10 - k * 26 - (i % 3) * 4;
            g.fillStyle = type === "heal" ? (i % 2 ? "#7aff9a" : "#ffffff") : type === "charge" ? (i % 2 ? "#ffe040" : "#ff8aff") : (i % 2 ? "#ffe040" : "#ffffff");
            g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
          }
          if (type === "cheer" && k < 0.8) { g.fillStyle = "#ffe040"; g.beginPath(); g.moveTo(x, y - 18 - k * 8); g.lineTo(x - 4, y - 12 - k * 8); g.lineTo(x + 4, y - 12 - k * 8); g.fill(); }
        });
        break;
      }
      case "sleep": case "dark": {
        dur = 0.6;
        for (const [x, y] of T) add((g, t) => {
          const k = t / dur;
          if (type === "dark") { g.strokeStyle = "#a02aff"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 20 * (1 - k) + 2, 0, Math.PI * 2); g.stroke(); return; }
          G.drawText(g, "Z", x + 6 + k * 6, y - 10 - k * 14, "#ffffff", { outline: "#3a2a6a" });
          G.drawText(g, "Z", x + k * 4, y - 4 - k * 10, "#c8c8ff", { outline: "#3a2a6a" });
        });
        break;
      }
      case "quake": case "roar": case "missile": {
        dur = 0.6;
        Q.shake(0.5, type === "quake" ? 5 : 3);
        if (type === "quake") Q.snd.play("quake");
        if (type === "roar") { Q.snd.play("roar"); add((g, t) => { g.strokeStyle = "#ffffff"; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(sx, sy, ((t / dur) * 80 + i * 18) % 90, 0, Math.PI * 2); g.stroke(); } }); }
        for (const [x, y] of T) {
          if (type === "missile") add((g, t) => {
            const k = Math.min(1, t / (dur * 0.7));
            const px = sx + (x - sx) * k;
            const py = sy + (y - sy) * k;
            g.fillStyle = "#f8f4ea"; g.beginPath(); g.moveTo(px + 5, py); g.lineTo(px - 4, py - 3); g.lineTo(px - 4, py + 3); g.fill();
          });
          if (type === "quake") add((g, t) => { g.fillStyle = "#b8a080"; for (let i = 0; i < 5; i++) g.fillRect(x - 10 + i * 5, y + 12 - (t / dur) * 10 * ((i % 2) + 1), 3, 3); });
        }
        break;
      }
      case "explode": case "darknova": case "meteor": {
        dur = type === "darknova" ? 1.4 : 0.9;
        if (type === "meteor") {
          T.forEach(([x, y], i) => add((g, t) => {
            const k = Math.min(1, Math.max(0, t / (dur * 0.6) - i * 0.12));
            if (k <= 0) return;
            const px = x - 60 + 60 * k;
            const py = y - 90 + 90 * k;
            g.fillStyle = "#ffe040"; g.beginPath(); g.arc(px, py, 5, 0, Math.PI * 2); g.fill();
            g.fillStyle = "#ff8a3a"; g.fillRect(px - 10, py - 10, 6, 6);
            if (k >= 1) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); }
          }));
          Q.snd.play("explode");
        } else {
          for (const [x, y] of T) add((g, t) => {
            const k = t / dur;
            g.fillStyle = type === "darknova" ? (Math.floor(t * 20) % 2 ? "#a02aff" : "#1a0030") : (Math.floor(t * 20) % 2 ? "#ffe040" : "#ff5a1a");
            g.globalAlpha = 1 - k;
            g.beginPath(); g.arc(x, y, 4 + k * (type === "darknova" ? 40 : 22), 0, Math.PI * 2); g.fill();
            g.globalAlpha = 1;
          });
          Q.snd.play("explode");
          Q.flash(0.25, type === "darknova" ? "#a02aff" : "#ffd040");
        }
        Q.shake(0.6, 5);
        break;
      }
      default:
        dur = 0.2;
    }
    yield durOverride || dur;
  }

  // ================================================================ 更新 と 描画
  function update(dt) {
    if (!B) return;
    B.t += dt;
    for (const u of [...B.enemies, ...B.party]) {
      if (u.flash > 0) u.flash -= dt;
      if (u.shake > 0) u.shake -= dt;
      if (u.poseT > 0) { u.poseT -= dt; if (u.poseT <= 0 && u.pose === "hurt" && u.alive) u.pose = "idle"; }
      if (u.dieT >= 0) u.dieT += dt;
      if (u.appearT > 0) u.appearT -= dt;
    }
    for (const p of B.pops) p.t += dt;
    B.pops = B.pops.filter((p) => p.t < 1.1);
    for (const f of B.fx) f.t += dt;
    B.fx = B.fx.filter((f) => f.t < f.dur + (f.delay || 0));
    if (B.msg) B.msgT += dt;
  }

  function draw(g) {
    if (!B) return;
    const bg = Q.tiles.battleBg(B.bg);
    g.drawImage(bg, 0, 0);
    // ボスの オーラ
    if (B.aura) {
      g.globalAlpha = 0.25 + Math.sin(B.t * 4) * 0.1;
      g.fillStyle = "#5a0a6a";
      g.fillRect(0, 0, W, FIELD_H);
      g.globalAlpha = 1;
    }
    if (B.dark) { g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, 0, W, FIELD_H); }
    // てき
    for (const e of B.enemies) {
      if (!e.alive && (e.dieT < 0 || e.dieT > (e.dieDur || 0.6))) continue;
      const w = e.img.width * e.scale;
      const h = e.img.height * e.scale;
      let x = e.x - w / 2 + e.lunge;
      let y = e.y - h;
      if (e.shake > 0) x += Math.round(Math.sin(e.shake * 80) * 2);
      const breathe = e.alive ? Math.sin(B.t * 2.4 + e.idx) : 0;
      const sy = 1 + breathe * 0.025;
      const hh = h * sy;
      y = e.y - hh;
      if (e.d.fly) y -= 12 + Math.sin(B.t * 3 + e.idx) * 3;
      if (e.appearT > 0) g.globalAlpha = 1 - e.appearT / 1.2;
      // かげ
      if (!e.d.fly || true) {
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.beginPath(); g.ellipse(e.x + e.lunge, e.y - 1, w * 0.4, 3, 0, 0, Math.PI * 2); g.fill();
      }
      if (e.dieT >= 0) {
        // しんだ: あかく そまって 消える (ボスは ながめ)
        const k = e.dieT / (e.dieDur || 0.6);
        g.globalAlpha = Math.max(0, 1 - k);
        g.drawImage(G.silhouette(e.img, "#ff4a8a"), Math.round(x), Math.round(y + k * 6), w, hh);
        g.globalAlpha = 1;
        continue;
      }
      // ボスの オーラ (しんのすがた)
      if (e.d.final === 2) {
        const glow = cachedGlow(e.img);
        g.globalAlpha = 0.5 + Math.sin(B.t * 6) * 0.3;
        g.drawImage(glow, Math.round(x) - 2, Math.round(y) - 2, w + 4, hh + 4);
        g.globalAlpha = e.appearT > 0 ? 1 - e.appearT / 1.2 : 1;
      }
      g.drawImage(e.img, Math.round(x), Math.round(y), Math.round(w), Math.round(hh));
      if (e.flash > 0 && Math.floor(e.flash * 30) % 2 === 0) {
        g.globalAlpha = 0.85;
        g.drawImage(G.silhouette(e.img, "#ffffff"), Math.round(x), Math.round(y), Math.round(w), Math.round(hh));
      }
      g.globalAlpha = 1;
      if (e.status.sleep && Math.floor(B.t * 2) % 2) G.drawText(g, "Z", Math.round(x + w - 4), Math.round(y), "#ffffff", { outline: "#3a2a6a" });
      if (e.fuse != null && e.alive) G.drawText(g, String(e.fuse), Math.round(x + w / 2 + 2), Math.round(y - 10), "#ff4a4a", { outline: "#000", scale: 2 });
    }
    // なかま
    for (const m of B.party) {
      let pose = m.pose;
      if (!m.alive) pose = "ko";
      else if (pose === "idle" && m.c.hp < Q.statsOf(m.c).maxhp * 0.25) pose = "hurt";
      if (pose === "idle" && B.active === m) pose = Math.floor(B.t * 4) % 2 ? "step" : "idle";
      const img = Q.chars.battle(m.id, pose, Math.floor(B.t * 4));
      let x = m.homeX + m.ox - img.width / 2;
      const y = m.homeY - img.height + 8;
      if (m.shake > 0) x += Math.round(Math.sin(m.shake * 80) * 2);
      if (B.active === m) x -= 8;
      g.drawImage(img, Math.round(x), Math.round(y));
      if (m.flash > 0 && Math.floor(m.flash * 30) % 2 === 0) {
        g.globalAlpha = 0.6;
        g.drawImage(G.silhouette(img, "#ff3a3a"), Math.round(x), Math.round(y));
        g.globalAlpha = 1;
      }
      if (m.status.sleep && Math.floor(B.t * 2) % 2) G.drawText(g, "Z", Math.round(x), Math.round(y - 4), "#ffffff", { outline: "#3a2a6a" });
      if (m.buffs.atk) G.drawText(g, "+", Math.round(x + img.width - 6), Math.round(y), "#ffe040", { outline: "#000" });
      if (m.status.poison || m.c.poison) if (m.alive && Math.floor(B.t * 3) % 2) G.drawText(g, "*", Math.round(x + 2), Math.round(y + 4), "#c070ff", { outline: "#000" });
    }
    // エフェクト
    for (const f of B.fx) {
      const t = f.t - (f.delay || 0);
      if (t < 0) continue;
      g.save();
      f.draw(g, t);
      g.restore();
    }
    // ダメージの すうじ
    for (const p of B.pops) {
      const bounce = p.t < 0.3 ? -Math.sin((p.t / 0.3) * Math.PI) * 10 : 0;
      const a = p.t > 0.9 ? Math.max(0, 1 - (p.t - 0.9) / 0.2) : 1;
      g.globalAlpha = a;
      G.drawText(g, p.text, p.x, Math.round(p.y + bounce), p.color, { outline: "#1a1020", align: "center", scale: p.big ? 2 : 1 });
      g.globalAlpha = 1;
    }
    // ねらいの カーソル (てき)
    const cur = B.cursor;
    if (cur) {
      const list = cur.all ? (cur.kind === "enemies" ? B.enemies.filter((e) => e.alive) : B.party.filter((p) => p.alive)) : [cur.target];
      if (!cur.all || Math.floor(B.t * 6) % 2) {
        for (const u of list) {
          const [x, y] = centerOf(u);
          const cx = u.side === "e" ? x - (u.img.width * u.scale) / 2 - 4 : x - 22;
          g.save();
          g.translate(Math.round(cx + Math.sin(B.t * 10) * 1.5), Math.round(y - 4));
          if (u.side === "e") { g.scale(-1, 1); g.translate(-10, 0); }
          g.drawImage(cursorSprite(), 0, 0);
          g.restore();
        }
      }
    }
  }
  const glowCache = new Map();
  function cachedGlow(img) {
    if (!glowCache.has(img)) {
      const s = G.silhouette(img, "#c040ff");
      glowCache.set(img, s);
    }
    return glowCache.get(img);
  }
  let curSpr = null;
  function cursorSprite() {
    if (!curSpr) curSpr = G.paint(11, 9, (P) => { P.r(0, 3, 6, 3, "#ffffff"); P.ell(7, 4.5, 3, 3, "#c070ff"); }, { outline: true });
    return curSpr;
  }

  // たかい かいぞうどの UI (ステータス・メッセージ)
  function drawHi(c) {
    if (!B) return;
    // メッセージ
    if (B.msg) {
      const lines = Q.wrap(B.msg, 232, 10);
      const h = lines.length * 14 + 10;
      G.drawWindow(c, 4, 4, W - 8, h);
      lines.forEach((l, i) => G.jtext(c, l, 12, 9 + i * 14, "#ffffff", { size: 10 }));
    }
    // なかまの ステータス
    const x0 = 80;
    G.drawWindow(c, x0, FIELD_H + 2, W - x0 - 4, H - FIELD_H - 6);
    B.party.forEach((m, i) => {
      const y = FIELD_H + 8 + i * 15;
      const s = Q.statsOf(m.c);
      const ko = !m.alive;
      const low = !ko && m.c.hp < s.maxhp * 0.25;
      const col = ko ? "#ff6a6a" : low ? "#ffd040" : "#ffffff";
      if (B.active === m) { c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x0 + 4, y - 1, W - x0 - 12, 14); }
      G.jtext(c, m.name, x0 + 8, y, B.active === m ? "#ffe890" : col, { size: 10 });
      G.jtext(c, `${m.c.hp}`, x0 + 98, y, col, { size: 10, align: "right" });
      G.jtext(c, `/${s.maxhp}`, x0 + 100, y + 2, "#c8c8e8", { size: 8 });
      // HP バー
      const bw = 34;
      c.fillStyle = "#101030"; c.fillRect(x0 + 62, y + 11, bw, 2);
      c.fillStyle = low ? "#ffd040" : "#5af07a"; c.fillRect(x0 + 62, y + 11, Math.round(bw * Math.max(0, m.c.hp) / s.maxhp), 2);
      G.jtext(c, `MP ${m.c.mp}`, x0 + 128, y, "#a8d8ff", { size: 9 });
      if (m.status.sleep) G.jtext(c, "ねむり", x0 + 158, y + 1, "#c8c8ff", { size: 8 });
      else if (m.status.poison || m.c.poison) G.jtext(c, "どく", x0 + 158, y + 1, "#d090ff", { size: 8 });
    });
    // てきの なまえ (コマンド中で ないとき)
    const cmdOpen = Q.ui.some((w) => w instanceof Q.Menu && !w.o.hidden);
    if (!cmdOpen) {
      G.drawWindow(c, 4, FIELD_H + 2, 74, H - FIELD_H - 6);
      const names = {};
      for (const e of B.enemies) if (e.alive) names[e.d.name] = (names[e.d.name] || 0) + 1;
      Object.entries(names).slice(0, 4).forEach(([n, k], i) => {
        G.jtext(c, n.length > 6 ? n.slice(0, 6) + "…" : n, 10, FIELD_H + 8 + i * 15, "#ffffff", { size: 9 });
        if (k > 1) G.jtext(c, `${k}`, 72, FIELD_H + 8 + i * 15, "#ffffff", { size: 9, align: "right" });
      });
    }
    // ねらい中の てきの なまえ
    if (B.cursor && !B.cursor.all && B.cursor.target) {
      const n = B.cursor.target.name;
      G.drawWindow(c, 4, FIELD_H - 22, G.jwidth(c, n, 10) + 16, 20);
      G.jtext(c, n, 12, FIELD_H - 18, "#ffffff", { size: 10 });
    }
  }

  Q.battle = { fight, encounter, get B() { return B; } };
})();
