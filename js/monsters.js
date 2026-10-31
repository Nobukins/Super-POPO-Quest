// モンスターのドット絵 (すべてコードで描く)。どのモンスターも右 (= パーティ側) を向いている
// 丸っこくて、ちょっと生意気で、でも怒るとこわい —— そんなデザインを目指している
(() => {
  "use strict";
  const G = Q.gfx;
  const { paint, shade, OUT } = G;
  const S = { shade: 3, outline: true };
  const S2 = { shade: 2, outline: true };
  const OL = { outline: true };

  const DEFS = {};
  function def(id, w, h, fn) { DEFS[id] = { w, h, fn }; }

  // ---------------------------------------------------------------- 共通の顔パーツ
  function grin(P, x, y, w, o = {}) {
    // ニカッと笑う口 (上の歯つき)
    P.ell(x + w / 2, y + 1.5, w / 2, o.h || 3, OUT);
    P.ell(x + w / 2, y + 2, w / 2 - 1, (o.h || 3) - 1, o.inner || "#8a1030");
    P.r(x + 1, y, w - 2, 1.5, OUT);
    if (o.tongue !== false) P.ell(x + w / 2 + 1, y + (o.h || 3) - 0.5, w / 4, 1.2, "#ff6a8a");
    if (o.teeth !== false) {
      P.r(x + 2, y + 1, w - 4, 1, "#ffffff");
      if (o.fangs) { P.p(x + 2, y + 2, "#ffffff"); P.p(x + w - 3, y + 2, "#ffffff"); }
    }
  }
  function fangMouth(P, x, y, w, inner = "#7a0a20") {
    P.r(x, y, w, 3, OUT);
    P.r(x + 1, y + 1, w - 2, 2, inner);
    for (let i = x + 1; i < x + w - 1; i += 2) P.p(i, y + 1, "#ffffff");
    P.p(x + 1, y + 3, "#ffffff"); P.p(x + w - 2, y + 3, "#ffffff");
  }
  function cheek(P, x, y, col = "#ff8aa8") { P.r(x, y, 2, 1, col); }
  function sparkle(P, x, y, col = "#ffffff") { P.p(x, y, col); P.p(x - 1, y, col); P.p(x + 1, y, col); P.p(x, y - 1, col); P.p(x, y + 1, col); }

  // ================================================================ 1. はじまりの そうげん
  // プルン: ぷるぷるのプリン。カラメルを かぶって ごきげん
  function purun(c) {
    return (P) => {
      P.part((Q) => {
        Q.poly([[5, 27], [9, 11], [23, 11], [27, 27]], c.body);
        Q.ell(16, 26.5, 11, 3.2, c.body);
        Q.ell(16, 11.5, 7, 2.5, c.body);
      }, { shade: 4, outline: true });
      P.part((Q) => {
        Q.ell(16, 10.5, 7.5, 3.5, c.top);
        Q.ell(10.5, 13, 1.6, 2.6, c.top);
        Q.ell(14.5, 14, 1.4, 2.2, c.top);
        Q.ell(20.5, 14, 1.8, 3.6, c.top);
        Q.ell(24, 12, 1.2, 1.8, c.top);
      }, { shade: 2, outline: true });
      if (c.cherry) {
        P.part((Q) => {
          Q.line(17, 6, 20, 1, "#3a9a3a", 1);
          Q.ball(16.5, 6, 3, 3, c.cherry);
        }, OL);
      }
      P.eye(12, 18, 2.5, 3.3, 0.5, 0.1);
      P.eye(20, 18, 2.5, 3.3, 0.5, 0.1);
      grin(P, 13, 22, 7, { h: 2.5 });
      cheek(P, 8, 21, c.cheek || "#ff9ab0");
      cheek(P, 23, 21, c.cheek || "#ff9ab0");
      if (c.gleam) { sparkle(P, 7, 15); sparkle(P, 25, 9); }
    };
  }
  def("purun", 32, 31, purun({ body: "#ffd85a", top: "#a8541a", cherry: "#ec2a40" }));
  def("choco", 32, 31, purun({ body: "#9a5a32", top: "#4a2412", cherry: "#ffffff", cheek: "#e07070" }));
  def("kinpurun", 32, 31, purun({ body: "#ffd21a", top: "#fff2a0", cherry: "#ffffff", cheek: "#ffb040", gleam: true }));
  def("ichigo", 32, 31, purun({ body: "#ffb0c8", top: "#e83a5a", cherry: "#ec2a40", cheek: "#ff6a8a" }));

  // グミ: スーパーポポランドから やってきた ぷにぷにの グミ
  function gumi(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(15, 17, 12, 9.5, c.body);
        Q.ell(9, 10, 4, 4, c.body);
        Q.ell(21, 10, 4, 4, c.body);
        Q.ell(7, 26, 3.5, 2, c.body);
        Q.ell(23, 26, 3.5, 2, c.body);
      }, { shade: 4, outline: true });
      P.ell(11, 13, 3, 2, shade(c.body, 1.45));
      P.ell(20, 22, 1.5, 1.5, shade(c.body, 1.2));
      P.ell(23, 19, 1, 1, shade(c.body, 1.2));
      P.eye(11, 16, 2.6, 3.4, 0.5, 0);
      P.eye(19.5, 16, 2.6, 3.4, 0.5, 0);
      // ω のくち
      P.p(13, 21, OUT); P.p(14, 22, OUT); P.p(15, 21, OUT); P.p(16, 22, OUT); P.p(17, 21, OUT);
      cheek(P, 7, 20); cheek(P, 22, 20);
    };
  }
  def("gumi", 30, 30, gumi({ body: "#2fc8b0" }));
  def("gumired", 30, 30, gumi({ body: "#ff5a6a" }));

  // パタ: コウモリの はねで パタパタ。夜になると 気が大きくなる
  function pata(c) {
    return (P) => {
      P.part((Q) => {
        const wing = (s) => {
          const cx = 18;
          const pts = [[cx + s * 4, 12], [cx + s * 16, 3], [cx + s * 17, 8], [cx + s * 15, 12], [cx + s * 16, 16], [cx + s * 12, 15], [cx + s * 11, 19], [cx + s * 6, 17]];
          Q.poly(pts, c.wing);
        };
        wing(-1); wing(1);
      }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.ball(18, 15, 8.5, 8, c.body);
        Q.poly([[12, 9], [11, 2], [15, 7]], c.body);
        Q.poly([[24, 9], [25, 2], [21, 7]], c.body);
      }, { shade: 3, outline: true });
      P.eye(15, 13, 2.6, 2.6, 0.6, 0.2, { white: c.eye, pupil: 1.2 });
      P.eye(21.5, 13, 2.6, 2.6, 0.6, 0.2, { white: c.eye, pupil: 1.2 });
      P.brow(12, 9, 17, 11, 1);
      P.brow(24, 9, 19, 11, 1);
      fangMouth(P, 15, 18, 7);
      P.part((Q) => { Q.r(12, 22, 2, 3, c.body); Q.r(22, 22, 2, 3, c.body); }, OL);
    };
  }
  def("pata", 36, 28, pata({ body: "#6a4aa8", wing: "#9a6ae0", eye: "#ffe040" }));
  def("yorupata", 36, 28, pata({ body: "#2a3a7a", wing: "#3a6ab8", eye: "#ff5a5a" }));

  // カラ: ふきげんな カメ。こうらは かたい
  function kara(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(8, 24, 3, 3, c.skin); Q.ell(22, 24, 3, 3, c.skin);
        Q.ell(28, 16, 6, 5.5, c.skin);
        Q.ell(3, 19, 3, 1.5, c.skin);
      }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.ell(15, 15, 12, 10, c.shell);
        Q.r(3, 19, 24, 4, c.belly);
      }, { shade: 3, outline: true });
      P.part((Q) => {
        const hex = (x, y) => { Q.ell(x, y, 3, 2.5, c.plate); };
        hex(15, 9); hex(9, 13); hex(21, 13); hex(15, 15);
      }, { outline: shade(c.shell, 0.55) });
      P.r(3, 20, 24, 1, shade(c.belly, 0.75));
      P.eye(29, 14, 2, 2.4, 0.6, 0.2);
      P.brow(26, 11, 32, 12, 1);
      P.r(30, 18, 3, 1, OUT);
      if (c.bandage) { P.r(26, 9, 4, 2, "#ffffff"); P.p(27, 10, "#e0c0a0"); }
    };
  }
  def("kara", 36, 30, kara({ skin: "#7ac84a", shell: "#f0902a", belly: "#ffe08a", plate: "#ffb050", bandage: true }));
  def("haganekara", 36, 30, kara({ skin: "#8a9ab0", shell: "#5a6a88", belly: "#c0c8d8", plate: "#8a9ac0" }));

  // トゲ: ふめない トゲトゲ。さわると いたい
  function toge(c) {
    return (P) => {
      P.part((Q) => {
        for (let i = 0; i < 9; i++) {
          const a = Math.PI * (0.95 + (i / 8) * 1.1);
          const cx = 16 + Math.cos(a) * 9;
          const cy = 16 + Math.sin(a) * 9;
          const tx = 16 + Math.cos(a) * 16;
          const ty = 16 + Math.sin(a) * 15;
          const nx = -Math.sin(a) * 3;
          const ny = Math.cos(a) * 3;
          Q.poly([[cx + nx, cy + ny], [tx, ty], [cx - nx, cy - ny]], c.spike);
        }
      }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.ball(16, 17, 11, 10, c.body);
        Q.ell(10, 28, 4, 2.2, c.foot); Q.ell(22, 28, 4, 2.2, c.foot);
      }, { shade: 3, outline: true });
      P.eye(13, 15, 2.4, 3, 0.7, 0.1);
      P.eye(21, 15, 2.4, 3, 0.7, 0.1);
      P.brow(9, 10, 15, 13, 2);
      P.brow(25, 10, 19, 13, 2);
      fangMouth(P, 13, 20, 9);
    };
  }
  def("toge", 32, 32, toge({ body: "#e8403a", spike: "#f4f4f4", foot: "#ffb040" }));
  def("benitoge", 32, 32, toge({ body: "#5a2a8a", spike: "#ffd040", foot: "#ff6a3a" }));

  // ================================================================ 2. ほしくずの もり
  // マッシュボクサー: キノコの ボクサー。「シュッ シュッ」と シャドーが 日課
  function mush(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(13, 33, 3, 2, "#8a3a2a"); Q.ell(21, 33, 3, 2, "#8a3a2a");
        Q.r(11, 27, 4, 5, c.stem); Q.r(19, 27, 4, 5, c.stem);
      }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.ell(17, 22, 8, 8, c.stem);
        Q.r(10, 25, 14, 4, c.shorts);
      }, { shade: 3, outline: true });
      P.part((Q) => {
        Q.ell(17, 10, 15, 9, c.cap);
        Q.r(2, 10, 30, 4, c.cap);
      }, { shade: 3, outline: true });
      P.part((Q) => {
        Q.ell(10, 6, 3, 2, "#ffffff"); Q.ell(20, 4, 2.5, 2, "#ffffff"); Q.ell(26, 9, 2.5, 2, "#ffffff"); Q.ell(15, 10, 2, 1.5, "#ffffff");
      }, { shade: 1 });
      P.r(2, 14, 30, 1, OUT);
      P.eye(15, 19, 2, 2.6, 0.7, 0);
      P.eye(21, 19, 2, 2.6, 0.7, 0);
      P.brow(12, 15, 17, 17, 2);
      P.brow(24, 15, 19, 17, 2);
      grin(P, 15, 23, 6, { h: 2, tongue: false });
      // グローブ
      P.part((Q) => {
        Q.ball(7, 22, 4.5, 4.5, c.glove);
        Q.ball(30, 20, 4.5, 4.5, c.glove);
        Q.r(5, 26, 4, 2, "#ffffff"); Q.r(28, 24, 4, 2, "#ffffff");
      }, { outline: true });
    };
  }
  def("mush", 36, 36, mush({ cap: "#e83a3a", stem: "#f8e0b8", shorts: "#3a5ad8", glove: "#ff4a4a" }));
  def("mushking", 36, 36, mush({ cap: "#8a3ad8", stem: "#f0d8f0", shorts: "#f0b020", glove: "#ffd040" }));

  // バナナざる: レースで バナナを なげていた あの おさるの なかま
  function monkey(c) {
    return (P) => {
      P.part((Q) => {
        Q.worm([[8, 30], [3, 26], [3, 20], [7, 18], [8, 21]], c.fur, 3, 2);
      }, { outline: true });
      P.part((Q) => {
        Q.ell(17, 27, 9, 7, c.fur);
        Q.ell(11, 33, 4, 2.5, c.fur); Q.ell(23, 33, 4, 2.5, c.fur);
      }, { shade: 3, outline: true });
      P.part((Q) => { Q.ell(18, 28, 5, 4.5, c.face); }, { shade: 1 });
      P.part((Q) => {
        Q.ell(17, 14, 10, 9, c.fur);
        Q.ell(6, 14, 3.5, 3.5, c.fur); Q.ell(28, 14, 3.5, 3.5, c.fur);
      }, { shade: 3, outline: true });
      P.ell(6, 14, 2, 2, c.face); P.ell(28, 14, 2, 2, c.face);
      P.part((Q) => { Q.ell(18, 16, 7.5, 6, c.face); }, { shade: 1 });
      P.eye(15, 13, 2, 2.5, 0.6, 0);
      P.eye(21, 13, 2, 2.5, 0.6, 0);
      P.p(17, 17, OUT); P.p(19, 17, OUT);
      // いたずらっぽい にやり
      P.line(14, 19, 22, 20, OUT); P.line(22, 20, 23, 18, OUT);
      P.r(20, 20, 2, 1, "#ffffff");
      // あたまの バナナの かわ
      P.part((Q) => {
        Q.poly([[12, 7], [17, 1], [22, 7], [26, 9], [20, 8], [17, 6], [14, 8], [9, 10]], "#ffe040");
        Q.r(16, 0, 2, 2, "#6a4a1a");
      }, { shade: 1, outline: true });
      // 手に バナナ
      P.part((Q) => {
        Q.worm([[25, 26], [30, 24], [33, 20]], "#ffe040", 3, 2);
        Q.ell(25, 26, 2.5, 2.5, c.face);
      }, { outline: true });
    };
  }
  def("monkey", 36, 37, monkey({ fur: "#a0602a", face: "#ffd0a0" }));
  def("yetimonkey", 36, 37, monkey({ fur: "#e8f0ff", face: "#a0c0e8" }));

  // ハチドリル: ゴーグルの ハチ。はなの ドリルで なんでも つらぬく
  function bee(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(14, 6, 6, 4, "#d8f4ff"); Q.ell(20, 5, 5, 3.5, "#d8f4ff");
      }, { outline: "#4a7aa8" });
      P.part((Q) => {
        Q.ball(7, 19, 6, 6, c.body);
        Q.poly([[2, 21], [-1, 25], [4, 23]], OUT);
      }, { shade: 2, outline: true });
      P.atop((Q) => { Q.r(4, 13, 2, 12, OUT); Q.r(8, 13, 2, 12, OUT); });
      P.part((Q) => { Q.ball(17, 16, 8, 8, c.body); }, { shade: 3, outline: true });
      P.atop((Q) => { Q.r(11, 22, 12, 2, OUT); });
      // ドリル
      P.part((Q) => {
        Q.poly([[23, 12], [34, 16], [23, 20]], "#c8d0e0");
        Q.line(25, 13, 27, 18, "#7a8098"); Q.line(28, 14, 30, 17, "#7a8098");
      }, { outline: true });
      // ゴーグル
      P.part((Q) => {
        Q.r(10, 11, 13, 2, "#6a3a1a");
        Q.ell(15, 12, 3, 3, "#a0e0ff"); Q.ell(21, 12, 3, 3, "#a0e0ff");
      }, { outline: true });
      P.p(14, 11, "#ffffff"); P.p(20, 11, "#ffffff");
      P.r(15, 12, 2, 2, OUT); P.r(21, 12, 2, 2, OUT);
      P.line(16, 20, 21, 19, OUT);
      P.part((Q) => { Q.line(14, 8, 12, 3, OUT); Q.ell(12, 3, 1.5, 1.5, c.body); Q.line(19, 8, 20, 2, OUT); Q.ell(20, 2, 1.5, 1.5, c.body); });
      P.part((Q) => { Q.r(13, 24, 2, 4, OUT); Q.r(19, 24, 2, 4, OUT); });
    };
  }
  def("bee", 36, 30, bee({ body: "#ffd020" }));
  def("hornet", 36, 30, bee({ body: "#ff7a2a" }));

  // ランタンおばけ: さみしがりやの おばけ。ランタンの 火で あそびたい
  function ghost(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(15, 13, 11, 11, c.body);
        Q.r(4, 13, 22, 12, c.body);
        for (let i = 0; i < 4; i++) Q.ell(6.5 + i * 6, 25, 3, 3, c.body);
        Q.ell(25, 20, 4, 3, c.body);
      }, { shade: 3, outline: true });
      P.eye(13, 12, 2.6, 3.5, 0.5, 0.2, { white: "#1a1020", iris: c.eyes, pupil: 1.4 });
      P.eye(20, 12, 2.6, 3.5, 0.5, 0.2, { white: "#1a1020", iris: c.eyes, pupil: 1.4 });
      P.ell(16.5, 19, 3, 2.2, OUT);
      P.ell(17.5, 20.5, 1.5, 1, "#ff6a8a");
      cheek(P, 9, 17, "#ffa0c0"); cheek(P, 23, 17, "#ffa0c0");
      P.part((Q) => {
        Q.line(29, 13, 29, 17, OUT);
        Q.r(26, 17, 7, 2, "#6a4a2a");
        Q.r(27, 19, 5, 7, c.glass);
        Q.r(26, 26, 7, 2, "#6a4a2a");
      }, { outline: true });
      P.ell(29.5, 22.5, 1.5, 2.5, c.flame);
      P.p(29, 21, "#ffffff");
    };
  }
  def("ghost", 36, 32, ghost({ body: "#f0f0ff", eyes: "#ff8a2a", glass: "#ffe890", flame: "#ff8a2a" }));
  def("aoghost", 36, 32, ghost({ body: "#b8e8ff", eyes: "#3ad8ff", glass: "#c0f8ff", flame: "#3a8aff" }));

  // ================================================================ ボス 1: キングトゲ
  // スーパーポポランドの キングトゲが、まりゅうの ちからで パワーアップして かえってきた！
  def("kingtoge", 84, 80, (P) => {
    const body = "#e8403a";
    P.part((Q) => {
      for (let i = 0; i < 13; i++) {
        const a = Math.PI * (0.92 + (i / 12) * 1.16);
        const cx = 42 + Math.cos(a) * 24;
        const cy = 46 + Math.sin(a) * 22;
        const tx = 42 + Math.cos(a) * 40;
        const ty = 46 + Math.sin(a) * 37;
        const nx = -Math.sin(a) * 5.5;
        const ny = Math.cos(a) * 5.5;
        Q.poly([[cx + nx, cy + ny], [tx, ty], [cx - nx, cy - ny]], "#f8f4ea");
      }
    }, { shade: 2, outline: true });
    // あし
    P.part((Q) => { Q.ell(28, 75, 9, 4.5, "#ffb040"); Q.ell(56, 75, 9, 4.5, "#ffb040"); }, { shade: 2, outline: true });
    P.part((Q) => { Q.ball(42, 47, 29, 27, body); }, { shade: 6, outline: true });
    // おなか
    P.part((Q) => { Q.ell(44, 58, 16, 12, "#ffb0a0"); }, { shade: 3 });
    // 王冠
    P.part((Q) => {
      Q.poly([[26, 22], [24, 4], [32, 13], [37, 1], [42, 12], [48, 1], [52, 13], [60, 4], [58, 22]], "#ffd030");
      Q.r(26, 18, 32, 6, "#ffd030");
    }, { shade: 3, outline: true });
    P.part((Q) => {
      Q.ell(42, 20.5, 3, 2.5, "#3ae0ff"); Q.ell(32, 21, 2, 2, "#ff3a6a"); Q.ell(52, 21, 2, 2, "#3ac84a");
      Q.ell(24.5, 4.5, 1.5, 1.5, "#ff3a6a"); Q.ell(37, 1.5, 1.5, 1.5, "#ffffff"); Q.ell(48, 1.5, 1.5, 1.5, "#ffffff"); Q.ell(59.5, 4.5, 1.5, 1.5, "#ff3a6a");
    }, OL);
    // 目
    P.eye(34, 35, 6, 7, 0.6, 0.2, { pupil: 3 });
    P.eye(51, 35, 6, 7, 0.6, 0.2, { pupil: 3 });
    P.brow(25, 25, 38, 30, 4);
    P.brow(60, 25, 47, 30, 4);
    // ひげ
    P.part((Q) => {
      Q.ell(36, 46, 9, 4, "#ffffff"); Q.ell(50, 46, 9, 4, "#ffffff");
      Q.ell(28, 48, 4, 3, "#ffffff"); Q.ell(58, 48, 4, 3, "#ffffff");
      Q.ell(25, 50, 2, 2, "#ffffff"); Q.ell(61, 50, 2, 2, "#ffffff");
    }, { shade: 2, outline: true });
    P.ell(43, 41, 4, 3, "#ff8070");
    P.ell(42, 40, 1.5, 1, "#ffd0c8");
    // おおきな口
    P.ell(43, 55, 10, 5, OUT);
    P.ell(43, 56, 9, 4, "#7a0a20");
    P.r(35, 52, 17, 2, "#ffffff");
    P.p(35, 54, "#ffffff"); P.p(51, 54, "#ffffff");
    P.ell(46, 58, 4, 1.5, "#ff6a8a");
    // うで と しゃく
    P.part((Q) => {
      Q.worm([[66, 56], [74, 50], [76, 42]], body, 6, 5);
      Q.line(77, 46, 77, 16, "#8a5a2a", 2);
      Q.ell(18, 58, 5, 4, body);
    }, { shade: 2, outline: true });
    P.part((Q) => {
      Q.ball(77, 12, 5, 5, "#ffd030");
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; Q.poly([[77 + Math.cos(a) * 4, 12 + Math.sin(a) * 4], [77 + Math.cos(a + 0.3) * 8, 12 + Math.sin(a + 0.3) * 8], [77 + Math.cos(a + 0.6) * 4, 12 + Math.sin(a + 0.6) * 4]], "#ffd030"); }
    }, { shade: 2, outline: true });
    P.ell(77, 12, 2, 2, "#ff3a6a");
    P.ball(76, 46, 4, 4, body);
  });

  // ================================================================ 3. ランドール へいげん
  // ガルルン: いきがった オオカミの こども。バンダナが じまん
  function wolf(c) {
    return (P) => {
      P.part((Q) => {
        Q.worm([[6, 20], [2, 14], [4, 9]], c.fur, 5, 3);
        Q.ell(13, 22, 9, 7, c.fur);
        Q.r(8, 25, 4, 6, c.fur); Q.r(17, 25, 4, 6, c.fur);
        Q.ell(10, 31, 3, 1.5, c.fur); Q.ell(19, 31, 3, 1.5, c.fur);
      }, { shade: 3, outline: true });
      P.part((Q) => {
        Q.ball(25, 15, 10, 9, c.fur);
        Q.poly([[17, 9], [16, -1], [23, 6]], c.fur);
        Q.poly([[27, 6], [32, -1], [33, 9]], c.fur);
        Q.ell(33, 19, 6, 4, c.fur);
        // ほおの ふさふさ
        Q.poly([[16, 16], [12, 20], [18, 21]], c.fur);
      }, { shade: 3, outline: true });
      P.ell(19, 4, 1.5, 3, c.inner); P.ell(31, 4, 1.5, 3, c.inner);
      P.part((Q) => { Q.ell(34, 21, 5, 2.5, c.light); }, {});
      P.ell(38.5, 17, 1.8, 1.4, OUT);
      P.eye(26, 13, 2.2, 2.4, 0.8, 0.2, { iris: c.iris, pupil: 1.3 });
      P.brow(22, 9, 29, 11, 2);
      P.line(30, 22, 38, 21, OUT);
      P.p(33, 23, "#ffffff"); P.p(36, 22, "#ffffff");
      // きず
      P.line(22, 16, 24, 19, "#c04040");
      // バンダナ
      P.part((Q) => {
        Q.poly([[15, 21], [27, 22], [26, 26], [16, 25]], c.scarf);
        Q.poly([[16, 23], [10, 27], [13, 22]], c.scarf);
      }, { shade: 1, outline: true });
      P.p(20, 23, "#ffffff"); P.p(23, 24, "#ffffff");
    };
  }
  def("wolf", 40, 33, wolf({ fur: "#7a8ab0", light: "#d8e0f0", inner: "#ff9ab0", iris: "#ffd030", scarf: "#e83a3a" }));
  def("icewolf", 40, 33, wolf({ fur: "#d8ecff", light: "#ffffff", inner: "#a0c8ff", iris: "#3a8aff", scarf: "#3a5ad8" }));
  def("firewolf", 40, 33, wolf({ fur: "#c84a2a", light: "#ffc890", inner: "#ffd040", iris: "#ffffff", scarf: "#2a2a2a" }));

  // コボルン: なべを かぶった ゴブリンの こぶん
  function kobo(c) {
    return (P) => {
      P.part((Q) => {
        Q.line(6, 30, 12, 6, "#8a5a2a", 3);
        Q.ell(13, 5, 4.5, 4.5, "#a87040");
      }, { shade: 1, outline: true });
      P.part((Q) => { for (const [x, y] of [[9, 2], [16, 2], [13, 0], [17, 6], [9, 8]]) Q.r(x, y, 2, 2, "#e0e0e0"); }, OL);
      P.part((Q) => {
        Q.ell(17, 27, 7, 6, c.skin);
        Q.r(12, 31, 3, 4, c.skin); Q.r(19, 31, 3, 4, c.skin);
        Q.ell(13, 35, 3, 1.5, c.skin); Q.ell(21, 35, 3, 1.5, c.skin);
      }, { shade: 2, outline: true });
      P.part((Q) => { Q.poly([[11, 28], [24, 28], [22, 33], [13, 33]], c.cloth); }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.ball(18, 16, 9, 8, c.skin);
        Q.poly([[10, 15], [1, 11], [9, 19]], c.skin);
        Q.poly([[26, 15], [33, 9], [27, 19]], c.skin);
      }, { shade: 3, outline: true });
      // なべの かぶと
      P.part((Q) => {
        Q.ell(18, 10, 9.5, 5, c.pot);
        Q.r(8, 10, 20, 3, c.pot);
        Q.r(16, 3, 4, 2, OUT);
      }, { shade: 2, outline: true });
      P.eye(17, 16, 2, 2.4, 0.8, 0);
      P.eye(23, 16, 2, 2.4, 0.8, 0);
      P.part((Q) => { Q.ball(23, 20, 3, 2.5, shade(c.skin, 0.9)); }, OL);
      P.r(17, 23, 6, 1, OUT); P.p(18, 24, "#ffffff"); P.p(21, 24, "#ffffff");
      P.part((Q) => { Q.ell(10, 26, 2.5, 2.5, c.skin); }, OL);
    };
  }
  def("kobo", 36, 37, kobo({ skin: "#7ac84a", cloth: "#a06a3a", pot: "#8a98a8" }));
  def("koboboss", 36, 37, kobo({ skin: "#d8604a", cloth: "#3a3a5a", pot: "#ffd030" }));

  // マジカルハット: まほうつかいに すてられた ぼうしが、ひとりで まほうを おぼえた
  function hat(c) {
    return (P) => {
      P.part((Q) => {
        Q.poly([[8, 26], [15, 4], [19, 0], [26, 3], [22, 6], [27, 26]], c.hat);
      }, { shade: 4, outline: true });
      P.part((Q) => { Q.ell(18, 27, 16, 5, c.hat); }, { shade: 2, outline: true });
      P.part((Q) => { Q.poly([[9, 21], [27, 21], [27.5, 25], [8.5, 25]], c.band); }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.poly([[18, 19], [19, 21.5], [21.5, 22], [19.5, 23.5], [20, 26], [18, 24.5], [16, 26], [16.5, 23.5], [14.5, 22], [17, 21.5]], "#ffe040");
      }, OL);
      P.r(4, 29, 28, 4, OUT);
      P.ell(13, 30.5, 2, 1.2, c.eyes); P.ell(22, 30.5, 2, 1.2, c.eyes);
      P.p(13, 30, "#ffffff"); P.p(22, 30, "#ffffff");
      // てぶくろ と つえ
      P.part((Q) => {
        Q.ell(4, 22, 3, 3, "#ffffff");
        Q.line(33, 30, 34, 12, "#7a4a2a", 2);
        Q.ell(32, 28, 3, 3, "#ffffff");
      }, { shade: 1, outline: true });
      P.part((Q) => { Q.ball(34, 10, 3, 3, c.orb); }, OL);
      sparkle(P, 30, 6, c.orb);
    };
  }
  def("hat", 38, 35, hat({ hat: "#7a3ac8", band: "#3a1a6a", eyes: "#ffe040", orb: "#ff6af0" }));
  def("darkhat", 38, 35, hat({ hat: "#2a2a3a", band: "#a01a2a", eyes: "#ff3a3a", orb: "#ff3a3a" }));

  // ================================================================ 4. ゴロゴロ こうざん
  // イワゴロン: ねむたい いわ。おこると ころがってくる
  function rock(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(10, 34, 4, 2, c.rock); Q.ell(26, 34, 4, 2, c.rock);
      }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.poly([[3, 22], [5, 10], [12, 4], [22, 3], [31, 8], [35, 18], [33, 30], [22, 34], [9, 33]], c.rock);
      }, { shade: 5, outline: true });
      P.part((Q) => {
        Q.line(9, 14, 13, 18, shade(c.rock, 0.6)); Q.line(13, 18, 12, 22, shade(c.rock, 0.6));
        Q.line(28, 25, 31, 22, shade(c.rock, 0.6));
      });
      P.part((Q) => { Q.ell(18, 5, 9, 3, c.moss); Q.ell(11, 7, 3, 2, c.moss); Q.ell(25, 7, 4, 2, c.moss); }, { shade: 1, outline: true });
      // ねむたそうな 目
      P.r(16, 15, 6, 2, OUT); P.r(25, 15, 6, 2, OUT);
      P.r(17, 17, 4, 1, "#ffffff"); P.r(26, 17, 4, 1, "#ffffff");
      P.r(18, 17, 2, 1, OUT); P.r(27, 17, 2, 1, OUT);
      P.brow(15, 12, 21, 14, 2); P.brow(31, 12, 25, 14, 2);
      P.r(19, 24, 9, 2, OUT); P.r(20, 25, 2, 2, "#ffffff"); P.r(25, 25, 2, 2, "#ffffff");
      // うで
      P.part((Q) => { Q.ball(4, 24, 3.5, 3.5, c.rock); Q.ball(35, 23, 3.5, 3.5, c.rock); }, { outline: true });
    };
  }
  def("rock", 40, 37, rock({ rock: "#9a8a7a", moss: "#5ab040" }));
  def("magmarock", 40, 37, rock({ rock: "#5a3a3a", moss: "#ff7a2a" }));

  // モグラッパ: サングラスの モグラ。くらい ところでも サングラス
  function mole(c) {
    return (P) => {
      P.part((Q) => {
        Q.ball(18, 22, 13, 11, c.fur);
        Q.ell(9, 33, 4, 2, c.fur); Q.ell(25, 33, 4, 2, c.fur);
      }, { shade: 4, outline: true });
      P.part((Q) => { Q.ell(19, 26, 8, 6, c.belly); }, { shade: 1 });
      P.part((Q) => {
        Q.ell(18, 11, 11, 5, c.helmet);
        Q.r(7, 11, 22, 3, c.helmet);
        Q.r(16, 5, 5, 4, "#c0c0c0");
      }, { shade: 2, outline: true });
      P.ell(18.5, 7, 2, 1.6, "#fff8a0");
      // サングラス
      P.part((Q) => {
        Q.r(12, 15, 18, 2, OUT);
        Q.ell(15.5, 17, 4, 2.5, "#2a2a4a"); Q.ell(25, 17, 4, 2.5, "#2a2a4a");
      }, OL);
      P.p(14, 16, "#a0c0ff"); P.p(23, 16, "#a0c0ff");
      P.part((Q) => { Q.ball(30, 21, 3, 2.5, "#ff9ab0"); }, OL);
      P.r(20, 24, 6, 1, OUT); P.r(22, 25, 2, 2, "#ffffff");
      // ツメ
      P.part((Q) => {
        Q.ell(5, 24, 4, 4, c.belly);
        Q.ell(32, 28, 4, 4, c.belly);
        Q.poly([[33, 25], [38, 23], [36, 27]], "#ffffff");
        Q.poly([[34, 28], [39, 28], [35, 31]], "#ffffff");
      }, { shade: 1, outline: true });
    };
  }
  def("mole", 40, 36, mole({ fur: "#7a5a9a", belly: "#ffc8a8", helmet: "#ffc020" }));

  // ダイナマイトくん: いつも あせっている ばくだん。たまに ほんとうに ばくはつする
  function bomb(c) {
    return (P) => {
      P.part((Q) => { Q.ell(10, 32, 4, 2, "#ff8a2a"); Q.ell(20, 32, 4, 2, "#ff8a2a"); }, { shade: 1, outline: true });
      P.part((Q) => { Q.ball(15, 20, 11, 11, c.body); }, { shade: 4, outline: true });
      P.part((Q) => { Q.r(12, 6, 6, 4, "#8a8a9a"); }, { shade: 1, outline: true });
      P.part((Q) => { Q.worm([[15, 6], [17, 2], [21, 1]], "#e8d0a0", 2, 2); }, OL);
      P.ell(22, 1.5, 2.5, 2.5, "#ffe040"); P.ell(22, 1.5, 1.2, 1.2, "#ffffff");
      P.eye(12, 19, 2.6, 3.4, 0.5, -0.2);
      P.eye(20, 19, 2.6, 3.4, 0.5, -0.2);
      P.ell(17, 26, 2, 1.5, OUT);
      // あせ
      P.part((Q) => { Q.ell(26, 14, 1.5, 2.5, "#8ad8ff"); Q.ell(5, 16, 1.2, 2, "#8ad8ff"); }, OL);
      P.part((Q) => { Q.ell(4, 22, 2.5, 2.5, c.body); Q.ell(27, 23, 2.5, 2.5, c.body); }, OL);
    };
  }
  def("bomb", 30, 34, bomb({ body: "#3a3a5a" }));
  def("megabomb", 30, 34, bomb({ body: "#c83a3a" }));

  // ガイコツこうふ: むかしの こうふ。しんでも ほりつづける
  function skel(c) {
    return (P) => {
      P.part((Q) => {
        Q.line(2, 4, 12, 30, "#8a5a2a", 2);
        Q.poly([[-2, 8], [4, 1], [10, -1], [6, 4]], "#b0b8c8");
      }, { shade: 1, outline: true });
      P.part((Q) => {
        // せぼね と あばら
        Q.r(16, 22, 3, 12, c.bone);
        for (let i = 0; i < 3; i++) Q.ell(17.5, 23 + i * 3, 6 - i, 1, c.bone);
        Q.line(12, 34, 12, 40, c.bone, 2); Q.line(22, 34, 22, 40, c.bone, 2);
        Q.ell(11, 40, 3, 1.5, c.bone); Q.ell(23, 40, 3, 1.5, c.bone);
        Q.r(11, 33, 13, 3, c.bone);
        Q.line(12, 23, 8, 28, c.bone, 2); Q.line(23, 23, 28, 26, c.bone, 2);
      }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.ball(18, 13, 10, 9, c.bone);
        Q.r(13, 18, 11, 5, c.bone);
      }, { shade: 3, outline: true });
      P.ell(15, 13, 3, 3.3, OUT); P.ell(22, 13, 3, 3.3, OUT);
      P.ell(15.5, 13.5, 1, 1, c.glow); P.ell(22.5, 13.5, 1, 1, c.glow);
      P.p(18, 17, OUT); P.p(19, 17, OUT);
      P.r(14, 20, 9, 2, OUT); for (let i = 14; i < 23; i += 2) P.p(i, 20, c.bone);
      P.part((Q) => {
        Q.ell(18, 6, 10, 4, c.helmet);
        Q.r(8, 6, 21, 2, c.helmet);
        Q.r(16, 1, 4, 3, "#c0c0c0");
      }, { shade: 2, outline: true });
      P.ell(18, 2.5, 1.5, 1.2, "#fff8a0");
      P.part((Q) => { Q.ell(29, 26, 2.5, 2.5, c.bone); Q.ell(8, 28, 2.5, 2.5, c.bone); }, OL);
    };
  }
  def("skel", 34, 43, skel({ bone: "#f0ead8", glow: "#ff4a4a", helmet: "#c8a030" }));
  def("darkskel", 34, 43, skel({ bone: "#b8b0d8", glow: "#40ffe0", helmet: "#5a3a8a" }));

  // ================================================================ ボス 2: ガンテツ / くろがねゴーレム
  // ガンテツ: こうざんの さんぞく おやぶん。こわい かおで、じつは こどもに やさしい
  def("gantetsu", 64, 72, (P) => {
    const skin = "#e8a070";
    P.part((Q) => {
      Q.line(56, 70, 50, 14, "#8a5a2a", 4);
      Q.r(42, 2, 20, 14, "#8a8a9a");
    }, { shade: 3, outline: true });
    P.part((Q) => { Q.r(44, 4, 2, 10, "#c8c8d8"); Q.r(58, 4, 2, 10, "#5a5a6a"); });
    // あし
    P.part((Q) => {
      Q.r(18, 56, 10, 12, "#4a3a6a"); Q.r(34, 56, 10, 12, "#4a3a6a");
      Q.ell(22, 69, 7, 3, "#5a3a2a"); Q.ell(40, 69, 7, 3, "#5a3a2a");
    }, { shade: 2, outline: true });
    // からだ (まるい おなか)
    P.part((Q) => {
      Q.ball(31, 42, 20, 17, skin);
      Q.ell(10, 34, 8, 10, skin); Q.ell(52, 32, 8, 10, skin);
    }, { shade: 5, outline: true });
    P.part((Q) => { Q.r(12, 52, 38, 6, "#3a2a5a"); Q.r(27, 51, 8, 8, "#ffd030"); }, { shade: 2, outline: true });
    // むね毛 と へそ
    P.part((Q) => { Q.ell(31, 46, 2, 1.5, shade(skin, 0.6)); Q.line(25, 36, 28, 38, shade(skin, 0.6)); Q.line(37, 36, 34, 38, shade(skin, 0.6)); });
    // うで
    P.part((Q) => {
      Q.ball(8, 46, 7, 7, skin);
      Q.ball(56, 42, 7, 7, skin);
      Q.r(2, 40, 12, 4, "#e83a3a"); Q.r(50, 36, 12, 4, "#e83a3a");
    }, { shade: 3, outline: true });
    // あたま
    P.part((Q) => {
      Q.ball(32, 18, 13, 12, skin);
      Q.ell(20, 19, 2.5, 3.5, skin); Q.ell(44, 19, 2.5, 3.5, skin);
    }, { shade: 4, outline: true });
    // モヒカン
    P.part((Q) => { Q.poly([[26, 9], [28, -1], [32, 4], [35, -1], [38, 3], [40, 9], [32, 8]], "#2a1a1a"); }, { outline: true });
    // ひげ
    P.part((Q) => {
      Q.ell(32, 27, 11, 7, "#3a2216");
      Q.ell(25, 23, 4, 4, "#3a2216"); Q.ell(39, 23, 4, 4, "#3a2216");
    }, { shade: 2, outline: true });
    P.ell(32, 26, 5, 2.5, OUT);
    P.r(28, 24, 9, 2, "#ffffff");
    P.eye(27, 16, 2.5, 2.5, 0.6, 0.2, { pupil: 1.4 });
    P.eye(37, 16, 2.5, 2.5, 0.6, 0.2, { pupil: 1.4 });
    P.brow(22, 11, 30, 14, 3); P.brow(42, 11, 34, 14, 3);
    P.part((Q) => { Q.ball(32, 20, 3, 2.5, shade(skin, 0.95)); }, OL);
    P.line(38, 9, 42, 14, "#c04040");
  });

  // くろがねゴーレム ガンドロス: まりゅうの ちからで うごきだした いにしえの てつの きょじん
  def("golem", 92, 88, (P) => {
    const iron = "#5a6a8a";
    const plate = "#8a9ab8";
    // あし
    P.part((Q) => {
      Q.r(26, 66, 14, 16, iron); Q.r(52, 66, 14, 16, iron);
      Q.ell(33, 84, 11, 4, plate); Q.ell(59, 84, 11, 4, plate);
    }, { shade: 3, outline: true });
    // からだ
    P.part((Q) => {
      Q.ball(46, 48, 30, 24, iron);
    }, { shade: 7, outline: true });
    P.part((Q) => {
      Q.ell(46, 52, 18, 14, plate);
    }, { shade: 4, outline: true });
    // コア
    P.part((Q) => { Q.ball(46, 52, 6, 6, "#ff4a3a", { light: "#ffd0a0" }); }, OL);
    // リベット
    for (const [x, y] of [[32, 42], [60, 42], [30, 58], [62, 58], [46, 39], [46, 65]]) P.part((Q) => Q.ball(x, y, 1.6, 1.6, "#c8d0e0", { shine: false }), OL);
    // かた と うで
    P.part((Q) => {
      Q.ball(14, 36, 12, 11, plate);
      Q.ball(78, 36, 12, 11, plate);
    }, { shade: 4, outline: true });
    P.part((Q) => {
      Q.r(6, 44, 14, 14, iron); Q.r(72, 44, 14, 14, iron);
    }, { shade: 3, outline: true });
    // こぶし
    P.part((Q) => {
      Q.ball(12, 64, 11, 10, plate);
      Q.ball(80, 64, 11, 10, plate);
    }, { shade: 4, outline: true });
    P.part((Q) => {
      for (let i = 0; i < 3; i++) { Q.r(5 + i * 5, 58, 1, 8, shade(plate, 0.6)); Q.r(74 + i * 5, 58, 1, 8, shade(plate, 0.6)); }
    });
    // あたま
    P.part((Q) => {
      Q.ball(46, 20, 15, 13, iron);
      Q.poly([[33, 12], [24, 2], [36, 8]], plate);
      Q.poly([[59, 12], [68, 2], [56, 8]], plate);
    }, { shade: 4, outline: true });
    // ひとつめの バイザー
    P.part((Q) => { Q.r(33, 17, 26, 7, "#1a1428"); }, OL);
    P.ell(52, 20.5, 5, 3, "#ff3a2a");
    P.ell(52, 20.5, 2.5, 1.5, "#ffe0a0");
    P.r(36, 20, 10, 1, "#ff3a2a");
    // くちの グリル
    P.part((Q) => { Q.r(39, 26, 14, 4, "#2a3048"); }, OL);
    for (let i = 0; i < 4; i++) P.r(41 + i * 3, 26, 1, 4, "#8a9ab8");
    // じょうき
    P.part((Q) => { Q.ell(22, 24, 3, 3, "#e8e8f0"); Q.ell(18, 20, 4, 3, "#e8e8f0"); Q.ell(70, 24, 3, 3, "#e8e8f0"); Q.ell(74, 20, 4, 3, "#e8e8f0"); }, { shade: 1 });
  });

  // ================================================================ 5. ユキユキ ちほう
  // ユキダルマン: けんかっぱやい ゆきだるま。バケツは かぶとの つもり
  function snowman(c) {
    return (P) => {
      P.part((Q) => {
        Q.line(4, 16, 9, 22, "#7a4a2a", 2); Q.line(4, 16, 2, 12, "#7a4a2a"); Q.line(4, 16, 0, 16, "#7a4a2a");
        Q.line(30, 22, 34, 14, "#7a4a2a", 2); Q.line(34, 14, 36, 10, "#7a4a2a"); Q.line(34, 14, 37, 15, "#7a4a2a");
      });
      P.part((Q) => { Q.ball(18, 29, 12, 10, c.snow); }, { shade: 4, outline: true });
      P.part((Q) => { Q.ball(18, 14, 9, 8, c.snow); }, { shade: 3, outline: true });
      P.part((Q) => { Q.poly([[10, 9], [12, 0], [24, 0], [26, 9]], c.bucket); Q.r(9, 8, 18, 2, c.bucket); }, { shade: 2, outline: true });
      P.part((Q) => { Q.poly([[19, 14], [28, 16], [19, 17]], "#ff8a2a"); }, OL);
      P.r(13, 12, 3, 3, OUT); P.r(20, 12, 3, 3, OUT);
      P.brow(11, 9, 16, 11, 2); P.brow(25, 9, 20, 11, 2);
      for (let i = 0; i < 5; i++) P.p(13 + i * 2, 19 + (i === 0 || i === 4 ? 0 : 1), OUT);
      P.part((Q) => { Q.r(9, 21, 19, 3, c.scarf); Q.r(22, 23, 4, 7, c.scarf); }, { shade: 1, outline: true });
      for (const y of [27, 31, 35]) P.ell(18, y, 1.3, 1.3, OUT);
    };
  }
  def("snowman", 38, 40, snowman({ snow: "#f4f8ff", bucket: "#4a8ae8", scarf: "#e83a5a" }));

  // ペンギンナイト: ちいさな きし。ゆうしゃに あこがれている
  function penguin(c) {
    return (P) => {
      P.part((Q) => { Q.poly([[8, 14], [3, 34], [14, 30]], c.cape); }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.ball(16, 22, 11, 12, c.body);
        Q.ell(11, 35, 4, 2, "#ffa020"); Q.ell(21, 35, 4, 2, "#ffa020");
      }, { shade: 4, outline: true });
      P.part((Q) => { Q.ell(18, 25, 7, 8, "#ffffff"); Q.ell(18, 15, 7, 5, "#ffffff"); }, { shade: 2 });
      P.part((Q) => { Q.poly([[22, 16], [29, 18], [22, 20]], "#ffa020"); }, OL);
      P.eye(16, 14, 2, 2.4, 0.8, 0);
      P.eye(22, 14, 1.8, 2.2, 0.8, 0);
      P.brow(13, 10, 18, 11, 1);
      // かぶと
      P.part((Q) => {
        Q.ell(16, 9, 10, 5, c.helm);
        Q.r(6, 9, 20, 2, c.helm);
        Q.poly([[14, 4], [16, -2], [19, 4]], c.plume);
      }, { shade: 2, outline: true });
      // つるぎ と たて
      P.part((Q) => {
        Q.line(28, 26, 34, 6, "#e0e8f8", 2);
        Q.r(26, 24, 6, 2, "#ffd030");
      }, OL);
      P.part((Q) => { Q.ball(7, 25, 6, 7, c.shield); }, { shade: 2, outline: true });
      P.part((Q) => { Q.r(6, 21, 2, 9, "#ffd030"); Q.r(3, 24, 8, 2, "#ffd030"); });
    };
  }
  def("penguin", 36, 38, penguin({ body: "#2a3a5a", cape: "#e83a3a", helm: "#c0c8d8", plume: "#ff4a4a", shield: "#3a6ae8" }));
  def("penguinking", 36, 38, penguin({ body: "#3a1a4a", cape: "#ffd030", helm: "#ffd030", plume: "#ffffff", shield: "#a01a3a" }));

  // ユキンコ: ふわふわの ゆきの ようせい。いたずらで ふぶきを おこす
  function yukinko(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(16, 22, 9, 9, c.coat);
        Q.ell(9, 30, 3, 2, c.coat); Q.ell(22, 30, 3, 2, c.coat);
      }, { shade: 3, outline: true });
      P.part((Q) => {
        Q.ball(16, 13, 12, 11, c.hood);
        Q.ell(5, 17, 3, 3, c.hood); Q.ell(27, 17, 3, 3, c.hood);
      }, { shade: 3, outline: true });
      P.part((Q) => { Q.ell(17, 15, 7.5, 6.5, "#ffe0d0"); }, { shade: 1, outline: true });
      P.eye(14, 14, 2.2, 3, 0.4, 0.2, { iris: "#3a6ad8" });
      P.eye(20.5, 14, 2.2, 3, 0.4, 0.2, { iris: "#3a6ad8" });
      P.ell(17.5, 19, 1.5, 1, "#e85a7a");
      cheek(P, 11, 17); cheek(P, 22, 17);
      P.part((Q) => { Q.ball(16, 2, 3, 3, "#ffffff"); }, OL);
      sparkle(P, 30, 6, "#bfefff"); sparkle(P, 2, 8, "#bfefff");
    };
  }
  def("yukinko", 34, 33, yukinko({ coat: "#5a8ae8", hood: "#f4f8ff" }));
  def("hinoko", 34, 33, yukinko({ coat: "#e85a2a", hood: "#ffe080" }));

  // ================================================================ 6. こおりの とう
  // クリスタルン: ほうせきの スライム…ではなく、すいしょうの いきもの。まほうを はねかえしそう
  function crystal(c) {
    return (P) => {
      P.part((Q) => {
        Q.poly([[17, 0], [27, 8], [30, 22], [22, 33], [10, 33], [3, 22], [6, 8]], c.gem);
      }, { shade: 4, outline: true });
      P.part((Q) => {
        Q.line(17, 0, 17, 10, shade(c.gem, 1.4)); Q.line(6, 8, 12, 12, shade(c.gem, 1.4)); Q.line(27, 8, 22, 12, shade(c.gem, 0.7));
        Q.line(12, 12, 22, 12, shade(c.gem, 1.2)); Q.line(3, 22, 10, 33, shade(c.gem, 0.75));
      });
      P.eye(13, 18, 2.4, 3, 0.6, 0, { iris: c.iris });
      P.eye(21, 18, 2.4, 3, 0.6, 0, { iris: c.iris });
      P.r(15, 24, 5, 1, OUT);
      sparkle(P, 9, 6); sparkle(P, 28, 28);
      P.part((Q) => { Q.poly([[3, 14], [-1, 18], [3, 20]], c.gem); Q.poly([[30, 14], [34, 17], [30, 20]], c.gem); }, { shade: 1, outline: true });
    };
  }
  def("crystal", 34, 35, crystal({ gem: "#7ae0ff", iris: "#1a4a8a" }));
  def("ruby", 34, 35, crystal({ gem: "#ff4a7a", iris: "#4a0a1a" }));

  // つららゴースト: こおりの とうに すむ さむがりの ゆうれい
  def("iceghost", 36, 36, (P) => {
    P.part((Q) => {
      Q.ell(17, 16, 12, 11, "#c8f0ff");
      Q.worm([[8, 18], [6, 26], [10, 32], [16, 30], [22, 35], [26, 28], [28, 20]], "#c8f0ff", 8, 4);
    }, { shade: 3, outline: true, alpha: 0.95 });
    P.part((Q) => {
      for (let i = 0; i < 5; i++) Q.poly([[8 + i * 4.5, 7], [10 + i * 4.5, -1 + (i % 2) * 3], [12 + i * 4.5, 7]], "#ffffff");
      Q.r(8, 5, 19, 3, "#a0d8ff");
    }, { shade: 1, outline: true });
    P.eye(14, 15, 2.6, 3.4, 0.6, 0.3, { white: "#1a2a4a", iris: "#a0ffff", pupil: 1.3 });
    P.eye(21, 15, 2.6, 3.4, 0.6, 0.3, { white: "#1a2a4a", iris: "#a0ffff", pupil: 1.3 });
    P.ell(18, 22, 3, 2, OUT);
    P.r(16, 21, 4, 1, "#ffffff");
    P.part((Q) => { Q.ell(29, 18, 3, 2.5, "#c8f0ff"); Q.ell(5, 20, 3, 2.5, "#c8f0ff"); }, OL);
  });

  // ================================================================ ボス 3: こおりの まじょ フブキーナ
  def("fubukina", 70, 84, (P) => {
    const hair = "#7ad0ff";
    const robe = "#3a5ad8";
    // かみ (うしろ)
    P.part((Q) => {
      Q.worm([[30, 20], [22, 34], [16, 50], [10, 66], [14, 74]], hair, 14, 6);
      Q.worm([[36, 22], [44, 40], [48, 58], [52, 70]], hair, 10, 4);
    }, { shade: 3, outline: true });
    // ローブ
    P.part((Q) => {
      Q.poly([[22, 38], [44, 38], [56, 82], [10, 82]], robe);
    }, { shade: 5, outline: true });
    P.part((Q) => {
      Q.poly([[30, 40], [36, 40], [40, 82], [26, 82]], "#e8f4ff");
      for (let i = 0; i < 6; i++) Q.poly([[10 + i * 8, 82], [14 + i * 8, 76], [18 + i * 8, 82]], "#e8f4ff");
    }, { shade: 2 });
    // かた の えり
    P.part((Q) => {
      Q.poly([[18, 38], [12, 30], [24, 34], [33, 40], [42, 34], [54, 30], [48, 40]], "#ffffff");
    }, { shade: 2, outline: true });
    // かお
    P.part((Q) => { Q.ball(33, 26, 9, 10, "#f4e0f0"); }, { shade: 3, outline: true });
    // まえがみ
    P.part((Q) => {
      Q.poly([[23, 22], [26, 14], [40, 13], [44, 22], [40, 18], [36, 23], [33, 18], [29, 23]], hair);
    }, { shade: 1, outline: true });
    // つめたい ほほえみ
    P.part((Q) => {
      Q.r(28, 25, 4, 2, "#1a1a3a"); Q.r(36, 25, 4, 2, "#1a1a3a");
      Q.p(30, 26, "#7affff"); Q.p(38, 26, "#7affff");
    });
    P.brow(27, 22, 32, 23, 1, "#3a5ad8"); P.brow(41, 22, 36, 23, 1, "#3a5ad8");
    P.line(32, 31, 37, 31, "#a01a5a"); P.p(37, 30, "#a01a5a");
    P.p(26, 29, "#c8a0d8"); P.p(41, 29, "#c8a0d8");
    // ぼうし
    P.part((Q) => {
      Q.poly([[18, 17], [30, 0], [40, -2], [34, 4], [50, 17]], "#1a2a6a");
      Q.ell(34, 17, 20, 3.5, "#1a2a6a");
    }, { shade: 3, outline: true });
    P.part((Q) => {
      const cx = 34, cy = 11;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; Q.line(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, "#ffffff"); }
    });
    // うで と つえ
    P.part((Q) => {
      Q.worm([[46, 42], [54, 48], [58, 44]], robe, 5, 4);
      Q.line(60, 80, 60, 14, "#c8e8ff", 2);
    }, { shade: 2, outline: true });
    P.part((Q) => {
      Q.poly([[60, 2], [66, 12], [60, 22], [54, 12]], "#7affff");
    }, { shade: 2, outline: true });
    P.part((Q) => { Q.ball(58, 44, 3, 3, "#f4e0f0"); }, OL);
    sparkle(P, 60, 12); sparkle(P, 66, 26, "#bfffff"); sparkle(P, 52, 4, "#bfffff");
  });

  // ================================================================ 7. まりゅうの しま
  // ヒノタマン: ごきげんな ひのたま。だれにでも ハイタッチしたがる (あつい)
  function fireball(c) {
    return (P) => {
      P.part((Q) => {
        Q.ell(16, 22, 11, 10, c.outer);
        Q.poly([[6, 20], [4, 6], [11, 13], [13, 2], [18, 11], [23, 0], [24, 12], [30, 5], [27, 21]], c.outer);
      }, { shade: 2, outline: true });
      P.part((Q) => { Q.ell(16, 23, 8, 7, c.inner); Q.poly([[10, 20], [12, 11], [16, 17], [20, 9], [22, 20]], c.inner); }, { shade: 1 });
      P.eye(13, 20, 2, 2.8, 0.6, 0);
      P.eye(19, 20, 2, 2.8, 0.6, 0);
      grin(P, 13, 25, 7, { h: 2 });
      P.part((Q) => { Q.ell(3, 24, 2.5, 2.5, c.outer); Q.ell(29, 22, 2.5, 2.5, c.outer); }, OL);
    };
  }
  def("fireball", 33, 33, fireball({ outer: "#ff5a1a", inner: "#ffd040" }));
  def("bluefire", 33, 33, fireball({ outer: "#3a6aff", inner: "#a0f0ff" }));

  // トカゲへい: まりゅうぐんの へいたい。まじめだが よく ころぶ
  function lizard(c) {
    return (P) => {
      P.part((Q) => { Q.worm([[12, 34], [5, 38], [1, 34], [2, 30]], c.skin, 5, 2); }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.r(13, 34, 4, 7, c.skin); Q.r(21, 34, 4, 7, c.skin);
        Q.ell(14, 42, 4, 1.5, c.skin); Q.ell(24, 42, 4, 1.5, c.skin);
        Q.ell(19, 28, 8, 9, c.skin);
      }, { shade: 3, outline: true });
      P.part((Q) => { Q.ell(20, 29, 4, 7, c.belly); for (let i = 0; i < 4; i++) Q.r(17, 24 + i * 3, 7, 1, shade(c.belly, 0.8)); }, {});
      P.part((Q) => { Q.r(12, 22, 15, 6, c.armor); Q.r(12, 33, 15, 3, c.armor); }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.ball(21, 13, 8, 7, c.skin);
        Q.ell(29, 15, 6, 3.5, c.skin);
      }, { shade: 3, outline: true });
      P.r(27, 17, 8, 1, OUT); P.p(29, 18, "#ffffff"); P.p(32, 18, "#ffffff");
      P.p(33, 13, OUT);
      P.eye(23, 11, 2.2, 2.4, 0.6, 0, { iris: "#ffd030", slit: true, pupil: 1 });
      P.brow(19, 8, 26, 9, 2);
      P.part((Q) => {
        Q.ell(20, 7, 8, 4, c.armor); Q.r(12, 7, 16, 2, c.armor);
        Q.poly([[17, 4], [20, -2], [23, 4]], c.fin);
      }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.line(32, 40, 34, 2, "#8a5a2a", 2);
        Q.poly([[31, 4], [34, -4], [37, 4], [34, 8]], "#d0d8e8");
        Q.ell(32, 26, 2.5, 2.5, c.skin);
      }, { shade: 1, outline: true });
      P.part((Q) => { Q.ball(9, 27, 6, 7, c.shield); }, { shade: 2, outline: true });
      P.ell(9, 27, 2, 2, "#ffd030");
    };
  }
  def("lizard", 38, 44, lizard({ skin: "#4ab06a", belly: "#e8e0a0", armor: "#8a5a3a", fin: "#e83a3a", shield: "#b03a3a" }));
  def("lizardelite", 38, 44, lizard({ skin: "#3a4a8a", belly: "#a0b0e0", armor: "#2a2a3a", fin: "#ffd030", shield: "#5a2a8a" }));

  // ドラゴンパピー: まりゅうの とおい しんせき。ほのおは まだ ちょっと へた
  function puppy(c) {
    return (P) => {
      P.part((Q) => {
        Q.poly([[10, 14], [0, 4], [4, 14], [0, 18], [8, 20]], c.wing);
      }, { shade: 2, outline: true });
      P.part((Q) => { Q.worm([[10, 30], [3, 32], [1, 27]], c.body, 6, 3); Q.poly([[0, 28], [-2, 23], [3, 25]], c.belly); }, { shade: 1, outline: true });
      P.part((Q) => {
        Q.ball(15, 26, 9, 8, c.body);
        Q.ell(10, 34, 3.5, 2, c.body); Q.ell(20, 34, 3.5, 2, c.body);
      }, { shade: 3, outline: true });
      P.part((Q) => { Q.ell(17, 28, 5, 5, c.belly); }, { shade: 1 });
      P.part((Q) => {
        Q.ball(23, 14, 11, 10, c.body);
        Q.ell(32, 18, 6, 5, c.body);
        Q.poly([[16, 7], [12, -1], [20, 5]], c.horn);
        Q.poly([[24, 5], [26, -2], [28, 6]], c.horn);
      }, { shade: 3, outline: true });
      P.part((Q) => { Q.poly([[18, 15], [10, 10], [17, 19]], c.wing); }, { shade: 1, outline: true });
      P.eye(26, 11, 3, 3.6, 0.6, 0.2, { pupil: 1.8 });
      P.brow(22, 6, 29, 8, 2);
      P.p(36, 16, OUT);
      P.line(28, 21, 36, 20, OUT); P.p(33, 21, "#ffffff");
      P.part((Q) => { Q.ell(37, 21, 2, 1.5, c.puff); Q.ell(40, 19, 1.5, 1.2, c.puff); }, {});
      P.part((Q) => { Q.ell(22, 29, 2.5, 2.5, c.body); }, OL);
    };
  }
  def("puppy", 42, 37, puppy({ body: "#e8503a", belly: "#ffe0a0", wing: "#a83a8a", horn: "#fff0d0", puff: "#c8c8c8" }));
  def("greenpuppy", 42, 37, puppy({ body: "#3aa85a", belly: "#ffe890", wing: "#2a6a8a", horn: "#ffd030", puff: "#ff8a3a" }));

  // ヤミアイ: やみの ひとつめ。ポポの 目を にくんでいる
  function darkeye(c) {
    return (P) => {
      P.part((Q) => {
        for (let i = 0; i < 4; i++) Q.worm([[12 + i * 4, 22], [10 + i * 5, 30], [13 + i * 4, 36]], c.tent, 3, 1);
      }, { shade: 1, outline: true });
      P.part((Q) => {
        const wing = (s) => Q.poly([[19 + s * 6, 12], [19 + s * 18, 2], [19 + s * 17, 10], [19 + s * 19, 16], [19 + s * 13, 16], [19 + s * 10, 20]], c.wing);
        wing(-1); wing(1);
      }, { shade: 2, outline: true });
      P.part((Q) => { Q.ball(19, 15, 11, 10, c.body); }, { shade: 3, outline: true });
      P.eye(20, 15, 7, 6, 0.7, 0.1, { iris: c.iris, pupil: 3, slit: true, white: "#fff0e0" });
      P.line(12, 14, 14, 10, OUT); P.line(28, 14, 26, 10, OUT);
      P.part((Q) => { for (let i = 0; i < 5; i++) Q.line(13 + i * 3, 20, 14 + i * 3, 23, OUT); });
    };
  }
  def("darkeye", 38, 38, darkeye({ body: "#3a1a4a", tent: "#5a2a6a", wing: "#2a0a3a", iris: "#ff2a3a" }));
  def("goldeye", 38, 38, darkeye({ body: "#8a5a1a", tent: "#a07020", wing: "#4a2a0a", iris: "#3aff6a" }));

  // ================================================================ 8. まりゅうじょう
  // りゅうきへい: まりゅうに つかえる きし。かぶとは りゅうの かお
  function dknight(c) {
    return (P) => {
      P.part((Q) => { Q.poly([[10, 16], [2, 46], [24, 44]], c.cape); }, { shade: 3, outline: true });
      P.part((Q) => {
        Q.r(12, 36, 6, 10, c.armor); Q.r(22, 36, 6, 10, c.armor);
        Q.ell(14, 47, 5, 2, c.armor); Q.ell(25, 47, 5, 2, c.armor);
      }, { shade: 2, outline: true });
      P.part((Q) => {
        Q.ball(20, 28, 11, 11, c.armor);
        Q.ball(9, 20, 5, 5, c.trim); Q.ball(31, 20, 5, 5, c.trim);
      }, { shade: 4, outline: true });
      P.part((Q) => { Q.r(13, 34, 14, 3, c.trim); Q.ball(20, 26, 3, 3, c.gem); }, { shade: 1, outline: true });
      // りゅうの かぶと
      P.part((Q) => {
        Q.ball(21, 11, 9, 9, c.armor);
        Q.ell(29, 14, 6, 4, c.armor);
        Q.poly([[14, 6], [6, -2], [18, 3]], c.trim);
        Q.poly([[22, 3], [27, -4], [27, 5]], c.trim);
      }, { shade: 3, outline: true });
      P.r(18, 11, 14, 4, OUT);
      P.r(24, 12, 3, 2, c.eye);
      for (let i = 0; i < 3; i++) P.p(28 + i * 2, 16, "#ffffff");
      // おおきな けん
      P.part((Q) => {
        Q.poly([[33, 40], [37, 0], [41, 40]], "#d8e0f0");
        Q.r(30, 38, 14, 3, c.trim);
        Q.r(35, 41, 4, 6, "#5a3a2a");
      }, { shade: 2, outline: true });
      P.line(37, 4, 37, 36, "#ffffff");
      P.part((Q) => { Q.ball(35, 34, 3, 3, c.armor); }, OL);
    };
  }
  def("dknight", 46, 50, dknight({ armor: "#4a4a6a", trim: "#c8a030", cape: "#8a1a2a", gem: "#ff3a3a", eye: "#ff3a3a" }));
  def("dknightelite", 46, 50, dknight({ armor: "#2a1a2a", trim: "#d8d8e8", cape: "#2a2a8a", gem: "#3affd0", eye: "#3affd0" }));

  // ガーゴン: しろを まもる いしの あくま。ひるまは ずっと じっとしている
  def("gargoyle", 46, 44, (P) => {
    const st = "#8a8aa0";
    P.part((Q) => {
      Q.poly([[16, 14], [0, 2], [2, 12], [-1, 20], [10, 22]], "#5a5a78");
      Q.poly([[30, 14], [46, 2], [44, 12], [47, 20], [36, 22]], "#5a5a78");
    }, { shade: 2, outline: true });
    P.part((Q) => {
      Q.ball(23, 28, 11, 10, st);
      Q.ell(14, 40, 5, 3, st); Q.ell(32, 40, 5, 3, st);
    }, { shade: 4, outline: true });
    P.part((Q) => {
      Q.ball(23, 13, 10, 9, st);
      Q.poly([[15, 8], [9, -2], [19, 5]], "#c8c8d8");
      Q.poly([[31, 8], [37, -2], [27, 5]], "#c8c8d8");
    }, { shade: 3, outline: true });
    P.eye(19, 12, 2.4, 2, 0.8, 0, { white: "#ffd030", pupil: 1 });
    P.eye(28, 12, 2.4, 2, 0.8, 0, { white: "#ffd030", pupil: 1 });
    P.brow(15, 8, 21, 10, 2); P.brow(32, 8, 26, 10, 2);
    fangMouth(P, 18, 17, 11, "#3a0a1a");
    P.part((Q) => { Q.ball(12, 30, 4, 4, st); Q.ball(35, 30, 4, 4, st); }, { shade: 1, outline: true });
    P.part((Q) => { Q.line(17, 26, 21, 31, shade(st, 0.6)); Q.line(28, 24, 26, 30, shade(st, 0.6)); });
  });

  // ホネドラゴン: まりゅうに まけた むかしの りゅう。ほねに なっても たたかう
  def("bonedragon", 72, 60, (P) => {
    const bone = "#ece4cc";
    P.part((Q) => {
      Q.poly([[38, 30], [16, 4], [20, 16], [8, 18], [22, 28], [30, 36]], "#5a3a5a");
    }, { shade: 2, outline: true });
    P.part((Q) => { Q.line(38, 30, 16, 4, bone, 2); Q.line(28, 18, 20, 16, bone, 1); Q.line(30, 26, 8, 18, bone, 1); });
    P.part((Q) => {
      // せぼね と しっぽ
      Q.worm([[28, 34], [18, 40], [8, 46], [2, 54], [8, 58]], bone, 5, 2);
      // あばら
      for (let i = 0; i < 4; i++) Q.ell(32 + i * 3, 36, 2, 9, bone);
      Q.ell(34, 30, 10, 2, bone);
      // あし
      Q.worm([[28, 40], [24, 50], [28, 56]], bone, 3, 3);
      Q.worm([[42, 40], [44, 50], [48, 56]], bone, 3, 3);
      Q.ell(28, 57, 4, 2, bone); Q.ell(49, 57, 4, 2, bone);
      // くび
      Q.worm([[40, 30], [46, 22], [50, 14]], bone, 4, 4);
    }, { shade: 2, outline: true });
    P.part((Q) => { for (let i = 0; i < 4; i++) Q.r(33 + i * 3, 30, 1, 12, "#3a2a3a"); });
    P.part((Q) => {
      Q.ball(54, 13, 10, 9, bone);
      Q.ell(64, 18, 7, 4, bone);
      Q.poly([[48, 6], [40, -2], [52, 4]], bone);
      Q.poly([[55, 5], [58, -3], [60, 5]], bone);
    }, { shade: 3, outline: true });
    P.ell(56, 12, 3.5, 3.5, OUT);
    P.ell(57, 12.5, 1.5, 1.5, "#40ffd0");
    P.r(58, 20, 12, 2, OUT);
    for (let i = 0; i < 5; i++) { P.p(59 + i * 2, 19, "#ffffff"); P.p(60 + i * 2, 22, "#ffffff"); }
    P.p(67, 15, OUT);
  });

  // ヤミポポ: やみの ちからで うまれた もうひとりの ポポ (ポポの ドット絵を そのまま 色がえ)
  def("yamipopo", 32, 32, (P) => {
    const POPO = window.POPO_SPRITES;
    const pal = { 0: "#4a2a6a", 1: "#0a0410", 2: "#2a1440", 3: "#ff4a5a", 4: "#1a0a2a", 5: "#ffd030" };
    const rows = POPO.frames.walk_right1 || POPO.frames.idle;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const ch = rows[y][x]; if (ch !== ".") P.p(x, y, pal[ch]); }
  });

  // ================================================================ ボス 4: りゅうきし ガルム
  // まりゅうの いちばんの けらい。むかしは りゅうを まもる きしだった
  def("garm", 80, 84, (P) => {
    const ar = "#3a3a58";
    const gold = "#d8a830";
    P.part((Q) => { Q.poly([[22, 22], [6, 82], [52, 80], [44, 24]], "#8a1a2a"); }, { shade: 4, outline: true });
    P.part((Q) => { Q.poly([[10, 82], [14, 74], [18, 82], [22, 74], [26, 82], [30, 74], [34, 82]], "#5a0a1a"); });
    // あし
    P.part((Q) => {
      Q.r(24, 58, 9, 18, ar); Q.r(40, 58, 9, 18, ar);
      Q.ell(28, 78, 7, 3, ar); Q.ell(46, 78, 7, 3, ar);
      Q.ball(28, 62, 4, 4, gold); Q.ball(45, 62, 4, 4, gold);
    }, { shade: 3, outline: true });
    // どう
    P.part((Q) => {
      Q.ball(36, 42, 16, 18, ar);
    }, { shade: 5, outline: true });
    P.part((Q) => {
      Q.poly([[26, 32], [46, 32], [42, 52], [30, 52]], "#5a5a7a");
      Q.r(22, 54, 28, 4, gold);
    }, { shade: 2, outline: true });
    P.part((Q) => { Q.ball(36, 40, 4, 4, "#3affb0"); }, OL);
    // かたあて
    P.part((Q) => {
      Q.ball(19, 30, 9, 8, gold);
      Q.ball(53, 30, 9, 8, gold);
      Q.poly([[14, 26], [8, 14], [20, 23]], "#f0e8d0");
      Q.poly([[58, 26], [64, 14], [52, 23]], "#f0e8d0");
    }, { shade: 3, outline: true });
    // あたま (りゅうの かぶと)
    P.part((Q) => {
      Q.ball(37, 18, 11, 11, ar);
      Q.ell(46, 22, 7, 5, ar);
      Q.poly([[30, 10], [18, -2], [34, 6]], gold);
      Q.poly([[42, 9], [52, -3], [46, 11]], gold);
    }, { shade: 3, outline: true });
    // かお (かぶとの すきまから)
    P.part((Q) => { Q.r(32, 17, 18, 7, "#e8b890"); }, { shade: 1, outline: true });
    P.part((Q) => { Q.r(33, 17, 16, 2, ar); }, {});
    P.r(36, 19, 4, 2, OUT); P.r(43, 19, 4, 2, OUT);
    P.p(38, 19, "#ff3a2a"); P.p(45, 19, "#ff3a2a");
    P.line(35, 18, 40, 19, OUT); P.line(48, 18, 43, 19, OUT);
    P.line(39, 22, 46, 22, OUT);
    P.line(46, 17, 44, 23, "#a03030");
    // うで と だいけん
    P.part((Q) => {
      Q.worm([[54, 36], [60, 46], [62, 54]], ar, 7, 6);
      Q.ball(62, 55, 4.5, 4.5, gold);
    }, { shade: 2, outline: true });
    P.part((Q) => {
      Q.poly([[60, 50], [70, -2], [78, 2], [66, 54]], "#c8d0e0");
      Q.r(56, 50, 16, 4, gold);
      Q.r(60, 54, 5, 9, "#4a2a1a");
    }, { shade: 3, outline: true });
    P.line(72, 2, 63, 48, "#ffffff");
    P.part((Q) => { Q.ball(16, 46, 5, 5, ar); }, { shade: 1, outline: true });
  });

  // ================================================================ ラスボス: まりゅう ドラグザード
  function dragonBody(P, c) {
    // つばさ (うしろ)
    P.part((Q) => {
      Q.poly([[56, 48], [20, 2], [30, 26], [6, 18], [22, 42], [0, 44], [26, 60], [52, 66]], c.wing);
    }, { shade: 4, outline: true });
    P.part((Q) => {
      Q.line(56, 48, 20, 2, c.bone, 3); Q.line(40, 30, 6, 18, c.bone, 2); Q.line(44, 50, 0, 44, c.bone, 2);
    });
    // しっぽ
    P.part((Q) => {
      Q.worm([[52, 100], [34, 112], [14, 114], [4, 104], [10, 94]], c.scale, 16, 5);
      Q.poly([[10, 96], [0, 86], [14, 92]], c.horn);
    }, { shade: 4, outline: true });
    P.part((Q) => { for (let i = 0; i < 4; i++) Q.poly([[38 - i * 8, 106 - (i > 1 ? 2 : 0)], [34 - i * 8, 98 - i], [32 - i * 8, 108]], c.spine); }, { outline: true });
    // うしろあし
    P.part((Q) => { Q.ball(60, 104, 14, 12, c.scale); Q.ell(60, 118, 12, 4, c.scale); }, { shade: 4, outline: true });
    // からだ
    P.part((Q) => {
      Q.ball(80, 80, 32, 30, c.scale);
    }, { shade: 7, outline: true });
    P.part((Q) => {
      for (let i = 0; i < 6; i++) Q.ell(92, 62 + i * 9, 13 - Math.abs(i - 2.5) * 1.6, 4.5, c.belly);
    }, { shade: 2, outline: true });
    // まえあし
    P.part((Q) => { Q.ball(98, 110, 13, 10, c.scale); Q.ell(100, 120, 13, 4, c.scale); }, { shade: 4, outline: true });
    P.part((Q) => { for (let i = 0; i < 4; i++) Q.poly([[104 + i * 5, 120], [108 + i * 5, 126], [111 + i * 5, 120]], c.horn); }, { outline: true });
    // せなかの トゲ
    P.part((Q) => { for (let i = 0; i < 5; i++) Q.poly([[52 + i * 6, 58 - i * 4], [48 + i * 6, 44 - i * 4], [58 + i * 6, 54 - i * 4]], c.spine); }, { shade: 1, outline: true });
    // くび
    P.part((Q) => {
      Q.worm([[92, 66], [100, 48], [112, 34], [124, 30]], c.scale, 24, 18);
    }, { shade: 5, outline: true });
    P.part((Q) => { for (let i = 0; i < 4; i++) Q.ell(106 + i * 5, 56 - i * 7, 6, 3.5, c.belly); }, { shade: 1, outline: true });
    // うで (かぎづめ)
    P.part((Q) => {
      Q.worm([[104, 78], [120, 86], [128, 80]], c.scale, 10, 7);
    }, { shade: 3, outline: true });
    P.part((Q) => { for (let i = 0; i < 3; i++) Q.poly([[127, 74 + i * 4], [138, 70 + i * 5], [130, 79 + i * 4]], c.horn); }, { outline: true });
  }
  function dragonHead(P, c) {
    P.part((Q) => {
      Q.ball(126, 26, 16, 14, c.scale);
      Q.poly([[134, 22], [152, 26], [154, 34], [138, 40], [126, 36]], c.scale);
    }, { shade: 4, outline: true });
    // したあご
    P.part((Q) => { Q.poly([[124, 38], [150, 40], [148, 46], [128, 46]], shade(c.scale, 0.85)); }, { shade: 2, outline: true });
    P.part((Q) => { Q.poly([[132, 38], [150, 38], [148, 43], [132, 42]], "#6a0a1a"); });
    for (let i = 0; i < 5; i++) { P.poly([[134 + i * 3.5, 36], [135.5 + i * 3.5, 39.5], [137 + i * 3.5, 36]], "#ffffff"); }
    for (let i = 0; i < 4; i++) { P.poly([[135 + i * 3.5, 44], [136.5 + i * 3.5, 40.5], [138 + i * 3.5, 44]], "#ffffff"); }
    // ツノ
    P.part((Q) => {
      Q.worm([[118, 16], [108, 6], [96, 4], [90, 8]], c.horn, 6, 2);
      Q.worm([[128, 12], [126, 2], [120, -4]], c.horn, 5, 1);
      Q.poly([[140, 22], [146, 12], [144, 24]], c.horn);
    }, { shade: 2, outline: true });
    // め
    P.part((Q) => { Q.poly([[128, 20], [140, 23], [136, 28], [127, 26]], c.eye); }, OL);
    P.r(132, 22, 2, 5, OUT);
    P.brow(124, 16, 142, 22, 3);
    P.p(150, 28, OUT); P.p(149, 27, OUT);
    // ほのおの いき
    if (c.fire) P.part((Q) => { Q.ell(154, 42, 2, 2, "#ffd040"); Q.ell(152, 46, 1.5, 1.5, "#ff8a2a"); });
  }
  def("dragzard", 160, 128, (P) => {
    const c = { scale: "#4a2a7a", belly: "#e8b84a", wing: "#7a2a5a", bone: "#2a1440", horn: "#f0e0b0", spine: "#d84a5a", eye: "#ffe040", fire: true };
    dragonBody(P, c);
    dragonHead(P, c);
  });

  // しんのすがた: ちいさく なった けれど、ちからは なんばいも つよい (オーラは バトルで 描く)
  def("dragzard2", 84, 100, (P) => {
    const sk = "#2a1a3a";
    const mus = "#4a2a6a";
    const gold = "#f0c040";
    // しっぽ
    P.part((Q) => { Q.worm([[30, 74], [14, 82], [6, 94], [16, 98]], sk, 10, 3); Q.poly([[16, 94], [26, 100], [14, 100]], gold); }, { shade: 2, outline: true });
    // つばさ (ちいさく するどい)
    P.part((Q) => {
      Q.poly([[30, 34], [2, 6], [8, 22], [0, 30], [14, 36], [10, 46], [26, 46]], "#5a0a2a");
      Q.poly([[56, 34], [82, 4], [78, 22], [84, 30], [70, 36], [74, 46], [58, 46]], "#5a0a2a");
    }, { shade: 3, outline: true });
    // あし
    P.part((Q) => {
      Q.worm([[34, 70], [30, 82], [34, 94]], mus, 11, 8);
      Q.worm([[52, 70], [56, 82], [54, 94]], mus, 11, 8);
      Q.ell(32, 97, 8, 3, sk); Q.ell(56, 97, 8, 3, sk);
    }, { shade: 3, outline: true });
    // どう (きんにく)
    P.part((Q) => {
      Q.poly([[26, 36], [60, 36], [56, 72], [30, 72]], mus);
      Q.ell(43, 40, 19, 8, mus);
    }, { shade: 5, outline: true });
    P.part((Q) => {
      Q.ell(36, 46, 7, 5, shade(mus, 1.25)); Q.ell(50, 46, 7, 5, shade(mus, 1.25));
      for (let i = 0; i < 3; i++) { Q.ell(38, 56 + i * 5, 4, 2, shade(mus, 1.2)); Q.ell(48, 56 + i * 5, 4, 2, shade(mus, 1.2)); }
    }, { shade: 1 });
    // むねの ひとつめ (まりゅうの こころ)
    P.eye(43, 50, 3.5, 3, 0.6, 0, { white: "#ff3a6a", iris: OUT, pupil: 1.4, slit: true });
    P.r(28, 68, 30, 5, gold);
    // うで
    P.part((Q) => {
      Q.worm([[26, 40], [16, 52], [14, 64]], mus, 10, 8);
      Q.worm([[60, 40], [70, 50], [74, 40]], mus, 10, 8);
      Q.ball(14, 66, 6, 5, sk); Q.ball(75, 37, 6, 6, sk);
    }, { shade: 3, outline: true });
    P.part((Q) => { Q.poly([[70, 33], [72, 26], [74, 33]], gold); Q.poly([[75, 32], [79, 26], [79, 34]], gold); Q.poly([[10, 70], [8, 76], [13, 71]], gold); }, OL);
    // あたま
    P.part((Q) => {
      Q.ball(44, 22, 11, 11, sk);
      Q.ell(52, 26, 7, 5, sk);
      Q.worm([[36, 16], [26, 8], [24, -1]], gold, 5, 1);
      Q.worm([[50, 14], [58, 6], [58, -2]], gold, 5, 1);
    }, { shade: 3, outline: true });
    // ひたいの 第三の目 と するどい 目
    P.eye(44, 14, 2.4, 2, 0, 0, { white: "#ff3a6a", pupil: 1 });
    P.poly([[38, 21], [46, 23], [43, 25], [38, 24]], "#ffe040");
    P.poly([[48, 23], [55, 21], [55, 24], [50, 25]], "#ffe040");
    P.brow(36, 19, 46, 22, 2); P.brow(57, 19, 48, 22, 2);
    fangMouth(P, 44, 29, 12, "#5a0a1a");
  });

  // ---------------------------------------------------------------- 公開
  const imgCache = new Map();
  function get(id) {
    if (!imgCache.has(id)) {
      const d = DEFS[id];
      if (!d) throw new Error("unknown monster art: " + id);
      imgCache.set(id, paint(d.w, d.h, d.fn));
    }
    return imgCache.get(id);
  }
  Q.monsters = { get, DEFS, def, helpers: { grin, fangMouth, cheek, sparkle } };
})();
