(function () {
  const KEY = "mimie-canon-v1";
  const SET = "mimie-canon-settings";
  const COLORS = ["#ff6b4a", "#3d7eff", "#1aaa6b", "#a259e6", "#e0a100", "#e3527a"];
  const DAILY_GOAL = 12;
  const SURE = 3;

  function empty() {
    return { version: 1, session: null, users: {} };
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (!data || !data.users) return empty();
      data.version = 1;
      return data;
    } catch (err) {
      return empty();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function keyOf(name) {
    return String(name || "").trim().toLocaleLowerCase("fr-FR");
  }

  function validName(name) {
    const n = String(name || "").trim();
    return n.length >= 2 && n.length <= 16 && /^[\p{L}][\p{L}\s'-]*$/u.test(n);
  }

  function colorFor(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function blankUser(name) {
    return {
      name: name.trim(),
      pin: "",
      color: colorFor(name),
      bestScore: 0,
      bestCombo: 0,
      games: 0,
      mastery: {},
      errors: {},
      daily: { day: today(), good: 0 },
      sawTutorial: false
    };
  }

  function current() {
    const data = load();
    if (!data.session || !data.users[data.session]) return null;
    const user = data.users[data.session];
    if (!user.daily || user.daily.day !== today()) user.daily = { day: today(), good: 0 };
    return user;
  }

  function writeCurrent(mutator) {
    const data = load();
    if (!data.session || !data.users[data.session]) return null;
    const user = data.users[data.session];
    mutator(user);
    save(data);
    return user;
  }

  function list() {
    const data = load();
    return Object.keys(data.users).map((key) => {
      const u = data.users[key];
      return { key: key, name: u.name, color: u.color };
    });
  }

  function signup(name, pin) {
    if (!validName(name)) return { ok: false, msg: "Écris ton prénom, avec des lettres." };
    if (!/^\d{4}$/.test(pin)) return { ok: false, msg: "Le code secret a 4 chiffres." };
    const data = load();
    const key = keyOf(name);
    if (data.users[key]) return { ok: false, msg: "Ce prénom a déjà un code. Connecte-toi." };
    const user = blankUser(name);
    user.pin = pin;
    data.users[key] = user;
    data.session = key;
    save(data);
    return { ok: true };
  }

  function login(key, pin) {
    const data = load();
    const user = data.users[key];
    if (!user || user.pin !== pin) return { ok: false, msg: "Ce code n’est pas le bon." };
    data.session = key;
    save(data);
    return { ok: true };
  }

  function logout() {
    const data = load();
    data.session = null;
    save(data);
  }

  function resetPin(name, pin) {
    if (!/^\d{4}$/.test(pin)) return { ok: false, msg: "Le nouveau code a 4 chiffres." };
    const data = load();
    const key = keyOf(name);
    if (!data.users[key]) return { ok: false, msg: "Je ne connais pas ce prénom." };
    data.users[key].pin = pin;
    data.session = key;
    save(data);
    return { ok: true };
  }

  function markTutorial() {
    writeCurrent((u) => { u.sawTutorial = true; });
  }

  function masteryCount(user) {
    return Object.values(user.mastery || {}).filter((n) => n >= SURE).length;
  }

  function startTier() {
    const user = current();
    if (!user) return 1;
    const n = masteryCount(user);
    if (n > 180) return 3;
    if (n > 60) return 2;
    return 1;
  }

  function reviewEntries() {
    const user = current();
    if (!user) return [];
    const bank = window.WORD_BANK || [];
    const out = [];
    Object.keys(user.errors).forEach((id) => {
      const e = user.errors[id];
      const fromBank = bank.find((w) => w.t === e.correct && w.g === e.g);
      let wrongs = [];
      if (e.shown && e.shown !== e.correct) wrongs = [e.shown];
      else if (fromBank) wrongs = fromBank.b.slice();
      wrongs = wrongs.filter((w) => w && w !== e.correct);
      if (!wrongs.length) return;
      out.push({ t: e.correct, b: wrongs, d: 1, g: e.g });
    });
    return out;
  }

  function commit(stats) {
    const data = load();
    const user = data.session ? data.users[data.session] : null;
    if (!user) return { record: false, best: 0, daily: 0 };
    if (!user.daily || user.daily.day !== today()) user.daily = { day: today(), good: 0 };
    const before = user.bestScore || 0;
    const record = stats.mode === "play" && stats.score > before && stats.score > 0;
    if (record) user.bestScore = stats.score;
    if ((stats.combo || 0) > (user.bestCombo || 0)) user.bestCombo = stats.combo;
    if (stats.mode === "play" && stats.elapsed > 2) user.games = (user.games || 0) + 1;

    const fixed = new Set((stats.successes || []).map((s) => s.g + "|" + s.correct));
    Object.keys(user.errors).forEach((id) => {
      const e = user.errors[id];
      if (fixed.has(e.g + "|" + e.correct)) {
        e.count -= 1;
        if (e.count <= 0) delete user.errors[id];
      }
    });
    (stats.errors || []).forEach((ev) => {
      if (fixed.has(ev.g + "|" + ev.correct)) return;
      const id = ev.kind + "|" + ev.g + "|" + ev.correct + "|" + ev.shown;
      if (!user.errors[id]) {
        user.errors[id] = {
          correct: ev.correct,
          shown: ev.shown,
          g: ev.g,
          kind: ev.kind,
          count: 0,
          last: Date.now()
        };
      }
      user.errors[id].count += 1;
      user.errors[id].last = Date.now();
    });
    const ids = Object.keys(user.errors);
    if (ids.length > 200) {
      ids.sort((a, b) => user.errors[a].count - user.errors[b].count);
      ids.slice(0, ids.length - 200).forEach((id) => delete user.errors[id]);
    }

    (stats.successes || []).forEach((ev) => {
      const id = ev.g + "|" + ev.correct;
      user.mastery[id] = (user.mastery[id] || 0) + 1;
    });
    user.daily.good += (stats.successes || []).length;
    save(data);
    return { record: record, best: user.bestScore, daily: user.daily.good, first: before === 0 && record };
  }

  function settings() {
    try {
      return JSON.parse(localStorage.getItem(SET)) || { muted: false };
    } catch (err) {
      return { muted: false };
    }
  }

  function saveSettings(s) {
    localStorage.setItem(SET, JSON.stringify(s));
  }

  window.MimieStore = {
    DAILY_GOAL: DAILY_GOAL,
    SURE: SURE,
    load: load,
    list: list,
    current: current,
    signup: signup,
    login: login,
    logout: logout,
    resetPin: resetPin,
    markTutorial: markTutorial,
    masteryCount: masteryCount,
    startTier: startTier,
    reviewEntries: reviewEntries,
    commit: commit,
    settings: settings,
    saveSettings: saveSettings,
    today: today
  };
})();
