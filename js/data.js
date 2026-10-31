// ゲームデータ: なかま・とくぎ・どうぐ・そうび・モンスター・エンカウント
(() => {
  "use strict";

  // ---------------------------------------------------------------- なかま
  // grow: 1 レベルごとの のび (小数は たまって いく)
  const PARTY = {
    popo: {
      name: "ポポ", job: "ゆうしゃ", color: "#ff69b4",
      base: { hp: 32, mp: 8, atk: 10, def: 8, mag: 8, spd: 9 },
      grow: { hp: 7.2, mp: 2.4, atk: 2.5, def: 1.9, mag: 1.7, spd: 1.3 },
      equip: { w: "branch", a: "cloth", x: null },
      skills: [[3, "genki"], [5, "beam"], [9, "thunder"], [13, "shower"], [17, "gigabeam"], [21, "ikazuchi"], [25, "inochi"]],
      desc: "ピンクの ひとつめ うちゅうじん。\nあたまの アンテナは でんせつの ゆうしゃと おなじ かたち。",
    },
    yuta: {
      name: "ユウタ", job: "ちきゅうっこ", color: "#ff9a2a",
      base: { hp: 27, mp: 5, atk: 9, def: 6, mag: 4, spd: 13 },
      grow: { hp: 5.6, mp: 1.3, atk: 2.25, def: 1.5, mag: 0.6, spd: 1.8 },
      equip: { w: "plabat", a: "tshirt", x: null },
      skills: [[1, "slingshot"], [2, "ouen"], [4, "homerun"], [7, "bakuchiku"], [10, "renda"], [14, "homeking"], [19, "zenryoku"]],
      desc: "ちきゅうの しょうがくせい。ポポの しんゆう。\nどうぐを つかうと かいふくりょうが 1.5ばいに なる。",
    },
    meru: {
      name: "メル", job: "まほうつかい", color: "#9a4ad8",
      base: { hp: 21, mp: 14, atk: 5, def: 5, mag: 13, spd: 10 },
      grow: { hp: 4.6, mp: 3.5, atk: 1.0, def: 1.1, mag: 2.6, spd: 1.4 },
      equip: { w: "minarai", a: "robe", x: null },
      skills: [[1, "boppo"], [3, "suya"], [5, "hiehie"], [7, "iyashi"], [9, "kachikochi"], [12, "boboboon"], [15, "blizzard"], [18, "hoshifuru"], [23, "dokkaan"]],
      desc: "ハッパむらの みならい まほうつかい。\nげんきで おっちょこちょい。ほうきは まだ のれない。",
    },
    gantetsu: {
      name: "ガンテツ", job: "ちからもち", color: "#e8a070",
      base: { hp: 60, mp: 3, atk: 22, def: 15, mag: 2, spd: 5 },
      grow: { hp: 9.2, mp: 0.7, atk: 3.0, def: 2.4, mag: 0.3, spd: 0.9 },
      equip: { w: "stonehammer", a: "leather", x: null },
      skills: [[1, "kabau"], [1, "tame"], [11, "buchikamashi"], [15, "dainfunka"], [21, "gantetsuhammer"]],
      desc: "ゴロゴロこうざんの さんぞくの おやぶん。\nこわい かおだが こどもと ねこに よわい。",
    },
  };

  // ---------------------------------------------------------------- とくぎ / まほう
  // kind: dmg(まほう) / phys(ぶつり) / heal / revive / buff / status / special
  // target: enemy / enemies / ally / allies / self / ko
  const SKILLS = {
    genki: { name: "げんきのひかり", mp: 3, kind: "heal", target: "ally", power: 28, k: 0.9, anim: "heal", field: true, desc: "なかま ひとりの HPを かいふく" },
    beam: { name: "ピカッとビーム", mp: 4, kind: "dmg", target: "enemy", power: 20, k: 1.1, elem: "light", anim: "beam", desc: "ひとつめから ビーム！ てき ひとりに ダメージ" },
    thunder: { name: "アンテナサンダー", mp: 8, kind: "dmg", target: "enemies", power: 24, k: 0.85, elem: "thunder", anim: "thunder", desc: "アンテナから かみなり。てき ぜんいんに ダメージ" },
    shower: { name: "げんきシャワー", mp: 11, kind: "heal", target: "allies", power: 45, k: 0.8, anim: "heal", field: true, desc: "なかま ぜんいんの HPを かいふく" },
    gigabeam: { name: "ギガポポビーム", mp: 12, kind: "dmg", target: "enemy", power: 90, k: 2.0, elem: "light", anim: "bigbeam", desc: "ちょうでかい ビーム！ てき ひとりに だいダメージ" },
    ikazuchi: { name: "ゆうしゃのいかずち", mp: 18, kind: "dmg", target: "enemies", power: 85, k: 1.4, elem: "thunder", anim: "bigthunder", desc: "でんせつの いかずち。てき ぜんいんに だいダメージ" },
    inochi: { name: "いのちのひかり", mp: 20, kind: "revive", target: "ko", power: 1.0, anim: "heal", field: true, desc: "たおれた なかまを ぜんかいで いきかえらせる" },
    supernova: { name: "スーパーポポノヴァ", mp: 0, kind: "dmg", target: "enemy", power: 2600, k: 3, elem: "light", anim: "nova", desc: "みんなの きもちを ひとつに した さいごの ひかり", hidden: true },

    slingshot: { name: "パチンコ", mp: 0, kind: "phys", target: "enemy", mult: 0.85, sure: true, first: true, anim: "pebble", desc: "かならず あたる。だれよりも はやく うてる" },
    ouen: { name: "おうえん", mp: 2, kind: "buff", target: "allies", stat: "atk", amount: 0.3, turns: 4, anim: "cheer", desc: "「がんばれー！」 なかま ぜんいんの こうげきりょく アップ" },
    homerun: { name: "ホームラン", mp: 3, kind: "phys", target: "enemy", mult: 1.9, hit: 0.8, anim: "homerun", desc: "おもいっきり ふりぬく！ でも ときどき からぶり" },
    bakuchiku: { name: "ばくちく", mp: 4, kind: "dmg", target: "enemies", power: 22, k: 0.4, useAtk: true, elem: "fire", anim: "firecracker", desc: "パンパン！ てき ぜんいんに ほのおの ダメージ" },
    renda: { name: "れんぞくヒット", mp: 5, kind: "phys", target: "enemy", mult: 0.85, hits: 2, anim: "slash", desc: "すばやく 2かい こうげき" },
    homeking: { name: "ホームランキング", mp: 9, kind: "phys", target: "enemies", mult: 1.25, anim: "homerun", desc: "てき ぜんいんを まとめて かっとばす！" },
    zenryoku: { name: "ぜんりょくおうえん", mp: 10, kind: "buff", target: "allies", stat: "both", amount: 0.35, turns: 5, anim: "cheer", desc: "こうげきりょくと しゅびりょくが アップ" },

    boppo: { name: "ボッポ", mp: 2, kind: "dmg", target: "enemy", power: 14, k: 1.0, elem: "fire", anim: "fire", desc: "ちいさな ひのたま。てき ひとりに ほのおの ダメージ" },
    suya: { name: "スヤスヤ", mp: 3, kind: "status", target: "enemies", status: "sleep", chance: 0.65, anim: "sleep", desc: "てき ぜんいんを ねむらせる (きかない あいても いる)" },
    hiehie: { name: "ヒエヒエ", mp: 5, kind: "dmg", target: "enemies", power: 15, k: 0.75, elem: "ice", anim: "ice", desc: "つららの あめ。てき ぜんいんに こおりの ダメージ" },
    iyashi: { name: "いやしのかぜ", mp: 7, kind: "heal", target: "allies", power: 26, k: 0.7, anim: "heal", field: true, desc: "なかま ぜんいんの HPを かいふく" },
    kachikochi: { name: "カチコチ", mp: 4, kind: "buff", target: "allies", stat: "def", amount: 0.4, turns: 5, anim: "shield", desc: "なかま ぜんいんの しゅびりょく アップ" },
    boboboon: { name: "ボボボーン", mp: 9, kind: "dmg", target: "enemies", power: 40, k: 1.0, elem: "fire", anim: "bigfire", desc: "ばくはつ！ てき ぜんいんに ほのおの だいダメージ" },
    blizzard: { name: "ヒエヒエビッグ", mp: 12, kind: "dmg", target: "enemies", power: 55, k: 1.05, elem: "ice", anim: "bigice", desc: "ふぶき！ てき ぜんいんに こおりの だいダメージ" },
    hoshifuru: { name: "ほしふるよる", mp: 18, kind: "dmg", target: "enemies", power: 90, k: 1.3, anim: "meteor", desc: "ほしを ふらせる。だれにでも きく だいダメージ" },
    dokkaan: { name: "ドッカーン", mp: 20, kind: "dmg", target: "enemy", power: 180, k: 2.4, elem: "fire", anim: "bigfire", desc: "メルの さいきょう まほう！ てき ひとりに ちょう だいダメージ" },

    kabau: { name: "かばう", mp: 0, kind: "special", target: "ally", anim: "shield", first: true, desc: "このターン なかま ひとりの かわりに こうげきを うける" },
    tame: { name: "ちからため", mp: 2, kind: "special", target: "self", anim: "charge", desc: "つぎの こうげきが 2.2ばいに なる" },
    buchikamashi: { name: "ぶちかまし", mp: 4, kind: "phys", target: "enemy", mult: 1.7, stun: 0.35, anim: "smash", desc: "たいあたり！ あいてが うごけなく なることも" },
    dainfunka: { name: "だいふんか", mp: 9, kind: "phys", target: "enemies", mult: 1.15, anim: "quake", desc: "じめんを たたいて てき ぜんいんに ダメージ" },
    gantetsuhammer: { name: "ガンテツハンマー", mp: 14, kind: "phys", target: "enemy", mult: 3.2, anim: "smash", desc: "ひっさつの いちげき。あたれば でかい" },
  };

  // ---------------------------------------------------------------- どうぐ
  // type: use(しょうもうひん) / w(ぶき) / a(ぼうぐ) / x(アクセサリ) / key(だいじなもの)
  const ITEMS = {
    berry: { name: "ポポベリー", type: "use", price: 8, heal: 35, target: "ally", desc: "あまずっぱい きのみ。HPを 35 かいふく" },
    niboshi: { name: "にぼし", type: "use", price: 3, heal: 15, target: "ally", desc: "ねこの だいこうぶつ。HPを 15 かいふく" },
    bigberry: { name: "ビッグベリー", type: "use", price: 45, heal: 110, target: "ally", desc: "おおきな ポポベリー。HPを 110 かいふく" },
    miracle: { name: "ミラクルベリー", type: "use", price: 400, heal: 9999, target: "allies", desc: "なかま ぜんいんの HPを ぜんかい" },
    ramune: { name: "ラムネ", type: "use", price: 70, mpheal: 25, target: "ally", desc: "シュワッと MPを 25 かいふく" },
    bigramune: { name: "まんたんラムネ", type: "use", price: 600, mpheal: 999, target: "ally", desc: "MPを ぜんかい" },
    antidote: { name: "どくけしそう", type: "use", price: 10, cure: "poison", target: "ally", desc: "どくを なおす にがい くさ" },
    feather: { name: "いのちのはね", type: "use", price: 300, revive: 0.5, target: "ko", desc: "たおれた なかまを はんぶんの HPで いきかえらせる" },
    smoke: { name: "けむりだま", type: "use", price: 25, escape: true, target: "none", battleOnly: true, desc: "せんとうから かならず にげられる" },
    bombstone: { name: "ばくだんいし", type: "use", price: 90, bomb: 60, target: "enemies", battleOnly: true, desc: "なげると ばくはつ！ てき ぜんいんに 60の ダメージ" },
    homefeather: { name: "ふるさとのはね", type: "use", price: 25, warp: true, target: "none", fieldOnly: true, desc: "さいごに たちよった まちへ もどれる" },

    // ぶき
    branch: { name: "きのえだ", type: "w", who: ["popo"], atk: 3, price: 10 },
    bronzesword: { name: "どうのけん", type: "w", who: ["popo"], atk: 11, price: 120 },
    steelsword: { name: "はがねのけん", type: "w", who: ["popo"], atk: 22, price: 650 },
    starsword: { name: "ほしくずのけん", type: "w", who: ["popo"], atk: 36, price: 2200 },
    herosword: { name: "ゆうしゃのけん", type: "w", who: ["popo"], atk: 58, mag: 10, price: 0, desc: "でんせつの ゆうしゃが つかった けん" },
    plabat: { name: "プラスチックバット", type: "w", who: ["yuta"], atk: 4, price: 10 },
    woodbat: { name: "きのバット", type: "w", who: ["yuta"], atk: 12, price: 110 },
    ironbat: { name: "てつのバット", type: "w", who: ["yuta"], atk: 23, price: 700 },
    goldbat: { name: "きんのバット", type: "w", who: ["yuta"], atk: 35, price: 2100 },
    homerunbat: { name: "ホームランバット", type: "w", who: ["yuta"], atk: 50, spd: 6, price: 0, desc: "かっとばせ！ かいしんが でやすい", crit: 0.12 },
    minarai: { name: "みならいのつえ", type: "w", who: ["meru"], atk: 2, mag: 2, price: 10 },
    starrod: { name: "ほしのつえ", type: "w", who: ["meru"], atk: 5, mag: 7, price: 150 },
    icerod: { name: "こおりのつえ", type: "w", who: ["meru"], atk: 9, mag: 14, price: 900 },
    witchrod: { name: "まじょのつえ", type: "w", who: ["meru"], atk: 14, mag: 24, price: 0, desc: "フブキーナの つえ。つめたい まりょくが やどる" },
    stonehammer: { name: "いしのハンマー", type: "w", who: ["gantetsu"], atk: 18, price: 300 },
    ironhammer: { name: "てつのハンマー", type: "w", who: ["gantetsu"], atk: 30, price: 1200 },
    gigahammer: { name: "ギガハンマー", type: "w", who: ["gantetsu"], atk: 48, price: 3000 },

    // ぼうぐ
    cloth: { name: "ぬののふく", type: "a", who: ["popo", "gantetsu"], def: 3, price: 10 },
    tshirt: { name: "ポポTシャツ", type: "a", who: ["yuta"], def: 2, price: 10 },
    robe: { name: "みならいローブ", type: "a", who: ["meru"], def: 3, price: 10 },
    leather: { name: "かわのよろい", type: "a", who: ["popo", "gantetsu"], def: 8, price: 90 },
    jersey: { name: "ジャージ", type: "a", who: ["yuta"], def: 7, spd: 2, price: 80 },
    magicrobe: { name: "まほうのローブ", type: "a", who: ["meru"], def: 7, mag: 3, price: 100 },
    chain: { name: "くさりかたびら", type: "a", who: ["popo", "gantetsu"], def: 15, price: 450 },
    uniform: { name: "ユニフォーム", type: "a", who: ["yuta"], def: 15, spd: 4, price: 420 },
    stardress: { name: "ほしのドレス", type: "a", who: ["meru"], def: 14, mag: 6, price: 480 },
    steelarmor: { name: "はがねのよろい", type: "a", who: ["popo", "gantetsu"], def: 25, price: 1400 },
    superuni: { name: "スーパーユニフォーム", type: "a", who: ["yuta"], def: 24, spd: 8, price: 1300 },
    lightrobe: { name: "ひかりのローブ", type: "a", who: ["meru"], def: 22, mag: 10, price: 1500 },
    dragonmail: { name: "ドラゴンメイル", type: "a", who: ["popo", "gantetsu"], def: 40, price: 0, desc: "りゅうの うろこの よろい。ほのおに つよい", resist: "fire" },

    // アクセサリ
    badge: { name: "ポポのバッジ", type: "x", def: 3, price: 50 },
    powerring: { name: "ちからのゆびわ", type: "x", atk: 8, price: 600 },
    guardring: { name: "まもりのゆびわ", type: "x", def: 10, price: 600 },
    swiftshoes: { name: "はやてのくつ", type: "x", spd: 12, price: 800 },
    earring: { name: "まりょくのイヤリング", type: "x", mag: 12, price: 800 },
    catbell: { name: "ねこのすず", type: "x", spd: 5, def: 5, nosleep: true, price: 0, desc: "ねむりを ふせぐ ちりんちりん" },
    pendant: { name: "ほしのペンダント", type: "x", atk: 6, def: 6, mag: 6, spd: 6, price: 0, desc: "ぜんぶの のうりょくが すこし あがる" },

    // だいじなもの
    orbG: { name: "みどりのほうぎょく", type: "key", desc: "もりの ちからが やどる ほうぎょく" },
    orbR: { name: "あかのほうぎょく", type: "key", desc: "だいちの ちからが やどる ほうぎょく" },
    orbB: { name: "あおのほうぎょく", type: "key", desc: "こおりの ちからが やどる ほうぎょく" },
    letter: { name: "おうさまのてがみ", type: "key", desc: "「この ものたちに きょうりょく せよ」" },
    icekey: { name: "こおりのかぎ", type: "key", desc: "こおりの とうの とびらを ひらく かぎ" },
    ufocore: { name: "UFOの エンジン", type: "key", desc: "ポポの UFOの だいじな ぶひん" },
  };

  // ---------------------------------------------------------------- てきの わざ
  const EACTS = {
    attack: { name: null, kind: "phys", target: "one", mult: 1, anim: "claw" },
    bite: { name: "かみつき", kind: "phys", target: "one", mult: 1.15, anim: "bite" },
    tackle: { name: "たいあたり", kind: "phys", target: "one", mult: 1.2, anim: "punch" },
    onetwo: { name: "ワンツーパンチ", kind: "phys", target: "one", mult: 0.75, hits: 2, anim: "punch" },
    drill: { name: "ドリルアタック", kind: "phys", target: "one", mult: 1.1, pierce: true, anim: "drill" },
    spore: { name: "ねむりの ほうし", kind: "status", target: "all", status: "sleep", chance: 0.35, anim: "sleep" },
    banana: { name: "バナナの かわを なげた！", kind: "status", target: "one", status: "slip", chance: 0.8, anim: "banana" },
    poison: { name: "どくばり", kind: "phys", target: "one", mult: 0.9, status: "poison", chance: 0.5, anim: "drill" },
    fire1: { name: "ひのこ", kind: "mag", target: "one", power: 12, k: 0.6, elem: "fire", anim: "fire" },
    fire2: { name: "ほのお", kind: "mag", target: "all", power: 18, k: 0.5, elem: "fire", anim: "bigfire" },
    ice1: { name: "つらら", kind: "mag", target: "one", power: 20, k: 0.7, elem: "ice", anim: "ice" },
    ice2: { name: "ふぶき", kind: "mag", target: "all", power: 26, k: 0.55, elem: "ice", anim: "bigice" },
    thunder1: { name: "でんげき", kind: "mag", target: "one", power: 30, k: 0.7, elem: "thunder", anim: "thunder" },
    sleep: { name: "ねむりの じゅもん", kind: "status", target: "one", status: "sleep", chance: 0.55, anim: "sleep" },
    stare: { name: "あやしい まなざし", kind: "status", target: "one", status: "sleep", chance: 0.6, anim: "dark" },
    darkbeam: { name: "やみの ビーム", kind: "mag", target: "one", power: 50, k: 0.8, elem: "dark", anim: "darkbeam" },
    heal: { name: "かいふく", kind: "heal", target: "self", power: 40, k: 1.0, anim: "heal" },
    healAlly: { name: "かいふく", kind: "heal", target: "ally", power: 60, k: 1.0, anim: "heal" },
    guard: { name: "みを まもっている", kind: "buff", target: "self", stat: "def", amount: 0.5, turns: 3, anim: "shield" },
    rage: { name: "いかり だした！", kind: "buff", target: "self", stat: "atk", amount: 0.4, turns: 4, anim: "charge" },
    roll: { name: "ゴロゴロ ころがってきた！", kind: "phys", target: "all", mult: 0.7, anim: "quake" },
    snowball: { name: "ゆきだまを なげた！", kind: "phys", target: "all", mult: 0.6, elem: "ice", anim: "snowball" },
    explode: { name: "ばくはつした！", kind: "explode", target: "all", power: 1.6, anim: "explode" },
    fuse: { name: "どうかせんに ひが ついた…", kind: "fuse", target: "self", anim: "charge" },
    breath: { name: "ほのおを はいた！", kind: "mag", target: "all", power: 30, k: 0.5, elem: "fire", anim: "breath" },
    bigbreath: { name: "はげしい ほのおを はいた！", kind: "mag", target: "all", power: 36, k: 0.4, elem: "fire", anim: "breath" },
    flee: { name: "にげだした！", kind: "flee", target: "self" },
    nothing: { name: "ようすを みている", kind: "none", target: "self" },
    giggle: { name: "おどっている", kind: "none", target: "self" },
    call: { name: "なかまを よんだ！", kind: "call", target: "self" },

    // ボス
    togemissile: { name: "トゲミサイル！", kind: "phys", target: "all", mult: 0.75, anim: "missile" },
    press: { name: "のしかかり！", kind: "phys", target: "one", mult: 1.6, anim: "quake" },
    hammer: { name: "ハンマーを ふりおろした！", kind: "phys", target: "one", mult: 1.45, anim: "smash" },
    quake: { name: "じだんだを ふんだ！ じしんだ！", kind: "phys", target: "all", mult: 0.8, anim: "quake" },
    rocket: { name: "ロケットパンチ！", kind: "phys", target: "one", mult: 1.8, anim: "rocket" },
    steam: { name: "あつい じょうきを ふきだした！", kind: "mag", target: "all", power: 32, k: 0.6, elem: "fire", anim: "steam" },
    charge: { name: "エネルギーを ためている…", kind: "buff", target: "self", stat: "atk", amount: 0.8, turns: 2, anim: "charge" },
    lance: { name: "こおりの やり！", kind: "mag", target: "one", power: 70, k: 1.0, elem: "ice", anim: "ice" },
    diamond: { name: "ダイヤモンドダスト！", kind: "mag", target: "all", power: 45, k: 0.75, elem: "ice", anim: "bigice" },
    freeze: { name: "こおりの いき！", kind: "status", target: "all", status: "sleep", chance: 0.3, anim: "bigice" },
    icearmor: { name: "こおりの よろいを まとった", kind: "buff", target: "self", stat: "def", amount: 0.6, turns: 3, anim: "shield" },
    sword: { name: "りゅうけん！", kind: "phys", target: "one", mult: 1.6, anim: "bigslash" },
    swordall: { name: "つるぎの まい！", kind: "phys", target: "all", mult: 0.9, anim: "bigslash" },
    warcry: { name: "たけだけしく ほえた！", kind: "buff", target: "self", stat: "atk", amount: 0.4, turns: 3, anim: "roar" },
    claw: { name: "するどい つめ！", kind: "phys", target: "one", mult: 1.4, anim: "claw" },
    tail: { name: "しっぽを ふりまわした！", kind: "phys", target: "all", mult: 0.85, anim: "quake" },
    roar: { name: "おたけびを あげた！", kind: "debuff", target: "all", stat: "def", amount: 0.3, turns: 3, anim: "roar" },
    darkflare: { name: "ダークフレア！", kind: "mag", target: "one", power: 90, k: 1.0, elem: "dark", anim: "darkbeam" },
    darknova: { name: "ダークノヴァ！！", kind: "mag", target: "all", power: 70, k: 0.6, elem: "dark", anim: "darknova" },
    darkfist: { name: "まりゅうけん！", kind: "phys", target: "one", mult: 1.7, anim: "bigslash" },
    darkstare: { name: "やみの まなざし", kind: "status", target: "all", status: "sleep", chance: 0.3, anim: "dark" },
    regen: { name: "やみの ちからで きずを ふさいだ", kind: "heal", target: "self", power: 400, k: 0, anim: "dark" },
    mimic: { name: "ポポの まねを した！ ピカッとビーム！", kind: "mag", target: "one", power: 60, k: 1.0, elem: "dark", anim: "darkbeam" },
  };

  // ---------------------------------------------------------------- モンスター
  // weak / resist: ぞくせい (fire ice thunder light dark)、 sleepImmune、 counter: はんげき (トゲ)
  const E = {};
  function mon(id, o) { E[id] = Object.assign({ id, art: id, scale: 1, mp: 0, mag: 0, acts: [[1, "attack"]], weak: [], resist: [], drop: null }, o); }

  // そうげん
  mon("purun", { name: "プルン", hp: 12, atk: 9, def: 3, mag: 4, spd: 6, exp: 3, gold: 4, acts: [[3, "attack"], [1, "giggle"]], drop: ["berry", 0.12],
    desc: "ぷるぷるの プリンの モンスター。\nカラメルの ぼうしが じまん。たべないでね。" });
  mon("gumi", { name: "グミ", hp: 16, atk: 10, def: 4, spd: 7, exp: 4, gold: 5, acts: [[3, "attack"], [1, "tackle"]], drop: ["niboshi", 0.1],
    desc: "スーパーポポランドから やってきた。\nふまれるのは もう こりごり らしい。" });
  mon("pata", { name: "パタ", hp: 14, atk: 11, def: 3, spd: 13, exp: 5, gold: 6, acts: [[3, "attack"], [1, "bite"]], fly: true,
    desc: "コウモリの はねで パタパタ とぶ。\nよるに なると きが おおきくなる。" });
  mon("kara", { name: "カラ", hp: 22, atk: 11, def: 13, spd: 3, exp: 7, gold: 9, acts: [[3, "attack"], [1, "guard"]], weak: ["thunder"],
    desc: "いつも ふきげんな カメ。\nこうらが かたくて ぶつりこうげきが ききにくい。" });
  // もり
  mon("mush", { name: "マッシュボクサー", hp: 30, atk: 15, def: 7, spd: 9, exp: 10, gold: 10, acts: [[3, "attack"], [2, "onetwo"], [1, "spore"]], weak: ["fire"], drop: ["berry", 0.2],
    desc: "キノコの ボクサー。まいあさ 100かい\nシャドーボクシングを する。ねむりの ほうしに ちゅうい。" });
  mon("monkey", { name: "バナナざる", hp: 26, atk: 14, def: 6, spd: 15, exp: 9, gold: 12, acts: [[3, "attack"], [2, "banana"]], drop: ["niboshi", 0.25],
    desc: "レースで バナナを なげていた あの おさるの なかま。\nバナナの かわで すべらせてくる。" });
  mon("bee", { name: "ハチドリル", hp: 24, atk: 16, def: 6, spd: 17, exp: 10, gold: 9, acts: [[2, "attack"], [2, "drill"], [1, "poison"]], fly: true, weak: ["ice"],
    desc: "ゴーグルを かけた ハチ。はなの ドリルは\nどんな よろいも つらぬく。" });
  mon("ichigo", { name: "イチゴプルン", hp: 30, atk: 14, def: 6, mag: 10, spd: 8, exp: 9, gold: 11, acts: [[3, "attack"], [1, "healAlly"]], drop: ["berry", 0.3],
    desc: "イチゴあじの プルン。なかまを かいふく してくれる\nやさしい せいかく。" });
  // もりの どうくつ
  mon("ghost", { name: "ランタンおばけ", hp: 28, atk: 12, def: 6, mag: 14, spd: 10, exp: 12, gold: 13, acts: [[2, "attack"], [2, "fire1"]], weak: ["light"], resist: ["fire"],
    desc: "さみしがりやの おばけ。ランタンの ひで\nあそんで ほしがる。あつい。" });
  mon("toge", { name: "トゲ", hp: 30, atk: 17, def: 10, spd: 7, exp: 14, gold: 12, acts: [[3, "attack"], [1, "tackle"]], counter: 0.15,
    desc: "ふめない トゲトゲ。たたくと トゲが ささって\nこっちも いたい！ まほうが ねらいめ。" });
  mon("yorupata", { name: "ヨルパタ", hp: 26, atk: 16, def: 5, spd: 19, exp: 12, gold: 10, acts: [[2, "attack"], [2, "bite"], [1, "stare"]], fly: true,
    desc: "どうくつ そだちの パタ。あかい めで\nにらまれると ねむくなる。" });
  mon("choco", { name: "チョコプルン", hp: 40, atk: 16, def: 9, mag: 8, spd: 7, exp: 13, gold: 16, acts: [[3, "attack"], [1, "tackle"]], weak: ["fire"],
    desc: "ビターな チョコあじ。ふつうの プルンより\nちょっと おとなで ちょっと かたい。" });
  mon("kingtoge", { name: "キングトゲ", hp: 560, atk: 26, def: 12, mag: 12, spd: 9, exp: 220, gold: 300, boss: true, counter: 0.12, sleepImmune: true,
    acts: [[3, "attack"], [2, "togemissile"], [2, "press"], [1, "rage"]], ai: "kingtoge", weak: ["ice"],
    desc: "トゲの おうさま。スーパーポポランドで まけた\nあと、まりゅうの ちからで パワーアップ！" });
  // へいげん
  mon("wolf", { name: "ガルルン", hp: 46, atk: 25, def: 11, spd: 19, exp: 19, gold: 15, acts: [[3, "attack"], [2, "bite"], [1, "call"]], weak: ["fire"],
    desc: "いきがった オオカミの こども。\nバンダナと ほおの きずが じまん (じつは ころんだ)。" });
  mon("kobo", { name: "コボルン", hp: 42, atk: 23, def: 13, spd: 11, exp: 17, gold: 22, acts: [[3, "attack"], [1, "tackle"], [1, "rage"]], drop: ["antidote", 0.2],
    desc: "なべを かぶった ゴブリン。おやぶんに\nいいところを みせたくて いつも はりきっている。" });
  mon("hat", { name: "マジカルハット", hp: 38, atk: 15, def: 9, mag: 22, spd: 14, exp: 21, gold: 19, acts: [[1, "attack"], [2, "fire1"], [1, "sleep"]], weak: ["fire"], drop: ["ramune", 0.12],
    desc: "まほうつかいに すてられた ぼうし。\nひとりで まほうを べんきょうした どりょくか。" });
  mon("gumired", { name: "グミグミ", hp: 50, atk: 24, def: 12, spd: 10, exp: 20, gold: 18, acts: [[3, "attack"], [1, "tackle"], [1, "call"]],
    desc: "イチゴあじの グミ。ふたつ あつまると\nなぜか あばれだす。" });
  mon("kinpurun", { name: "キンプルン", hp: 8, atk: 20, def: 999, mag: 0, spd: 40, exp: 1200, gold: 60, acts: [[2, "flee"], [2, "attack"], [1, "giggle"]], metal: true, sleepImmune: true, resist: ["fire", "ice", "thunder", "light", "dark"],
    desc: "きんいろに かがやく まぼろしの プルン。\nすぐ にげる。たおせば けいけんちが がっぽり！" });
  // こうざん
  mon("rock", { name: "イワゴロン", hp: 72, atk: 31, def: 30, spd: 4, exp: 30, gold: 24, acts: [[2, "attack"], [2, "roll"], [1, "nothing"]], weak: ["ice"], resist: ["fire"],
    desc: "いつも ねむたい いわ。おこると ころがって\nくるので おこさないように。" });
  mon("mole", { name: "モグラッパ", hp: 58, atk: 29, def: 15, spd: 15, exp: 26, gold: 26, acts: [[3, "attack"], [1, "onetwo"]], weak: ["thunder"],
    desc: "サングラスの モグラ。くらい どうくつでも\nサングラスを はずさない。こだわり。" });
  mon("bomb", { name: "ダイナマイトくん", hp: 36, atk: 20, def: 10, spd: 12, exp: 28, gold: 30, acts: [[1, "attack"]], ai: "bomb", weak: ["ice"],
    desc: "いつも あせっている ばくだん。どうかせんに ひが\nつくと たいへん！ はやめに たおそう。" });
  mon("skel", { name: "ガイコツこうふ", hp: 62, atk: 33, def: 17, spd: 10, exp: 29, gold: 28, acts: [[3, "attack"], [1, "tackle"]], weak: ["light", "fire"], drop: ["antidote", 0.15],
    desc: "むかしの こうふ。ほねに なっても\nほりつづける しごとにん。" });
  mon("haganekara", { name: "ハガネカラ", hp: 60, atk: 30, def: 46, spd: 4, exp: 34, gold: 30, acts: [[3, "attack"], [1, "guard"]], weak: ["thunder"],
    desc: "はがねの こうらの カラ。かたすぎて\nじぶんでも ぬげない。" });
  mon("gantetsu", { name: "ガンテツ", hp: 1150, atk: 46, def: 17, spd: 8, exp: 300, gold: 0, boss: true, sleepImmune: true, scale: 1,
    acts: [[3, "attack"], [2, "hammer"], [1, "quake"], [1, "rage"]], ai: "gantetsu",
    desc: "さんぞくの おやぶん。こわい かおだが\nこうざんの こどもたちを まもっていた。" });
  mon("golem", { name: "くろがねゴーレム", hp: 1600, atk: 46, def: 30, mag: 24, spd: 10, exp: 900, gold: 600, boss: true, sleepImmune: true,
    acts: [[3, "attack"], [2, "rocket"], [2, "steam"], [1, "charge"]], ai: "golem", weak: ["thunder", "ice"],
    desc: "いにしえの てつの きょじん。\nまりゅうの ちからで めを さました。" });
  // ゆきぐに
  mon("snowman", { name: "ユキダルマン", hp: 92, atk: 42, def: 24, spd: 12, exp: 46, gold: 38, acts: [[2, "attack"], [2, "snowball"]], weak: ["fire"], resist: ["ice"],
    desc: "けんかっぱやい ゆきだるま。\nバケツは かぶとの つもり。" });
  mon("penguin", { name: "ペンギンナイト", hp: 84, atk: 47, def: 27, spd: 21, exp: 52, gold: 44, acts: [[3, "attack"], [1, "guard"], [1, "tackle"]], resist: ["ice"],
    desc: "ちいさな きし。ほんとうは ゆうしゃに\nあこがれている。サインが ほしい。" });
  mon("yukinko", { name: "ユキンコ", hp: 72, atk: 28, def: 18, mag: 38, spd: 18, exp: 49, gold: 40, acts: [[1, "attack"], [2, "ice1"], [1, "ice2"]], weak: ["fire"], resist: ["ice"], drop: ["ramune", 0.15],
    desc: "ふわふわの ゆきの ようせい。\nいたずらで ふぶきを おこす。" });
  mon("icewolf", { name: "アイスガルルン", hp: 98, atk: 50, def: 24, spd: 27, exp: 54, gold: 42, acts: [[3, "attack"], [2, "bite"], [1, "call"]], weak: ["fire"], resist: ["ice"],
    desc: "ゆきぐにの ガルルン。バンダナは\nおかあさんの てあみ。" });
  mon("yetimonkey", { name: "ユキざる", hp: 88, atk: 45, def: 22, spd: 24, exp: 50, gold: 46, acts: [[3, "attack"], [2, "banana"], [1, "snowball"]], weak: ["fire"],
    desc: "ゆきやまの バナナざる。バナナは\nこおっていて かたい。あぶない。" });
  // こおりの とう
  mon("iceghost", { name: "つららゴースト", hp: 104, atk: 38, def: 26, mag: 46, spd: 20, exp: 62, gold: 50, acts: [[1, "attack"], [2, "ice1"], [1, "stare"]], weak: ["fire", "light"], resist: ["ice"],
    desc: "こおりの とうに すむ さむがりの ゆうれい。\nだれか だきしめて ほしい。つめたいけど。" });
  mon("crystal", { name: "クリスタルン", hp: 120, atk: 46, def: 52, mag: 30, spd: 14, exp: 72, gold: 64, acts: [[3, "attack"], [1, "guard"]], resist: ["fire", "ice", "thunder", "light"],
    desc: "すいしょうの いきもの。まほうが\nほとんど きかない。たたいて くだこう。" });
  mon("penguinking", { name: "ペンギンキング", hp: 140, atk: 56, def: 32, spd: 22, exp: 84, gold: 70, acts: [[3, "attack"], [1, "call"], [1, "rage"]], resist: ["ice"],
    desc: "ペンギンナイトの たいちょう。\nマントは じぶんで ぬった。" });
  mon("aoghost", { name: "あおランタン", hp: 96, atk: 30, def: 22, mag: 50, spd: 18, exp: 66, gold: 52, acts: [[1, "attack"], [2, "ice2"], [1, "sleep"]], weak: ["light"], resist: ["ice"],
    desc: "あおい ひの ランタンおばけ。\nひが つめたいので さわっても へいき。" });
  mon("fubukina", { name: "フブキーナ", hp: 2200, atk: 46, def: 30, mag: 56, spd: 24, exp: 2200, gold: 1000, boss: true, sleepImmune: true,
    acts: [[2, "lance"], [2, "diamond"], [1, "freeze"], [1, "icearmor"]], ai: "fubukina", weak: ["fire"], resist: ["ice"],
    desc: "こおりの まじょ。メルの ししょうの むかしの\nライバル。まりゅうに こころを こおらされていた。" });
  // まりゅうの しま
  mon("fireball", { name: "ヒノタマン", hp: 140, atk: 50, def: 30, mag: 62, spd: 24, exp: 92, gold: 70, acts: [[1, "attack"], [2, "fire1"], [1, "fire2"]], weak: ["ice"], resist: ["fire"],
    desc: "ごきげんな ひのたま。だれにでも\nハイタッチ したがる。あつい。" });
  mon("lizard", { name: "トカゲへい", hp: 170, atk: 72, def: 42, spd: 20, exp: 104, gold: 80, acts: [[3, "attack"], [1, "guard"], [1, "poison"]], weak: ["ice"],
    desc: "まりゅうぐんの へいたい。まじめだが\nしっぽを ふまれて よく ころぶ。" });
  mon("magmarock", { name: "マグマゴロン", hp: 210, atk: 70, def: 72, spd: 6, exp: 112, gold: 88, acts: [[2, "attack"], [2, "roll"], [1, "fire2"]], weak: ["ice"], resist: ["fire"],
    desc: "マグマで あたたまった イワゴロン。\nぽかぽかで きもちよさそう。" });
  mon("puppy", { name: "ドラゴンパピー", hp: 185, atk: 70, def: 40, mag: 50, spd: 23, exp: 124, gold: 90, acts: [[2, "attack"], [2, "breath"], [1, "bite"]], weak: ["ice"], resist: ["fire"],
    desc: "まりゅうの とおい しんせき。\nほのおは まだ ちょっと へた。" });
  mon("darkeye", { name: "ヤミアイ", hp: 150, atk: 55, def: 34, mag: 72, spd: 28, exp: 118, gold: 86, acts: [[1, "attack"], [2, "darkbeam"], [1, "stare"]], weak: ["light"], resist: ["dark"],
    desc: "やみの ひとつめ。ポポの きらきらした\nめを ねたんでいる。" });
  mon("firewolf", { name: "ヒノガルルン", hp: 160, atk: 76, def: 34, spd: 32, exp: 110, gold: 78, acts: [[3, "attack"], [2, "bite"], [1, "fire1"]], weak: ["ice"], resist: ["fire"],
    desc: "ほのおの しまの ガルルン。\nあつがりなので いつも ハァハァ している。" });
  mon("greenpuppy", { name: "ミドリパピー", hp: 200, atk: 74, def: 44, mag: 56, spd: 25, exp: 130, gold: 96, acts: [[2, "attack"], [2, "breath"], [1, "healAlly"]], weak: ["fire"],
    desc: "ミドリいろの パピー。ほのおより\nなかまの きずを なめて なおす ほうが とくい。" });
  // まりゅうじょう
  mon("dknight", { name: "りゅうきへい", hp: 260, atk: 92, def: 56, spd: 26, exp: 180, gold: 120, acts: [[3, "attack"], [1, "guard"], [1, "sword"]], weak: ["light"],
    desc: "まりゅうに つかえる きし。かぶとの\nりゅうの かおは じぶんで けずった。" });
  mon("gargoyle", { name: "ガーゴン", hp: 240, atk: 84, def: 72, spd: 18, exp: 172, gold: 110, acts: [[3, "attack"], [1, "bite"], [1, "darkbeam"]], weak: ["thunder"], resist: ["dark"],
    desc: "しろを まもる いしの あくま。\nひるまは ずっと じっと している。" });
  mon("bonedragon", { name: "ホネドラゴン", hp: 420, atk: 98, def: 50, mag: 60, spd: 22, exp: 270, gold: 160, acts: [[2, "attack"], [2, "claw"], [1, "bigbreath"]], weak: ["light", "fire"], sleepImmune: true,
    desc: "むかし まりゅうに まけた りゅう。\nほねに なっても まだ たたかう。" });
  mon("yamipopo", { name: "ヤミポポ", hp: 230, atk: 70, def: 44, mag: 84, spd: 30, exp: 200, gold: 140, scale: 1.4, acts: [[1, "attack"], [2, "mimic"], [1, "stare"]], weak: ["light"], resist: ["dark"],
    desc: "やみの ちからで うまれた もうひとりの ポポ。\n「ぼくは… だれ…？」" });
  mon("dknightelite", { name: "あんこくきへい", hp: 330, atk: 104, def: 62, spd: 30, exp: 230, gold: 150, acts: [[3, "attack"], [2, "sword"], [1, "swordall"]], weak: ["light"],
    desc: "りゅうきへいの エリート。マントの\nうらに ガルムの サインを ぬいつけている。" });
  mon("darkhat", { name: "やみのぼうし", hp: 200, atk: 50, def: 40, mag: 90, spd: 28, exp: 190, gold: 130, acts: [[2, "fire2"], [1, "darkbeam"], [1, "sleep"]], weak: ["light"],
    desc: "やみの まほうを おぼえた マジカルハット。\nぐれた りゆうは だれも しらない。" });
  mon("benitoge", { name: "ヤミトゲ", hp: 240, atk: 96, def: 60, spd: 20, exp: 200, gold: 120, acts: [[3, "attack"], [1, "togemissile"]], counter: 0.2,
    desc: "やみに そまった トゲ。キングトゲの\nいうことも きかない ふりょう。" });
  mon("garm", { name: "りゅうきし ガルム", extra: 0.85, hp: 4100, atk: 90, def: 58, mag: 40, spd: 34, exp: 5000, gold: 2000, boss: true, sleepImmune: true,
    acts: [[3, "attack"], [2, "sword"], [2, "swordall"], [1, "warcry"]], ai: "garm", weak: ["light"],
    desc: "まりゅうの いちばんの けらい。\nむかしは りゅうを まもる ほこりたかき きしだった。" });
  mon("dragzard", { name: "まりゅう ドラグザード", extra: 0.55, hp: 4000, atk: 88, def: 60, mag: 90, spd: 30, exp: 0, gold: 0, boss: true, final: 1, sleepImmune: true,
    acts: [[2, "claw"], [2, "bigbreath"], [1, "tail"], [1, "roar"], [1, "darkflare"]], ai: "dragzard", weak: ["light"], resist: ["fire", "dark"],
    desc: "せかいを やみに つつもうとする まりゅう。\n1000ねんの ねむりから めざめた。" });
  mon("dragzard2", { name: "ドラグザード しんのすがた", extra: 0.8, hp: 4400, atk: 112, def: 66, mag: 95, spd: 44, exp: 0, gold: 0, boss: true, final: 2, sleepImmune: true,
    acts: [[2, "darkfist"], [2, "darknova"], [1, "darkstare"], [1, "darkflare"]], ai: "dragzard2", weak: ["light"], resist: ["fire", "ice", "dark"],
    desc: "まりゅうの ほんとうの すがた。\nむねの ひとつめは、かつて すてた こころ。" });

  // ---------------------------------------------------------------- エンカウント表 (それぞれ [おもさ, なかまの リスト])
  const ENC = {
    plains1: [[4, ["purun"]], [4, ["purun", "purun"]], [3, ["gumi"]], [3, ["gumi", "purun"]], [2, ["pata"]], [2, ["pata", "purun"]], [1, ["kara"]]],
    plains1b: [[3, ["gumi", "gumi"]], [3, ["pata", "pata"]], [2, ["kara", "purun"]], [2, ["gumi", "pata", "purun"]], [1, ["mush"]]],
    forest: [[3, ["mush"]], [3, ["monkey", "purun"]], [3, ["bee", "bee"]], [2, ["mush", "monkey"]], [2, ["ichigo", "gumi", "gumi"]], [2, ["kara", "bee"]], [1, ["monkey", "monkey", "monkey"]]],
    forestcave: [[3, ["ghost", "yorupata"]], [3, ["toge"]], [2, ["toge", "ghost"]], [2, ["choco", "choco"]], [2, ["yorupata", "yorupata", "yorupata"]], [2, ["mush", "ghost"]]],
    plains2: [[3, ["wolf"]], [3, ["kobo", "kobo"]], [3, ["hat", "kobo"]], [2, ["wolf", "wolf"]], [2, ["gumired", "gumired"]], [2, ["hat", "hat"]], [1, ["kobo", "kobo", "hat"]], [0.4, ["kinpurun"]]],
    mine: [[3, ["rock", "mole"]], [3, ["mole", "mole"]], [3, ["bomb", "skel"]], [2, ["skel", "skel"]], [2, ["haganekara", "mole"]], [2, ["bomb", "bomb", "rock"]], [0.5, ["kinpurun"]]],
    snow: [[3, ["snowman", "snowman"]], [3, ["penguin", "yukinko"]], [3, ["icewolf", "icewolf"]], [2, ["yetimonkey", "yukinko"]], [2, ["penguin", "penguin", "yukinko"]], [0.5, ["kinpurun", "kinpurun"]]],
    icetower: [[3, ["iceghost", "crystal"]], [3, ["penguinking", "penguin"]], [3, ["aoghost", "aoghost"]], [2, ["crystal", "crystal"]], [2, ["iceghost", "yukinko", "yukinko"]], [2, ["icewolf", "aoghost"]]],
    island: [[3, ["fireball", "fireball"]], [3, ["lizard", "fireball"]], [3, ["puppy"]], [2, ["magmarock", "lizard"]], [2, ["darkeye", "darkeye"]], [2, ["firewolf", "firewolf"]], [2, ["greenpuppy", "puppy"]], [0.6, ["kinpurun", "kinpurun"]]],
    dcastle: [[3, ["dknight", "gargoyle"]], [3, ["bonedragon"]], [2, ["yamipopo", "darkhat"]], [3, ["dknightelite", "darkeye"]], [2, ["benitoge", "benitoge"]], [2, ["gargoyle", "darkhat", "darkeye"]], [1, ["lizard", "lizard", "dknight"]]],
  };

  // バランス ちょうせい: ざこは HP と こうげきを まとめて あげる (ボスは こべつに せってい)
  for (const e of Object.values(E)) {
    if (e.boss || e.metal) continue;
    e.hp = Math.round(e.hp * 1.8);
    e.atk = Math.round(e.atk * 1.22);
    e.mag = Math.round(e.mag * 1.15);
  }

  // けいけんち テーブル (そのレベルに なるのに ひつような るいけい)
  const EXP = [0, 0];
  for (let L = 2; L <= 60; L++) EXP[L] = Math.round(8 * Math.pow(L - 1, 2.3) + 4 * (L - 1));

  Q.data = { PARTY, SKILLS, ITEMS, EACTS, E, ENC, EXP, MAXLV: 60 };
})();
