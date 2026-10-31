// タイトル・エンドロール・起動
(() => {
  "use strict";
  const G = Q.gfx;
  const W = Q.W;
  const H = Q.H;

  // ---------------------------------------------------------------- タイトル
  const title = {
    t: 0,
    enter() { this.t = 0; },
    update(dt) { this.t += dt; },
    draw(g) {
      const t = this.t;
      // よぞら
      for (let i = 0; i < 10; i++) {
        g.fillStyle = G.mix("#080420", "#3a2a7a", i / 9);
        g.fillRect(0, Math.floor(i * 16), W, 17);
      }
      for (let i = 0; i < 90; i++) {
        const x = (i * 131) % W;
        const y = (i * 71) % 150;
        if ((i * 7 + Math.floor(t * 4)) % 11) { g.fillStyle = i % 4 ? "#ffffff" : "#ffd0f0"; g.fillRect(x, y, 1, 1); }
      }
      // ながれぼし
      const sx = ((t * 120) % 500) - 100;
      if (sx < W + 40) {
        g.fillStyle = "#ffffc0";
        for (let k = 0; k < 14; k++) g.fillRect(Math.round(sx - k * 3), Math.round(20 + sx * 0.25 - k * 0.75), 2, 1);
      }
      // まりゅうの かげ
      const dr = Q.monsters.get("dragzard");
      g.globalAlpha = 0.5;
      g.drawImage(G.silhouette(dr, "#1a0a3a"), W - 172, 34);
      g.globalAlpha = 1;
      // やま と おしろ
      g.fillStyle = "#1a1440";
      g.beginPath(); g.moveTo(0, 170); g.lineTo(40, 140); g.lineTo(80, 165); g.lineTo(130, 130); g.lineTo(190, 168); g.lineTo(256, 145); g.lineTo(256, 224); g.lineTo(0, 224); g.fill();
      g.fillStyle = "#2a2058";
      g.fillRect(150, 134, 30, 30); g.fillRect(146, 124, 8, 40); g.fillRect(176, 124, 8, 40);
      g.beginPath(); g.moveTo(144, 125); g.lineTo(150, 114); g.lineTo(156, 125); g.fill();
      g.beginPath(); g.moveTo(174, 125); g.lineTo(180, 114); g.lineTo(186, 125); g.fill();
      g.fillStyle = "#ffe890"; g.fillRect(163, 145, 3, 4);
      // おか
      g.fillStyle = "#2a5a3a";
      g.beginPath(); g.ellipse(70, 214, 110, 40, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#3a7a4a";
      g.beginPath(); g.ellipse(64, 212, 96, 32, 0, 0, Math.PI * 2); g.fill();
      // ポポ と なかま
      const popo = Q.chars.popoFrame(Math.floor(t * 2) % 4 === 3 ? "jump" : "idle");
      g.drawImage(popo, 50, 150 + (Math.floor(t * 2) % 4 === 3 ? -3 : 0), 48, 48);
      g.drawImage(Q.chars.field("yuta", 2, 0), 26, 172);
      g.drawImage(Q.chars.field("meru", 2, 0), 100, 172);
      g.drawImage(Q.chars.field("gantetsu", 1, 0), 118, 168);
    },
    drawHi(c) {
      const t = this.t;
      const bob = Math.round(Math.sin(t * 2) * 2);
      // ロゴ
      G.drawText(c, "SUPER", W / 2 - 66, 22 + bob, "#ffe890", { scale: 2, outline: "#3a0a4a" });
      G.drawText(c, "POPO", W / 2 - 2, 18 + bob, "#ff69b4", { scale: 3, outline: "#3a0a4a" });
      G.drawText(c, "QUEST", W / 2 - 52, 46 + bob, "#ffffff", { scale: 4, outline: "#3a0a4a" });
      G.jtext(c, "～ ポポの だいぼうけん ～", W / 2, 80 + bob, "#ffe890", { size: 11, align: "center", outline: "#2a0a3a", outlineWidth: 3 });
      if (!Q.ui.length && Math.floor(t * 2) % 2 === 0) G.jtext(c, "PRESS  A  BUTTON", W / 2, 122, "#ffffff", { size: 9, align: "center" });
      G.jtext(c, "© POPO SERIES", W - 6, H - 12, "#8a8ab8", { size: 7, align: "right" });
    },
  };

  function* titleFlow() {
    Q.setScene(title);
    Q.snd.music("title");
    for (;;) {
      yield () => Q.In.pressed("a") || Q.In.pressed("menu");
      Q.snd.unlock();
      Q.snd.play("select");
      const hasSave = [1, 2, 3].some((i) => Q.saveInfo(i));
      const items = [{ label: "はじめから", value: "new" }, { label: "つづきから", value: "load", disabled: !hasSave }];
      const v = yield* Q.select(items, { x: W / 2 - 46, y: 138, w: 92, cur: hasSave ? 1 : 0 });
      if (v === "new") {
        Q.S = Q.newState();
        Q.snd.stop();
        yield* Q.fadeOut(0.6);
        yield* Q.EV.prologue();
        return;
      }
      if (v === "load") {
        const slots = [];
        for (let i = 1; i <= Q.SLOTS; i++) {
          const inf = Q.saveInfo(i);
          slots.push({ label: `ぼうけんのしょ ${i}`, value: i, disabled: !inf, right: inf ? `${inf.name} Lv${inf.lv} ${Q.fmtTime(inf.time)}` : "－" });
        }
        const s = yield* Q.select(slots, { x: 20, y: 118, w: 216 });
        if (!s) continue;
        const st = Q.loadFrom(s);
        if (!st) continue;
        Q.S = st;
        yield* Q.fadeOut(0.5);
        Q.field.vehicle = null;
        Q.field.load(st.map, st.x, st.y, st.dir);
        Q.setScene(Q.field);
        yield* Q.fadeIn(0.5);
        return;
      }
    }
  }

  // ---------------------------------------------------------------- エンドロール
  const CREDITS = [
    ["SUPER POPO QUEST", "big"],
    ["～ ポポの だいぼうけん ～", "sub"],
    ["", ""],
    ["― なかま ―", "head"],
    ["ポポ　…　ほしから きた ひとつめの ゆうしゃ", ""],
    ["ユウタ　…　ちきゅうの しんゆう", ""],
    ["メル　…　ハッパむらの みならい まほうつかい", ""],
    ["ガンテツ　…　こわもての やさしい ちからもち", ""],
    ["", ""],
    ["― このせかいの ひとびと ―", "head"],
    ["ポロじい / ランドールおう / おひめさま", ""],
    ["うおまさ / カンカンまちの みんな / ユキユキむらの ばあさま", ""],
    ["フブキーナ / りゅうきし ガルム", ""],
    ["キングトゲ", ""],
    ["", ""],
    ["― そして ―", "head"],
    ["まもりりゅう ドラグザード", ""],
    ["", ""],
    ["― スーパーポポ シリーズ ―", "head"],
    ["Super POPO Land", ""],
    ["Super POPO Racing", ""],
    ["Super POPO Quest", ""],
    ["", ""],
    ["― げんさく ―", "head"],
    ["ポポ by Nobukins", ""],
    ["", ""],
    ["", ""],
    ["THE END", "big"],
    ["Thank you for playing!", "sub"],
  ];
  const credits = {
    t: 0, done: false,
    enter() { this.t = 0; this.done = false; },
    update(dt) {
      this.t += dt * (Q.In.held("a") ? 3 : 1);
      if (this.t > CREDITS.length * 1.6 + 14 && (Q.In.pressed("a") || Q.In.pressed("menu"))) {
        this.done = true;
        Q.run(backToTitle());
      }
    },
    draw(g) {
      for (let i = 0; i < 10; i++) { g.fillStyle = G.mix("#06041a", "#2a1a5a", i / 9); g.fillRect(0, i * 23, W, 23); }
      for (let i = 0; i < 60; i++) { const x = (i * 131) % W; const y = (i * 71 + this.t * 6) % H; g.fillStyle = "#ffffff"; g.fillRect(x, Math.floor(y), 1, 1); }
      // モンスターの パレード
      const ids = Object.keys(Q.data.E).filter((id) => !Q.data.E[id].boss || id === "kingtoge");
      const sp = 28;
      let x = W + 20 - ((this.t * sp) % ((ids.length * 54) + W + 40));
      g.fillStyle = "#1a3a2a"; g.fillRect(0, 196, W, 28);
      for (const id of ids) {
        const img = Q.monsters.get(Q.data.E[id].art);
        const k = Math.min(1, 34 / img.height);
        const w = img.width * k;
        if (x > -60 && x < W + 10) {
          const hop = Math.abs(Math.sin(this.t * 6 + x * 0.05)) * 3;
          g.drawImage(img, Math.round(x), Math.round(198 - img.height * k - hop), Math.round(w), Math.round(img.height * k));
        }
        x += Math.max(w, 30) + 20;
      }
      // ポポたち (さいごに あるいていく)
      const px = W + 20 - ((this.t * sp) % ((ids.length * 54) + W + 40)) - 120;
      if (px > -100) {
        ["popo", "yuta", "meru", "gantetsu"].forEach((who, i) => {
          const f = Math.floor(this.t * 6) % 2 ? 1 : 2;
          g.drawImage(Q.chars.field(who, 1, f), Math.round(px + i * 22), 176);
        });
      }
    },
    drawHi(c) {
      const y0 = H - this.t * 22;
      CREDITS.forEach(([text, kind], i) => {
        const y = y0 + i * 18 + (i > CREDITS.length - 3 ? 60 : 0);
        const final = i >= CREDITS.length - 2;
        const yy = final ? Math.max(70 + (i - (CREDITS.length - 2)) * 22, y) : y;
        if (yy < -20 || yy > 190) return;
        if (kind === "big") G.drawText(c, text, W / 2, yy, "#ffe890", { scale: 2, outline: "#3a0a4a", align: "center" });
        else G.jtext(c, text, W / 2, yy, kind === "head" ? "#ff9ad8" : kind === "sub" ? "#ffe890" : "#ffffff", { size: kind === "head" ? 10 : 9, align: "center" });
      });
    },
  };
  Q.creditsScene = credits;
  function* backToTitle() {
    yield* Q.fadeOut(1.0);
    Q.snd.stop();
    Q.run(titleFlow());
    yield* Q.fadeIn(0.6);
  }

  // ---------------------------------------------------------------- 起動
  const Input = window.PopoInput;
  document.getElementById("game").addEventListener("pointerdown", () => Q.snd.unlock());
  Input.on((what) => {
    Q.snd.unlock();
    if (what === "mute") Q.snd.toggleMute();
  });
  Input.setupTouch(document.getElementById("touch"));
  const muteBtn = document.getElementById("mute");
  if (muteBtn) {
    const label = () => { muteBtn.textContent = Q.snd.muted ? "🔇 音オフ" : "🔊 音オン"; };
    label();
    muteBtn.addEventListener("click", () => { Q.snd.unlock(); Q.snd.toggleMute(); label(); muteBtn.blur(); });
    Input.on((w) => { if (w === "mute") label(); });
  }
  Q.fit();

  // テスト・デバッグ用 (ブラウザの コンソールから つかえる)
  window.PopoQuest = {
    Q,
    titleFlow,
    newGame() { Q.S = Q.newState(); },
    warp(map, x, y, dir = 0) { Q.field.vehicle = null; Q.field.load(map, x, y, dir); Q.setScene(Q.field); },
    level(n) { for (const c of Object.values(Q.S.chars)) { c.exp = Q.data.EXP[n]; c.lv = n; const s = Q.statsOf(c); c.hp = s.maxhp; c.mp = s.maxmp; } },
    give(id, n = 1) { Q.addItem(id, n); },
    flags(o) { Object.assign(Q.S.flags, o); },
    fight(form, o) { return Q.runEvent(Q.battle.fight(form, o)); },
  };

  // ?notitle を つけると タイトルを ださない (じどうテスト用)
  if (!/[?&]notitle/.test(location.search)) Q.run(titleFlow());
  else Q.setScene(title);
  Q.start();
})();
