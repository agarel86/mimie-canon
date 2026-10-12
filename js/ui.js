(function () {
  const Store = window.MimieStore;
  const Audio = window.MimieAudio;
  const QUIPS = [
    "Lis le mot jusqu'au bout.",
    "La couleur aide à distinguer, pas à tricher.",
    "Série de 4 : voir les fautes, ralentir, ou un cœur.",
    "Le carnet garde les fautes à revoir.",
    "Les étiquettes disent le temps et la personne."
  ];
  const SLIDES = [
    {
      text: "Un seul mot tombe, découpé en lettres. Tire sur la lettre en trop. S'il y a pp, comme dans pappa, un des deux p suffit.",
      cards: [
        { chip: "nom", word: "c", cls: "" },
        { chip: "nom", word: "h", cls: "" },
        { chip: "nom", word: "a", cls: "bad" },
        { chip: "nom", word: "t", cls: "" }
      ]
    },
    {
      text: "Vise avec la souris ou le doigt. Un clic ou un appui tire. Le gros bouton Tirer fait la même chose.",
      cards: [{ chip: "nom", word: "a", cls: "bad" }]
    },
    {
      text: "Juste : l'écran blanchit, un grand BIEN !, et le mot part. Faux : l'écran rougit, et le mot part aussi.",
      cards: [{ chip: "nom", word: "t", cls: "good" }]
    },
    {
      text: "Parfois deux ou trois écritures du même mot. Efface la faute, ou les deux fautes. La couleur ne dit pas laquelle.",
      cards: [
        { chip: "nom", word: "chateau", cls: "bad" },
        { chip: "nom", word: "château", cls: "good" }
      ]
    },
    {
      text: "L'étiquette au-dessus dit ce que c'est. Pour un verbe, tu vois le temps et la personne : il faut la bonne terminaison.",
      cards: [{ chip: "tourner · présent · ils/elles", word: "tournent", cls: "good" }]
    },
    {
      text: "Parfois une phrase tombe mot par mot. Exemple : Il · est · sont · grand. Efface seulement le mot en trop.",
      cards: [
        { chip: "phrase", word: "Il", cls: "good" },
        { chip: "phrase", word: "est", cls: "good" },
        { chip: "phrase", word: "sont", cls: "bad" },
        { chip: "phrase", word: "grand", cls: "good" }
      ]
    },
    {
      text: "Après 4 réussites d'affilée : Voir fautes met les lettres pièges en rouge. Moins vite ralentit les mots. + 1 cœur rend une vie.",
      cards: [{ chip: "être · présent · tu", word: "es", cls: "" }]
    }
  ];

  let helpIndex = 0;
  let helpThenPlay = false;
  let loginKey = null;
  let mathAnswer = 0;
  let lastMode = "play";

  const $ = (id) => document.getElementById(id);

  function show(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("on", screen.id === id);
    });
    document.body.classList.toggle("playing", id === "screen-game");
  }

  function owl() {
    const img = document.createElement("img");
    img.src = "img/owl.png";
    img.alt = "";
    img.className = "owl";
    return img;
  }

  function mountOwls() {
    ["owl-auth", "owl-home", "owl-help", "owl-over"].forEach((id) => {
      const host = $(id);
      if (host) host.replaceChildren(owl());
    });
  }

  function setMsg(id, text) {
    $(id).textContent = text || "";
  }

  function renderPlayers() {
    const list = $("player-list");
    list.replaceChildren();
    const players = Store.list();
    if (!players.length) {
      $("auth-picker").hidden = true;
      $("auth-signup").hidden = false;
      return;
    }
    $("auth-picker").hidden = false;
    $("auth-signup").hidden = true;
    $("auth-login").hidden = true;
    $("auth-forgot").hidden = true;
    players.forEach((player) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "player";
      const avatar = document.createElement("span");
      avatar.className = "avatar";
      avatar.style.background = player.color;
      avatar.textContent = player.name.trim().charAt(0).toUpperCase();
      const name = document.createElement("span");
      name.textContent = player.name;
      btn.append(avatar, name);
      btn.addEventListener("click", () => openLogin(player));
      list.appendChild(btn);
    });
  }

  function openLogin(player) {
    loginKey = player.key;
    $("login-title").textContent = "Salut " + player.name;
    $("login-pin").value = "";
    setMsg("login-msg", "");
    $("auth-picker").hidden = true;
    $("auth-login").hidden = false;
    $("login-pin").focus();
  }

  function showPicker() {
    $("auth-login").hidden = true;
    $("auth-signup").hidden = true;
    $("auth-forgot").hidden = true;
    renderPlayers();
  }

  function renderHome() {
    const user = Store.current();
    if (!user) { showAuth(); return; }
    $("home-hello").textContent = "Salut " + user.name + " !";
    $("home-quip").textContent = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    $("home-best").textContent = String(user.bestScore || 0);
    $("home-combo").textContent = String(user.bestCombo || 0);
    const sure = Store.masteryCount(user);
    $("home-mastery").textContent = String(sure);
    const daily = user.daily ? user.daily.good : 0;
    const goal = Store.DAILY_GOAL;
    $("home-daily").textContent = Math.min(daily, goal) + " / " + goal + (daily >= goal ? "  réussi !" : "");
    $("home-daily-bar").style.width = Math.min(100, (daily / goal) * 100) + "%";
    const faults = Object.keys(user.errors || {}).length;
    $("btn-review").hidden = faults === 0;
    $("btn-review").textContent = "Réviser mes fautes (" + faults + ")";
    show("screen-home");
  }

  function showAuth() {
    show("screen-auth");
    showPicker();
  }

  function renderHelp() {
    const slide = SLIDES[helpIndex];
    const host = $("help-slide");
    host.replaceChildren();
    const row = document.createElement("div");
    row.className = slide.cards.length > 1 ? "demo-row" : "";
    slide.cards.forEach((card) => {
      const el = document.createElement("div");
      el.className = "demo-card " + (card.cls || "");
      const chip = document.createElement("span");
      chip.className = "chip" + (card.clue ? " clue" : "");
      chip.textContent = card.chip;
      const word = document.createElement("strong");
      word.textContent = card.word;
      el.append(chip, word);
      row.appendChild(el);
    });
    const text = document.createElement("p");
    text.className = "help-text";
    text.textContent = slide.text;
    host.append(row, text);
    const dots = $("help-dots");
    dots.replaceChildren();
    SLIDES.forEach((_, i) => {
      const dot = document.createElement("i");
      if (i === helpIndex) dot.className = "on";
      dots.appendChild(dot);
    });
    const last = helpIndex === SLIDES.length - 1;
    $("btn-help-next").textContent = last ? (helpThenPlay ? "C'est parti !" : "Jouer") : "Suivant";
    show("screen-help");
  }

  function finishHelp(play) {
    Store.markTutorial();
    if (play) startGame("play");
    else renderHome();
  }

  function kindLabel(kind) {
    return kind === "tire-juste" ? "Tu as effacé un mot juste" : "Tu as laissé passer la faute";
  }

  function faultCard(ev) {
    const el = document.createElement("article");
    el.className = "fault";
    const word = document.createElement("div");
    word.className = "word";
    if (ev.shown && ev.shown !== ev.correct) {
      const wrong = document.createElement("span");
      wrong.className = "wrong";
      wrong.textContent = ev.shown;
      const right = document.createElement("span");
      right.className = "right";
      right.textContent = ev.correct;
      word.append(wrong, document.createTextNode(" → "), right);
    } else {
      const right = document.createElement("span");
      right.className = "right";
      right.textContent = ev.correct;
      word.appendChild(right);
    }
    const meta = document.createElement("div");
    meta.className = "meta";
    const times = ev.count ? " · " + ev.count + " fois" : "";
    meta.textContent = ev.g + " · " + kindLabel(ev.kind) + times;
    el.append(word, meta);
    return el;
  }

  function renderJournal() {
    const user = Store.current();
    const host = $("journal-list");
    host.replaceChildren();
    const rows = Object.values(user.errors || {});
    rows.sort((a, b) => b.count - a.count || b.last - a.last);
    if (!rows.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Aucune faute pour l'instant. Bravo !";
      host.appendChild(p);
      $("btn-review-2").hidden = true;
    } else {
      rows.slice(0, 40).forEach((row) => host.appendChild(faultCard(row)));
      $("btn-review-2").hidden = false;
    }
    show("screen-journal");
  }

  function starsFor(stats) {
    const total = stats.good + stats.bad;
    const accuracy = total ? stats.good / total : 0;
    let stars = 1;
    if (stats.score >= 700 && accuracy >= 0.55) stars = 2;
    if (stats.score >= 1600 && accuracy >= 0.72) stars = 3;
    if (total < 2) stars = 1;
    return stars;
  }

  function confetti() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const host = $("confetti");
    host.replaceChildren();
    const colors = ["#ff6b4a", "#ffc14d", "#3d7eff", "#1aaa6b", "#a259e6"];
    for (let i = 0; i < 36; i++) {
      const bit = document.createElement("i");
      bit.style.left = Math.random() * 100 + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 0.25) + "s";
      host.appendChild(bit);
    }
    setTimeout(() => host.replaceChildren(), 1600);
  }

  function renderOver(stats, saved) {
    const review = stats.mode === "review";
    const stars = starsFor(stats);
    $("over-title").textContent = review ? "Entraînement terminé" : (stats.good > stats.bad ? "Bravo !" : "Bien essayé !");
    const starHost = $("over-stars");
    starHost.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const s = document.createElement("span");
      s.className = i < stars ? "on" : "off";
      s.textContent = "★";
      starHost.appendChild(s);
    }
    $("over-score").textContent = String(stats.score);
    let detail = review
      ? "Tes fautes sont à jour. Le record de partie ne change pas."
      : "Record : " + (saved ? saved.best : 0);
    if (!review && saved && saved.record) detail = saved.first ? "Premier record !" : "Nouveau record !";
    if (!review && saved && saved.daily >= Store.DAILY_GOAL) detail += " Objectif du jour réussi.";
    $("over-detail").textContent = detail;
    const host = $("over-errors");
    host.replaceChildren();
    const unique = [];
    const seen = new Set();
    (stats.errors || []).forEach((ev) => {
      const id = ev.kind + ev.correct + ev.shown + ev.g;
      if (seen.has(id)) return;
      seen.add(id);
      unique.push(ev);
    });
    if (unique.length) {
      const title = document.createElement("p");
      title.className = "hint";
      title.textContent = "À retenir dans cette partie";
      host.appendChild(title);
      unique.slice(0, 6).forEach((ev) => host.appendChild(faultCard(ev)));
    }
    show("screen-over");
    if (!review && saved && saved.record) {
      try {
        confetti();
        Audio.fanfare();
      } catch (err) {
        /* Le son ne doit pas bloquer l'écran de fin. */
      }
    }
  }

  async function startGame(mode) {
    lastMode = mode;
    const user = Store.current();
    if (!user) { showAuth(); return; }
    if (mode === "review" && Store.reviewEntries().length === 0) {
      renderHome();
      return;
    }
    show("screen-game");
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);
    }
    Audio.ensure();
    window.MimieGame.start({
      mode: mode,
      entries: mode === "review" ? Store.reviewEntries() : null,
      startTier: Store.startTier(),
      onEnd(stats) {
        const saved = Store.commit(stats);
        renderOver(stats, saved);
      }
    });
  }

  function toggleSecret(input) {
    input.type = input.type === "password" ? "text" : "password";
  }

  function bind() {
    $("btn-new").addEventListener("click", () => {
      $("auth-picker").hidden = true;
      $("auth-signup").hidden = false;
      setMsg("signup-msg", "");
      $("signup-name").focus();
    });
    $("btn-back-login").addEventListener("click", showPicker);
    $("btn-back-signup").addEventListener("click", showPicker);
    $("btn-back-forgot").addEventListener("click", showPicker);
    $("btn-show-login").addEventListener("click", () => toggleSecret($("login-pin")));
    $("btn-show-signup").addEventListener("click", () => {
      toggleSecret($("signup-pin"));
      $("signup-pin2").type = $("signup-pin").type;
    });
    $("auth-login").addEventListener("submit", (e) => {
      e.preventDefault();
      const res = Store.login(loginKey, $("login-pin").value.trim());
      if (!res.ok) { setMsg("login-msg", res.msg); return; }
      Audio.ensure();
      const user = Store.current();
      if (!user.sawTutorial) {
        helpIndex = 0;
        helpThenPlay = true;
        renderHelp();
      } else renderHome();
    });
    $("auth-signup").addEventListener("submit", (e) => {
      e.preventDefault();
      const pin = $("signup-pin").value.trim();
      if (pin !== $("signup-pin2").value.trim()) {
        setMsg("signup-msg", "Les deux codes ne sont pas pareils.");
        return;
      }
      const res = Store.signup($("signup-name").value, pin);
      if (!res.ok) { setMsg("signup-msg", res.msg); return; }
      $("signup-name").value = "";
      $("signup-pin").value = "";
      $("signup-pin2").value = "";
      Audio.ensure();
      helpIndex = 0;
      helpThenPlay = true;
      renderHelp();
    });
    $("btn-forgot").addEventListener("click", () => {
      const a = 2 + Math.floor(Math.random() * 8);
      const b = 2 + Math.floor(Math.random() * 8);
      mathAnswer = a + b;
      $("forgot-math").textContent = "Combien font " + a + " + " + b + " ?";
      $("forgot-name").value = "";
      $("forgot-answer").value = "";
      $("forgot-pin").value = "";
      setMsg("forgot-msg", "");
      $("auth-login").hidden = true;
      $("auth-forgot").hidden = false;
    });
    $("auth-forgot").addEventListener("submit", (e) => {
      e.preventDefault();
      if (Number($("forgot-answer").value) !== mathAnswer) {
        setMsg("forgot-msg", "Ce n'est pas le bon résultat.");
        return;
      }
      const res = Store.resetPin($("forgot-name").value, $("forgot-pin").value.trim());
      if (!res.ok) { setMsg("forgot-msg", res.msg); return; }
      renderHome();
    });
    $("btn-play").addEventListener("click", () => {
      const user = Store.current();
      if (user && !user.sawTutorial) {
        helpIndex = 0;
        helpThenPlay = true;
        renderHelp();
        return;
      }
      startGame("play");
    });
    $("btn-review").addEventListener("click", () => startGame("review"));
    $("btn-review-2").addEventListener("click", () => startGame("review"));
    $("btn-journal").addEventListener("click", renderJournal);
    $("btn-journal-back").addEventListener("click", renderHome);
    $("btn-help").addEventListener("click", () => {
      helpIndex = 0;
      helpThenPlay = false;
      renderHelp();
    });
    $("btn-help-next").addEventListener("click", () => {
      if (helpIndex < SLIDES.length - 1) {
        helpIndex += 1;
        renderHelp();
      } else finishHelp(true);
    });
    $("btn-help-skip").addEventListener("click", () => finishHelp(false));
    $("btn-logout").addEventListener("click", () => {
      Store.logout();
      showAuth();
    });
    $("btn-pause").addEventListener("click", () => window.MimieGame.pause());
    $("btn-resume").addEventListener("click", () => window.MimieGame.resume());
    $("btn-quit").addEventListener("click", () => window.MimieGame.quit());
    $("btn-shoot").addEventListener("click", () => window.MimieGame.shoot());
    document.querySelectorAll(".power").forEach((btn) => {
      btn.addEventListener("click", () => window.MimieGame.usePower(btn.dataset.power));
    });
    $("btn-mute").addEventListener("click", () => {
      const settings = Store.settings();
      settings.muted = !settings.muted;
      Store.saveSettings(settings);
      Audio.muted = settings.muted;
      $("btn-mute").textContent = settings.muted ? "Muet" : "Son";
      if (!settings.muted) Audio.ensure();
    });
    $("btn-again").addEventListener("click", () => startGame(lastMode));
    $("btn-over-journal").addEventListener("click", renderJournal);
    $("btn-over-home").addEventListener("click", renderHome);
  }

  function boot() {
    mountOwls();
    if (!window.WORD_BANK || !window.WORD_BANK.length) {
      $("boot-error").hidden = false;
      return;
    }
    const settings = Store.settings();
    Audio.muted = !!settings.muted;
    $("btn-mute").textContent = Audio.muted ? "Muet" : "Son";
    bind();
    if (Store.current()) renderHome();
    else showAuth();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
