/* CALCTETRIS — Tetris CE2. Fonctions : calculs, grille, rendu, niveaux, entrées. */
(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const STORE = "calctetris-v1";
  const TETRO = {
    I: { c: "#6fe7ff", blocks: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]], [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]]] },
    O: { c: "#ffd15a", blocks: [[[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]]] },
    T: { c: "#c084fc", blocks: [[[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]] },
    S: { c: "#4ade80", blocks: [[[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]], [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]]] },
    Z: { c: "#fb7185", blocks: [[[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]]] },
    J: { c: "#60a5fa", blocks: [[[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]]] },
    L: { c: "#fb923c", blocks: [[[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]] }
  };
  const GOOD = ["Bravo !", "Super calcul !", "Tu as juste !", "Bien vu !", "Nickel !"];
  const KIND = { add: "Additions", sub: "Soustractions", mul: "Multiplications", div: "Divisions" };

  const $ = (id) => document.getElementById(id);
  const canvas = $("cv");
  const ctx = canvas.getContext("2d");
  const nextCv = $("next");
  const nctx = nextCv.getContext("2d");

  let mode = "mix";
  let muted = false;
  let cell = 24;
  let dpr = 1;
  let bag = [];
  let lastCalc = "";
  let raf = 0;
  let hold = { key: null, t: 0 };

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const state = {
    phase: "menu",
    board: emptyBoard(),
    piece: null,
    next: null,
    pending: null,
    rot: 0,
    x: 3,
    y: 0,
    score: 0,
    level: 1,
    streak: 0,
    speedMul: 1,
    dropAcc: 0,
    last: 0,
    calc: null,
    typed: "",
    recent: [],
    stats: { add: { ok: 0, bad: 0 }, sub: { ok: 0, bad: 0 }, mul: { ok: 0, bad: 0 }, div: { ok: 0, bad: 0 } },
    missed: [],
    pickLine: false,
    paused: false,
    over: false,
    waitUntil: 0
  };

  function rand(n) { return Math.floor(Math.random() * n); }
  function randInt(a, b) { return a + rand(b - a + 1); }
  function pick(arr) { return arr[rand(arr.length)]; }
  function digits(n) { return String(n).split("").map(Number); }

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function saveStore(data) { localStorage.setItem(STORE, JSON.stringify(data)); }

  function beep(ok) {
    if (muted) return;
    const ac = beep.ac || (beep.ac = new (window.AudioContext || window.webkitAudioContext)());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = ok ? 660 : 220;
    g.gain.value = 0.05;
    o.connect(g); g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.12);
  }

  /* ---------- Générateur de calculs CE2 ---------- */
  function addNoCarry() {
    const len = Math.random() < 0.82 ? 2 : 3;
    let a = 0, b = 0;
    for (let i = 0; i < len; i++) {
      const da = i === len - 1 ? randInt(1, 8) : randInt(0, 8);
      const db = randInt(0, 9 - da);
      a += da * Math.pow(10, i);
      b += db * Math.pow(10, i);
    }
    if (b < 1) b = 1;
    return make("+", a, b, a + b, "add");
  }

  function addCarry() {
    let a = randInt(15, 980);
    let b = randInt(15, 1000 - a);
    let tries = 0;
    while (!hasCarry(a, b) && tries < 20) {
      a = randInt(15, 980);
      b = randInt(15, 1000 - a);
      tries += 1;
    }
    if (a + b > 1000) b = 1000 - a;
    return make("+", a, b, a + b, "add");
  }

  function hasCarry(a, b) {
    const da = digits(a).reverse();
    const db = digits(b).reverse();
    const n = Math.max(da.length, db.length);
    for (let i = 0; i < n; i++) if ((da[i] || 0) + (db[i] || 0) >= 10) return true;
    return false;
  }

  function subNoBorrow() {
    const len = Math.random() < 0.82 ? 2 : 3;
    let a = 0, b = 0;
    for (let i = 0; i < len; i++) {
      const da = i === len - 1 ? randInt(1, 9) : randInt(0, 9);
      const db = randInt(0, da);
      a += da * Math.pow(10, i);
      b += db * Math.pow(10, i);
    }
    if (a === b) a += 1;
    if (b < 1) b = 1;
    return make("−", a, b, a - b, "sub");
  }

  function subBorrow() {
    let a = randInt(20, 999);
    let b = randInt(1, a - 1);
    let tries = 0;
    while (!hasBorrow(a, b) && tries < 24) {
      a = randInt(20, 999);
      b = randInt(1, a - 1);
      tries += 1;
    }
    return make("−", a, b, a - b, "sub");
  }

  function hasBorrow(a, b) {
    const da = digits(a).reverse();
    const db = digits(b).reverse();
    for (let i = 0; i < db.length; i++) if ((da[i] || 0) < (db[i] || 0)) return true;
    return false;
  }

  function mulTable(tables) {
    const t = pick(tables);
    const n = randInt(2, 10);
    return make("×", n, t, n * t, "mul");
  }

  function mulBig() {
    if (Math.random() < 0.45) {
      const n = randInt(11, 99);
      const k = pick([10, 100]);
      return make("×", n, k, n * k, "mul");
    }
    const n = randInt(12, 49);
    const k = randInt(2, 9);
    return make("×", n, k, n * k, "mul");
  }

  function divExact(tables) {
    const t = pick(tables);
    const n = randInt(2, 10);
    return make("÷", t * n, t, n, "div");
  }

  function make(sym, a, b, r, kind) {
    return { text: a + "  " + sym + "  " + b, a: a, b: b, r: r, kind: kind, key: kind + ":" + a + sym + b };
  }

  function opsForLevel(level) {
    if (mode === "add") return ["add"];
    if (mode === "sub") return ["sub"];
    if (mode === "mul") return ["mul"];
    if (mode === "div") return ["div"];
    if (level <= 1) return ["add", "sub", "mul"];
    if (level === 2) return ["add", "sub", "mul"];
    return ["add", "sub", "mul", "div"];
  }

  function nextCalc() {
    const level = state.level;
    const kind = pick(opsForLevel(level));
    let item;
    for (let i = 0; i < 12; i++) {
      if (kind === "add") item = level === 1 ? addNoCarry() : addCarry();
      else if (kind === "sub") item = level === 1 ? subNoBorrow() : subBorrow();
      else if (kind === "mul") {
        if (mode === "div") item = divExact([2, 5, 10]);
        else if (level === 1) item = mulTable([2, 5, 10]);
        else if (level === 2) item = mulTable([3, 4, 6]);
        else item = Math.random() < 0.45 ? mulBig() : mulTable([7, 8, 9]);
      } else {
        if (level <= 1) item = divExact([2, 5, 10]);
        else if (level === 2) item = divExact([3, 4, 6]);
        else item = divExact([7, 8, 9, 2, 3, 4, 5, 6]);
      }
      if (item.key !== lastCalc) break;
    }
    lastCalc = item.key;
    return item;
  }

  function bumpLevel() {
    const rec = state.recent;
    if (rec.length >= 10) {
      const last10 = rec.slice(-10);
      const ok = last10.filter(Boolean).length;
      if (ok >= 8 && state.level < 3) state.level += 1;
    }
    if (rec.length >= 5) {
      const last5 = rec.slice(-5);
      const bad = last5.filter((x) => !x).length;
      if (bad >= 3 && state.level > 1) state.level -= 1;
    }
    $("level").textContent = String(state.level);
  }

  /* ---------- Tetris ---------- */
  function takePiece() {
    if (bag.length < 3) {
      const names = Object.keys(TETRO);
      for (let i = names.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        const tmp = names[i];
        names[i] = names[j];
        names[j] = tmp;
      }
      bag = bag.concat(names);
    }
    return bag.shift();
  }

  function cellsOf(name, rot, x, y) {
    return TETRO[name].blocks[rot].map(([cx, cy]) => [x + cx, y + cy]);
  }

  function hits(name, rot, x, y) {
    return cellsOf(name, rot, x, y).some(([cx, cy]) => {
      if (cx < 0 || cx >= COLS || cy >= ROWS) return true;
      if (cy < 0) return false;
      return !!state.board[cy][cx];
    });
  }

  function spawnPending(speedMul) {
    const name = state.pending;
    state.pending = null;
    state.piece = name;
    state.rot = 0;
    state.x = 3;
    state.y = 0;
    state.speedMul = speedMul;
    state.dropAcc = 0;
    state.phase = "play";
    $("calc-kicker").textContent = "Place ta pièce";
    if (hits(name, 0, 3, 0)) endGame();
  }

  function lockPiece() {
    const name = state.piece;
    cellsOf(name, state.rot, state.x, state.y).forEach(([x, y]) => {
      if (y >= 0) state.board[y][x] = TETRO[name].c;
    });
    const full = [];
    for (let y = 0; y < ROWS; y++) if (state.board[y].every(Boolean)) full.push(y);
    if (full.length) {
      full.forEach((y) => { state.board.splice(y, 1); state.board.unshift(Array(COLS).fill(null)); });
      state.score += [0, 100, 300, 500, 800][full.length];
    }
    state.piece = null;
    $("score").textContent = String(state.score);
    askCalc();
  }

  function move(dx, dy) {
    if (state.phase !== "play" || !state.piece || state.paused) return false;
    const nx = state.x + dx;
    const ny = state.y + dy;
    if (hits(state.piece, state.rot, nx, ny)) return false;
    state.x = nx;
    state.y = ny;
    return true;
  }

  function rotate() {
    if (state.phase !== "play" || !state.piece || state.paused) return;
    const nr = (state.rot + 1) % 4;
    const kicks = [0, -1, 1, -2, 2];
    for (let i = 0; i < kicks.length; i++) {
      if (!hits(state.piece, nr, state.x + kicks[i], state.y)) {
        state.rot = nr;
        state.x += kicks[i];
        return;
      }
    }
  }

  function hardDrop() {
    if (state.phase !== "play" || !state.piece || state.paused) return;
    while (move(0, 1)) state.score += 1;
    $("score").textContent = String(state.score);
    lockPiece();
  }

  function ghostY() {
    if (!state.piece) return state.y;
    let y = state.y;
    while (!hits(state.piece, state.rot, state.x, y + 1)) y += 1;
    return y;
  }

  function fallDelay() {
    const base = state.level === 1 ? 900 : state.level === 2 ? 620 : 420;
    return base / state.speedMul;
  }

  /* ---------- Calcul → pièce ---------- */
  function askCalc() {
    state.phase = "ask";
    state.typed = "";
    state.pending = state.next || takePiece();
    state.next = takePiece();
    state.calc = nextCalc();
    state.speedMul = 1;
    $("calc").textContent = state.calc.text + "  =  ?";
    $("calc-kicker").textContent = "À toi de calculer";
    $("typed").textContent = " ";
    $("msg").textContent = "Pas de chrono. Réfléchis bien.";
    $("msg").className = "msg";
    drawNext();
  }

  function typeKey(k) {
    if (state.phase !== "ask" || state.paused) return;
    if (k === "ok") return submit();
    if (k === "del") state.typed = state.typed.slice(0, -1);
    else if (/^\d$/.test(k) && state.typed.length < 5) state.typed += k;
    $("typed").textContent = state.typed || " ";
  }

  function submit() {
    if (state.phase !== "ask" || !state.calc) return;
    const n = Number(state.typed);
    const good = state.typed !== "" && n === state.calc.r;
    const kind = state.calc.kind;
    state.stats[kind][good ? "ok" : "bad"] += 1;
    state.recent.push(good);
    if (state.recent.length > 12) state.recent.shift();
    bumpLevel();
    if (good) {
      beep(true);
      state.streak += 1;
      state.score += 10;
      $("score").textContent = String(state.score);
      $("streak").textContent = String(state.streak);
      $("msg").textContent = pick(GOOD);
      $("msg").className = "msg ok";
      $("calc").textContent = state.calc.text + "  =  " + state.calc.r;
      if (state.streak > 0 && state.streak % 3 === 0) {
        state.phase = "bonus";
        $("bonus").hidden = false;
        return;
      }
      spawnPending(1);
    } else {
      beep(false);
      state.streak = 0;
      $("streak").textContent = "0";
      state.missed.push({ text: state.calc.text, r: state.calc.r, kind: kind });
      $("msg").textContent = "Regarde : " + state.calc.text + " = " + state.calc.r + ". La pièce ira un peu plus vite.";
      $("msg").className = "msg bad";
      $("calc").textContent = state.calc.text + "  =  " + state.calc.r;
      state.phase = "wait";
      state.waitUntil = performance.now() + 2000;
    }
  }

  function useSlow() {
    $("bonus").hidden = true;
    spawnPending(0.55);
  }

  function useClear() {
    $("bonus").hidden = true;
    const has = state.board.some((row) => row.some(Boolean));
    spawnPending(1);
    if (!has) return;
    state.pickLine = true;
    document.body.classList.add("picking-line");
    $("msg").textContent = "Touche une ligne à enlever. Tu peux aussi jouer.";
    $("msg").className = "msg ok";
  }

  function clearRow(row) {
    if (row < 0 || row >= ROWS) return;
    state.board.splice(row, 1);
    state.board.unshift(Array(COLS).fill(null));
    state.pickLine = false;
    document.body.classList.remove("picking-line");
    $("msg").textContent = "Ligne enlevée !";
  }

  /* ---------- Rendu ---------- */
  function applyLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    document.body.classList.toggle("narrow", w < 720 || (w < 960 && h > w));
    sizeBoard();
    drawBoard();
    drawNext();
  }

  function sizeBoard() {
    const wrap = $("board-wrap").getBoundingClientRect();
    const w = Math.max(80, wrap.width);
    const h = Math.max(120, wrap.height);
    cell = Math.max(8, Math.floor(Math.min(w / COLS, h / ROWS)));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(COLS * cell * dpr);
    canvas.height = Math.floor(ROWS * cell * dpr);
    canvas.style.width = COLS * cell + "px";
    canvas.style.height = ROWS * cell + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function roundCell(x, y, s, color, ghost) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.28 : 1;
    ctx.fillStyle = color;
    const r = Math.max(3, s * 0.18);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + s, y, x + s, y + s, r);
    ctx.arcTo(x + s, y + s, x, y + s, r);
    ctx.arcTo(x, y + s, x, y, r);
    ctx.arcTo(x, y, x + s, y, r);
    ctx.closePath();
    ctx.fill();
    if (!ghost) {
      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.fillRect(x + 2, y + 2, s - 4, Math.max(3, s * 0.28));
    }
    ctx.restore();
  }

  function drawBoard() {
    const s = cell;
    ctx.clearRect(0, 0, COLS * s, ROWS * s);
    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, COLS * s, ROWS * s);
    ctx.strokeStyle = "rgba(255,255,255,.05)";
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * s, 0); ctx.lineTo(x * s, ROWS * s); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * s); ctx.lineTo(COLS * s, y * s); ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (state.board[y][x]) roundCell(x * s + 1, y * s + 1, s - 2, state.board[y][x], false);
      }
    }
    if (state.pickLine) {
      ctx.fillStyle = "rgba(255, 209, 90, .12)";
      ctx.fillRect(0, 0, COLS * s, ROWS * s);
    }
    if (state.piece) {
      const gy = ghostY();
      cellsOf(state.piece, state.rot, state.x, gy).forEach(([x, y]) => {
        if (y >= 0) roundCell(x * s + 1, y * s + 1, s - 2, TETRO[state.piece].c, true);
      });
      cellsOf(state.piece, state.rot, state.x, state.y).forEach(([x, y]) => {
        if (y >= 0) roundCell(x * s + 1, y * s + 1, s - 2, TETRO[state.piece].c, false);
      });
    }
  }

  function drawNext() {
    const name = state.next;
    nctx.clearRect(0, 0, nextCv.width, nextCv.height);
    if (!name) return;
    const s = 16;
    const blocks = TETRO[name].blocks[0];
    let minX = 9, minY = 9, maxX = 0, maxY = 0;
    blocks.forEach(([x, y]) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    });
    const ox = (nextCv.width - (maxX - minX + 1) * s) / 2;
    const oy = (nextCv.height - (maxY - minY + 1) * s) / 2;
    blocks.forEach(([x, y]) => {
      nctx.fillStyle = TETRO[name].c;
      nctx.fillRect(ox + (x - minX) * s, oy + (y - minY) * s, s - 2, s - 2);
    });
  }

  /* ---------- Boucle ---------- */
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (state.paused || state.over) {
      drawBoard();
      return;
    }
    if (state.phase === "wait" && now >= state.waitUntil) spawnPending(2);
    if (state.phase === "play" && state.piece) {
      const dt = state.last ? now - state.last : 16;
      state.dropAcc += dt;
      if (state.dropAcc >= fallDelay()) {
        state.dropAcc = 0;
        if (!move(0, 1)) lockPiece();
      }
      if (hold.key && now - hold.t > 140) {
        if (hold.key === "left") move(-1, 0);
        if (hold.key === "right") move(1, 0);
        if (hold.key === "down") {
          if (move(0, 1)) state.score += 1;
          $("score").textContent = String(state.score);
        }
        hold.t = now;
      }
    }
    state.last = now;
    drawBoard();
  }

  function startGame() {
    state.board = emptyBoard();
    state.score = 0;
    state.level = 1;
    state.streak = 0;
    state.recent = [];
    state.missed = [];
    state.stats = { add: { ok: 0, bad: 0 }, sub: { ok: 0, bad: 0 }, mul: { ok: 0, bad: 0 }, div: { ok: 0, bad: 0 } };
    state.piece = null;
    state.next = takePiece();
    state.paused = false;
    state.over = false;
    state.pickLine = false;
    document.body.classList.remove("picking-line");
    $("score").textContent = "0";
    $("level").textContent = "1";
    $("streak").textContent = "0";
    $("menu").classList.remove("on");
    $("game").classList.add("on");
    $("pause").hidden = true;
    $("bonus").hidden = true;
    $("over").hidden = true;
    applyLayout();
    askCalc();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function endGame() {
    state.over = true;
    state.phase = "over";
    const data = loadStore();
    data.best = Math.max(data.best || 0, state.score);
    data.byOp = data.byOp || { add: { ok: 0, bad: 0 }, sub: { ok: 0, bad: 0 }, mul: { ok: 0, bad: 0 }, div: { ok: 0, bad: 0 } };
    ["add", "sub", "mul", "div"].forEach((k) => {
      data.byOp[k].ok += state.stats[k].ok;
      data.byOp[k].bad += state.stats[k].bad;
    });
    saveStore(data);
    $("best").textContent = String(data.best || 0);
    $("over-score").textContent = String(state.score);
    const total = ["add", "sub", "mul", "div"].reduce((s, k) => s + state.stats[k].ok + state.stats[k].bad, 0);
    const ok = ["add", "sub", "mul", "div"].reduce((s, k) => s + state.stats[k].ok, 0);
    $("over-detail").textContent = total ? (ok + " calculs justes sur " + total) : "Aucun calcul cette fois.";
    $("over-ops").innerHTML = ["add", "sub", "mul", "div"].map((k) => {
      const t = state.stats[k].ok + state.stats[k].bad;
      const p = t ? Math.round(100 * state.stats[k].ok / t) : 0;
      return "<div>" + KIND[k] + "<br><strong>" + p + " %</strong> · " + t + " calculs</div>";
    }).join("");
    $("over-miss").innerHTML = state.missed.length
      ? "<p><strong>À revoir</strong></p>" + state.missed.slice(-8).map((m) => "<p>" + m.text + " → " + m.r + "</p>").join("")
      : "<p>Aucun calcul raté. Bravo !</p>";
    $("over").hidden = false;
  }

  function goMenu() {
    state.over = true;
    state.phase = "menu";
    cancelAnimationFrame(raf);
    $("game").classList.remove("on");
    $("menu").classList.add("on");
    $("pause").hidden = true;
    $("bonus").hidden = true;
    $("over").hidden = true;
    document.body.classList.remove("picking-line");
  }

  /* ---------- Entrées clavier / tactile / boutons ---------- */
  function onKey(e) {
    if (state.phase === "menu") return;
    if (e.key === "Escape") {
      togglePause();
      return;
    }
    if (state.paused || state.over) return;
    if (state.phase === "ask") {
      if (/^\d$/.test(e.key)) typeKey(e.key);
      else if (e.key === "Backspace") { e.preventDefault(); typeKey("del"); }
      else if (e.key === "Enter") { e.preventDefault(); typeKey("ok"); }
      return;
    }
    if (state.phase !== "play") return;
    if (e.key === "ArrowLeft") { e.preventDefault(); move(-1, 0); hold = { key: "left", t: performance.now() + 220 }; }
    if (e.key === "ArrowRight") { e.preventDefault(); move(1, 0); hold = { key: "right", t: performance.now() + 220 }; }
    if (e.key === "ArrowDown") { e.preventDefault(); if (move(0, 1)) state.score += 1; hold = { key: "down", t: performance.now() + 80 }; }
    if (e.key === "ArrowUp") { e.preventDefault(); rotate(); }
    if (e.key === " ") { e.preventDefault(); hardDrop(); }
  }

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowDown") hold.key = null;
  });

  function togglePause() {
    if (state.phase === "menu" || state.over) return;
    state.paused = !state.paused;
    $("pause").hidden = !state.paused;
  }

  $("btn-start").onclick = startGame;
  $("btn-pause").onclick = togglePause;
  $("btn-resume").onclick = togglePause;
  $("btn-restart").onclick = startGame;
  $("btn-quit").onclick = goMenu;
  $("btn-again").onclick = startGame;
  $("btn-home").onclick = goMenu;
  $("btn-slow").onclick = useSlow;
  $("btn-clear").onclick = useClear;
  $("btn-mute").onclick = function () {
    muted = !muted;
    this.textContent = muted ? "Muet" : "Son";
  };

  document.querySelectorAll(".mode").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".mode").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      mode = btn.getAttribute("data-mode");
    };
  });

  $("numpad").onclick = (e) => {
    const k = e.target.getAttribute("data-k");
    if (k) typeKey(k);
  };
  $("moves").onclick = (e) => {
    const m = e.target.getAttribute("data-move");
    if (!m) return;
    if (m === "left") move(-1, 0);
    if (m === "right") move(1, 0);
    if (m === "rot") rotate();
    if (m === "down") { if (move(0, 1)) state.score += 1; }
    if (m === "drop") hardDrop();
  };

  let swipe = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (state.pickLine) {
      const rect = canvas.getBoundingClientRect();
      const row = Math.floor((e.clientY - rect.top) / (rect.height / ROWS));
      clearRow(row);
      e.preventDefault();
      return;
    }
    swipe = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* déjà capturé */ }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!swipe || state.phase !== "play") return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    if (Math.abs(dx) > cell * 0.7 && Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 1 : -1, 0);
      swipe.x = e.clientX;
      swipe.moved = true;
    } else if (dy > cell * 0.7 && dy > Math.abs(dx)) {
      if (move(0, 1)) state.score += 1;
      swipe.y = e.clientY;
      swipe.moved = true;
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!swipe) return;
    const dt = Date.now() - swipe.t;
    const dy = e.clientY - swipe.y;
    if (!swipe.moved && dt < 280) rotate();
    else if (dy > 80 && dt < 280) hardDrop();
    swipe = null;
  });

  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", applyLayout);
  window.addEventListener("orientationchange", () => setTimeout(applyLayout, 180));

  $("best").textContent = String(loadStore().best || 0);
})();
