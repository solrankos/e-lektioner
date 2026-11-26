(function () {
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function lev(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }

  function judge(input, key, pool) {
    const n = norm(input);
    let best = Infinity, winners = new Set(), hit = "";
    pool.forEach(p => p.names.forEach(v => {
      const d = lev(n, norm(v));
      if (d < best) { best = d; winners = new Set([p.key]); hit = v; }
      else if (d === best) winners.add(p.key);
    }));
    const len = norm(hit).length;
    const tol = len < 4 ? 0 : len <= 6 ? 1 : len <= 10 ? 2 : 3;
    const ok = winners.size === 1 && winners.has(key) && best <= tol;
    return { ok, exact: ok && best === 0, hit };
  }

  function start(cfg) {
    const root = cfg.el;
    root.classList.add("forhor");
    root.innerHTML = `
      <section data-v="home"></section>
      <section data-v="quiz" hidden>
        <div class="fh-bar"><span data-r="pos"></span><button class="fh-link" data-r="pause">Pausa</button></div>
        <div class="fh-progress"><div data-r="prog"></div></div>
        <div data-r="prompt"></div>
        <div data-r="answer"></div>
        <p class="fh-feedback" data-r="feedback" aria-live="polite"></p>
        <button class="fh-primary" data-r="next" hidden>Nästa fråga</button>
      </section>
      <section data-v="stats" hidden></section>`;
    const $ = r => root.querySelector(`[data-r="${r}"]`);
    const view = v => root.querySelector(`[data-v="${v}"]`);
    const groups = cfg.groups;
    const settingDefs = [...(cfg.settings || []), {
      name: "format", legend: "Svara genom att",
      options: [["choice", "Välja bland fyra"], ["typed", "Skriva själv"]], def: "choice"
    }];
    const defaults = () => Object.fromEntries(settingDefs.map(s => [s.name, s.def]));
    const freshGroup = () => ({ series: null, stats: {} });

    function load() {
      try {
        const s = JSON.parse(localStorage.getItem(cfg.storeKey));
        if (s && s.groups && groups.some(g => g.id === s.group)) {
          s.settings = Object.assign(defaults(), s.settings);
          return s;
        }
      } catch (e) {}
      return { group: groups[0].id, settings: defaults(), groups: {} };
    }
    const S = load();
    const save = () => { try { localStorage.setItem(cfg.storeKey, JSON.stringify(S)); } catch (e) {} };
    const G = () => S.groups[S.group] || (S.groups[S.group] = freshGroup());
    const groupName = () => groups.find(g => g.id === S.group).name;
    const itemsById = {};
    groups.forEach(g => cfg.items(g.id).forEach(it => { itemsById[it.id] = it; }));

    let current = null;
    let confirmReset = false;

    function show(v) {
      ["home", "quiz", "stats"].forEach(x => { view(x).hidden = x !== v; });
      window.scrollTo(0, 0);
    }

    function startRound(ids) {
      const g = G(), prev = g.series;
      g.series = {
        round: prev ? prev.round + 1 : 1,
        queue: shuffle(ids), total: ids.length, right: 0, wrong: [], unsure: [],
        history: prev ? prev.history : [], phase: "active"
      };
      save();
      show("quiz");
      nextQuestion();
    }

    function nextQuestion() {
      const sr = G().series;
      if (!sr || !sr.queue.length) { renderHome(); show("home"); return; }
      const item = itemsById[sr.queue[0]];
      const done = sr.total - sr.queue.length;
      $("pos").textContent = `Omgång ${sr.round}, fråga ${done + 1} av ${sr.total}`;
      $("prog").style.width = `${(done / sr.total) * 100}%`;
      $("feedback").textContent = "";
      $("feedback").className = "fh-feedback";
      $("next").hidden = true;
      const q = cfg.question(item, S.settings);
      current = { item, q, answered: false };
      const prompt = $("prompt");
      if (q.render) q.render(prompt);
      else prompt.innerHTML = `<div class="fh-stamp"><p class="fh-ask">${esc(q.ask)}</p><p class="fh-subject">${esc(q.subject)}</p></div>`;
      const area = $("answer");
      area.innerHTML = "";
      if (S.settings.format === "choice") {
        const box = document.createElement("div");
        box.className = "fh-answers";
        shuffle([q.correct, ...q.wrong]).forEach(opt => {
          const b = document.createElement("button");
          b.textContent = opt;
          b.onclick = () => { if (current.answered) return; if (opt !== q.correct) b.classList.add("wrong"); answer(opt === q.correct); };
          box.appendChild(b);
        });
        area.appendChild(box);
        box.firstChild.focus({ preventScroll: true });
      } else {
        const form = document.createElement("div");
        form.className = "fh-typed";
        form.innerHTML = `<input type="text" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="${esc(q.typedLabel || "Ditt svar")}"><button>Bekräfta</button>`;
        area.appendChild(form);
        const input = form.querySelector("input");
        const submit = () => {
          if (current.answered || !input.value.trim()) return;
          const r = judge(input.value, q.key, q.pool);
          input.classList.add(r.ok ? "right" : "wrong");
          answer(r.ok, false, r.ok && norm(r.hit) !== norm(q.correct));
        };
        form.querySelector("button").onclick = submit;
        input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); submit(); } });
        input.focus({ preventScroll: true });
      }
      const u = document.createElement("button");
      u.className = "fh-secondary fh-unsure";
      u.textContent = "Osäker";
      u.onclick = () => answer(false, true);
      area.appendChild(u);
      if (q.hint) area.insertAdjacentHTML("beforeend", `<p class="fh-hint">${esc(q.hint)}</p>`);
    }

    function answer(ok, unsure, other) {
      if (current.answered) return;
      current.answered = true;
      const g = G(), sr = g.series, id = current.item.id, q = current.q;
      const st = g.stats[id] || (g.stats[id] = { asked: 0, wrong: 0 });
      st.asked++;
      $("answer").querySelectorAll("button, input").forEach(el => {
        el.disabled = true;
        if (el.parentNode.classList.contains("fh-answers") && el.textContent === q.correct) el.classList.add("right");
      });
      if (cfg.onAnswer) cfg.onAnswer(current.item, ok);
      const fb = $("feedback");
      if (ok) {
        sr.right++;
        fb.textContent = other ? `Rätt! Facit: ${q.correct}.` : "Rätt!";
        fb.className = "fh-feedback good";
      } else {
        if (unsure) { st.unsure = (st.unsure || 0) + 1; sr.unsure.push(id); } else st.wrong++;
        sr.wrong.push(id);
        fb.textContent = unsure ? `Svaret är ${q.correct}. Den kommer med i nästa omgång.` : `Rätt svar är ${q.correct}.`;
        fb.className = "fh-feedback bad";
      }
      sr.queue.shift();
      if (!sr.queue.length) {
        sr.history.push({ round: sr.round, total: sr.total, right: sr.right });
        sr.phase = sr.wrong.length ? "review" : "done";
      }
      save();
      $("next").textContent = sr.queue.length ? "Nästa fråga" : "Se resultatet";
      $("next").hidden = false;
      $("next").focus({ preventScroll: true });
    }

    function historyHtml(h) {
      if (!h || !h.length) return "";
      return `<h2>Omgångar hittills</h2><ul class="fh-history">${h.map(r => `<li><span>Omgång ${r.round}</span><span>${r.right} av ${r.total} rätt</span></li>`).join("")}</ul>`;
    }

    function resetHtml() {
      if (!confirmReset) return `<div class="fh-stack"><button class="fh-secondary fh-danger" data-a="resetOpen">Rensa</button></div>`;
      return `<div class="fh-panel">
        <p>Vad vill du rensa för ${esc(groupName())}?</p>
        <div class="fh-stack">
          <button class="fh-secondary fh-danger" data-a="resetRounds">Börja om från omgång 1 och behåll statistiken</button>
          <button class="fh-secondary fh-danger" data-a="resetAll">Rensa allt, även statistiken</button>
          <button class="fh-secondary" data-a="resetCancel">Avbryt</button>
        </div>
      </div>`;
    }

    function renderHome() {
      const g = G(), sr = g.series, items = cfg.items(S.group);
      const nav = `<fieldset><legend>Världsdel</legend><div class="fh-choices">${groups.map(x => `<label><input type="radio" name="fh-group" value="${x.id}"${x.id === S.group ? " checked" : ""}><span>${esc(x.name)}</span></label>`).join("")}</div></fieldset>`;
      const settings = settingDefs.map(s => `<fieldset><legend>${esc(s.legend)}</legend><div class="fh-choices">${s.options.map(([v, l]) => `<label><input type="radio" name="fh-${s.name}" value="${v}"${S.settings[s.name] === v ? " checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></fieldset>`).join("");
      const noun = n => n === 1 ? (cfg.noun || ["fråga", "frågor"])[0] : (cfg.noun || ["fråga", "frågor"])[1];
      let body;
      if (!sr) {
        body = `<p class="fh-lead">${esc(cfg.intro(items.length))}</p>${settings}<button class="fh-primary" data-a="start">Starta omgång 1 med ${items.length} ${noun(items.length)}</button>`;
      } else if (sr.phase === "active") {
        const left = sr.queue.length;
        body = `<div class="fh-status"><p class="fh-round">Omgång ${sr.round}</p><p>${sr.total - left} av ${sr.total} besvarade, ${sr.right} rätt hittills.</p></div>
          ${settings}<button class="fh-primary" data-a="resume">Fortsätt omgång ${sr.round}</button>`;
      } else if (sr.phase === "review") {
        const wrong = sr.wrong.slice().sort((a, b) => cfg.name(itemsById[a]).localeCompare(cfg.name(itemsById[b]), "sv"));
        body = `<div class="fh-status">
            <p class="fh-round">${sr.right} av ${sr.total}</p>
            <p>Omgång ${sr.round} är klar. Det blev fel eller osäkert på ${wrong.length} ${noun(wrong.length)}:</p>
            <ul class="fh-chips">${wrong.map(id => `<li>${esc(cfg.name(itemsById[id]))}${sr.unsure.includes(id) ? " (osäker)" : ""}</li>`).join("")}</ul>
          </div>
          ${settings}<button class="fh-primary" data-a="nextRound">Starta omgång ${sr.round + 1} med ${wrong.length} ${noun(wrong.length)}</button>`;
      } else {
        body = `<div class="fh-status"><p class="fh-round">Allt rätt!</p><p>Omgång ${sr.round} gick felfritt. Det tog ${sr.round} ${sr.round === 1 ? "omgång" : "omgångar"}.</p></div>
          <button class="fh-primary" data-a="restart">Kör ett nytt förhör från omgång 1</button>`;
      }
      view("home").innerHTML = `<h1>${esc(cfg.title)}</h1><p class="fh-parent">${esc(cfg.parentNote)}</p>${nav}${body}${historyHtml(sr && sr.history)}
        <div class="fh-stack"><button class="fh-secondary" data-a="stats">Visa statistik</button></div>${resetHtml()}`;

      const home = view("home");
      const act = (a, fn) => { const b = home.querySelector(`[data-a="${a}"]`); if (b) b.onclick = fn; };
      home.querySelectorAll('input[name="fh-group"]').forEach(i => i.onchange = () => { S.group = i.value; confirmReset = false; save(); renderHome(); });
      settingDefs.forEach(s => home.querySelectorAll(`input[name="fh-${s.name}"]`).forEach(i => i.onchange = () => { S.settings[s.name] = i.value; save(); }));
      act("start", () => startRound(items.map(it => it.id)));
      act("resume", () => { show("quiz"); nextQuestion(); });
      act("nextRound", () => startRound(g.series.wrong));
      act("restart", () => { g.series = null; save(); renderHome(); });
      act("stats", () => { renderStats(); show("stats"); });
      act("resetOpen", () => { confirmReset = true; renderHome(); home.querySelector('[data-a="resetCancel"]').focus(); });
      act("resetCancel", () => { confirmReset = false; renderHome(); });
      act("resetRounds", () => { confirmReset = false; g.series = null; save(); renderHome(); });
      act("resetAll", () => { confirmReset = false; S.groups[S.group] = freshGroup(); save(); renderHome(); });
    }

    function renderStats() {
      const g = G();
      const miss = s => s.wrong + (s.unsure || 0);
      const label = id => cfg.statLabel ? cfg.statLabel(itemsById[id]) : esc(cfg.name(itemsById[id]));
      const known = Object.entries(g.stats).filter(([id]) => itemsById[id]);
      const rows = known.filter(([, s]) => miss(s) > 0)
        .sort((a, b) => miss(b[1]) - miss(a[1]) || (miss(b[1]) / b[1].asked) - (miss(a[1]) / a[1].asked) || cfg.name(itemsById[a[0]]).localeCompare(cfg.name(itemsById[b[0]]), "sv"));
      const asked = known.reduce((n, [, s]) => n + s.asked, 0);
      const wrong = known.reduce((n, [, s]) => n + miss(s), 0);
      const never = known.filter(([, s]) => s.asked > 0 && miss(s) === 0).map(([id]) => cfg.name(itemsById[id])).sort((a, b) => a.localeCompare(b, "sv"));
      const max = rows.length ? miss(rows[0][1]) : 1;
      const list = rows.length
        ? rows.map(([id, s]) => `
          <div class="fh-stat">
            <div class="fh-top"><span class="fh-name">${label(id)}</span><span class="fh-num">${[s.wrong ? `${s.wrong} fel` : "", s.unsure ? `${s.unsure} osäker` : ""].filter(Boolean).join(", ")} av ${s.asked}</span></div>
            <div class="fh-meter"><div style="width:${(miss(s) / max) * 100}%"></div></div>
          </div>`).join("")
        : `<p class="fh-empty">Inga fel ännu. Här dyker frågorna upp när det blir fel på dem.</p>`;
      view("stats").innerHTML = `
        <div class="fh-bar"><span>Statistik: ${esc(groupName())}</span><button class="fh-link" data-a="back">Tillbaka</button></div>
        <div class="fh-summary">
          <div><strong>${asked}</strong><span>besvarade</span></div>
          <div><strong>${asked - wrong}</strong><span>rätt</span></div>
          <div><strong>${asked ? Math.round(((asked - wrong) / asked) * 100) : 0}%</strong><span>träffsäkerhet</span></div>
        </div>
        <h2>Oftast fel eller osäker</h2>
        ${list}
        ${never.length ? `<details><summary>Aldrig fel (${never.length})</summary><p>${never.map(esc).join(", ")}</p></details>` : ""}
        ${historyHtml(g.series && g.series.history)}`;
      view("stats").querySelector('[data-a="back"]').onclick = () => { renderHome(); show("home"); };
    }

    $("next").onclick = nextQuestion;
    $("pause").onclick = () => { renderHome(); show("home"); };
    document.addEventListener("keydown", e => {
      if (view("quiz").hidden || S.settings.format !== "choice" || !current || current.answered) return;
      if (e.target.tagName === "INPUT") return;
      const n = parseInt(e.key, 10);
      const btns = [...root.querySelectorAll(".fh-answers button")];
      if (n >= 1 && n <= btns.length) btns[n - 1].click();
    });
    renderHome();
  }

  function pick(arr, n) { return shuffle(arr).slice(0, n); }

  window.Forhor = { start, pick, shuffle, esc, judge };
})();
