// ストーリー と イベント。 すべて ジェネレータで 上から じゅんばんに 書いている
// ポポの くちぐせは「〜ポ」。 ユウタは げんきな ちきゅうの こども、 メルは きの つよい みならい まほうつかい、
// ガンテツは こわもてで こどもに やさしい ちからもち
(() => {
  "use strict";
  const D = Q.data;
  const F = Q.field;
  const EV = {};
  Q.EV = EV;

  const say = Q.say;
  const talk = Q.talk;
  const has = (id) => Q.S.party.includes(id);
  const flag = (k) => !!Q.S.flags[k];
  const set = (k, v = true) => { Q.S.flags[k] = v; };

  function* get(item, n = 1) {
    Q.addItem(item, n);
    Q.snd.jingle("item", Q.snd.current);
    yield* say(`${D.ITEMS[item].name}を てにいれた！`);
  }
  function* gold(n) {
    Q.S.gold += n;
    Q.snd.play("gold");
    yield* say(`${n}ゴールドを もらった！`);
  }
  function* narrate(text, o = {}) { yield* say(text, Object.assign({ voice: false }, o)); }

  // ================================================================ プロローグ
  EV.prologue = function* () {
    Q.fx.fade = 1;
    F.load("yutaroom", 4, 1, 3);
    F.map.tint = "rgba(20,30,110,0.45)";
    Q.setScene(F);
    Q.snd.music("story");
    yield 0.4;
    yield* Q.fadeIn(1.2);
    yield 0.6;
    yield* talk("yuta", "ポポ、 まだ おきてるの？\nはやく ねないと ママに おこられるよ。");
    F.p.dir = 3;
    yield* talk("popo", "ユウタ… みて。\nおそらの ほしが… ないてるポ。");
    yield* talk("yuta", "ほしが ないてる？ なに いって…\n…あっ！ ながれぼし！ でっかい！！");
    Q.snd.play("sparkle");
    Q.flash(0.3, "#ffffc0");
    yield 0.6;
    yield* talk("popo", "アンテナが… ビリビリ するポ！\nだれかが… ポポを よんでるポ…！");
    F.p.dir = 0;
    yield* talk("yuta", "え、 え！？ ポポ、 からだが ひかってる…！\nうわあああっ！！");
    Q.snd.play("warp");
    for (let i = 0; i < 10; i++) { Q.flash(0.1, i % 2 ? "#ffffff" : "#ff9ad8"); yield 0.1; }
    yield* Q.fadeOut(0.8, "#ffffff");
    Q.snd.music("title");
    yield 0.5;
    Q.fx.fadeCol = "#000000";
    // でんせつ
    Q.setScene(legendScene);
    yield* Q.fadeIn(0.8);
    yield* narrate("—— むかし むかし。\nほしふる たいりく ステラードを、 まりゅう ドラグザードが やみで つつもうとした。");
    yield* narrate("そのとき ほしから おりてきた ひとつめの ゆうしゃが、\n3つの ほうぎょくの ちからで まりゅうを ねむらせた という。");
    yield* narrate("それから 1000ねん。\nふたたび まりゅうの めざめる ときが ちかづいていた——");
    yield* Q.fadeOut(1.0);
    F.map.tint = null;
    F.load("crashsite", 8, 9, 3);
    Q.setScene(F);
    yield 0.3;
    yield* Q.fadeIn(0.8);
    yield* EV.ev_intro_crash();
  };
  const legendScene = {
    t: 0,
    update(dt) { this.t += dt; },
    draw(g) {
      g.fillStyle = "#06041a";
      g.fillRect(0, 0, Q.W, Q.H);
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % Q.W;
        const y = (i * 53) % 120;
        if ((i + Math.floor(this.t * 3)) % 7) { g.fillStyle = i % 3 ? "#ffffff" : "#ffd0f0"; g.fillRect(x, y, 1, 1); }
      }
      const img = Q.monsters.get("dragzard");
      g.globalAlpha = 0.55;
      g.drawImage(Q.gfx.silhouette(img, "#2a0a3a"), Q.W / 2 - 80, 18);
      g.globalAlpha = 1;
      const popo = Q.chars.popoFrame("jump");
      g.drawImage(Q.gfx.silhouette(popo, "#ffe890"), Q.W / 2 + 60, 70 + Math.sin(this.t * 2) * 3);
    },
  };

  EV.ev_intro_crash = function* () {
    if (flag("intro")) return;
    Q.snd.music("story");
    yield* talk("yuta", "いてて… ここ どこ…？\n…あっ！ ポポの UFOが ボロボロだ！");
    yield* talk("popo", "ユウタの いえの にわに とめてた UFOごと、\nひっぱられちゃったポ…");
    yield* talk("popo", "エンジンが… こわれちゃったポ。\nこれじゃ ちきゅうに かえれないポ…");
    // メル とうじょう
    set("meruScene");
    yield* F.moveNpc("meru0", [1, 1, 1]);
    F.p.dir = 2;
    yield* talk("meru", "ちょっと あんたたち！\nさっきの ながれぼし、 あんたたちの しわざ！？");
    yield* talk("meru", "って… ひ、 ひとつめに… アンテナ…！？\nまさか… でんせつの…");
    yield* talk("yuta", "でんせつ？");
    Q.snd.play("encounter");
    Q.shake(0.3, 2);
    yield* say("ガサガサッ！ しげみから まものが とびだしてきた！");
    yield* talk("meru", "まもの！？ …もう、 しかたないわね！\nてつだって あげるわよ！");
    Q.join("meru");
    set("meruJoined");
    F.regroup();
    const r = yield* Q.battle.fight(["purun", "gumi", "purun"], { bg: "forest", noRun: true });
    if (r === "lose") { Q.healAll(); }
    Q.snd.music("story");
    yield* talk("meru", "ふう… やるじゃない。\nわたしは メル。 ハッパむらの まほうつかい… の みならい よ。");
    yield* talk("popo", "ポポは ポポ。 こっちは しんゆうの ユウタだポ！");
    yield* talk("meru", "ポポ… ねえ、 むらの おじいちゃんに あってほしいの。\nいっしょに きて！ むらは もりを でて みなみよ。");
    yield* talk("yuta", "いこうよ ポポ！ UFOを なおす ほうほうも\nわかるかも しれないし！");
    yield* talk("popo", "わかったポ！");
    Q.snd.play("buff");
    yield* narrate("メルが なかまに くわわった！");
    set("intro");
    yield* narrate("（Bボタン / X キーで メニュー。 A ボタン / Z キーで はなす・しらべる）");
    F.playMapMusic();
  };

  EV.ev_ufo = function* () {
    if (flag("ufo")) { yield* say("ここには もう なにも ない。"); return; }
    if (!(Q.hasItem("orbG") && Q.hasItem("orbR") && Q.hasItem("orbB"))) {
      yield* say("ポポの UFO。 エンジンが こわれて うごかない…");
      const n = ["orbG", "orbR", "orbB"].filter((o) => Q.hasItem(o)).length;
      if (n) yield* talk("popo", `ほうぎょくが ${n}つ。 もうすこし だポ…`);
      return;
    }
    Q.snd.stop();
    yield* say("3つの ほうぎょくが かがやきはじめた！");
    for (let i = 0; i < 8; i++) { Q.flash(0.12, ["#3ae07a", "#ff4a4a", "#4a9aff"][i % 3]); Q.snd.play("sparkle"); yield 0.15; }
    yield* talk("popo", "ほうぎょくの ちからが…\nエンジンに ながれこんで いくポ！");
    Q.snd.play("ufo");
    Q.shake(0.6, 2);
    yield 0.8;
    yield* say("UFOの エンジンが うごきだした！");
    Q.snd.music("story");
    yield* talk("yuta", "やったー！ これで ちきゅうに かえれるぞ！");
    yield* talk("popo", "…………");
    yield* talk("meru", "…かえっちゃうの？");
    yield* talk("popo", "ううん。 まりゅうを ほうっておいたら、\nこの せかいの みんなが こまるポ。");
    yield* talk("popo", "ポポ、 ゆうしゃ だから。\nまりゅうを やっつけてから かえるポ！");
    yield* talk("yuta", "…へへっ、 そう いうと おもった！\nさいごまで つきあうよ、 ポポ！");
    if (has("gantetsu")) yield* talk("gantetsu", "へっ、 いいこと いうじゃねえか ちびすけ。\nおれの ハンマーも まだまだ あばれ たりねえぜ。");
    yield* talk("meru", "そ、 そうよね！ ほら、 さっさと いくわよ！\nめざすは ひがしの うみの まりゅうの しま！");
    set("ufo");
    Q.S.ufo = true;
    Q.S.ufoPos = [8, 26];
    yield* Q.fadeOut(0.5);
    F.load("world", 8, 27, 3);
    yield* Q.fadeIn(0.5);
    Q.snd.jingle("fanfare", "field");
    yield* say("UFOが なおった！\nUFOに ふれると のることが できる。");
  };

  // ================================================================ ハッパむら
  EV.ev_elder = function* () {
    if (!flag("metElder")) {
      Q.snd.music("story");
      yield* say("ポロじい「おお、 メル！ どこへ いっとった… むむっ！？\nその ひとつめ… その アンテナ…！」");
      yield* say("ポロじい「まちがいない。 1000ねんまえ、 まりゅう ドラグザードを\nふういんした でんせつの ゆうしゃと おなじ すがた じゃ！」");
      yield* talk("popo", "ポポ… ゆうしゃ なのかポ？");
      yield* talk("yuta", "すっげー！ ポポが ゆうしゃ！？");
      yield* say("ポロじい「でんせつでは、 ゆうしゃは 3つの ほうぎょく\n—— みどり、 あか、 あお —— の ちからで まりゅうを ねむらせた。」");
      yield* say("ポロじい「じゃが さいきん、 まりゅうの ちからが もれだし、\nまものたちが あばれだした。」");
      yield* say("ポロじい「そして ほうぎょくは まりゅうの てしたに\nぬすまれて しもうた…」");
      yield* say("ポロじい「みどりの ほうぎょくは きたの もりの どうくつ。\nトゲトゲの おうさまが もっていった と きく。」");
      yield* talk("popo", "トゲトゲの おうさま…？\nどこかで きいたこと あるポ…");
      yield* say("ポロじい「ほうぎょくが そろえば、 そらとぶ ふね——\nおぬしらの ユーフォー とやらも うごくかも しれん。」");
      yield* talk("yuta", "ほんと！？ じゃあ ほうぎょくを あつめれば\nちきゅうに かえれる！");
      yield* talk("meru", "おじいちゃん、 わたしも いく！\nゆうしゃの おともは まほうつかいって きまってるんだから！");
      yield* say("ポロじい「…やれやれ。 いいだしたら きかん こじゃ。\nポポどの、 ユウタどの、 まごを たのみましたぞ。」");
      yield* say("ポロじい「これは すこしじゃが、 たびの たしに しなされ。」");
      yield* gold(100);
      yield* get("homefeather", 2);
      yield* say("ポロじい「むらの みせで そうびを ととのえて いくと よい。\nどうくつは むらの きた、 もりの おく じゃ。」");
      set("metElder");
      F.playMapMusic();
      return;
    }
    if (flag("ending")) { yield* say("ポロじい「ほっほっ。 ゆうしゃどのの ぼうけんは、\nこの むらで ずっと かたりつがれるじゃろう。」"); return; }
    if (flag("ufo")) {
      yield* say("ポロじい「そらとぶ ふねが なおったか！」");
      if (!Q.hasItem("herosword")) yield* say("ポロじい「そうじゃ、 みなみの うみの こじまに\nゆうしゃの ほこらが あると いう。 よって いきなされ。」");
      yield* say("ポロじい「まりゅうは ひがしの うみの しま じゃ。\nどうか… ぶじで。」");
      return;
    }
    if (flag("orbB")) { yield* say("ポロじい「フブキーナが…！ そうか、 もとに もどったか…\nほうぎょくが そろったなら、 ほしくずの もりの ふねへ！」"); return; }
    if (flag("orbR")) { yield* say("ポロじい「のこるは あおの ほうぎょく。 きたの こおりの とう じゃ。\nユキユキむらの ばあさまを たずねなされ。」"); return; }
    if (flag("orbG")) { yield* say("ポロじい「みどりの ほうぎょくを とりもどしたか！\nつぎは ランドールじょうの おうさまを たずねなされ。」\n「はしの へいしも とおして くれるはず じゃ。」"); return; }
    yield* say("ポロじい「みどりの ほうぎょくは きたの もりの どうくつ じゃ。\nき を つけて いくのじゃぞ。」");
    yield* healAsk();
  };
  function* healAsk() {
    if (Q.party().some((c) => c.hp < Q.statsOf(c).maxhp)) {
      if (yield* Q.ask("ポロじい「つかれて おるようじゃな。 やすんで いくか？」")) {
        yield* Q.fadeOut(0.4);
        Q.snd.jingle("inn", Q.snd.current);
        Q.healAll();
        yield 1.5;
        yield* Q.fadeIn(0.4);
        yield* say("みんな げんきに なった！");
      }
    }
  }

  EV.ev_uomasa_village = function* (n) {
    if (!flag("metUomasa")) {
      yield* say("うおまさ「タコだーーっ！！」");
      Q.shake(0.2, 2);
      yield* say("うおまさ「…って、 なんだ ポポじゃねえか！」");
      yield* talk("yuta", "さかなやの おじさん！？\nなんで ここに！？");
      yield* say("うおまさ「それが よう、 きのう みせを しめてたら\nそらが ピカーッと ひかって… きづいたら ここよ！ ガハハ！」");
      yield* say("うおまさ「まあ しょうばいは どこでも できらあ。\nこまったら うおまさ しょうてんに きな！」");
      set("metUomasa");
    }
    yield* Q.menu.shop("village_i", n);
  };

  EV.ev_v_woman = function* () {
    if (flag("orbG")) { yield* say("おばさん「キングトゲを やっつけたって？\nこれで あんしんして きのみを つみに いけるわ！」"); return; }
    yield* say("おばさん「もりの どうくつの トゲトゲの おうさま…\nつめたい ものが にがて だって うわさよ。」");
    yield* talk("meru", "つめたい もの… こおりの まほうね！\nわたし もうすこしで おぼえられそうなんだけど…");
  };
  EV.ev_v_kid = function* () {
    yield* say("おとこのこ「わあ、 め おっきい！ さわって いい？」");
    yield* talk("popo", "だめポ！");
    yield* say("おとこのこ「ちぇー。」");
  };
  EV.ev_v_granny = function* () {
    yield* say("おばあさん「マッシュボクサーの ほうしを すうと\nねむって しまうよ。 きを つけなさい。」");
    yield* say("おばあさん「それから… ねこに やさしい ひとには\nいいことが あるって いうねえ。」");
  };
  EV.ev_cat_village = function* () {
    if (flag("catbell")) { yield* say("ねこ「ゴロゴロ…」 （まんぞく そうだ）"); return; }
    yield* say("ねこ「ニャー。」\n（ねこは ポポの ふくろを じっと みている…）");
    if (Q.itemCount("niboshi") > 0) {
      if (yield* Q.ask("にぼしを あげますか？")) {
        Q.addItem("niboshi", -1);
        yield* say("ねこ「ニャ〜ン♪」\nねこは うれしそうに にぼしを たべた！");
        yield* say("…ねこは くびから すずを はずして、 ポポの まえに おいた。");
        yield* get("catbell");
        set("catbell");
      }
    }
  };

  // ================================================================ ワールドの みはり
  EV.ev_bridgeguard = function* () {
    yield* say("へいし「この さきは ランドールおうこく。\nもりの まものが あばれていて、 いまは つうこう どめだ！」");
    yield* say("へいし「どうくつの トゲトゲの ボスを なんとか できれば\nいいんだが…」");
  };
  EV.ev_passguard = function* () {
    yield* say("へいし「ひがしの とうげの むこうは さんぞくが でる。\nおうさまの きょかが ないと とおせない！」");
  };

  // ================================================================ キングトゲ
  EV.ev_kingtoge = function* () {
    if (flag("orbG")) return;
    Q.snd.stop();
    Q.shake(0.4, 2);
    yield* say("キングトゲ「グワーッハッハッハ！\nだれかと おもえば ポポでは ないか！」");
    yield* talk("popo", "キングトゲ！？");
    yield* talk("yuta", "しってるの！？");
    yield* talk("popo", "スーパーポポランドで… ふんづけたポ。");
    yield* say("キングトゲ「ふむなーーっ！！\nあの ときの うらみ、 いちにちも わすれた ことは ないわ！」");
    yield* say("キングトゲ「まりゅうさまに もらった この ちからと、\nみどりの ほうぎょく！ もう ふまれは せんぞ！」");
    yield* talk("meru", "なによ この トゲトゲ！\nみどりの ほうぎょくを かえしなさい！");
    yield* say("キングトゲ「やなこった！\nまとめて トゲトゲに してくれるわーっ！」");
    const r = yield* Q.battle.fight(["kingtoge"], { bg: "cave", noRun: true, intro: "キングトゲが おそいかかってきた！" });
    if (r === "lose") { yield* EV.gameover(); return; }
    yield* say("キングトゲ「ぐぬぬぬ… また まけた…\nお、 おぼえてろーっ！！」");
    yield* say("キングトゲは ころころ ころがって にげていった！");
    set("orbG");
    yield* get("orbG");
    yield* talk("meru", "やったわね！\n…あの トゲトゲ、 ちょっと かわいそう だったかも。");
    yield* talk("popo", "また あそびに くるポ。 たぶん。");
    F.playMapMusic();
  };

  // ================================================================ ランドールじょう
  EV.ev_king = function* () {
    if (!flag("metKing")) {
      Q.snd.music("castle");
      yield* say("おうさま「よくぞ まいった、 ひとつめの ゆうしゃよ。\nわしは この くにの おう、 ランドール じゃ。」");
      if (!flag("orbG")) yield* say("おうさま「ふむ… もりの どうくつの まものを\nまずは しずめて まいれ。」");
      yield* say("おうさま「ポロじいから はなしは きいて おる。\nみどりの ほうぎょくを とりもどした そうじゃな。」");
      yield* say("おうさま「のこる あかの ほうぎょくは ひがしの ゴロゴロこうざん、\nあおの ほうぎょくは きたの こおりの とうに あると いう。」");
      yield* say("おうさま「じゃが こうざんには さんぞく ガンテツが いすわり、\nきたへの はしは まものに こわされて しもうた…」");
      yield* say("おうさま「この てがみを もって ひがしの とうげへ ゆくがよい。\nへいしが とおして くれよう。」");
      yield* get("letter");
      yield* gold(300);
      yield* talk("popo", "ありがとうポ！");
      yield* talk("yuta", "おうさまって ほんとに いるんだ…\nかっこいい…");
      set("metKing");
      return;
    }
    if (flag("ending")) { yield* say("おうさま「ゆうしゃ ポポよ。 そなたらは この くにの えいゆう じゃ！」"); return; }
    if (flag("orbB")) { yield* say("おうさま「3つの ほうぎょくが そろったか！\nいよいよ まりゅうとの たたかい じゃな…」"); return; }
    if (flag("orbR")) { yield* say("おうさま「ガンテツが なかまに！？ はっはっは、\nそれは こころづよい！ きたへの はしも なおったと きく。」"); return; }
    yield* say("おうさま「ひがしの こうざんへ ゆくのじゃ。\nさんぞくには き を つけよ。」");
  };
  EV.ev_princess = function* () {
    if (!flag("princessGift")) {
      yield* say("おひめさま「まあ！ ポポさまの おめめ、 ほうせき みたいに\nきれい！ さわっても よろしくて？」");
      yield* talk("popo", "だ、 だめポ…");
      yield* say("おひめさま「うふふ、 ざんねん。\nでは かわりに これを さしあげますわ。」");
      yield* get("bigberry", 2);
      set("princessGift");
      return;
    }
    yield* say("おひめさま「ユウタさまの いた ちきゅうって、\nどんな ところ なのかしら…」");
    yield* talk("yuta", "えーっと… ゲームと マンガと… ラムネが ある！");
  };
  EV.ev_scholar = function* () {
    yield* say("がくしゃ「ふるい ほんに こう かいて あります。\n『まりゅうは かつて、 せかいを まもる まもりりゅう なりき』…」");
    yield* say("がくしゃ「そして まもりりゅうに つかえた きしを\n『りゅうきし』と よんだ そうです。 ふしぎな はなしでしょう？」");
  };
  EV.ev_priest = function* () {
    yield* say("しんぷ「ひとつめの ゆうしゃさまに、 ほしの ごかごを。」");
    if (Q.party().some((c) => c.poison)) {
      for (const c of Q.party()) c.poison = false;
      Q.snd.play("heal");
      yield* say("しんぷ「どくを ちりょう しました。」");
    }
    if (yield* Q.ask("しんぷ「ぼうけんのしょに きろく しますか？」")) yield* Q.menu.saveMenu();
  };
  EV.ev_castle_man = function* () {
    if (flag("orbR")) { yield* say("おとこ「ガンテツは こどもを まもってたって！？\nひとは みかけに よらねえなあ。」"); return; }
    yield* say("おとこ「こうざんの さんぞく ガンテツは、\nクマ みたいに でっかくて こわい かお なんだとさ…」");
  };

  // ================================================================ カンカンまち と こうざん
  EV.ev_m_mother = function* () {
    if (flag("golem")) {
      if (!flag("motherGift")) {
        yield* say("おかあさん「こどもたちを たすけて くださって\nほんとうに ありがとう ございました！」");
        yield* say("おかあさん「これは なくなった おっとの かたみ です。\nどうか つかって ください。」");
        yield* get("powerring");
        set("motherGift");
        return;
      }
      yield* say("おかあさん「ガンテツさんにも おれいを いわなくちゃ…」");
      return;
    }
    yield* say("おかあさん「うちの こどもたちが こうざんに あそびに いったきり\nかえって こないの… さんぞくに つかまったのかしら…」");
    yield* talk("yuta", "まかせて！ ぼくたちが さがしてくる！");
  };
  EV.ev_m_miner = function* () {
    if (flag("gantetsu")) { yield* say("こうふ「ガンテツが こどもらを まもってたって！？\n…わるいこと いっちまったなあ。」"); return; }
    yield* say("こうふ「さんぞくの ガンテツ。 クマみたいに でかくて、\nハンマーで いわを こなごなに するんだ…」");
  };
  EV.ev_minekids = function* () {
    if (!flag("gantetsu")) { yield* say("こども「…………」 （おびえている）"); return; }
    yield* say("こども「ガンテツの おじちゃん、 とっても つよいんだよ！\nてつの おばけ、 やっつけて！」");
  };
  EV.ev_boulder = function* () {
    yield* say("おおきな いわが みちを ふさいでいる。\nびくとも しない…");
  };

  EV.ev_gantetsu = function* () {
    if (flag("gantetsu")) return;
    Q.snd.stop();
    yield* say("ガンテツ「とまれ！\nここから さきへは いかせねえ！」");
    yield* talk("yuta", "でた、 さんぞく！\nこどもたちを かえせ！");
    yield* say("ガンテツ「…こどもだと？\n…かえれ。 けがを したく なけりゃな。」");
    yield* talk("meru", "なによ その いいかた！ ポポ、 やっちゃいましょ！");
    yield* talk("popo", "こどもたちを かえすポ！");
    yield* say("ガンテツ「…ことばで わからねえなら、 ちからずくだ！\nうおおおおっ！！」");
    const r = yield* Q.battle.fight(["gantetsu"], { bg: "mine", noRun: true, intro: "ガンテツが ハンマーを ふりあげた！", winMsg: "ガンテツは ひざを ついた！" });
    if (r === "lose") { yield* EV.gameover(); return; }
    Q.snd.music("story");
    yield* say("ガンテツ「…へっ、 まいったぜ。\nちびの くせに やるじゃねえか。」");
    yield* say("こども「ガンテツの おじちゃん！」\nこども「おじちゃんを いじめないでー！」");
    yield* F.moveNpc("kid1", [0, 0]);
    yield* talk("yuta", "え…？ こどもたちが かばってる…？");
    yield* say("ガンテツ「…この おくで、 てつの きょじんが めを さましやがった。\nこいつらが まよいこんで きた とき、 おれが ここに かくまったんだ。」");
    yield* say("ガンテツ「だが きょじんは でぐちの ちかくを うろついてやがる。\nこいつらを つれて とおるのは むりだった…」");
    yield* talk("meru", "そうだったの… ごめんなさい。\nわたしたち、 かんちがい してた…");
    yield* say("ガンテツ「いいって ことよ。 こんな かお してりゃ\nかんちがい されるのにも なれてらあ。」");
    yield* say("ガンテツ「…で、 おまえら。 あの きょじんを たおしに いくのか？」");
    yield* talk("popo", "うん！ あかの ほうぎょくも とりかえすポ！");
    yield* say("ガンテツ「…ちっ、 しかたねえ。\nおれの ハンマーも かしてやらあ！」");
    Q.join("gantetsu");
    Q.healAll();
    F.regroup();
    Q.snd.play("buff");
    yield* say("ガンテツが なかまに くわわった！");
    yield* talk("gantetsu", "まずは この じゃまな いわだ。\nどいてな！ ……ふんっ！！");
    Q.snd.play("quake");
    Q.shake(0.6, 4);
    set("boulder");
    yield 0.6;
    yield* say("おおきな いわが こなごなに くだけた！");
    set("gantetsu");
    F.playMapMusic();
  };

  EV.ev_golem = function* () {
    if (flag("golem")) return;
    Q.snd.stop();
    Q.snd.play("quake");
    Q.shake(0.8, 3);
    yield* say("ゴゴゴゴゴゴ……");
    yield* talk("gantetsu", "でやがったな、 てつの きょじん！");
    yield* say("くろがねゴーレム「ガ… ガガ…\nシンニュウシャ… ハッケン… ハイジョ シマス…」");
    yield* talk("yuta", "しゃべった！？");
    yield* talk("popo", "あかい ほうぎょくが むねで ひかってるポ！");
    const r = yield* Q.battle.fight(["golem"], { bg: "mine", noRun: true, intro: "くろがねゴーレムが うごきだした！" });
    if (r === "lose") { yield* EV.gameover(); return; }
    yield* say("くろがねゴーレムは がらがらと くずれおちた…");
    set("golem");
    set("orbR");
    yield* get("orbR");
    Q.snd.music("story");
    yield* talk("gantetsu", "やったぜ！ …さて、 ガキどもを\nまちに かえして やらねえとな。");
    yield* talk("gantetsu", "そうだ、 きたへの はしが こわれてるって きいたぜ。\nおれが なおして やらあ。 だいくしごとも とくいでな！");
    set("bridgeFixed");
    yield* say("（きたへの はしが なおった！\nこおりの とうへ いけるように なった）");
    F.playMapMusic();
  };

  // ================================================================ ユキユキむら と こおりの とう
  EV.ev_s_elder = function* () {
    if (flag("orbB")) { yield* say("ばあさま「あの こが… フブキーナが もどって きた…\nありがとう、 ありがとうねえ…」"); return; }
    if (!flag("icekey")) {
      yield* say("ばあさま「ようこそ ユキユキむらへ…\nこの さむさは こおりの まじょ フブキーナの しわざ じゃ。」");
      yield* say("ばあさま「あの こは むかし 『ゆきの せいじょ』と よばれた\nやさしい むすめ じゃった。」");
      yield* say("ばあさま「ハッパむらの ポロとは、 まほうの ライバル でねえ。\nいつも けんかして、 いつも わらっていたよ。」");
      yield* talk("meru", "えっ、 おじいちゃんと！？");
      yield* say("ばあさま「おや、 ポロの まごかい。 にてるねえ。\n…じゃが まりゅうの やみが、 あの この こころを こおらせて しもうた。」");
      yield* say("ばあさま「たのむよ。 あの こを たすけて おくれ。\nこの こおりの かぎで、 とうの とびらが ひらく。」");
      yield* get("icekey");
      set("icekey");
      return;
    }
    yield* say("ばあさま「フブキーナを… たのんだよ。\nこおりの とうは むらの ひがし、 こおった みずうみの まんなか じゃ。」");
  };
  EV.ev_s_fan = function* () {
    yield* say("むらびと「わあっ！ ほんものの ゆうしゃさまだ！\nサイン ください！」");
    yield* talk("popo", "ポポ、 じ かけないポ…");
    yield* say("むらびと「じゃあ アンテナの あと だけでも！」");
    yield* say("ポポは ゆきに アンテナで ぽちっと あとを つけた。");
    yield* say("むらびと「かぞくの たからに します！」");
  };
  EV.ev_towerlocked = function* () {
    yield* say("とうの とびらは かたく こおりついている。\nなにか かぎが ひつようだ…");
  };

  EV.ev_fubukina = function* () {
    if (flag("orbB")) return;
    Q.snd.stop();
    yield* say("フブキーナ「あら… こんな ところまで、\nかわいい おきゃくさま。」");
    yield* say("フブキーナ「ひとつめの ぼうや… あなたが いまの ゆうしゃ ね。\nまりゅうさまの じゃまは させないわ。」");
    yield* talk("meru", "あなたが フブキーナね！\nばあさまが いってた！ ほんとうは やさしい ひと だって！");
    yield* say("フブキーナ「ポロの まご…？ ふふ…\nやさしさなんて、 とっくに こおりついたわ。」");
    yield* say("フブキーナ「みんな まとめて、\nこおりの にんぎょうに してあげる！」");
    const r = yield* Q.battle.fight(["fubukina"], { bg: "ice", noRun: true, intro: "フブキーナが つえを かかげた！" });
    if (r === "lose") { yield* EV.gameover(); return; }
    Q.snd.music("story");
    yield* say("フブキーナの まわりの こおりが とけていく…");
    yield* say("フブキーナ「…あたたかい。\nわたし… いったい なにを していたの…」");
    yield* say("フブキーナ「そう… まりゅうの やみに こころを こおらされて…\nごめんなさい。 ユキユキむらの みんなにも…」");
    yield* talk("meru", "フブキーナさん…！");
    yield* say("フブキーナ「メル、 だったわね。 あなたの まほう…\nポロに そっくり。 なつかしいわ。」");
    yield* say("フブキーナ「これを あげる。 わたしの つえよ。」");
    yield* get("witchrod");
    yield* say("フブキーナ「そして これが… あおの ほうぎょく。」");
    set("orbB");
    yield* get("orbB");
    yield* say("フブキーナ「まりゅうは ひがしの うみの しまに いる。\nそこへ いくには、 そらを とばなければ いけないわ。」");
    yield* talk("yuta", "そらを…！ UFOだ！\nほうぎょくが 3つ そろったから、 なおせるかも！");
    yield* say("フブキーナ「きをつけて。 まりゅうの そばには、\nりゅうきし ガルムが いる…」");
    yield* say("フブキーナは ちいさく ほほえむと、\nこなゆきに なって きえていった。");
    yield* talk("popo", "ほしくずの もりの UFOに いくポ！");
    F.playMapMusic();
  };

  // ================================================================ ゆうしゃの ほこら
  EV.ev_shrine = function* () {
    if (flag("herosword")) { yield* say("ほこらは しずかな ひかりに つつまれている。"); return; }
    Q.snd.music("story");
    yield* say("まばゆい ひかりの なかに、\nいっぽんの けんが ささっている…");
    yield* say("？？？「…よくぞ きた。 わたしの ちからを\nうけついだ ちいさき ゆうしゃよ。」");
    yield* say("？？？「わたしは 1000ねんまえの ゆうしゃ。\nおまえと おなじ、 ほしから きた ひとつめ…」");
    yield* say("ゆうしゃの こえ「まりゅうは もともと、 この せかいを まもる\nりゅう だった。 だが ひとの おそれと いかりを うけて、 やみに おちた…」");
    yield* say("ゆうしゃの こえ「わたしには ふういん することしか できなかった。\nだが おまえなら… あの りゅうの こころを すくえるかも しれぬ。」");
    yield* say("ゆうしゃの こえ「この けんを もっていけ。\nそして… なかまを しんじるのだ。」");
    set("herosword");
    yield* get("herosword");
    yield* talk("popo", "…ありがとうポ。 ご、 ごせんぞさま…？");
    F.playMapMusic();
  };

  // ================================================================ まりゅうじょう
  EV.ev_garm = function* () {
    if (flag("garm")) return;
    Q.snd.stop();
    yield* say("ガルム「とまれ。\nここから さきは まりゅうさまの ま。」");
    yield* say("ガルム「わたしは りゅうきし ガルム。\nまりゅうさまに つかえる さいごの きし。」");
    yield* talk("popo", "どうして わるい りゅうの みかた するポ？");
    yield* say("ガルム「…わるい りゅう、 か。\nおまえたちには そう みえるのだろうな。」");
    yield* say("ガルム「わたしには、 まもると ちかった やくそくが ある。\n—— ゆくぞ、 ひとつめの ゆうしゃ！」");
    const r = yield* Q.battle.fight(["garm"], { bg: "castle", noRun: true, intro: "りゅうきし ガルムが けんを ぬいた！" });
    if (r === "lose") { yield* EV.gameover(); return; }
    Q.snd.music("story");
    yield* say("ガルム「…みごとだ。\n1000ねんまえの ゆうしゃと おなじ… いや、 それいじょうの ひかりだ。」");
    yield* say("ガルム「まりゅうさまは、 もとは この せかいを まもる\n『まもりりゅう』 だった。」");
    yield* say("ガルム「だが ひとびとは その ちからを おそれ、 いしを なげ、\nおいはらった… なんども、 なんども。」");
    yield* say("ガルム「かなしみと いかりの なかで、 あのかたは\nじぶんの こころを すてて しまったのだ。」");
    yield* say("ガルム「わたしは… とめられなかった。\nそばに いる ことしか、 できなかった…」");
    yield* say("ガルム「たのむ。 あのかたを… すくって くれ。」");
    yield* talk("popo", "まかせるポ！");
    if (has("gantetsu")) yield* talk("gantetsu", "…へっ。 いい けらいじゃねえか。");
    yield* say("ガルムは しずかに めを とじた…");
    set("garm");
    F.playMapMusic();
  };

  EV.ev_dragzard = function* () {
    if (flag("dragon")) return;
    Q.snd.stop();
    Q.snd.play("quake");
    Q.shake(1.0, 3);
    yield* say("…ゴゴゴゴゴゴ……");
    yield* say("ドラグザード「…きたか。 ほしの ひとつめよ。」");
    yield* say("ドラグザード「1000ねんまえ、 おまえの そせんは わたしを ふういんした。\nひとは いつも そうだ。 おそれ、 きずつけ、 とじこめる。」");
    yield* say("ドラグザード「ならば わたしが すべてを やみに しずめよう。\nおそれも かなしみも ない、 しずかな せかいに！」");
    yield* talk("yuta", "そんなの… さびしい だけじゃないか！");
    yield* talk("meru", "まもりりゅう だった あなたが、 どうして…！");
    if (has("gantetsu")) yield* talk("gantetsu", "こわい かおの きもちは、 おれにも わかるぜ。\nだがな、 あばれたって だれも わらっちゃ くれねえんだ！");
    yield* talk("popo", "ドラグザード！\nポポは… きみを たすけに きたポ！");
    yield* say("ドラグザード「たすける…？ …わらわせるな！\nちいさき ものどもよ、 きえされ！！」");
    Q.snd.play("roar");
    Q.shake(0.8, 5);
    const r = yield* Q.battle.fight(["dragzard"], { bg: "dragon", noRun: true, music: "lastboss", phase2: "dragzard2", intro: "まりゅう ドラグザードが たちはだかった！", winMsg: "まりゅうの やみが はれていく…！", keepMusic: true });
    if (r === "lose") { yield* EV.gameover(); return; }
    set("dragon");
    yield* EV.ending();
  };

  // ================================================================ かいふくの ひかり / ぜんめつ
  EV.ev_healspot = function* () {
    Q.snd.play("heal");
    Q.healAll();
    Q.flash(0.2, "#a0ffd0");
    yield* say("ふしぎな ひかりが みんなを つつみこんだ…\nHPと MPが かいふくした！");
    if (yield* Q.ask("ぼうけんのしょに きろく しますか？")) yield* Q.menu.saveMenu();
  };

  EV.gameover = function* () {
    Q.snd.jingle("gameover", null);
    yield* Q.fadeOut(1.0);
    yield 1.2;
    const town = (Q.S.lastTown && Q.S.lastTown.town) || "village";
    const wp = Q.MAPS.world.warps.find((w) => w.to === town);
    Q.S.gold = Math.floor(Q.S.gold / 2);
    Q.healAll();
    F.vehicle = null;
    F.load(town, wp.tx, wp.ty, 3);
    Q.setScene(F);
    yield* Q.fadeIn(0.8);
    yield* say("…………\nきが つくと、 ポポたちは まちに もどっていた。");
    yield* say("（もっていた おかねが はんぶんに なってしまった…）");
  };

  // ================================================================ エンディング
  EV.ending = function* () {
    Q.snd.music("ending");
    yield* say("まりゅうの むねの ひとつめが、\nやさしい ひかりに かわっていく…");
    yield* say("ドラグザード「…あたたかい。 これは… ひかり…？」");
    yield* say("ドラグザード「おもいだした…\nわたしは… この せかいの そらを、 うみを、 いのちを…\nまもりたかった…」");
    yield* say("ドラグザード「ちいさき ゆうしゃよ。 そして その なかまたちよ。\n…ありがとう。」");
    for (let i = 0; i < 8; i++) { Q.flash(0.15, "#ffffff"); Q.snd.play("sparkle"); yield 0.2; }
    yield* say("まりゅうの からだは ひかりの つぶに なって、\nほしぞらへ のぼっていった…");
    yield* say("（どこからか、 ガルムの こえが きこえた）\n「…おかえりなさいませ、 まもりりゅうさま。」");
    yield* Q.fadeOut(1.2, "#ffffff");
    set("ending");
    // ハッパむらで おいわい
    F.vehicle = null;
    F.load("village", 13, 9, 3);
    Q.snd.music("ending");
    yield* Q.fadeIn(1.0);
    yield* say("ポロじい「ようやった！ ようやったぞ、 ゆうしゃたち！\nせかいに ひかりが もどったのじゃ！」");
    yield* say("うおまさ「おうっ、 おれも そろそろ ちきゅうに かえらねえとな！\nポポ、 UFOに のせて くんな！」");
    if (has("gantetsu")) yield* talk("gantetsu", "おれは こうざんに もどるぜ。\nガキどもが まってらあ。 …げんきでな、 ちびども。");
    yield* talk("meru", "…ポポ、 ユウタ。\nまた きてよね。 ぜったいよ！ やくそく なんだから！");
    yield* talk("popo", "やくそくポ！");
    yield* talk("yuta", "メルも、 ちきゅうに あそびに きてよ！\nラムネ ごちそう するからさ！");
    yield* Q.fadeOut(1.2);
    // ちきゅう
    Q.S.party = ["popo", "yuta"];
    F.load("yutaroom", 4, 2, 0);
    F.map.tint = "rgba(255,220,160,0.15)";
    F.regroup();
    Q.snd.music("village");
    yield* Q.fadeIn(1.2);
    yield* say("ママ「ユウタ〜！ ポポちゃ〜ん！\nあさごはん できたわよ〜！」");
    yield* talk("yuta", "…ゆめ、 だったのかな。");
    yield* talk("popo", "ゆめじゃ ないポ。 ほら。");
    yield* say("ポポの アンテナの さきで、\nちいさな ほしが きらりと ひかった。");
    yield* talk("yuta", "…へへっ。 また いこうな、 ポポ！");
    yield* talk("popo", "ポポッ！");
    yield* Q.fadeOut(1.5);
    F.map.tint = null;
    Q.setScene(Q.creditsScene);
    Q.snd.music("title");
    yield* Q.fadeIn(1.0);
    yield () => Q.creditsScene.done;
  };
})();
