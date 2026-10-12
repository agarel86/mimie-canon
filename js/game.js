(function () {
  const FONT = '"Fredoka", "Trebuchet MS", "Segoe UI", Verdana, sans-serif';
  const CHIP = '"Nunito", "Trebuchet MS", Verdana, sans-serif';
  const PALETTE = ["#3d7eff", "#ff7a3c", "#1aaa6b", "#a259e6", "#e3527a"];
  const LEVELS = [
    [0, "Le tableau", "", ""],
    [22, "Le tableau", "Deux écritures !", "Efface la version fausse."],
    [40, "La tour des verbes", "Les verbes !", "Regarde le temps et la personne."],
    [75, "Le pont des accents", "Plus vite !", "Les mots accélèrent un peu."],
    [130, "La rivière des sons", "Trois écritures !", "Efface les deux fautes."],
    [200, "Le château des homophones", "Encore un peu plus vite !", "Lis bien chaque mot."],
    [300, "L'orage des champions", "Champion !", "Tout va un peu plus vite."]
  ];
  const POWER_HINT = {
    loupe: "Voir les fautes : les mauvaises lettres deviennent rouges.",
    slow: "Moins vite : les mots tombent au ralenti.",
    shield: "+ 1 cœur : tu récupères une vie."
  };
  // Une phrase, un mot par bloc. cut = true : ce mot est en trop, il faut l'effacer.
  const PHRASES = [
    { text: "Il est grand", parts: [["Il", false], ["est", false], ["sont", true, "est"], ["grand", false]] },
    { text: "Elles sont grandes", parts: [["Elles", false], ["est", true, "sont"], ["sont", false], ["grandes", false]] },
    { text: "Les chats calmes", parts: [["Les", false], ["chats", false], ["calme", true, "calmes"], ["calmes", false]] },
    { text: "La fille contente", parts: [["La", false], ["fille", false], ["content", true, "contente"], ["contente", false]] },
    { text: "Les petits chats", parts: [["Les", false], ["petit", true, "petits"], ["petits", false], ["chats", false]] },
    { text: "Des chevaux noirs", parts: [["Des", false], ["chevals", true, "chevaux"], ["chevaux", false], ["noirs", false]] },
    { text: "Tu manges une pomme", parts: [["Tu", false], ["mange", true, "manges"], ["manges", false], ["une", false], ["pomme", false]] },
    { text: "Nous allons à l'école", parts: [["Nous", false], ["va", true, "allons"], ["allons", false], ["à", false], ["l'école", false]] },
    { text: "Le chat dort", parts: [["Le", false], ["chat", false], ["mangent", true, "dort"], ["dort", false]] },
    { text: "Les filles travaillent", parts: [["Les", false], ["filles", false], ["travaille", true, "travaillent"], ["travaillent", false]] },
    { text: "Mon chien aboie", parts: [["Mon", false], ["chiens", true, "chien"], ["chien", false], ["aboie", false]] },
    { text: "Une grande maison", parts: [["Une", false], ["grands", true, "grande"], ["grande", false], ["maison", false]] },
    { text: "Je vais au parc", parts: [["Je", false], ["allons", true, "vais"], ["vais", false], ["au", false], ["parc", false]] },
    { text: "Ces fleurs sont belles", parts: [["Ces", false], ["fleurs", false], ["est", true, "sont"], ["sont", false], ["belles", false]] },
    { text: "Le petit chat", parts: [["Le", false], ["la", true], ["petit", false], ["chat", false]] },
    { text: "Les enfants jouent", parts: [["Les", false], ["enfant", true, "enfants"], ["enfants", false], ["jouent", false]] },
    { text: "Les chats calmes", parts: [["Les", false], ["chat", true, "chats"], ["chats", false], ["calme", true, "calmes"], ["calmes", false]] },
    { text: "Il est grand", parts: [["Il", false], ["sont", true, "est"], ["est", false], ["grands", true, "grand"], ["grand", false]] }
  ];

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rand(arr.length)]; }

  function diffMask(shown, correct) {
    const mask = Array.from({ length: shown.length }, () => false);
    if (shown.length === correct.length) {
      for (let i = 0; i < shown.length; i++) if (shown[i] !== correct[i]) mask[i] = true;
      if (mask.some(Boolean)) return mask;
    }
    const dp = Array.from({ length: shown.length + 1 }, () => Array(correct.length + 1).fill(0));
    for (let i = shown.length - 1; i >= 0; i--) {
      for (let j = correct.length - 1; j >= 0; j--) {
        dp[i][j] = shown[i] === correct[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < shown.length && j < correct.length) {
      if (shown[i] === correct[j]) { i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { mask[i] = true; i++; }
      else j++;
    }
    while (i < shown.length) { mask[i] = true; i++; }
    return mask;
  }

  // Les lettres qu'on ne tire pas doivent épeler le mot juste.
  // Sinon « tournes » pour ils/elles laisse « tourne » et enseigne la mauvaise forme.
  function lettersKept(shown, mask) {
    let out = "";
    for (let i = 0; i < shown.length; i++) if (!mask[i]) out += shown[i];
    return out;
  }

  function create(opts) {
    const canvas = document.getElementById("cv");
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bank = (opts.entries && opts.entries.length) ? opts.entries : (window.WORD_BANK || []);
    const review = opts.mode === "review";
    const state = {
      running: false,
      paused: false,
      ended: false,
      cards: [],
      bullets: [],
      particles: [],
      floaters: [],
      hearts: 4,
      score: 0,
      combo: 0,
      bestCombo: 0,
      elapsed: 0,
      warmup: 0,
      groups: {},
      sentenceTold: false,
      letterTold: false,
      versionTold: false,
      spawnIn: 0.04,
      cooldown: 0,
      charges: { loupe: 0, slow: 0, shield: 0 },
      loupeT: 0,
      slowT: 0,
      hitSlow: 0,
      angle: -Math.PI / 2,
      pressing: false,
      levelName: LEVELS[0][1],
      levelIndex: 0,
      levelHold: 0,
      good: 0,
      bad: 0,
      errors: [],
      successes: [],
      recent: [],
      bonusTold: false,
      kick: 0,
      flash: 0,
      flashMax: 0.2,
      flashKind: "bad",
      waves: [],
      width: 300,
      height: 500,
      dockH: 118,
      topY: 120,
      beams: [],
      toastQueue: [],
      toastOn: false,
      cloudX: 0,
      aim: null
    };

    const onResize = () => resize();
    const onKey = (e) => {
      if (!state.running || state.paused || state.ended) return;
      if (e.key === "ArrowLeft" || e.key === "q" || e.key === "Q" || e.key === "a" || e.key === "A") {
        state.angle = Math.max(-Math.PI + 0.32, state.angle - 0.09);
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        state.angle = Math.min(-0.32, state.angle + 0.09);
        e.preventDefault();
      } else if (e.key === " " || e.key === "Enter") {
        shoot();
        e.preventDefault();
      }
    };
    const onDown = (e) => {
      if (!state.running || state.paused || state.ended) return;
      if (e.button !== undefined && e.button !== 0) return;
      state.pressing = true;
      aimEvent(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* Le doigt peut sortir de la zone. */ }
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!state.running || state.paused || state.ended) return;
      if (state.pressing || e.pointerType === "mouse") aimEvent(e);
    };
    const onUp = (e) => {
      if (!state.pressing) return;
      state.pressing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* Déjà relâché. */ }
      if (!state.running || state.paused || state.ended) return;
      if (e.target && e.target.closest && e.target.closest("button")) return;
      aimEvent(e);
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const x = e.clientX - rect.left;
      if (x >= 0 && x <= state.width && y >= 0 && y < state.height - state.dockH) shoot();
    };
    const onMenu = (e) => e.preventDefault();
    const onHide = () => { if (state.running && !state.ended) setPaused(true); };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.width = rect.width;
      state.height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(state.width * dpr));
      canvas.height = Math.max(1, Math.round(state.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.dockH = document.getElementById("dock").offsetHeight || 76;
      state.topY = 16;
      state.cards.forEach((card) => {
        card.baseX = Math.max(8, Math.min(state.width - card.w - 8, card.baseX));
      });
    }

    const ART = { sky: null, star: null };
    ["sky", "star"].forEach((name) => {
      const img = new Image();
      img.onload = () => { ART[name] = img; };
      img.src = "img/" + name + (name === "sky" ? ".jpg" : ".png") + "?v=4";
    });

    function cannonPos() {
      return { x: state.width / 2, y: state.height - state.dockH - 6 };
    }

    function barrelLength() {
      return Math.max(44, Math.min(56, state.width * 0.1));
    }

    function killLine() {
      return cannonPos().y - barrelLength() - 8;
    }

    function spawnTop() {
      return 18;
    }

    function muzzlePoint() {
      const pivot = cannonPos();
      const reach = barrelLength() * 0.92;
      return {
        x: pivot.x + Math.cos(state.angle) * reach,
        y: pivot.y + Math.sin(state.angle) * reach
      };
    }

    function aimEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pivot = cannonPos();
      const lo = -Math.PI + 0.32;
      const hi = -0.32;
      state.aim = {
        x: Math.max(18, Math.min(state.width - 18, x)),
        y: Math.max(18, Math.min(y, pivot.y - 28))
      };
      if (y >= pivot.y - 8) {
        state.angle = x < pivot.x ? lo : hi;
        return;
      }
      let a = Math.atan2(y - pivot.y, x - pivot.x);
      if (a > 0) a -= Math.PI * 2;
      state.angle = Math.max(lo, Math.min(hi, a));
    }

    function tier() {
      if (review) return 4;
      const bonus = state.elapsed < 75 ? 0 : state.elapsed < 150 ? 1 : state.elapsed < 240 ? 2 : 3;
      return Math.min(4, (opts.startTier || 1) + bonus);
    }

    function fallSeconds() {
      if (review) return 8.8;
      return Math.max(6.4, 9.8 - state.elapsed * 0.006);
    }

    function spawnGap() {
      if (review) return 2.2;
      return Math.max(1.45, 2.7 - state.elapsed * 0.0035);
    }

    function maxCards() {
      if (review) return 2;
      if (state.elapsed < 22) return 1;
      if (state.elapsed < 130) return 2;
      return 3;
    }

    function levelIndexAt(elapsed) {
      let index = 0;
      for (let i = 0; i < LEVELS.length; i++) if (elapsed >= LEVELS[i][0]) index = i;
      return index;
    }

    function showLevelUp(index) {
      const row = LEVELS[index];
      const box = document.getElementById("level-up");
      if (!box) return;
      document.getElementById("level-up-kicker").textContent = "Niveau " + (index + 1);
      document.getElementById("level-up-title").textContent = row[2];
      document.getElementById("level-up-sub").textContent = row[3];
      box.classList.remove("on");
      void box.offsetWidth;
      box.classList.add("on");
      state.levelHold = reduced ? 0.85 : 1.45;
      MimieAudio.level();
      clearTimeout(state.levelTimer);
      state.levelTimer = setTimeout(() => box.classList.remove("on"), reduced ? 900 : 1600);
    }

    function isVerb(entry) {
      return / · (présent|futur|imparfait|passé composé|impératif) · /.test(entry.g);
    }

    function verbShare() {
      if (review) return 0;
      if (state.elapsed < 14) return 0.42;
      if (state.elapsed < 90) return 0.5;
      return 0.62;
    }

    function seenKey(entry) {
      return (entry.g || "") + "|" + entry.t;
    }

    function pickEntry() {
      if (Math.random() < verbShare()) {
        const most = Math.max(3, tier());
        const verbs = bank.filter((w) => isVerb(w) && w.d <= most && !state.recent.includes(seenKey(w)));
        if (verbs.length) return pick(verbs);
      }
      let pool = bank.filter((w) => review || w.d <= tier());
      if (!pool.length) pool = bank.slice();
      const onScreen = new Set(state.cards.map((c) => c.correct));
      for (let n = 0; n < 12; n++) {
        const weights = pool.map((w) => (w.d === tier() ? 4 : isVerb(w) ? 3 : 1));
        let total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let entry = pool[0];
        for (let i = 0; i < pool.length; i++) {
          r -= weights[i];
          if (r <= 0) { entry = pool[i]; break; }
        }
        if (!onScreen.has(entry.t) && !state.recent.includes(seenKey(entry))) return entry;
      }
      return pick(pool);
    }

    function wrap(text, maxW, font) {
      ctx.font = font;
      const words = String(text).split(" ");
      const lines = [];
      let line = "";
      words.forEach((word) => {
        const trial = line ? line + " " + word : word;
        if (line && ctx.measureText(trial).width > maxW) {
          lines.push(line);
          line = word;
        } else line = trial;
      });
      if (line) lines.push(line);
      return lines.slice(0, 3);
    }

    function measureCard(entry, shown, compact, withChip) {
      const maxW = compact
        ? Math.max(72, Math.min(state.width * 0.48, 240))
        : Math.max(120, state.width - 28);
      let wordSize = compact ? (state.width < 520 ? 22 : 26) : (state.width < 520 ? 30 : 36);
      ctx.font = "700 " + wordSize + "px " + FONT;
      while (wordSize > (compact ? 15 : 20) && ctx.measureText(shown).width > maxW - 32) {
        wordSize -= 1;
        ctx.font = "700 " + wordSize + "px " + FONT;
      }
      const chipSize = Math.max(13, Math.round(wordSize * 0.4));
      const chipFont = "800 " + chipSize + "px " + CHIP;
      const wordW = ctx.measureText(shown).width;
      const lines = [];
      let chipW = 0;
      if (withChip !== false && entry.g) {
        ctx.font = chipFont;
        wrap(entry.g, Math.min(maxW - 36, Math.max(wordW, 80)), chipFont).forEach((line) => {
          lines.push(line);
          chipW = Math.max(chipW, ctx.measureText(line).width);
        });
      }
      const w = Math.max(compact ? 64 : 112, Math.ceil(Math.max(wordW, chipW) + (compact ? 28 : 36)));
      const h = lines.length
        ? Math.max(88, 16 + lines.length * (chipSize + 6) + wordSize + 22)
        : Math.max(72, wordSize + 36);
      return { w: Math.min(w, maxW), h: h, wordSize: wordSize, chipSize: chipSize, lines: lines };
    }

    function makeCard(entry, isWrong, color, shape, bonus, compact, withChip) {
      const shown = isWrong ? pick(entry.b) : entry.t;
      const box = measureCard(entry, shown, compact, withChip);
      return {
        shown: shown,
        correct: entry.t,
        chip: entry.g,
        clue: entry.g.includes("___"),
        isWrong: isWrong,
        color: color,
        shape: shape,
        bonus: bonus,
        w: box.w,
        h: box.h,
        wordSize: box.wordSize,
        chipSize: box.chipSize,
        lines: box.lines,
        mask: isWrong ? diffMask(shown, entry.t) : null,
        baseX: 0,
        y: -box.h - 8,
        phase: Math.random() * 6,
        pair: 0
      };
    }

    function spawnSentence() {
      const maxParts = state.width < 420 ? 5 : 6;
      const pool = PHRASES.filter((phrase) => phrase.parts.length <= maxParts);
      if (!pool.length) return false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const phrase = pick(pool);
        const group = "p" + (state.sentenceSeq || 0);
        const cards = phrase.parts.map((part, index) => {
          const text = part[0];
          const cut = part[1];
          const fix = part[2] || phrase.text;
          const entry = { t: cut ? phrase.text : text, b: [text], g: "phrase" };
          const card = makeCard(entry, cut, PALETTE[index % PALETTE.length], index % 4, false, true, false);
          card.group = group;
          card.pair = 1;
          card.kind = "phrase";
          card.hint = cut ? fix : text;
          card.mask = cut ? diffMask(text, fix) : null;
          card.w = Math.max(48, Math.min(card.w, 110));
          card.h = Math.max(52, Math.min(card.h, 64));
          return card;
        });
        const y = spawnTop();
        if (!placeRow(cards, y, 6)) {
          cards.forEach((card) => { card.w = Math.max(44, card.w * 0.84); });
          if (!placeRow(cards, y, 4)) continue;
        }
        state.sentenceSeq = (state.sentenceSeq || 0) + 1;
        state.groups[group] = { text: phrase.text, label: "phrase", left: cards.length, failed: false, kind: "phrase" };
        state.cards.push(...cards);
        if (!state.sentenceTold) {
          state.sentenceTold = true;
          toast("Phrase mot par mot : efface seulement le mot en trop.");
        }
        return true;
      }
      return false;
    }

    function placeRow(cards, y, gap) {
      const space = gap == null ? 8 : gap;
      const total = cards.reduce((sum, card) => sum + card.w, 0) + space * (cards.length - 1);
      if (total + 16 > state.width) return false;
      let x = (state.width - total) / 2;
      cards.forEach((card) => {
        card.baseX = x;
        card.y = y;
        card.pair = 1;
        x += card.w + space;
      });
      return true;
    }

    function visibleFault(entry) {
      if (!entry.t || entry.t.includes(" ")) return null;
      const options = [];
      (entry.b || []).forEach((shown) => {
        if (!shown || shown === entry.t || shown.includes(" ")) return;
        const mask = diffMask(shown, entry.t);
        if (!mask.some(Boolean)) return;
        if (lettersKept(shown, mask) !== entry.t) return;
        options.push({ shown: shown, mask: mask });
      });
      return options.length ? pick(options) : null;
    }

    function isSubsequence(small, big) {
      let i = 0;
      for (const ch of big) if (i < small.length && ch === small[i]) i++;
      return i === small.length;
    }

    // Dans « pappa », les deux p de « pp » sont de bonnes cibles : on regarde si
    // le mot juste reste écrivable une fois la lettre enlevée.
    function refreshLetters(groupKey) {
      const tiles = state.cards
        .filter((card) => card.group === groupKey && !card.dead && card.kind === "letter")
        .sort((a, b) => a.baseX - b.baseX);
      if (!tiles.length) return "";
      const rest = tiles.map((tile) => tile.shown).join("");
      const correct = tiles[0].correct;
      if (rest.length > correct.length && isSubsequence(correct, rest)) {
        tiles.forEach((tile, index) => {
          const without = rest.slice(0, index) + rest.slice(index + 1);
          tile.isWrong = isSubsequence(correct, without);
          tile.mask = tile.isWrong ? [true] : null;
        });
      }
      return rest;
    }

    function spawnLetters(given) {
      for (let n = 0; n < 12; n++) {
        const entry = given && n === 0 ? given : pickEntry();
        const fault = visibleFault(entry);
        if (!fault) continue;
        const letters = Array.from(fault.shown);
        const gap = 5;
        const tile = Math.floor((state.width - 20 - gap * (letters.length - 1)) / letters.length);
        if (tile < 32 || letters.length < 2) continue;
        const size = Math.min(68, tile);
        const group = "l" + (state.sentenceSeq || 0);
        const color = pick(PALETTE);
        const cards = letters.map((ch, index) => ({
          shown: ch,
          fault: fault.shown,
          correct: entry.t,
          chip: entry.g,
          clue: false,
          isWrong: !!fault.mask[index],
          color: color,
          shape: 0,
          bonus: false,
          w: size,
          h: size,
          wordSize: Math.round(size * 0.52),
          chipSize: 13,
          lines: [],
          kind: "letter",
          mask: fault.mask[index] ? [true] : null,
          hint: entry.t,
          baseX: 0,
          y: -size - 20,
          phase: 0,
          pair: 1,
          group: group
        }));
        if (!placeRow(cards, spawnTop(), gap)) continue;
        state.sentenceSeq = (state.sentenceSeq || 0) + 1;
        state.groups[group] = { text: entry.t, label: entry.g, left: cards.length, failed: false, kind: "lettres" };
        state.cards.push(...cards);
        refreshLetters(group);
        state.recent.push(seenKey(entry));
        if (state.recent.length > 8) state.recent.shift();
        if (!state.letterTold) {
          state.letterTold = true;
          toast("Tire sur la lettre en trop. S'il y a pp, un des deux p suffit.");
        }
        return true;
      }
      return false;
    }

    function spawnVersions(given) {
      const wantThree = maxCards() >= 3 && Math.random() < 0.5;
      for (let n = 0; n < 10; n++) {
        const entry = given && n === 0 ? given : pickEntry();
        const wrongs = (entry.b || []).filter((word) => word && word !== entry.t);
        if (!wrongs.length) continue;
        const take = wantThree && wrongs.length >= 2 ? 2 : 1;
        const picked = [];
        const pool = wrongs.slice();
        while (picked.length < take && pool.length) picked.push(pool.splice(rand(pool.length), 1)[0]);
        const specs = [{ text: entry.t, wrong: false }];
        picked.forEach((text) => specs.push({ text: text, wrong: true }));
        for (let i = specs.length - 1; i > 0; i--) {
          const j = rand(i + 1);
          const swap = specs[i];
          specs[i] = specs[j];
          specs[j] = swap;
        }
        const group = "v" + (state.sentenceSeq || 0);
        const cards = specs.map((spec, index) => {
          const card = makeCard(
            { t: entry.t, b: [spec.text], g: entry.g },
            spec.wrong,
            PALETTE[index % PALETTE.length],
            index % 4,
            false,
            true,
            false
          );
          card.group = group;
          card.hint = entry.t;
          card.kind = "version";
          return card;
        });
        if (!placeRow(cards, spawnTop(), 10)) continue;
        state.sentenceSeq = (state.sentenceSeq || 0) + 1;
        state.groups[group] = { text: entry.t, label: entry.g, left: cards.length, failed: false, kind: "versions" };
        state.cards.push(...cards);
        state.recent.push(seenKey(entry));
        if (state.recent.length > 8) state.recent.shift();
        if (!state.versionTold) {
          state.versionTold = true;
          toast(specs.length > 2 ? "Trois écritures : efface les deux fautes." : "Deux écritures : efface la faute.");
        }
        return true;
      }
      return false;
    }

    function spawn() {
      if (state.cards.length || !bank.length) return;
      const entry = pickEntry();
      if (isVerb(entry)) {
        if (spawnVersions(entry) || spawnLetters(entry)) return;
      }
      const roll = Math.random();
      const phraseAt = Math.min(0.2, 0.1 + state.elapsed * 0.0004);
      const versionAt = state.elapsed < 12 ? 0.1 : Math.min(0.38, 0.14 + state.elapsed * 0.0007);
      if (roll < phraseAt && spawnSentence()) return;
      if (roll < phraseAt + versionAt && spawnVersions(entry)) return;
      if (!spawnLetters(entry)) spawnVersions(entry);
    }

    function pointsFor(base, bonus) {
      const mult = 1 + Math.min(state.combo, 12) * 0.1;
      return Math.round(base * mult * (bonus ? 2 : 1));
    }

    function grantPower() {
      if (state.combo > 0 && state.combo % 4 === 0) {
        const names = ["loupe", "slow", "shield"];
        const name = names[(state.combo / 4 - 1) % 3];
        if (state.charges[name] < 3) {
          state.charges[name] += 1;
          toast(POWER_HINT[name]);
          const btn = document.querySelector('[data-power="' + name + '"]');
          if (btn) {
            btn.classList.add("pop");
            setTimeout(() => btn.classList.remove("pop"), 350);
          }
          MimieAudio.power();
        }
      }
    }

    function speak(text) {
      const live = document.getElementById("live");
      if (live) live.textContent = text;
    }

    function succeed(card, base) {
      state.good += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const gained = pointsFor(base, card.bonus);
      state.score += gained;
      state.successes.push({ g: card.chip, correct: card.correct });
      grantPower();
      burst(card, "#ffe38a", true);
      burst(card, "#ffffff", false);
      state.floaters.push({
        x: card.baseX + card.w / 2,
        y: card.y + card.h / 2,
        life: 0.7,
        max: 0.7,
        small: "BIEN !",
        big: card.hint || card.correct,
        strike: false,
        color: "#128a52",
        points: "+" + gained,
        boom: true
      });
      speak("Faute effacée. " + (card.hint || card.correct));
      MimieAudio.ok();
      updateHud();
    }

    function fail(card, kind) {
      state.bad += 1;
      state.combo = 0;
      state.hearts -= 1;
      state.kick = reduced ? 0 : 6;
      state.hitSlow = reduced ? 0 : 0.06;
      punchFlash("bad");
      state.errors.push({
        kind: kind,
        g: card.chip,
        correct: card.correct,
        shown: card.fault || card.shown
      });
      burst(card, "#ff4d6a");
      const missed = kind === "faute-passee";
      const letter = card.kind === "letter";
      state.floaters.push({
        x: card.baseX + card.w / 2,
        y: Math.min(card.y, state.height - state.dockH - 70),
        life: 1.45,
        max: 1.45,
        small: missed
          ? (letter ? "Cette lettre était fausse" : "La faute s'écrit")
          : (letter ? "Cette lettre était juste" : "C'était juste"),
        big: card.hint || card.correct,
        strike: false,
        color: "#c4374a",
        points: ""
      });
      const said = letter
        ? (missed ? "Lettre fausse passée. On écrit " : "Oups, cette lettre était juste. ")
        : (missed ? "Faute passée. On écrit " : "Oups, c'était juste. ");
      speak(said + (card.hint || card.correct));
      MimieAudio.bad();
      updateHud();
      if (state.hearts <= 0) end("over");
    }

    function livingGroup(card) {
      if (!card.group) return [];
      return state.cards.filter((other) => other.group === card.group && !other.dead);
    }

    function wipeGroup(card) {
      livingGroup(card).forEach((other) => { other.dead = true; });
      card.dead = true;
    }

    function finishGroup(card, failed) {
      const group = card.group && state.groups[card.group];
      if (group) {
        if (group.done) return;
        group.done = true;
        group.failed = !!failed;
        group.left = 0;
        if (!failed) {
          const line = group.kind === "lettres"
            ? "Bien vu : "
            : group.kind === "versions"
              ? "La bonne écriture : "
              : "Phrase juste : ";
          toast(line + group.text);
        }
      }
      state.spawnIn = 0.34;
    }

    function punchFlash(kind) {
      state.flashKind = kind;
      state.flashMax = reduced ? 0.12 : 0.2;
      state.flash = state.flashMax;
    }

    function resolveShot(card) {
      if (card.dead || state.ended) return;
      const wasWrong = card.isWrong;
      card.dead = true;
      if (card.kind === "letter") {
        if (!wasWrong) {
          fail(card, "tire-juste");
          wipeGroup(card);
          finishGroup(card, true);
          return;
        }
        succeed(card, 100);
        const rest = refreshLetters(card.group);
        if (!rest || rest === card.correct || !livingGroup(card).some((other) => other.isWrong)) {
          wipeGroup(card);
          finishGroup(card, false);
        }
        return;
      }
      if (wasWrong) {
        const moreFaults = livingGroup(card).some((other) => other.isWrong);
        succeed(card, 100);
        if (!moreFaults) {
          wipeGroup(card);
          finishGroup(card, false);
        }
      } else {
        fail(card, "tire-juste");
        wipeGroup(card);
        finishGroup(card, true);
      }
    }

    function resolveLanding(card) {
      if (card.dead || state.ended) return;
      const group = card.group && state.groups[card.group];
      if (group && group.done) {
        card.dead = true;
        return;
      }
      const mates = livingGroup(card);
      if (!mates.some((other) => other.isWrong)) {
        card.dead = true;
        wipeGroup(card);
        return;
      }
      const fault = mates.find((other) => other.isWrong) || card;
      fault.dead = true;
      fail(fault, "faute-passee");
      wipeGroup(card);
      finishGroup(card, true);
    }

    function burst(card, color, big) {
      const x = card.baseX + card.w / 2;
      const y = card.y + card.h / 2;
      if (big) {
        state.waves.push({ x: x, y: y, life: 0.26, max: 0.26 });
        state.kick = reduced ? 0 : 10;
        state.hitSlow = reduced ? 0 : 0.08;
        punchFlash("good");
      }
      if (reduced) return;
      const count = big ? 24 : 10;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (big ? 80 : 36) + Math.random() * (big ? 180 : 100);
        state.particles.push({
          x: x,
          y: y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - (big ? 40 : 20),
          life: 0.28 + Math.random() * 0.12,
          color: color,
          r: (big ? 3 : 2) + Math.random() * (big ? 4 : 3)
        });
      }
    }

    function cardUnderPoint(x, y) {
      if (x == null || y == null) return null;
      const pad = 14;
      for (let i = state.cards.length - 1; i >= 0; i--) {
        const card = state.cards[i];
        if (card.dead) continue;
        if (x >= card.x - pad && x <= card.x + card.w + pad && y >= card.y - pad && y <= card.y + card.h + pad) return card;
      }
      return null;
    }

    function rayMeetsCard(ox, oy, dx, dy, card, maxT) {
      const minX = card.x;
      const minY = card.y;
      const maxX = card.x + card.w;
      const maxY = card.y + card.h;
      let tmin = 0;
      let tmax = maxT;
      const axes = [[dx, ox, minX, maxX], [dy, oy, minY, maxY]];
      for (let i = 0; i < axes.length; i++) {
        const d = axes[i][0];
        const o = axes[i][1];
        const lo = axes[i][2];
        const hi = axes[i][3];
        if (Math.abs(d) < 1e-6) {
          if (o < lo || o > hi) return false;
          continue;
        }
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) {
          const swap = t1;
          t1 = t2;
          t2 = swap;
        }
        if (t1 > tmin) tmin = t1;
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return false;
      }
      return tmax >= 0 && tmin <= maxT;
    }

    function shotTarget() {
      if (!state.aim) return null;
      const direct = cardUnderPoint(state.aim.x, state.aim.y);
      if (direct) return direct;
      const pivot = cannonPos();
      const dx = state.aim.x - pivot.x;
      const dy = state.aim.y - pivot.y;
      const len = Math.hypot(dx, dy);
      if (len < 8) return null;
      const dirx = dx / len;
      const diry = dy / len;
      let best = null;
      let bestD = 90;
      state.cards.forEach((card) => {
        if (card.dead || card.x == null) return;
        if (!rayMeetsCard(pivot.x, pivot.y, dirx, diry, card, len + 36)) return;
        const cx = card.x + card.w / 2;
        const cy = card.y + card.h / 2;
        const d = Math.hypot(cx - state.aim.x, cy - state.aim.y);
        if (d < bestD) {
          best = card;
          bestD = d;
        }
      });
      return best;
    }

    function shoot() {
      if (!state.running || state.paused || state.ended || state.cooldown > 0) return;
      state.cooldown = 0.3;
      const target = shotTarget();
      const pivot = cannonPos();
      let angle = state.angle;
      if (target && target.x != null) {
        const cx = target.x + target.w / 2;
        const cy = target.y + target.h / 2;
        let a = Math.atan2(cy - pivot.y, cx - pivot.x);
        if (a > 0) a -= Math.PI * 2;
        angle = Math.max(-Math.PI + 0.32, Math.min(-0.32, a));
        state.angle = angle;
      }
      const muzzle = muzzlePoint();
      const reach = target && target.x != null
        ? { x: target.x + target.w / 2, y: target.y + target.h / 2 }
        : { x: muzzle.x + Math.cos(angle) * 420, y: muzzle.y + Math.sin(angle) * 420 };
      state.beams.push({
        x0: muzzle.x,
        y0: muzzle.y,
        x1: reach.x,
        y1: reach.y,
        life: 0.18,
        max: 0.18
      });
      state.bullets.push({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(angle) * 1400,
        vy: Math.sin(angle) * 1400,
        life: 1.1,
        target: target
      });
      MimieAudio.shoot();
      if (navigator.vibrate) navigator.vibrate(8);
    }

    function usePower(name) {
      if (!state.running || state.paused || state.charges[name] <= 0) {
        if (state.charges[name] <= 0) toast(POWER_HINT[name] + " Gagne une série de 4.");
        return;
      }
      state.charges[name] -= 1;
      if (name === "loupe") {
        state.loupeT = 8;
        toast(POWER_HINT.loupe);
      } else if (name === "slow") {
        state.slowT = 6;
        toast(POWER_HINT.slow);
      } else if (name === "shield") {
        if (state.hearts < 4) {
          state.hearts += 1;
          toast("Un cœur en plus !");
        } else {
          state.score += 150;
          toast("Cœurs au maximum : +150");
        }
      }
      MimieAudio.power();
      updateHud();
    }

    function toast(msg) {
      state.toastQueue.push(msg);
      if (state.toastQueue.length > 3) state.toastQueue.shift();
      pumpToast();
    }

    function pumpToast() {
      if (state.toastOn || !state.toastQueue.length) return;
      state.toastOn = true;
      const el = document.getElementById("toast");
      el.textContent = state.toastQueue.shift();
      el.classList.add("show");
      setTimeout(() => {
        el.classList.remove("show");
        state.toastOn = false;
        setTimeout(pumpToast, 90);
      }, 1500);
    }

    function updateHud() {
      const hearts = document.getElementById("hearts");
      hearts.replaceChildren();
      for (let i = 0; i < 4; i++) {
        const s = document.createElement("span");
        s.className = i < state.hearts ? "heart on" : "heart";
        s.textContent = "♥";
        hearts.appendChild(s);
      }
      document.getElementById("score").textContent = String(state.score);
      document.getElementById("combo").textContent = state.combo >= 2 ? "Série " + state.combo : "";
      document.getElementById("level-name").textContent = review ? "Entraînement" : state.levelName;
      ["loupe", "slow", "shield"].forEach((name) => {
        const btn = document.querySelector('[data-power="' + name + '"]');
        if (!btn) return;
        btn.querySelector(".count").textContent = String(state.charges[name]);
        btn.disabled = state.charges[name] <= 0;
      });
    }

    function end(reason) {
      if (state.ended) return;
      state.ended = true;
      state.running = false;
      destroy();
      opts.onEnd({
        reason: reason,
        mode: opts.mode,
        score: state.score,
        combo: state.bestCombo,
        elapsed: state.elapsed,
        good: state.good,
        bad: state.bad,
        errors: state.errors,
        successes: state.successes
      });
    }

    function setPaused(value) {
      state.paused = value;
      document.getElementById("pause-layer").hidden = !value;
    }

    function update(raw) {
      const dt = Math.min(0.05, raw);
      state.cooldown = Math.max(0, state.cooldown - dt);
      state.loupeT = Math.max(0, state.loupeT - dt);
      state.slowT = Math.max(0, state.slowT - dt);
      state.hitSlow = Math.max(0, state.hitSlow - dt);
      state.kick = Math.max(0, state.kick - dt * 48);
      state.flash = Math.max(0, state.flash - dt);
      state.cloudX += dt * 8;
      if (state.paused) return;
      if (state.levelHold > 0) {
        state.levelHold -= dt;
        return;
      }
      state.elapsed += dt;
      const nextIndex = levelIndexAt(state.elapsed);
      if (!review && nextIndex !== state.levelIndex) {
        state.levelIndex = nextIndex;
        state.levelName = LEVELS[nextIndex][1];
        updateHud();
        if (nextIndex > 0) {
          showLevelUp(nextIndex);
          return;
        }
      }
      let gameDt = dt;
      if (state.slowT > 0) gameDt *= 0.45;
      if (state.hitSlow > 0) gameDt *= 0.35;
      if (state.warmup > 0) {
        state.warmup -= dt;
        return;
      }
      if (!state.cards.length) {
        state.spawnIn -= gameDt;
        if (state.spawnIn <= 0) {
          spawn();
          state.spawnIn = 0.6;
        }
      }
      const killY = killLine();
      const speed = Math.max(40, (killY - spawnTop()) / fallSeconds());
      state.cards.forEach((card) => {
        const wobble = card.pair || reduced ? 0 : Math.sin(state.elapsed * 1.5 + card.phase) * 6;
        card.x = card.baseX + wobble;
      });
      state.bullets.forEach((bullet) => {
        bullet.life -= dt;
        const aimed = bullet.target;
        if (aimed) {
          if (aimed.dead || aimed.x == null) {
            bullet.life = 0;
            return;
          }
          const cx = aimed.x + aimed.w / 2;
          const cy = aimed.y + aimed.h / 2;
          const dx = cx - bullet.x;
          const dy = cy - bullet.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 28) {
            bullet.life = 0;
            resolveShot(aimed);
            return;
          }
          const step = Math.min(dist, 1400 * dt);
          bullet.x += dx / dist * step;
          bullet.y += dy / dist * step;
          return;
        }
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        let chosen = null;
        let chosenD = Infinity;
        for (const card of state.cards) {
          if (card.dead || card.x == null) continue;
          const pad = 4;
          if (bullet.x < card.x - pad || bullet.x > card.x + card.w + pad || bullet.y < card.y - pad || bullet.y > card.y + card.h + pad) continue;
          const d = Math.hypot(bullet.x - (card.x + card.w / 2), bullet.y - (card.y + card.h / 2));
          if (d < chosenD) {
            chosen = card;
            chosenD = d;
          }
        }
        if (chosen) {
          bullet.life = 0;
          resolveShot(chosen);
        }
      });
      state.bullets = state.bullets.filter((b) => b.life > 0 && b.y > -20 && b.x > -20 && b.x < state.width + 20);
      state.cards.forEach((card) => {
        if (card.dead) return;
        card.y += speed * gameDt;
        if (card.y + card.h >= killY) resolveLanding(card);
      });
      state.cards = state.cards.filter((card) => !card.dead);
      state.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.life -= dt;
      });
      state.particles = state.particles.filter((p) => p.life > 0).slice(-120);
      state.waves.forEach((wave) => { wave.life -= dt; });
      state.waves = state.waves.filter((wave) => wave.life > 0);
      state.beams.forEach((beam) => { beam.life -= dt; });
      state.beams = state.beams.filter((beam) => beam.life > 0);
      state.floaters.forEach((f) => { f.y -= 36 * dt; f.life -= dt; });
      state.floaters = state.floaters.filter((f) => f.life > 0).slice(-4);
    }

    function drawBackground() {
      if (ART.sky) {
        const iw = ART.sky.width;
        const ih = ART.sky.height;
        const scale = Math.max(state.width / iw, state.height / ih);
        const w = iw * scale;
        const h = ih * scale;
        ctx.drawImage(ART.sky, (state.width - w) / 2, state.height - h, w, h);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, state.height);
        g.addColorStop(0, "#8fd4ff");
        g.addColorStop(0.55, "#fff4dc");
        g.addColorStop(1, "#8ed58a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, state.width, state.height);
      }
      if (state.slowT > 0) {
        ctx.fillStyle = "rgba(255, 214, 140, 0.16)";
        ctx.fillRect(0, 0, state.width, state.height);
      }
    }

    function drawShape(type, x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(x, y);
      if (type === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 1) {
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(7, 6);
        ctx.lineTo(-7, 6);
        ctx.fill();
      } else if (type === 2) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-5, -5, 10, 10);
      } else {
        ctx.fillRect(-6, -6, 12, 12);
      }
      ctx.restore();
    }

    function drawCard(card) {
      ctx.save();
      ctx.shadowColor = "rgba(36,48,68,.2)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      roundRect(ctx, card.x, card.y, card.w, card.h, 20);
      const fill = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.h);
      fill.addColorStop(0, "#ffffff");
      fill.addColorStop(1, card.bonus ? "#fff3d4" : "#fff8ef");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = card.color;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      roundRect(ctx, card.x + 3, card.y + 3, card.w - 6, card.h - 6, 17);
      ctx.stroke();
      if (card.kind === "letter") {
        ctx.fillStyle = state.loupeT > 0 && card.isWrong ? "#d7263d" : "#243044";
        ctx.font = "700 " + card.wordSize + "px " + FONT;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(card.shown, card.x + card.w / 2, card.y + card.h / 2 + 1);
        ctx.restore();
        return;
      }
      if (!card.lines.length) {
        ctx.fillStyle = state.loupeT > 0 && card.isWrong ? "#d7263d" : "#243044";
        ctx.font = "700 " + card.wordSize + "px " + FONT;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(card.shown, card.x + card.w / 2, card.y + card.h / 2 + 1);
        ctx.restore();
        return;
      }
      drawShape(card.shape, card.x + card.w - 16, card.y + 16, card.color);
      if (card.bonus) {
        ctx.fillStyle = "#e0a100";
        ctx.font = "700 14px " + FONT;
        ctx.textAlign = "left";
        ctx.fillText("×2", card.x + 12, card.y + 18);
      }
      const chipY = card.y + (card.bonus ? 26 : 12);
      const chipH = card.lines.length * (card.chipSize + 4) + 8;
      roundRect(ctx, card.x + 10, chipY, card.w - 20, chipH, 10);
      ctx.fillStyle = card.clue ? "#fff1c2" : "#e7f1ff";
      ctx.fill();
      ctx.fillStyle = card.clue ? "#6a4b00" : "#1d4e89";
      ctx.font = "800 " + card.chipSize + "px " + CHIP;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      card.lines.forEach((line, index) => {
        ctx.fillText(line, card.x + card.w / 2, chipY + 8 + card.chipSize / 2 + index * (card.chipSize + 4), card.w - 28);
      });
      const wordY = chipY + chipH + 8 + card.wordSize * 0.75;
      ctx.font = "700 " + card.wordSize + "px " + FONT;
      ctx.textBaseline = "alphabetic";
      if (state.loupeT > 0 && card.isWrong && card.mask) {
        const widths = [];
        let total = 0;
        for (const ch of card.shown) {
          const w = ctx.measureText(ch).width;
          widths.push(w);
          total += w;
        }
        let x = card.x + (card.w - total) / 2;
        for (let i = 0; i < card.shown.length; i++) {
          ctx.fillStyle = card.mask[i] ? "#d7263d" : "#243044";
          ctx.textAlign = "left";
          ctx.fillText(card.shown[i], x, wordY);
          x += widths[i];
        }
      } else {
        ctx.fillStyle = "#243044";
        ctx.textAlign = "center";
        ctx.fillText(card.shown, card.x + card.w / 2, wordY);
      }
      ctx.restore();
    }

    function drawCannon() {
      const pivot = cannonPos();
      const L = barrelLength();
      const thick = Math.max(13, L * 0.34);
      const ledgeW = Math.min(132, state.width * 0.34);
      const ledgeY = state.height - state.dockH + 4;

      ctx.save();
      ctx.fillStyle = "rgba(36, 48, 68, 0.16)";
      ctx.beginPath();
      ctx.ellipse(pivot.x, ledgeY + 4, ledgeW * 0.42, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const frame = ctx.createLinearGradient(pivot.x, ledgeY - 20, pivot.x, ledgeY + 10);
      frame.addColorStop(0, "#e4b57d");
      frame.addColorStop(1, "#8a5428");
      ctx.fillStyle = frame;
      ctx.strokeStyle = "#5c3516";
      ctx.lineWidth = 2;
      roundRect(ctx, pivot.x - ledgeW / 2, ledgeY - 18, ledgeW, 26, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2a4638";
      roundRect(ctx, pivot.x - ledgeW / 2 + 6, ledgeY - 13, ledgeW - 12, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(180, 220, 190, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(pivot.x, pivot.y);
      ctx.rotate(state.angle);
      const x0 = -L * 0.28;
      const x1 = L * 0.72;
      const r = Math.max(6, thick * 0.72);
      const body = ctx.createLinearGradient(0, -r, 0, r);
      body.addColorStop(0, "#fffef6");
      body.addColorStop(0.4, "#f4e7c2");
      body.addColorStop(1, "#d7c08a");
      ctx.fillStyle = body;
      ctx.strokeStyle = "#9a8158";
      ctx.lineWidth = 2;
      roundRect(ctx, x0, -r, x1 - x0, r * 2, r * 0.9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      roundRect(ctx, x0 + 3, -r + 2, x1 - x0 - 10, r * 0.55, 4);
      ctx.fill();
      ctx.fillStyle = "#fffdf4";
      ctx.beginPath();
      ctx.moveTo(x1 - 1, -r * 0.7);
      ctx.lineTo(x1 + r * 1.05, 0);
      ctx.lineTo(x1 - 1, r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c4ad7a";
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 252, 240, 0.7)";
      ctx.beginPath();
      ctx.arc(x1 + r * 0.25, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const muzzle = muzzlePoint();
      ctx.save();
      ctx.strokeStyle = "rgba(255, 252, 240, 0.9)";
      ctx.lineWidth = 3.5;
      ctx.setLineDash([5, 9]);
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(255, 255, 255, 0.65)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(muzzle.x, muzzle.y);
      ctx.lineTo(muzzle.x + Math.cos(state.angle) * 42, muzzle.y + Math.sin(state.angle) * 42);
      ctx.stroke();
      ctx.restore();
      if (state.aim) {
        const locked = cardUnderPoint(state.aim.x, state.aim.y);
        ctx.save();
        ctx.strokeStyle = locked ? "#ffc14d" : "#fffdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(36,48,68,.35)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(state.aim.x, state.aim.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ff6b4a";
        ctx.beginPath();
        ctx.arc(state.aim.x, state.aim.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawFloaters() {
      state.floaters.forEach((f) => {
        const alpha = Math.max(0, Math.min(1, f.life / 0.28));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        if (f.boom) {
          ctx.font = "700 26px " + FONT;
          ctx.fillStyle = "#128a52";
          ctx.fillText(f.small, f.x, f.y - 6);
          ctx.font = "700 " + (String(f.big).length > 14 ? 22 : 40) + "px " + FONT;
          ctx.fillStyle = f.color;
          ctx.fillText(f.big, f.x, f.y + 34);
          if (f.points) {
            ctx.font = "700 22px " + FONT;
            ctx.fillStyle = "#e07a00";
            ctx.fillText(f.points, f.x, f.y - 36);
          }
          ctx.restore();
          return;
        }
        ctx.font = "800 16px " + CHIP;
        ctx.fillStyle = "#5c6b82";
        if (f.strike) {
          const w = ctx.measureText(f.small).width;
          ctx.fillText(f.small, f.x, f.y);
          ctx.strokeStyle = "#5c6b82";
          ctx.beginPath();
          ctx.moveTo(f.x - w / 2, f.y - 5);
          ctx.lineTo(f.x + w / 2, f.y - 5);
          ctx.stroke();
        } else {
          ctx.fillText(f.small, f.x, f.y);
        }
        ctx.font = "700 " + (String(f.big).length > 16 ? 18 : 28) + "px " + FONT;
        ctx.fillStyle = f.color;
        ctx.fillText(f.big, f.x, f.y + 32);
        if (f.points) {
          ctx.font = "700 18px " + FONT;
          ctx.fillStyle = "#e07a00";
          ctx.fillText(f.points, f.x, f.y - 18);
        }
        ctx.restore();
      });
    }

    function drawPhraseLinks() {
      const groups = {};
      state.cards.forEach((card) => {
        if (!card.group || card.dead) return;
        if (!groups[card.group]) groups[card.group] = [];
        groups[card.group].push(card);
      });
      ctx.save();
      ctx.strokeStyle = "rgba(36, 48, 68, 0.28)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      Object.keys(groups).forEach((key) => {
        const list = groups[key];
        if (list.length < 2) return;
        list.sort((a, b) => a.baseX - b.baseX);
        const meta = state.groups[key];
        if (meta && meta.label) {
          const left = list[0].x;
          const right = list[list.length - 1].x + list[list.length - 1].w;
          const top = Math.min.apply(null, list.map((card) => card.y));
          ctx.fillStyle = "#1d4e89";
          ctx.font = "800 14px " + CHIP;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(meta.label, (left + right) / 2, top - 6, Math.max(40, right - left));
        }
        const y = list[0].y + list[0].h / 2;
        ctx.beginPath();
        ctx.moveTo(list[0].x + list[0].w - 4, y);
        for (let i = 1; i < list.length; i++) ctx.lineTo(list[i].x + 4, y);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawWarmup() {
      if (state.warmup <= 0) return;
      ctx.save();
      ctx.textAlign = "center";
      const boxW = Math.min(340, state.width - 24);
      const boxH = 120;
      const boxX = (state.width - boxW) / 2;
      const boxY = state.height * 0.28;
      ctx.fillStyle = "rgba(255,253,248,.92)";
      roundRect(ctx, boxX, boxY, boxW, boxH, 24);
      ctx.fill();
      ctx.fillStyle = "#243044";
      ctx.font = "700 " + (state.width < 380 ? 22 : 28) + "px " + FONT;
      ctx.fillText("Tire sur la faute", state.width / 2, boxY + 48);
      ctx.font = "800 16px " + CHIP;
      ctx.fillStyle = "#3d5678";
      ctx.fillText("Le mot répond tout de suite", state.width / 2, state.height * 0.28 + 82);
      ctx.restore();
    }

    function drawAll() {
      ctx.save();
      if (state.kick > 0) ctx.translate(0, state.kick * 0.35);
      drawBackground();
      drawPhraseLinks();
      state.cards.forEach(drawCard);
      state.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      state.beams.forEach((beam) => {
        const t = Math.max(0, beam.life / beam.max);
        ctx.save();
        ctx.strokeStyle = "rgba(255, 252, 240, " + (0.85 * t) + ")";
        ctx.lineWidth = 2 + 6 * t;
        ctx.lineCap = "round";
        ctx.setLineDash([5, 8]);
        ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(beam.x0, beam.y0);
        ctx.lineTo(beam.x1, beam.y1);
        ctx.stroke();
        ctx.restore();
      });
      state.bullets.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillStyle = "#fffdf6";
        ctx.strokeStyle = "rgba(138, 115, 80, 0.4)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, -11, -3.5, 20, 7, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      drawCannon();
      state.waves.forEach((wave) => {
        const t = 1 - wave.life / wave.max;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 252, 240, " + ((1 - t) * 0.8) + ")";
        ctx.lineWidth = 5 * (1 - t) + 1;
        ctx.arc(wave.x, wave.y, 16 + t * 72, 0, Math.PI * 2);
        ctx.stroke();
      });
      drawFloaters();
      drawWarmup();
      if (state.flash > 0) {
        const t = state.flash / (state.flashMax || 0.2);
        const peak = reduced ? 0.2 : (state.flashKind === "good" ? 0.62 : 0.5);
        ctx.fillStyle = state.flashKind === "good"
          ? "rgba(255, 255, 255, " + (t * peak) + ")"
          : "rgba(214, 42, 64, " + (t * peak) + ")";
        ctx.fillRect(0, 0, state.width, state.height);
      }
      ctx.restore();
    }

    function frame(now) {
      if (!state.running) return;
      const raw = state.last ? (now - state.last) / 1000 : 0.016;
      state.last = now;
      update(raw);
      drawAll();
      if (state.running) requestAnimationFrame(frame);
    }

    function destroy() {
      state.running = false;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("contextmenu", onMenu);
      document.getElementById("pause-layer").hidden = true;
      const levelUp = document.getElementById("level-up");
      if (levelUp) levelUp.classList.remove("on");
      clearTimeout(state.levelTimer);
    }

    function begin() {
      resize();
      updateHud();
      state.running = true;
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("contextmenu", onMenu);
      window.addEventListener("resize", onResize);
      window.addEventListener("keydown", onKey);
      document.addEventListener("visibilitychange", onHide);
      requestAnimationFrame(frame);
    }

    return {
      begin: begin,
      destroy: destroy,
      shoot: shoot,
      usePower: usePower,
      pause: () => setPaused(true),
      resume: () => setPaused(false),
      quit: () => end("quit")
    };
  }

  let current = null;
  window.MimieGame = {
    start(opts) {
      if (current) current.destroy();
      current = create(opts);
      current.begin();
      return current;
    },
    shoot() { if (current) current.shoot(); },
    usePower(name) { if (current) current.usePower(name); },
    pause() { if (current) current.pause(); },
    resume() { if (current) current.resume(); },
    quit() { if (current) current.quit(); }
  };
})();
