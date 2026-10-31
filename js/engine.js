// エンジン: 画面・入力・コルーチン (イベントを順番に書ける仕組み)・ウインドウ・セーブ・なかまの ステータス
(() => {
  "use strict";
  const G = Q.gfx;
  const D = Q.data;
  const W = 256;
  const H = 224;
  Q.W = W;
  Q.H = H;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scr = G.canvasOf(W, H); // ドット絵を描く低解像度の画面
  const sctx = scr.getContext("2d");
  const mos = G.canvasOf(W, H);
  const mctx = mos.getContext("2d");
  let K = 1;
  Q.ctx = ctx;
  Q.scr = scr;
  Q.sctx = sctx;

  // ---------------------------------------------------------------- 入力
  // a = けってい (Z / Space / Enter), b = キャンセル・メニュー (X / Esc / Shift), menu = START
  const Input = window.PopoInput;
  const MAP = { a: "jump", b: "run", menu: "start", up: "up", down: "down", left: "left", right: "right" };
  const holdT = {};
  let bot = null; // テスト用
  const In = {
    held: (b) => (bot ? !!bot.held[b] : Input.held(MAP[b])),
    pressed: (b) => (bot ? !!bot.pressed[b] : Input.pressed(MAP[b])),
    // カーソル用: おしっぱなしで くりかえし
    rep(b) {
      if (In.pressed(b)) return true;
      const t = holdT[b] || 0;
      return t > 0.32 && Math.floor((t - 0.32) / 0.09) !== Math.floor((t - 0.32 - Q.dt) / 0.09);
    },
    update(dt) {
      for (const b of ["up", "down", "left", "right"]) holdT[b] = In.held(b) ? (holdT[b] || 0) + dt : 0;
    },
    setBot(b) { bot = b; },
  };
  Q.In = In;
  Q.dt = 1 / 60;

  // ---------------------------------------------------------------- コルーチン
  class Task {
    constructor(gen) { this.gen = gen; this.wait = null; this.done = false; this.value = undefined; }
  }
  const tasks = [];
  function waiterOf(v) {
    if (v === undefined || v === null) { let f = false; return { update: () => { const r = f; f = true; return r; } }; }
    if (typeof v === "number") { let t = v; return { update(dt) { t -= dt; return t <= 0; } }; }
    if (typeof v === "function") return { update: v };
    if (v instanceof Task) return { update: () => v.done, get value() { return v.value; } };
    if (v.isWidget) return { update: () => v.closed, get value() { return v.result; } };
    if (v.update) return v;
    throw new Error("bad yield: " + v);
  }
  function stepTask(t, dt) {
    if (t.done) return;
    let val;
    if (t.wait) {
      if (!t.wait.update(dt)) return;
      val = t.wait.value;
      t.wait = null;
    }
    for (let i = 0; i < 500; i++) {
      let r;
      try { r = t.gen.next(val); } catch (e) { console.error(e); t.done = true; t.error = e; Q.lastError = e; return; }
      if (r.done) { t.done = true; t.value = r.value; return; }
      const w = waiterOf(r.value);
      if (r.value !== undefined && r.value !== null && w.update(0)) { val = w.value; continue; }
      t.wait = w;
      return;
    }
  }
  function run(gen) {
    const t = new Task(gen);
    tasks.push(t);
    stepTask(t, 0);
    return t;
  }
  Q.Task = Task;
  Q.run = run;

  // ---------------------------------------------------------------- ウインドウ類
  const ui = [];
  Q.ui = ui;
  function topWidget() { return ui[ui.length - 1]; }
  function push(w) { ui.push(w); return w; }
  function remove(w) { const i = ui.indexOf(w); if (i >= 0) ui.splice(i, 1); }

  // 日本語の おりかえし (スペースで くぎる。長い語は 文字で きる)
  function wrap(text, width, size) {
    const out = [];
    for (const para of String(text).split("\n")) {
      let line = "";
      const words = para.split(/(?<= )/);
      for (const w of words) {
        if (G.jwidth(ctx, line + w, size) <= width) { line += w; continue; }
        if (line) { out.push(line.trimEnd()); line = ""; }
        let cur = "";
        for (const ch of w) {
          if (G.jwidth(ctx, cur + ch, size) > width && cur) { out.push(cur); cur = ""; }
          cur += ch;
        }
        line = cur;
      }
      out.push(line.trimEnd());
    }
    return out;
  }
  Q.wrap = wrap;

  // メッセージウインドウ
  class MsgWin {
    constructor(text, o = {}) {
      this.isWidget = true;
      this.o = o;
      this.size = 10;
      this.lineH = 15;
      this.x = 8;
      this.w = W - 16;
      this.maxLines = o.lines || 3;
      this.h = this.maxLines * this.lineH + 14;
      this.y = o.pos === "top" ? 8 : o.pos === "mid" ? 70 : H - this.h - 8;
      const tx = this.textX();
      const pages = Array.isArray(text) ? text : String(text).split("\f");
      this.pages = [];
      for (const p of pages) {
        const lines = wrap(p, this.x + this.w - 10 - tx, this.size);
        for (let i = 0; i < lines.length; i += this.maxLines) this.pages.push(lines.slice(i, i + this.maxLines));
      }
      this.page = 0;
      this.shown = 0;
      this.t = 0;
      this.closed = false;
      this.result = null;
      this.speed = o.speed || 46;
      this.blip = 0;
    }
    textX() { return this.x + (this.o.face ? 46 : 10); }
    pageLen() { return this.pages[this.page].reduce((a, l) => a + l.length, 0); }
    update(dt, active) {
      this.t += dt;
      const len = this.pageLen();
      if (this.shown < len) {
        const sp = In.held("a") || In.held("b") ? this.speed * 3 : this.speed;
        const before = Math.floor(this.shown);
        this.shown = Math.min(len, this.shown + sp * dt);
        if (Math.floor(this.shown) !== before && this.o.voice !== false && (this.blip++ % 3 === 0)) Q.snd.play("talk");
        if (active && In.pressed("a") && this.shown > 2) this.shown = len;
        return;
      }
      if (this.o.auto != null) {
        this.autoT = (this.autoT || 0) + dt;
        if (this.autoT >= this.o.auto) this.next();
        return;
      }
      if (this.o.hold) return; // 外から とじる (はい/いいえ と いっしょに出すとき)
      if (active && (In.pressed("a") || In.pressed("b"))) this.next();
    }
    next() {
      this.autoT = 0;
      if (this.page < this.pages.length - 1) { this.page++; this.shown = 0; Q.snd.play("cursor"); }
      else { this.closed = true; remove(this); }
    }
    close() { this.closed = true; remove(this); }
    draw(c) {
      G.drawWindow(c, this.x, this.y, this.w, this.h);
      let tx = this.textX();
      if (this.o.face) {
        c.drawImage(Q.chars.face(this.o.face), this.x + 8, this.y + 10, 32, 32);
      }
      let ty = this.y + 8;
      if (this.o.name) {
        G.jtext(c, this.o.name, this.x + 8, this.y - 6, "#ffe890", { size: 9, outline: "#1a1040", outlineWidth: 3, shadow: false });
      }
      let left = Math.floor(this.shown);
      for (const line of this.pages[this.page]) {
        const s = line.slice(0, Math.max(0, left));
        left -= line.length;
        G.jtext(c, s, tx, ty, "#ffffff", { size: this.size });
        ty += this.lineH;
      }
      const done = this.shown >= this.pageLen();
      if (done && this.o.auto == null && !this.o.hold && Math.floor(this.t * 3) % 2 === 0) {
        G.jtext(c, "▼", this.x + this.w - 16, this.y + this.h - 13, "#ffffff", { size: 8 });
      }
    }
  }

  // えらぶ メニュー
  class Menu {
    constructor(items, o = {}) {
      this.isWidget = true;
      this.items = items.map((it) => (typeof it === "string" ? { label: it, value: it } : it));
      this.o = o;
      this.cols = o.cols || 1;
      this.rowH = o.rowH || 14;
      this.size = o.size || 10;
      this.cur = Math.max(0, Math.min(this.items.length - 1, o.cur || 0));
      this.rowsVisible = o.rows || Math.ceil(this.items.length / this.cols);
      this.scroll = 0;
      this.w = o.w || this.autoWidth();
      this.h = o.h || this.rowsVisible * this.rowH + 12 + (o.title ? 14 : 0);
      this.x = o.x ?? 8;
      this.y = o.y ?? 8;
      this.picked = undefined;
      this.closed = false;
      this.result = undefined;
      this.t = 0;
      this.active = true;
      this.fixScroll();
    }
    autoWidth() {
      let m = 0;
      for (const it of this.items) m = Math.max(m, G.jwidth(ctx, it.label, this.size) + (it.right ? G.jwidth(ctx, String(it.right), this.size) + 12 : 0));
      if (this.o.title) m = Math.max(m, G.jwidth(ctx, this.o.title, 9));
      return Math.ceil(m * this.cols + 28 + (this.cols - 1) * 14);
    }
    fixScroll() {
      const row = Math.floor(this.cur / this.cols);
      if (row < this.scroll) this.scroll = row;
      if (row >= this.scroll + this.rowsVisible) this.scroll = row - this.rowsVisible + 1;
    }
    choose() {
      this.picked = undefined;
      this.active = true;
      const self = this;
      return { update: () => self.picked !== undefined, get value() { return self.picked; } };
    }
    update(dt, top) {
      this.t += dt;
      if (!top || !this.active || this.picked !== undefined) return;
      const n = this.items.length;
      if (!n) { if (In.pressed("b") || In.pressed("a")) this.pick(null); return; }
      const old = this.cur;
      if (In.rep("down")) this.cur = this.cur + this.cols < n ? this.cur + this.cols : (this.o.wrap === false ? this.cur : this.cur % this.cols);
      if (In.rep("up")) this.cur = this.cur - this.cols >= 0 ? this.cur - this.cols : (this.o.wrap === false ? this.cur : Math.min(n - 1, this.cur + this.cols * (Math.ceil(n / this.cols) - 1)));
      if (this.cols > 1) {
        if (In.rep("right") && this.cur % this.cols < this.cols - 1 && this.cur + 1 < n) this.cur++;
        if (In.rep("left") && this.cur % this.cols > 0) this.cur--;
      } else if (this.o.pageLR) {
        if (In.rep("right")) this.cur = Math.min(n - 1, this.cur + this.rowsVisible);
        if (In.rep("left")) this.cur = Math.max(0, this.cur - this.rowsVisible);
      }
      if (old !== this.cur) { Q.snd.play("cursor"); this.fixScroll(); if (this.o.onMove) this.o.onMove(this.items[this.cur], this.cur); }
      if (In.pressed("a")) {
        const it = this.items[this.cur];
        if (it.disabled) { Q.snd.play("buzz"); return; }
        Q.snd.play("select");
        this.pick(it.value !== undefined ? it.value : this.cur);
      } else if (In.pressed("b") && this.o.cancel !== false) {
        Q.snd.play("cancel");
        this.pick(null);
      }
    }
    pick(v) { this.picked = v; this.result = v; this.active = false; }
    close() { this.closed = true; remove(this); }
    get current() { return this.items[this.cur]; }
    draw(c) {
      if (this.o.hidden) return;
      G.drawWindow(c, this.x, this.y, this.w, this.h, { theme: this.o.theme });
      let y0 = this.y + 7;
      if (this.o.title) {
        G.jtext(c, this.o.title, this.x + this.w / 2, y0 - 1, "#ffe890", { size: 9, align: "center" });
        y0 += 14;
      }
      const colW = (this.w - 16) / this.cols;
      const first = this.scroll * this.cols;
      const last = Math.min(this.items.length, first + this.rowsVisible * this.cols);
      for (let i = first; i < last; i++) {
        const it = this.items[i];
        const r = Math.floor(i / this.cols) - this.scroll;
        const cc = i % this.cols;
        const x = this.x + 18 + cc * colW;
        const y = y0 + r * this.rowH;
        const col = it.disabled ? "#8a8aa8" : it.color || "#ffffff";
        G.jtext(c, it.label, x, y, col, { size: this.size });
        if (it.right != null) G.jtext(c, String(it.right), x + colW - 12, y, it.disabled ? "#8a8aa8" : it.rightColor || "#ffffff", { size: this.size, align: "right" });
        if (i === this.cur && (this.active || this.o.showCursor)) G.drawCursor(c, x - 2, y + 2, this.active ? this.t : 0);
      }
      // スクロールの しるし
      const rows = Math.ceil(this.items.length / this.cols);
      if (this.scroll > 0) G.jtext(c, "▲", this.x + this.w - 14, this.y + 3, "#ffffff", { size: 7 });
      if (this.scroll + this.rowsVisible < rows) G.jtext(c, "▼", this.x + this.w - 14, this.y + this.h - 11, "#ffffff", { size: 7 });
    }
  }

  // じゆうに描ける パネル (ステータス画面など)
  class Panel {
    constructor(drawFn, o = {}) { this.isWidget = true; this.drawFn = drawFn; this.o = o; this.closed = false; this.t = 0; }
    update(dt, top) {
      this.t += dt;
      if (this.o.waitKey && top && (In.pressed("a") || In.pressed("b"))) { this.result = In.pressed("a") ? "a" : "b"; this.close(); }
    }
    close() { this.closed = true; remove(this); }
    draw(c) { this.drawFn(c, this.t); }
  }

  Q.MsgWin = MsgWin;
  Q.Menu = Menu;
  Q.Panel = Panel;
  Q.push = push;
  Q.remove = remove;

  // ---- イベントで つかう 便利な ジェネレータ
  function* say(text, o = {}) {
    if (typeof o === "string") o = { name: o };
    const m = push(new MsgWin(text, o));
    yield m;
  }
  // 話者つき: talk("popo", "...")
  function* talk(who, text, o = {}) {
    const name = (D.PARTY[who] && D.PARTY[who].name) || o.name || who;
    yield* say(text, Object.assign({ name, face: Q.chars.LOOKS[who] || who === "popo" ? who : null }, o));
  }
  function* select(items, o = {}) {
    const m = push(new Menu(items, o));
    const v = yield m.choose();
    m.close();
    return v;
  }
  // はい / いいえ
  function* ask(text, o = {}) {
    const msg = push(new MsgWin(text, Object.assign({ hold: true }, o)));
    yield () => msg.shown >= msg.pageLen() && msg.page === msg.pages.length - 1;
    const v = yield* select([{ label: o.yes || "はい", value: true }, { label: o.no || "いいえ", value: false }], { x: W - 70, y: msg.y - 48, cancel: true });
    msg.close();
    return v === true;
  }
  Q.say = say;
  Q.talk = talk;
  Q.select = select;
  Q.ask = ask;

  // ---------------------------------------------------------------- 画面効果
  const fx = { fade: 0, fadeCol: "#000000", mosaic: 1, shakeT: 0, shakeA: 0, flashT: 0, flashCol: "#ffffff", flashMax: 0.1 };
  Q.fx = fx;
  function* fadeOut(t = 0.35, col = "#000000") {
    fx.fadeCol = col;
    const s = fx.fade;
    for (let e = 0; e < t; e += Q.dt) { fx.fade = s + (1 - s) * (e / t); yield; }
    fx.fade = 1;
  }
  function* fadeIn(t = 0.35) {
    const s = fx.fade;
    for (let e = 0; e < t; e += Q.dt) { fx.fade = s * (1 - e / t); yield; }
    fx.fade = 0;
  }
  function shake(t = 0.3, a = 3) { fx.shakeT = Math.max(fx.shakeT, t); fx.shakeA = a; }
  function flash(t = 0.12, col = "#ffffff") { fx.flashT = t; fx.flashMax = t; fx.flashCol = col; }
  Q.fadeOut = fadeOut;
  Q.fadeIn = fadeIn;
  Q.shake = shake;
  Q.flash = flash;

  // ---------------------------------------------------------------- ゲームの状態 (セーブされる)
  const SAVE_PREFIX = "popoquest.save";
  function newState() {
    const S = {
      v: 1,
      party: ["popo", "yuta"],
      chars: {},
      gold: 30,
      items: { berry: 3, niboshi: 2 },
      flags: {},
      map: "yutaroom",
      x: 5, y: 5, dir: 0,
      lastTown: { map: "village", x: 12, y: 21 },
      time: 0,
      steps: 0,
      book: {},
      ufo: false,
      wins: 0,
    };
    for (const id of Object.keys(D.PARTY)) S.chars[id] = newChar(id, 1);
    return S;
  }
  function newChar(id, lv) {
    const P = D.PARTY[id];
    const c = { id, lv: 1, exp: 0, hp: 1, mp: 0, equip: Object.assign({}, P.equip), poison: false };
    setLevel(c, lv);
    const st = statsOf(c);
    c.hp = st.maxhp;
    c.mp = st.maxmp;
    return c;
  }
  function setLevel(c, lv) {
    c.lv = lv;
    c.exp = Math.max(c.exp, D.EXP[lv] || 0);
  }
  // ステータスの けいさん (きほん + せいちょう + そうび)
  function baseStat(id, lv, k) {
    const P = D.PARTY[id];
    return Math.floor(P.base[k] + P.grow[k] * (lv - 1) + (k === "hp" ? (lv - 1) * (lv - 1) * 0.06 : 0));
  }
  function statsOf(c) {
    const s = {
      maxhp: baseStat(c.id, c.lv, "hp"), maxmp: baseStat(c.id, c.lv, "mp"),
      atk: baseStat(c.id, c.lv, "atk"), def: baseStat(c.id, c.lv, "def"),
      mag: baseStat(c.id, c.lv, "mag"), spd: baseStat(c.id, c.lv, "spd"),
      crit: 1 / 24, resist: [], nosleep: false,
    };
    for (const slot of ["w", "a", "x"]) {
      const it = c.equip[slot] && D.ITEMS[c.equip[slot]];
      if (!it) continue;
      for (const k of ["atk", "def", "mag", "spd"]) if (it[k]) s[k] += it[k];
      if (it.crit) s.crit += it.crit;
      if (it.resist) s.resist.push(it.resist);
      if (it.nosleep) s.nosleep = true;
    }
    return s;
  }
  function skillsOf(c) {
    return D.PARTY[c.id].skills.filter(([lv]) => c.lv >= lv).map(([, id]) => id).concat(c.extraSkills || []);
  }
  Q.newState = newState;
  Q.newChar = newChar;
  Q.statsOf = statsOf;
  Q.skillsOf = skillsOf;
  Q.S = newState();

  Q.member = (id) => Q.S.chars[id];
  Q.party = () => Q.S.party.map((id) => Q.S.chars[id]);
  Q.flag = (k, v) => { if (v === undefined) return Q.S.flags[k]; Q.S.flags[k] = v; return v; };
  Q.addItem = (id, n = 1) => { Q.S.items[id] = (Q.S.items[id] || 0) + n; if (Q.S.items[id] <= 0) delete Q.S.items[id]; };
  Q.hasItem = (id) => (Q.S.items[id] || 0) > 0 || Q.party().some((c) => Object.values(c.equip).includes(id));
  Q.itemCount = (id) => Q.S.items[id] || 0;

  // なかまに くわわる (レベルは パーティの へいきんに あわせる)
  Q.join = (id) => {
    if (Q.S.party.includes(id)) return;
    const avg = Math.round(Q.party().reduce((a, c) => a + c.lv, 0) / Q.party().length);
    const c = Q.S.chars[id];
    if (c.lv < avg - 1) {
      setLevel(c, avg - 1);
      const st = statsOf(c);
      c.hp = st.maxhp;
      c.mp = st.maxmp;
    }
    Q.S.party.push(id);
  };

  // けいけんち: レベルアップの メッセージを かえす
  Q.gainExp = (c, n) => {
    const msgs = [];
    c.exp += n;
    while (c.lv < D.MAXLV && c.exp >= D.EXP[c.lv + 1]) {
      const before = statsOf(c);
      const oldSkills = skillsOf(c);
      c.lv++;
      const after = statsOf(c);
      c.hp += after.maxhp - before.maxhp;
      c.mp += after.maxmp - before.maxmp;
      const name = D.PARTY[c.id].name;
      let m = `${name}は レベル${c.lv}に あがった！`;
      const parts = [];
      if (after.maxhp > before.maxhp) parts.push(`HP+${after.maxhp - before.maxhp}`);
      if (after.maxmp > before.maxmp) parts.push(`MP+${after.maxmp - before.maxmp}`);
      if (after.atk > before.atk) parts.push(`ちから+${after.atk - before.atk}`);
      if (after.def > before.def) parts.push(`まもり+${after.def - before.def}`);
      if (after.mag > before.mag) parts.push(`まりょく+${after.mag - before.mag}`);
      if (after.spd > before.spd) parts.push(`すばやさ+${after.spd - before.spd}`);
      m += "\n" + parts.join(" ");
      msgs.push(m);
      for (const sk of skillsOf(c)) if (!oldSkills.includes(sk)) msgs.push(`${name}は 「${D.SKILLS[sk].name}」を おぼえた！`);
    }
    return msgs;
  };

  Q.healAll = () => {
    for (const c of Q.party()) {
      const st = statsOf(c);
      c.hp = st.maxhp;
      c.mp = st.maxmp;
      c.poison = false;
    }
  };

  // ---- セーブ / ロード
  function saveTo(slot) {
    try {
      Q.S.savedAt = Date.now();
      localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(Q.S));
      return true;
    } catch (e) { return false; }
  }
  function loadFrom(slot) {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_PREFIX + slot));
      if (!s || !s.chars) return null;
      const base = newState();
      return Object.assign(base, s, { chars: Object.assign(base.chars, s.chars) });
    } catch (e) { return null; }
  }
  function saveInfo(slot) {
    const s = loadFrom(slot);
    if (!s) return null;
    const lead = s.chars[s.party[0]];
    return { lv: lead.lv, name: D.PARTY[lead.id].name, place: s.placeName || "", time: s.time || 0 };
  }
  Q.saveTo = saveTo;
  Q.loadFrom = loadFrom;
  Q.saveInfo = saveInfo;
  Q.SLOTS = 3;
  Q.fmtTime = (t) => {
    const m = Math.floor(t / 60);
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  };

  // ---------------------------------------------------------------- シーン と メインループ
  Q.scene = null;
  Q.setScene = (s) => { Q.scene = s; if (s && s.enter) s.enter(); };
  Q.busy = () => ui.length > 0 || (Q.event && !Q.event.done);
  Q.runEvent = (gen) => { Q.event = run(gen); return Q.event; };

  let frozen = false;
  let last = performance.now();
  Q.frame = 0;
  function frame(now) {
    const dt = Math.min(1 / 20, (now - last) / 1000);
    last = now;
    if (!frozen) tick(dt);
    draw();
    requestAnimationFrame(frame);
  }
  function tick(dt) {
    Q.dt = dt;
    Input.update();
    In.update(dt);
    Q.frame++;
    Q.wasBusy = Q.busy(); // この フレームの はじめに ウインドウや イベントが あったら、 フィールドは 入力を うけない
    if (Q.S) Q.S.time += dt;
    const top = topWidget();
    for (const w of ui.slice()) w.update(dt, w === top);
    for (const t of tasks.slice()) stepTask(t, dt);
    for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].done) tasks.splice(i, 1);
    if (Q.scene && Q.scene.update) Q.scene.update(dt);
    if (fx.shakeT > 0) fx.shakeT -= dt;
    if (fx.flashT > 0) fx.flashT -= dt;
  }
  Q.tick = tick;
  function draw() {
    sctx.imageSmoothingEnabled = false;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.fillStyle = "#000";
    sctx.fillRect(0, 0, W, H);
    if (Q.scene && Q.scene.draw) Q.scene.draw(sctx);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.imageSmoothingEnabled = false;
    let ox = 0;
    let oy = 0;
    if (fx.shakeT > 0) { ox = Math.round((Math.random() * 2 - 1) * fx.shakeA); oy = Math.round((Math.random() * 2 - 1) * fx.shakeA); }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    if (fx.mosaic > 1) {
      const m = Math.max(1, Math.floor(fx.mosaic));
      const w = Math.ceil(W / m);
      const h = Math.ceil(H / m);
      mctx.imageSmoothingEnabled = false;
      mctx.clearRect(0, 0, W, H);
      mctx.drawImage(scr, 0, 0, w, h);
      ctx.drawImage(mos, 0, 0, w, h, ox, oy, w * m, h * m);
    } else ctx.drawImage(scr, ox, oy);
    if (Q.scene && Q.scene.drawHi) Q.scene.drawHi(ctx);
    if (fx.flashT > 0) {
      ctx.globalAlpha = Math.min(1, fx.flashT / fx.flashMax) * 0.8;
      ctx.fillStyle = fx.flashCol;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    for (const w of ui) w.draw(ctx);
    if (fx.fade > 0) {
      ctx.globalAlpha = fx.fade;
      ctx.fillStyle = fx.fadeCol;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (Q.scene && Q.scene.drawTop) Q.scene.drawTop(ctx);
  }
  Q.draw = draw;
  Q.freeze = (v) => { frozen = v; };
  Q.start = () => requestAnimationFrame(frame);

  // ---------------------------------------------------------------- 画面サイズ
  function fit() {
    const wrap = canvas.parentElement;
    const availW = wrap.clientWidth;
    const touch = document.body.classList.contains("is-touch");
    const landscape = touch && matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const availH = landscape ? window.innerHeight - 16 : window.innerHeight - top - (touch ? 170 : 24);
    let s = Math.min(availW / W, Math.max(availH, 180) / H);
    if (s >= 2) s = Math.floor(s);
    canvas.style.width = `${Math.floor(W * s)}px`;
    canvas.style.height = `${Math.floor(H * s)}px`;
    const dpr = window.devicePixelRatio || 1;
    K = G.clamp(Math.round(s * dpr), 1, 6);
    canvas.width = W * K;
    canvas.height = H * K;
  }
  Q.fit = fit;
  window.addEventListener("resize", fit);
  if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("is-touch");
  fit();
})();
