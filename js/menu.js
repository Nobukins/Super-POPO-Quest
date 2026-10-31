// フィールドの メニュー / やどや / おみせ / きろく
(() => {
  "use strict";
  const G = Q.gfx;
  const D = Q.data;
  const W = Q.W;
  const H = Q.H;

  // ---------------------------------------------------------------- おみせの しなもの
  const SHOPS = {
    village_w: ["bronzesword", "woodbat", "starrod", "leather", "jersey", "magicrobe", "badge"],
    village_i: ["berry", "niboshi", "antidote", "homefeather", "smoke"],
    castle_w: ["bronzesword", "woodbat", "starrod", "stonehammer", "leather", "jersey", "magicrobe", "chain", "uniform", "badge"],
    castle_i: ["berry", "bigberry", "ramune", "antidote", "feather", "homefeather", "smoke", "bombstone"],
    mintown_w: ["steelsword", "ironbat", "stonehammer", "ironhammer", "chain", "uniform", "stardress", "guardring"],
    mintown_i: ["berry", "bigberry", "ramune", "antidote", "feather", "homefeather", "smoke", "bombstone"],
    snow_w: ["starsword", "goldbat", "icerod", "ironhammer", "steelarmor", "superuni", "lightrobe", "powerring", "swiftshoes", "earring"],
    snow_i: ["bigberry", "ramune", "antidote", "feather", "homefeather", "smoke", "bombstone"],
  };
  Q.SHOPS = SHOPS;

  function memberName(id) { return D.PARTY[id].name; }

  // ステータスの 小さな パネル (メニューの みぎ)
  function drawPartyPanel(c, x, y, sel) {
    const party = Q.party();
    const h = party.length * 26 + 10;
    G.drawWindow(c, x, y, W - x - 6, h);
    party.forEach((m, i) => {
      const s = Q.statsOf(m);
      const yy = y + 6 + i * 26;
      if (sel === i) { c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(x + 4, yy - 1, W - x - 14, 25); }
      c.drawImage(Q.chars.field(m.id, 0, 0), x + 6, yy - 2);
      G.jtext(c, memberName(m.id), x + 26, yy, m.hp <= 0 ? "#ff6a6a" : "#ffffff", { size: 10 });
      G.jtext(c, `Lv${m.lv}`, x + 26, yy + 12, "#ffe890", { size: 8 });
      G.jtext(c, `HP ${m.hp}/${s.maxhp}`, x + 78, yy, m.hp < s.maxhp * 0.25 ? "#ffd040" : "#ffffff", { size: 9 });
      G.jtext(c, `MP ${m.mp}/${s.maxmp}`, x + 78, yy + 12, "#a8d8ff", { size: 9 });
      if (m.poison) G.jtext(c, "どく", x + 148, yy + 12, "#d090ff", { size: 8 });
    });
  }

  function* chooseMember(title, o = {}) {
    const party = Q.party();
    const items = party.map((m, i) => ({ label: memberName(m.id), value: i, disabled: o.filter ? !o.filter(m) : false }));
    const menu = Q.push(new Q.Menu(items, { x: 8, y: o.y ?? 96, title, cur: o.cur || 0 }));
    const v = yield menu.choose();
    menu.close();
    return v == null ? null : party[v];
  }

  // ---------------------------------------------------------------- フィールドメニュー
  function* fieldMenu() {
    const dungeon = (Q.field.map && Q.field.map.dungeon) || Q.field.vehicle;
    const items = [
      { label: "どうぐ", value: "item" },
      { label: "とくぎ", value: "skill" },
      { label: "そうび", value: "equip" },
      { label: "つよさ", value: "status" },
      { label: "ならびかえ", value: "order", disabled: Q.S.party.length < 2 },
      { label: "ずかん", value: "book" },
      { label: "きろく", value: "save", disabled: dungeon },
    ];
    const panel = Q.push(new Q.Panel((c) => {
      drawPartyPanel(c, 84, 8, -1);
      G.drawWindow(c, 8, H - 34, 100, 26);
      G.jtext(c, `${Q.S.gold} G`, 100, H - 27, "#ffe890", { size: 10, align: "right" });
      G.drawWindow(c, 112, H - 34, W - 118, 26);
      G.jtext(c, Q.S.placeName || "", 120, H - 27, "#ffffff", { size: 9 });
      G.jtext(c, Q.fmtTime(Q.S.time), W - 12, H - 27, "#c8c8e8", { size: 9, align: "right" });
    }));
    const menu = Q.push(new Q.Menu(items, { x: 8, y: 8, w: 72, cancel: true }));
    Q.snd.play("select");
    try {
      for (;;) {
        const v = yield menu.choose();
        if (v == null) break;
        if (v === "item") yield* itemMenu();
        else if (v === "skill") yield* skillMenu();
        else if (v === "equip") yield* equipMenu();
        else if (v === "status") yield* statusMenu();
        else if (v === "order") yield* orderMenu();
        else if (v === "book") yield* bookMenu();
        else if (v === "save") { const done = yield* saveMenu(); if (done) break; }
        if (Q.S.flags._warped) { delete Q.S.flags._warped; break; }
      }
    } finally {
      menu.close();
      panel.close();
    }
  }

  // ---- どうぐ
  function itemList() {
    const ids = Object.keys(Q.S.items).filter((id) => D.ITEMS[id]);
    ids.sort((a, b) => (D.ITEMS[a].type === "key") - (D.ITEMS[b].type === "key"));
    return ids;
  }
  function itemDesc(id) {
    const it = D.ITEMS[id];
    if (it.desc) return it.desc;
    const parts = [];
    if (it.atk) parts.push(`こうげき+${it.atk}`);
    if (it.def) parts.push(`しゅび+${it.def}`);
    if (it.mag) parts.push(`まりょく+${it.mag}`);
    if (it.spd) parts.push(`すばやさ+${it.spd}`);
    const who = it.who ? it.who.map(memberName).join("・") : "だれでも";
    return `${parts.join(" ")}　（${who}）`;
  }
  function* itemMenu() {
    for (;;) {
      const ids = itemList();
      if (!ids.length) { yield* Q.say("どうぐを なにも もっていない。"); return; }
      let descText = "";
      const items = ids.map((id) => ({ label: D.ITEMS[id].name, value: id, right: D.ITEMS[id].type === "key" ? "" : Q.S.items[id], color: D.ITEMS[id].type === "key" ? "#ffe890" : null }));
      const desc = Q.push(new Q.Panel((c) => { G.drawWindow(c, 8, H - 40, W - 16, 32); G.jtext(c, descText, 16, H - 31, "#ffffff", { size: 9 }); }));
      const menu = Q.push(new Q.Menu(items, { x: 8, y: 8, w: W - 16, h: H - 52, cols: 2, rows: 10, rowH: 15, title: "どうぐ", onMove: (it) => { descText = itemDesc(it.value); } }));
      descText = itemDesc(items[0].value);
      const v = yield menu.choose();
      if (v == null) { menu.close(); desc.close(); return; }
      menu.close();
      desc.close();
      yield* useItemField(v);
      if (Q.S.flags._warped) return;
    }
  }
  function* useItemField(id) {
    const it = D.ITEMS[id];
    if (it.type === "key") { yield* Q.say(`${it.name}\n${it.desc}`); return; }
    if (it.type !== "use") { yield* Q.say(`${it.name}は そうびひんだ。\n「そうび」から そうびしよう。`); return; }
    if (it.battleOnly) { yield* Q.say("それは せんとうちゅうに つかう どうぐだ。"); return; }
    if (it.warp) {
      if (Q.field.map.dungeon) { yield* Q.say("ここでは つかえない！"); return; }
      const towns = ["village", "castle", "mintown", "snowvillage"].filter((t) => Q.S.flags["visit_" + t]);
      if (!towns.length) { yield* Q.say("まだ もどれる まちが ない。"); return; }
      const v = yield* Q.select(towns.map((t) => ({ label: Q.MAPS[t].name, value: t })), { x: 8, y: 60, title: "どこへ もどる？" });
      if (!v) return;
      Q.addItem(id, -1);
      Q.snd.play("warp");
      Q.field.vehicle = null;
      const wp = Q.MAPS.world.warps.find((w) => w.to === v);
      Q.S.flags._warped = true;
      yield* Q.field.transfer(v, wp.tx, wp.ty, 3);
      return;
    }
    const m = yield* chooseMember(`${it.name}を だれに？`, { filter: it.revive ? (c) => c.hp <= 0 : (c) => c.hp > 0 });
    if (!m) return;
    const s = Q.statsOf(m);
    const k = Q.S.party.includes("yuta") ? 1 : 1;
    Q.addItem(id, -1);
    if (it.revive) { m.hp = Math.round(s.maxhp * it.revive); Q.snd.play("heal"); yield* Q.say(`${memberName(m.id)}は いきかえった！`); }
    else if (it.heal) { const before = m.hp; m.hp = Math.min(s.maxhp, m.hp + Math.round(it.heal * k)); Q.snd.play("heal"); yield* Q.say(`${memberName(m.id)}の HPが ${m.hp - before} かいふくした！`); }
    else if (it.mpheal) { const before = m.mp; m.mp = Math.min(s.maxmp, m.mp + it.mpheal); Q.snd.play("heal"); yield* Q.say(`${memberName(m.id)}の MPが ${m.mp - before} かいふくした！`); }
    else if (it.cure) { m.poison = false; Q.snd.play("heal"); yield* Q.say(`${memberName(m.id)}の どくが きえた！`); }
  }

  // ---- とくぎ (フィールドで つかえる かいふく)
  function* skillMenu() {
    const user = yield* chooseMember("だれの とくぎ？");
    if (!user) return;
    for (;;) {
      const ids = Q.skillsOf(user);
      let descText = "";
      const items = ids.map((id) => ({ label: D.SKILLS[id].name, value: id, right: D.SKILLS[id].mp, disabled: !D.SKILLS[id].field || D.SKILLS[id].mp > user.mp }));
      if (!items.length) { yield* Q.say(`${memberName(user.id)}は まだ とくぎを おぼえていない。`); return; }
      const desc = Q.push(new Q.Panel((c) => { G.drawWindow(c, 8, H - 40, W - 16, 32); G.jtext(c, descText, 16, H - 31, "#ffffff", { size: 9 }); }));
      const menu = Q.push(new Q.Menu(items, { x: 8, y: 8, w: W - 16, cols: 2, rows: 6, rowH: 15, title: `${memberName(user.id)}の とくぎ（MP ${user.mp}）`, onMove: (it) => { descText = D.SKILLS[it.value].desc; } }));
      descText = D.SKILLS[items[0].value].desc;
      const v = yield menu.choose();
      menu.close();
      desc.close();
      if (v == null) return;
      const s = D.SKILLS[v];
      const targets = s.target === "allies" ? Q.party().filter((c) => c.hp > 0) : [];
      if (s.target === "ally" || s.target === "ko") {
        const t = yield* chooseMember(`${s.name}を だれに？`, { filter: s.kind === "revive" ? (c) => c.hp <= 0 : (c) => c.hp > 0 });
        if (!t) continue;
        targets.push(t);
      }
      user.mp -= s.mp;
      Q.snd.play("heal");
      for (const t of targets) {
        const st = Q.statsOf(t);
        if (s.kind === "revive") t.hp = Math.round(st.maxhp * s.power);
        else t.hp = Math.min(st.maxhp, t.hp + Math.round(s.power + Q.statsOf(user).mag * s.k));
      }
      yield* Q.say(`${memberName(user.id)}は ${s.name}を となえた！\n${targets.length > 1 ? "みんな" : memberName(targets[0].id)}の HPが かいふくした！`);
    }
  }

  // ---- そうび
  const SLOT_NAMES = { w: "ぶき", a: "ぼうぐ", x: "アクセサリ" };
  function* equipMenu() {
    const m = yield* chooseMember("だれの そうび？");
    if (!m) return;
    for (;;) {
      const slots = ["w", "a", "x"].map((k) => ({ label: SLOT_NAMES[k], value: k, right: m.equip[k] ? D.ITEMS[m.equip[k]].name : "－" }));
      const panel = Q.push(new Q.Panel((c) => drawStatBox(c, m, null)));
      const v = yield* Q.select(slots, { x: 8, y: 8, w: 170, title: `${memberName(m.id)}の そうび` });
      panel.close();
      if (v == null) return;
      // そうびできる もの
      const cands = Object.keys(Q.S.items).filter((id) => { const it = D.ITEMS[id]; return it && it.type === v && (!it.who || it.who.includes(m.id)); });
      const items = cands.map((id) => ({ label: D.ITEMS[id].name, value: id, right: Q.S.items[id] }));
      if (m.equip[v]) items.push({ label: "はずす", value: "__none" });
      if (!items.length) { yield* Q.say("そうび できる ものを もっていない。"); continue; }
      let preview = null;
      const panel2 = Q.push(new Q.Panel((c) => drawStatBox(c, m, preview && { slot: v, id: preview })));
      const menu = Q.push(new Q.Menu(items, { x: 8, y: 8, w: 150, rows: 8, title: SLOT_NAMES[v], onMove: (it) => { preview = it.value; } }));
      preview = items[0].value;
      const pick = yield menu.choose();
      menu.close();
      panel2.close();
      if (pick == null) continue;
      const old = m.equip[v];
      if (old) Q.addItem(old, 1);
      if (pick === "__none") m.equip[v] = null;
      else { Q.addItem(pick, -1); m.equip[v] = pick; }
      Q.snd.play("select");
      const s = Q.statsOf(m);
      m.hp = Math.min(m.hp, s.maxhp);
      m.mp = Math.min(m.mp, s.maxmp);
    }
  }
  function drawStatBox(c, m, change) {
    const x = 162;
    const y = 8;
    G.drawWindow(c, x, y, W - x - 6, 96);
    const cur = Q.statsOf(m);
    let nxt = null;
    if (change) {
      const eq = Object.assign({}, m.equip, { [change.slot]: change.id === "__none" ? null : change.id });
      nxt = Q.statsOf(Object.assign({}, m, { equip: eq }));
    }
    const rows = [["こうげき", "atk"], ["しゅび", "def"], ["まりょく", "mag"], ["すばやさ", "spd"]];
    G.jtext(c, memberName(m.id), x + 8, y + 6, "#ffe890", { size: 10 });
    rows.forEach(([n, k], i) => {
      const yy = y + 22 + i * 16;
      G.jtext(c, n, x + 8, yy, "#ffffff", { size: 9 });
      G.jtext(c, String(cur[k]), x + 64, yy, "#ffffff", { size: 9, align: "right" });
      if (nxt && nxt[k] !== cur[k]) G.jtext(c, `→${nxt[k]}`, x + 68, yy, nxt[k] > cur[k] ? "#7aff9a" : "#ff8a8a", { size: 9 });
    });
  }

  // ---- つよさ
  function* statusMenu() {
    let i = 0;
    for (;;) {
      const party = Q.party();
      const m = party[i];
      const p = Q.push(new Q.Panel((c, t) => drawStatus(c, m, t), { waitKey: false }));
      let res = null;
      while (!res) {
        yield;
        if (Q.In.pressed("b") || Q.In.pressed("a")) res = "close";
        else if (Q.In.rep("right") || Q.In.rep("down")) { i = (i + 1) % party.length; res = "next"; Q.snd.play("cursor"); }
        else if (Q.In.rep("left") || Q.In.rep("up")) { i = (i + party.length - 1) % party.length; res = "next"; Q.snd.play("cursor"); }
      }
      p.close();
      if (res === "close") return;
    }
  }
  function drawStatus(c, m, t) {
    G.drawWindow(c, 8, 8, W - 16, H - 16);
    const P = D.PARTY[m.id];
    const s = Q.statsOf(m);
    c.save();
    c.imageSmoothingEnabled = false;
    const img = Q.chars.battle(m.id, Math.floor(t * 2) % 2 ? "idle" : "step", Math.floor(t * 4));
    c.drawImage(img, 22, 22, img.width * 1.5, img.height * 1.5);
    c.restore();
    G.jtext(c, P.name, 80, 18, "#ffe890", { size: 12 });
    G.jtext(c, P.job, 80, 34, "#c8c8e8", { size: 9 });
    G.jtext(c, `レベル ${m.lv}`, 160, 18, "#ffffff", { size: 10 });
    const next = m.lv < D.MAXLV ? D.EXP[m.lv + 1] - m.exp : 0;
    G.jtext(c, `つぎの レベルまで ${next}`, 160, 34, "#c8c8e8", { size: 8 });
    const rows = [
      ["HP", `${m.hp} / ${s.maxhp}`], ["MP", `${m.mp} / ${s.maxmp}`],
      ["こうげき", s.atk], ["しゅび", s.def], ["まりょく", s.mag], ["すばやさ", s.spd],
    ];
    rows.forEach(([a, b], i) => {
      const x = 20 + (i % 2) * 114;
      const y = 74 + Math.floor(i / 2) * 15;
      G.jtext(c, a, x, y, "#a8d8ff", { size: 9 });
      G.jtext(c, String(b), x + 102, y, "#ffffff", { size: 9, align: "right" });
    });
    ["w", "a", "x"].forEach((k, i) => {
      G.jtext(c, SLOT_NAMES[k], 20, 124 + i * 14, "#a8d8ff", { size: 9 });
      G.jtext(c, m.equip[k] ? D.ITEMS[m.equip[k]].name : "－", 84, 124 + i * 14, "#ffffff", { size: 9 });
    });
    Q.wrap(P.desc, 216, 9).forEach((l, i) => G.jtext(c, l, 20, 172 + i * 13, "#ffffff", { size: 9 }));
    G.jtext(c, "◀ ▶", W - 22, H - 22, "#c8c8e8", { size: 8, align: "right" });
  }

  // ---- ならびかえ
  function* orderMenu() {
    const a = yield* chooseMember("だれと…");
    if (!a) return;
    const b = yield* chooseMember("…だれを いれかえる？");
    if (!b || a === b) return;
    const ia = Q.S.party.indexOf(a.id);
    const ib = Q.S.party.indexOf(b.id);
    Q.S.party[ia] = b.id;
    Q.S.party[ib] = a.id;
    Q.field.regroup();
    Q.snd.play("select");
  }

  // ---- ずかん
  const BOOK_ORDER = Object.keys(D.E);
  function* bookMenu() {
    const seen = BOOK_ORDER.filter((id) => Q.S.book[id]);
    if (!seen.length) { yield* Q.say("まだ モンスターに であっていない。"); return; }
    let cur = 0;
    for (;;) {
      const items = BOOK_ORDER.map((id, i) => ({ label: Q.S.book[id] ? D.E[id].name : "？？？？", value: i, disabled: !Q.S.book[id] }));
      let showing = BOOK_ORDER[cur];
      const panel = Q.push(new Q.Panel((c, t) => {
        G.drawWindow(c, 128, 8, W - 136, H - 16);
        const id = showing;
        if (!Q.S.book[id]) return;
        const e = D.E[id];
        const img = Q.monsters.get(e.art);
        const k = Math.min(1.5, 100 / img.width, 80 / img.height) * (e.scale || 1) > 2 ? 2 : Math.min(1.5, 100 / img.width, 80 / img.height);
        c.save();
        c.imageSmoothingEnabled = false;
        const bob = Math.sin(t * 2.5) * 2;
        c.drawImage(img, Math.round(128 + (W - 136) / 2 - (img.width * k) / 2), Math.round(18 + 80 - img.height * k + bob), img.width * k, img.height * k);
        c.restore();
        G.jtext(c, e.name, 136, 104, "#ffe890", { size: 10 });
        G.jtext(c, `たおした かず ${Q.S.book[id].won}`, 136, 118, "#c8c8e8", { size: 8 });
        if (Q.S.book[id].won) {
          G.jtext(c, `HP ${e.hp}  EXP ${e.exp}  ${e.gold}G`, 136, 130, "#a8d8ff", { size: 8 });
          const weak = e.weak.map((w) => ({ fire: "ほのお", ice: "こおり", thunder: "かみなり", light: "ひかり", dark: "やみ" }[w])).join("・");
          if (weak) G.jtext(c, `よわい: ${weak}`, 136, 141, "#ffb0b0", { size: 8 });
        }
        Q.wrap(e.desc || "", W - 152, 8).forEach((l, i) => G.jtext(c, l, 136, 156 + i * 12, "#ffffff", { size: 8 }));
      }));
      const menu = Q.push(new Q.Menu(items, { x: 8, y: 8, w: 116, h: H - 16, rows: 13, rowH: 15, size: 9, cur, title: `ずかん ${seen.length}/${BOOK_ORDER.length}`, onMove: (it) => { showing = BOOK_ORDER[it.value]; } }));
      const v = yield menu.choose();
      menu.close();
      panel.close();
      if (v == null) return;
      cur = v;
    }
  }

  // ---- きろく
  function* saveMenu() {
    const items = [];
    for (let i = 1; i <= Q.SLOTS; i++) {
      const inf = Q.saveInfo(i);
      items.push({ label: `ぼうけんのしょ ${i}`, value: i, right: inf ? `${inf.name} Lv${inf.lv}` : "－ からっぽ －" });
    }
    const v = yield* Q.select(items, { x: 30, y: 60, w: 196, title: "どこに きろく しますか？" });
    if (!v) return false;
    if (Q.saveInfo(v) && !(yield* Q.ask(`ぼうけんのしょ ${v}に うわがき しますか？`))) return false;
    if (Q.saveTo(v)) { Q.snd.play("save"); yield* Q.say(`ぼうけんのしょ ${v}に きろく しました。`); }
    else yield* Q.say("きろく できませんでした…\n（ブラウザの ほぞんが つかえないようです）");
    return true;
  }

  // ---------------------------------------------------------------- やどや
  function* inn(price, npc) {
    const yes = yield* Q.ask(`やどやの しゅじん「ようこそ たびびとさん！\nひとばん ${price}ゴールド ですが、 おとまりに なりますか？」`);
    if (!yes) { yield* Q.say("やどやの しゅじん「また どうぞ！」"); return; }
    if (Q.S.gold < price) { yield* Q.say("やどやの しゅじん「おや、 おかねが たりない ようですね…」"); return; }
    Q.S.gold -= price;
    yield* Q.fadeOut(0.6);
    Q.snd.jingle("inn", Q.snd.current);
    Q.healAll();
    yield 2.6;
    yield* Q.fadeIn(0.6);
    yield* Q.say("やどやの しゅじん「おはようございます！ ゆうべは よく ねむれましたか？」");
    if (yield* Q.ask("ぼうけんのしょに きろく しますか？")) yield* saveMenu();
  }

  // ---------------------------------------------------------------- おみせ
  function* shop(id, npc, o = {}) {
    const goods = SHOPS[id];
    const isUomasa = npc && npc.d && npc.d.who === "uomasa";
    const hello = o.hello || (isUomasa ? "うおまさ「へい らっしゃい！ ちきゅう いちの\nうおまさ しょうてん だよ！ …さかなは ないけどな！」" : "「いらっしゃいませ！ なにを おもとめですか？」");
    yield* Q.say(hello);
    for (;;) {
      const v = yield* Q.select([{ label: "かう", value: "buy" }, { label: "うる", value: "sell" }, { label: "やめる", value: "quit" }], { x: 8, y: 8, w: 72 });
      if (v === "buy") yield* buy(goods);
      else if (v === "sell") yield* sell();
      else break;
    }
    yield* Q.say(isUomasa ? "うおまさ「まいどっ！ また きてくんな！」" : "「ありがとう ございました！」");
  }
  function* buy(goods) {
    for (;;) {
      let cur = goods[0];
      const items = goods.map((g) => ({ label: D.ITEMS[g].name, value: g, right: D.ITEMS[g].price + "G", disabled: D.ITEMS[g].price > Q.S.gold }));
      const panel = Q.push(new Q.Panel((c) => {
        G.drawWindow(c, 8, H - 74, W - 16, 66);
        const it = D.ITEMS[cur];
        Q.wrap(itemDesc(cur), W - 32, 9).slice(0, 2).forEach((l, i) => G.jtext(c, l, 16, H - 68 + i * 12, "#ffffff", { size: 9 }));
        // だれが そうび できるか / つよさの へんか
        if (it.type === "w" || it.type === "a" || it.type === "x") {
          Q.party().forEach((m, i) => {
            const ok = !it.who || it.who.includes(m.id);
            const x = 16 + i * 58;
            G.jtext(c, memberName(m.id), x, H - 40, ok ? "#ffffff" : "#6a6a8a", { size: 8 });
            if (!ok) return;
            const eq = Object.assign({}, m.equip, { [it.type]: cur });
            const a = Q.statsOf(m);
            const b = Q.statsOf(Object.assign({}, m, { equip: eq }));
            const k = it.type === "w" ? (m.id === "meru" ? "mag" : "atk") : it.type === "a" ? "def" : (it.atk ? "atk" : it.def ? "def" : it.mag ? "mag" : "spd");
            const d = b[k] - a[k];
            G.jtext(c, d > 0 ? `+${d}` : d < 0 ? `${d}` : "±0", x, H - 28, d > 0 ? "#7aff9a" : d < 0 ? "#ff8a8a" : "#c8c8e8", { size: 9 });
            if (m.equip[it.type] === cur) G.jtext(c, "E", x + 30, H - 28, "#ffe890", { size: 8 });
          });
        }
        G.drawWindow(c, W - 90, 8, 82, 22);
        G.jtext(c, `${Q.S.gold} G`, W - 14, 13, "#ffe890", { size: 9, align: "right" });
      }));
      const menu = Q.push(new Q.Menu(items, { x: 8, y: 34, w: 170, rows: 8, onMove: (it) => { cur = it.value; } }));
      const v = yield menu.choose();
      menu.close();
      panel.close();
      if (v == null) return;
      const it = D.ITEMS[v];
      if (Q.S.gold < it.price) { yield* Q.say("「おかねが たりない ようですね。」"); continue; }
      let n = 1;
      if (it.type === "use") {
        const maxN = Math.min(20, Math.floor(Q.S.gold / it.price));
        n = yield* chooseCount(it, maxN);
        if (!n) continue;
      } else if (!(yield* Q.ask(`${it.name}は ${it.price}ゴールドです。 かいますか？`))) continue;
      Q.S.gold -= it.price * n;
      Q.addItem(v, n);
      Q.snd.play("gold");
      if (it.type === "w" || it.type === "a" || it.type === "x") {
        const can = Q.party().filter((m) => !it.who || it.who.includes(m.id));
        if (can.length && (yield* Q.ask("いま そうび していきますか？"))) {
          const m = can.length === 1 ? can[0] : yield* chooseMember("だれが そうびする？", { filter: (c) => can.includes(c) });
          if (m) {
            if (m.equip[it.type]) Q.addItem(m.equip[it.type], 1);
            m.equip[it.type] = v;
            Q.addItem(v, -1);
            yield* Q.say(`${memberName(m.id)}は ${it.name}を そうびした！`);
          }
        }
      } else yield* Q.say(`${it.name}を ${n}こ かった！`);
    }
  }
  function* chooseCount(it, maxN) {
    let n = 1;
    const p = Q.push(new Q.Panel((c) => {
      G.drawWindow(c, 60, 90, 136, 44);
      G.jtext(c, `${it.name}`, 70, 96, "#ffffff", { size: 9 });
      G.jtext(c, `× ${n}   ${it.price * n} G`, 186, 114, "#ffe890", { size: 10, align: "right" });
      G.jtext(c, "▲▼", 70, 114, "#c8c8e8", { size: 9 });
    }));
    try {
      for (;;) {
        yield;
        if (Q.In.rep("up") || Q.In.rep("right")) { n = Math.min(maxN, n + 1); Q.snd.play("cursor"); }
        if (Q.In.rep("down") || Q.In.rep("left")) { n = Math.max(1, n - 1); Q.snd.play("cursor"); }
        if (Q.In.pressed("a")) { Q.snd.play("select"); return n; }
        if (Q.In.pressed("b")) { Q.snd.play("cancel"); return 0; }
      }
    } finally { p.close(); }
  }
  function* sell() {
    for (;;) {
      const ids = Object.keys(Q.S.items).filter((id) => D.ITEMS[id] && D.ITEMS[id].type !== "key" && D.ITEMS[id].price > 0);
      if (!ids.length) { yield* Q.say("「うれる ものは ないようですね。」"); return; }
      const items = ids.map((id) => ({ label: D.ITEMS[id].name, value: id, right: Math.floor(D.ITEMS[id].price / 2) + "G" }));
      const v = yield* Q.select(items, { x: 8, y: 34, w: 170, rows: 8, title: `うる（${Q.S.gold} G）` });
      if (v == null) return;
      const price = Math.floor(D.ITEMS[v].price / 2);
      if (yield* Q.ask(`${D.ITEMS[v].name}を ${price}ゴールドで かいとります。 いいですか？`)) {
        Q.addItem(v, -1);
        Q.S.gold += price;
        Q.snd.play("gold");
      }
    }
  }

  Q.menu = { fieldMenu, inn, shop, saveMenu, chooseMember };
})();
