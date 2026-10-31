// マップの けんさ: node tools/check_maps.js
// 行の長さ・legend・ワープ先・宝箱/NPC の位置・入口からの到達可能性をチェックする
const fs = require("fs");
const path = require("path");
global.window = global;
global.Q = {};
for (const f of ["gfx.js", "tiles.js", "data.js", "maps.js", "world.js"]) eval(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"));
const M = Q.MAPS, T = Q.tiles.T;
let bad = 0;
const err = (m) => { bad++; console.log("NG", m); };
function tileAt(map, x, y) {
  const rows = map.rows;
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return map.fill;
  return map.legend[rows[y][x]];
}
function solid(map, x, y) { const t = T[tileAt(map, x, y)]; return !t || t.solid; }
for (const [id, map] of Object.entries(M)) {
  const rows = map.rows;
  const w = rows[0].length;
  rows.forEach((r, y) => { if (r.length !== w) err(`${id} row ${y} length ${r.length} != ${w}`); for (const ch of r) if (!map.legend[ch]) err(`${id} row ${y} char '${ch}' not in legend`); });
  for (const v of Object.values(map.legend)) if (!T[v]) err(`${id} legend tile '${v}' undefined`);
  if (!T[map.fill]) err(`${id} fill '${map.fill}'`);
  for (const wp of map.warps || []) {
    const to = M[wp.to];
    if (!to) { err(`${id} warp to ${wp.to} missing`); continue; }
    if (solid(to, wp.tx, wp.ty)) err(`${id} warp -> ${wp.to} (${wp.tx},${wp.ty}) lands on solid '${tileAt(to, wp.tx, wp.ty)}'`);
  }
  if (map.exit && !M[map.exit.to]) err(`${id} exit`);
  // 到達可能性: 最初のワープ先 (入口) から
  const objs = new Set();
  if (id !== "world") for (const n of map.npcs || []) if (n.cond !== "never") for (let i = 0; i < (n.w || 1); i++) objs.add(n.x + i + "," + n.y);
  for (const c of map.chests || []) objs.add(c.x + "," + c.y);
  if (id === "world") continue; // ワールドは はし・とうげ・UFO で すすめる場所が かわるので tools/gen_world.py の だんかいで かくにん
  const entries = [];
  for (const [mid, m2] of Object.entries(M)) for (const wp of m2.warps || []) if (wp.to === id) entries.push([wp.tx, wp.ty]);
  if (!entries.length) continue;
  const seen = new Set();
  const st = [entries[0]];
  seen.add(entries[0].join(","));
  while (st.length) {
    const [x, y] = st.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + "," + ny;
      if (seen.has(k) || nx < 0 || ny < 0 || nx >= w || ny >= rows.length) continue;
      if (solid(map, nx, ny) || objs.has(k)) continue;
      seen.add(k); st.push([nx, ny]);
    }
  }
  const adj = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(x + dx + "," + (y + dy)));
  // カウンター越し
  const adj2 = (x, y) => adj(x, y) || [[0, 2], [0, -2], [2, 0], [-2, 0]].some(([dx, dy]) => seen.has(x + dx + "," + (y + dy)) && T[tileAt(map, x + dx / 2, y + dy / 2)].counter);
  for (const wp of map.warps || []) if (!seen.has(wp.x + "," + wp.y)) err(`${id} warp at (${wp.x},${wp.y}) unreachable`);
  for (const c of map.chests || []) { if (solid(map, c.x, c.y)) err(`${id} chest ${c.id} on solid`); if (!adj(c.x, c.y)) err(`${id} chest ${c.id} unreachable`); }
  for (const n of map.npcs || []) { if (n.cond === "never" || id === "world") continue; if (!n.tileObj && !n.obj && !n.art && !n.sign && solid(map, n.x, n.y)) err(`${id} npc ${n.id} on solid`); if (!adj2(n.x, n.y)) err(`${id} npc ${n.id} not reachable`); }
  for (const t of map.triggers || []) if (!seen.has(t.x + "," + t.y)) err(`${id} trigger (${t.x},${t.y}) unreachable`);
}
console.log(bad ? `${bad} problems` : "maps OK");
