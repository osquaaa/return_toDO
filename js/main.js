// js/main.js — LETget v4 (Monochrome redesign) — fully updated for current index.html/main.css
(function () {
  "use strict";

  /* =========================================================
     Storage & State
     ========================================================= */
  var STORAGE_KEY_V4 = "letget_v4";
  var STORAGE_KEY_V3 = "letget_v3";
var DRAFT_TASK_KEY = "letget_v4_draft_task";
var DRAFT_CODE_KEY = "letget_v4_draft_code";
var DRAFT_CODE_TITLE_KEY = "letget_v4_draft_code_title";
  var CATEGORIES = ["tasks", "shopping", "code", "workout"];

  function nowId() {
    return Date.now() + Math.random();
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function loadFrom(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = safeJsonParse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(state));
    } catch (e) {}
  }

  function getDateKey(d) {
    var date = d || new Date();
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function formatDateTimeShort(d) {
    try {
      return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function formatTimeShort(d) {
    try {
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function formatDateLabelFromKey(key) {
    var parts = key ? key.split("-") : null;
    if (!parts || parts.length !== 3) return key || "";
    var y = Number(parts[0]);
    var m = Number(parts[1]) - 1;
    var d = Number(parts[2]);
    var date = new Date(y, m, d);
    try {
      return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    } catch (e) {
      return key;
    }
  }

  function createEmptyData() {
    return {
      tasks: [],
      shopping: [], // trips array
      code: [],
      workout: [], // sessions array
    };
  }

  function normalizeStateShape(s) {
    if (!s || typeof s !== "object") s = {};
    if (!s.data || typeof s.data !== "object") s.data = createEmptyData();

    if (!Array.isArray(s.data.tasks)) s.data.tasks = [];
    if (!Array.isArray(s.data.shopping)) s.data.shopping = [];
    if (!Array.isArray(s.data.code)) s.data.code = [];
    if (!Array.isArray(s.data.workout)) s.data.workout = [];

    if (!s.activeView || CATEGORIES.indexOf(s.activeView) === -1) s.activeView = "tasks";
    if (!s.taskFilter || ["all", "active", "done"].indexOf(s.taskFilter) === -1) s.taskFilter = "all";

    if (!s.workoutSelectedExercise) s.workoutSelectedExercise = "pullups";
    if (!s.workoutRepsPerSet || typeof s.workoutRepsPerSet !== "number") s.workoutRepsPerSet = 8;

    return s;
  }

  /* =========================================================
     HTML sanitizing (for tasks RTE)
     ========================================================= */
  var ALLOWED_TAGS = {
    A: true,
    B: true,
    STRONG: true,
    I: true,
    EM: true,
    U: true,
    BR: true,
    DIV: true,
    P: true,
    SPAN: true,
    OL: true,
    UL: true,
    LI: true,
    CODE: true,
    PRE: true,
  };

  function sanitizeHtml(html) {
    if (!html) return "";

    var doc;
    try {
      doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    } catch (e) {
      return "";
    }

    var root = doc.body && doc.body.firstChild ? doc.body.firstChild : null;
    if (!root) return "";

    // Remove scripts/styles/unknown tags; strip dangerous attrs
    function walk(node) {
      if (!node) return;

      var children = Array.prototype.slice.call(node.childNodes || []);
      children.forEach(function (child) {
        if (child.nodeType === 1) {
          var tag = child.tagName;

if (!ALLOWED_TAGS[tag]) {
  // unwrap, но каждую перенесённую ноду сразу чистим
  while (child.firstChild) {
    var moved = child.firstChild;
    node.insertBefore(moved, child);
    if (moved.nodeType === 1) {
      walk(moved);
    }
  }
  node.removeChild(child);
  return;
}

          // Clean attributes
// Clean attributes
var attrs = Array.prototype.slice.call(child.attributes || []);
attrs.forEach(function (attr) {
  var name = attr.name.toLowerCase();

  // keep only href on <a>
  if (tag === "A") {
    if (name !== "href") child.removeAttribute(attr.name);
    return;
  }

  // allow safe class on <code> (for language-xxx / hljs)
  if (tag === "CODE" && name === "class") {
    var raw = String(attr.value || "");
    var safe = raw
      .split(/\s+/)
      .filter(function (c) {
        return c === "hljs" || /^language-[a-z0-9_-]+$/i.test(c);
      })
      .join(" ");

    child.removeAttribute(attr.name);
    if (safe) child.setAttribute("class", safe);
    return;
  }

  // remove everything else
  child.removeAttribute(attr.name);
});

          // Validate href
          if (tag === "A") {
            var href = child.getAttribute("href") || "";
            href = href.trim();
            // allow http(s), mailto, tel, and same-page/hash
            var ok =
              href.startsWith("http://") ||
              href.startsWith("https://") ||
              href.startsWith("mailto:") ||
              href.startsWith("tel:") ||
              href.startsWith("#") ||
              href.startsWith("./") ||
              href.startsWith("/") ||
              href.startsWith("?");

            if (!ok) {
              child.removeAttribute("href");
            } else {
              // prevent tabnabbing-ish issues, and keep UX consistent
              try {
                child.setAttribute("target", "_blank");
                child.setAttribute("rel", "noopener noreferrer");
              } catch (e) {}
            }
          }

          walk(child);
          return;
        }

        if (child.nodeType === 8) {
          // comment
          node.removeChild(child);
          return;
        }

        // Text nodes ok
      });
    }

    walk(root);

    // normalize: remove empty wrappers produced by paste
    var out = root.innerHTML || "";
    out = out.replace(/\u00A0/g, " ").trim(); // nbsp -> space
    return out;
  }

  function rteIsEmpty(el) {
    if (!el) return true;
    var html = (el.innerHTML || "").replace(/\u00A0/g, " ").trim();
    var text = (el.textContent || "").replace(/\u00A0/g, " ").trim();
    // Sometimes empty contenteditable becomes "<br>"
    if (!text && (html === "" || html === "<br>" || html === "<div><br></div>")) return true;
    return !text && !html;
  }

  /* =========================================================
     Migrations
     ========================================================= */
  function migrateLegacyTasksArray() {
    // Old “tasks” key: array of {id,text,done,...}
    var legacyRaw;
    try {
      legacyRaw = localStorage.getItem("tasks");
    } catch (e) {
      legacyRaw = null;
    }
    if (!legacyRaw) return [];
    var legacy = safeJsonParse(legacyRaw);
    if (!Array.isArray(legacy)) return [];

    return legacy.map(function (t) {
      var text = (t && t.text) || "";
      // convert to safe html
      var html = sanitizeHtml(String(text).replace(/\n/g, "<br>"));
      return {
        id: t.id || nowId(),
        html: html,
        done: !!t.done,
        pinned: false,
        createdAt: t.createdAt || "",
        updatedAt: "",
      };
    });
  }

  function normalizeShoppingTrips(trips) {
    if (!Array.isArray(trips)) return [];
    // If already trips format: first element has items array
    if (trips[0] && Array.isArray(trips[0].items)) return trips;

    // Otherwise, treat as flat old items array (rare)
    var items = trips;
    var now = new Date();
    var trip = {
      id: now.getTime(),
      name: "Поход в магазин",
      createdAt: formatDateTimeShort(now),
      dateKey: getDateKey(now),
      items: (items || []).map(function (it) {
        return {
          id: (it && it.id) || nowId(),
          name: (it && (it.name || it.text)) || "",
          qty: (it && it.qty) || "",
          done: !!(it && it.done),
        };
      }),
    };
    return [trip];
  }

  function normalizeWorkoutSessions(arr) {
    if (!Array.isArray(arr)) return [];

    // If old format had completedSets -> convert
    if (arr[0] && Object.prototype.hasOwnProperty.call(arr[0], "completedSets")) {
      var sessions = [];
      arr.forEach(function (oldItem) {
        if (!oldItem || !oldItem.exercise) return;
        var sets = Number(oldItem.completedSets || oldItem.totalSets || 0) || 0;
        var reps = Number(oldItem.reps || 0) || 0;
        var totalReps = sets * reps;

        sessions.push({
          id: oldItem.id || nowId(),
          dateKey: getDateKey(new Date()),
          exercise: normalizeExerciseKey(oldItem.exercise),
          sets: sets,
          totalReps: totalReps,
          updatedAt: "",
        });
      });
      return sessions;
    }

    return arr;
  }

  function normalizeExerciseKey(name) {
    if (!name) return "pullups";
    var lower = String(name).toLowerCase();
    if (lower.indexOf("подтяг") !== -1) return "pullups";
    if (lower.indexOf("брусь") !== -1) return "dips";
    if (lower.indexOf("отжим") !== -1) return "pushups";
    if (lower === "pullups" || lower === "dips" || lower === "pushups") return lower;
    return "pullups";
  }

  function migrateFromV3(v3) {
    // v3 shape: {activeCategory, data:{...}, taskFilter,...}
    var s = {
      activeView: (v3 && v3.activeCategory) || "tasks",
      taskFilter: (v3 && v3.taskFilter) || "all",
      workoutSelectedExercise: (v3 && v3.workoutSelectedExercise) || "pullups",
      workoutRepsPerSet: (v3 && v3.workoutRepsPerSet) || 8,
      data: createEmptyData(),
    };

    if (v3 && v3.data && typeof v3.data === "object") {
      // tasks: v3 tasks were {text,done,...}; v4 uses {html,...}
      var tasks = Array.isArray(v3.data.tasks) ? v3.data.tasks : [];
      s.data.tasks = tasks.map(function (t) {
        var html = "";
        if (t && typeof t.html === "string") {
          html = sanitizeHtml(t.html);
        } else {
          var text = (t && t.text) || "";
          html = sanitizeHtml(String(text).replace(/\n/g, "<br>"));
        }
        return {
          id: (t && t.id) || nowId(),
          html: html,
          done: !!(t && t.done),
          pinned: !!(t && t.pinned),
          createdAt: (t && t.createdAt) || "",
          updatedAt: (t && t.updatedAt) || "",
        };
      });

      // shopping: keep trips format but normalize
      s.data.shopping = normalizeShoppingTrips(v3.data.shopping);

      // code: keep
      s.data.code = Array.isArray(v3.data.code) ? v3.data.code : [];

      // workout: normalize
      s.data.workout = normalizeWorkoutSessions(v3.data.workout);
    }

    // If v3 had no tasks, try legacy "tasks" key
    if (!s.data.tasks.length) {
      var legacyTasks = migrateLegacyTasksArray();
      if (legacyTasks.length) s.data.tasks = legacyTasks;
    }

    return normalizeStateShape(s);
  }

  function createFreshState() {
    var s = normalizeStateShape({
      activeView: "tasks",
      taskFilter: "all",
      workoutSelectedExercise: "pullups",
      workoutRepsPerSet: 8,
      data: createEmptyData(),
    });

    // Bring in old legacy tasks if present
    var legacy = migrateLegacyTasksArray();
    if (legacy.length) s.data.tasks = legacy;

    return s;
  }

  /* =========================================================
     Init state
     ========================================================= */
  var state = loadFrom(STORAGE_KEY_V4);

  if (!state) {
    var v3 = loadFrom(STORAGE_KEY_V3);
    if (v3) state = migrateFromV3(v3);
  }

  if (!state) state = createFreshState();
  state = normalizeStateShape(state);

  // Ensure shopping has an active trip
  function ensureActiveTrip() {
    state.data.shopping = normalizeShoppingTrips(state.data.shopping);

    if (!state.data.shopping.length) {
      var now = new Date();
      state.data.shopping.unshift({
        id: now.getTime(),
        name: "Поход в магазин",
        createdAt: formatDateTimeShort(now),
        dateKey: getDateKey(now),
        items: [],
      });
    }
    return state.data.shopping[0];
  }
  ensureActiveTrip();

  saveState();

  /* =========================================================
     DOM helpers
     ========================================================= */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function debounce(fn, wait) {
  var t = null;
  return function () {
    var args = arguments;
    if (t) clearTimeout(t);
    t = setTimeout(function () { fn.apply(null, args); }, wait);
  };
}
function highlightAllCode(root) {
  if (!window.hljs) return;
  var scope = root || document;
  var blocks = scope.querySelectorAll("pre code:not([data-hl])");

  if (blocks.length === 0) return;

  // Подсвечиваем асинхронно, чтобы не тормозить UI
  requestAnimationFrame(() => {
    blocks.forEach(function (el) {
      try {
        el.setAttribute("data-hl", "1");
        hljs.highlightElement(el);
      } catch (e) {}
    });
  });
}

  function setActiveClassByDataNav(view) {
    // buttons with data-nav
    qsa("[data-nav]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-nav") === view);
    });
  }

  /* =========================================================
     Toasts
     ========================================================= */
  var toastsEl = qs("[data-toasts]");

function toast(text, opts) {
  if (!toastsEl) return null;
  opts = opts || {};
  var ttl = typeof opts.ttl === "number" ? opts.ttl : 3200;
  var actions = Array.isArray(opts.actions) ? opts.actions : [];

  var el = document.createElement("div");
  el.className = "toast";

  var textEl = document.createElement("div");
  textEl.className = "toast-text";
  textEl.textContent = String(text || "");

  var actionsEl = document.createElement("div");
  actionsEl.className = "toast-actions";

  // action buttons
  actions.forEach(function (a) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-btn";
    btn.textContent = String((a && a.label) || "OK");
    btn.addEventListener("click", function () {
      try { if (a && typeof a.onClick === "function") a.onClick(); } catch (e) {}
      close();
    });
    actionsEl.appendChild(btn);
  });

  // close button
  var closeBtn = document.createElement("button");
  closeBtn.className = "mini";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Закрыть");
  closeBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-x"></use></svg>';
  closeBtn.addEventListener("click", close);
  actionsEl.appendChild(closeBtn);

  el.appendChild(textEl);
  el.appendChild(actionsEl);

  toastsEl.appendChild(el);

  function close() {
    try {
      if (el && el.parentNode === toastsEl) toastsEl.removeChild(el);
    } catch (e) {}
  }

  if (ttl > 0) {
    setTimeout(close, ttl);
  }

  return el;
}


  /* =========================================================
     Clock
     ========================================================= */
  function updateClock() {
    var hoursEl = qs("[data-time='hours']");
    var minutesEl = qs("[data-time='minutes']");
    var dateEl = qs("[data-time='date']");
    if (!hoursEl || !minutesEl || !dateEl) return;

    var now = new Date();
    hoursEl.textContent = String(now.getHours()).padStart(2, "0");
    minutesEl.textContent = String(now.getMinutes()).padStart(2, "0");

    try {
      var dateStr = now.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (dateStr) dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      dateEl.textContent = dateStr || "";
    } catch (e) {
      dateEl.textContent = "";
    }
  }

  function initClock() {
    updateClock();
    setInterval(updateClock, 60 * 1000);
  }
var netBadgeEl = qs("[data-net-badge]");

function updateNetworkBadge() {
  if (!netBadgeEl) return;
  var offline = !navigator.onLine;
  netBadgeEl.hidden = !offline;
  netBadgeEl.classList.toggle("is-offline", offline);
}

function initNetworkBadge() {
  updateNetworkBadge();
  window.addEventListener("online", function () {
    updateNetworkBadge();
    toast("Снова онлайн.");
  });
  window.addEventListener("offline", function () {
    updateNetworkBadge();
    toast("Оффлайн. Всё сохраняется локально.");
  });
}
  /* =========================================================
     Drawer (mobile)
     ========================================================= */
  var drawerEl = qs("[data-drawer]");

  function openDrawer() {
    if (!drawerEl) return;
    drawerEl.classList.add("is-open");
    drawerEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawerEl) return;
    drawerEl.classList.remove("is-open");
    drawerEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initDrawer() {
    var openBtn = qs("[data-open-drawer]");
    if (openBtn) openBtn.addEventListener("click", openDrawer);

    qsa("[data-close-drawer]").forEach(function (btn) {
      btn.addEventListener("click", closeDrawer);
    });
  }

  /* =========================================================
     Modals
     ========================================================= */
  function modalEl(name) {
    return qs('[data-modal="' + name + '"]');
  }

  function openModal(name) {
    var el = modalEl(name);
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(name) {
    var el = modalEl(name);
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function closeAllModals() {
    qsa(".modal.is-open").forEach(function (m) {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "";
  }

  function initModals() {
    // Close buttons/backdrops
    qsa("[data-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-modal-close");
        if (name) closeModal(name);
      });
    });

    // Settings open
    qsa("[data-open-settings]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal("settings");
        closeDrawer();
      });
    });

    // ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeDrawer();
        closeAllModals();
        if (isSearchActive()) closeSearch();
      }
    });
  }

  /* =========================================================
     Views / Navigation
     ========================================================= */
  function setActiveView(view) {
    if (CATEGORIES.indexOf(view) === -1 && view !== "search") view = "tasks";

    state.activeView = view === "search" ? state.activeView || "tasks" : view;
    saveState();

    qsa(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.getAttribute("data-view") === view);
    });

    if (view !== "search") {
      setActiveClassByDataNav(view);
    }

    closeDrawer();

    switch (view) {
    case "tasks":
      renderTasks();
      break;
    case "shopping":
      renderShopping();
      break;
    case "code":
      renderCode();
      break;
    case "workout":
      renderWorkout();
      break;
  }
  }

  function initNavigation() {
    // data-nav buttons (sidebar, bottom, drawer)
    qsa("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.getAttribute("data-nav");
        if (!view) return;
        clearSearchUI();
        setActiveView(view);
      });
    });
  }

  /* =========================================================
     Tasks (RTE + pins + modal editor)
     ========================================================= */
  var tasksComposerEl = qs("[data-task-composer]");
  var tasksListEl = qs("[data-tasks-list]");
  var tasksCounterEl = qs("[data-tasks-counter]");
  var taskFilterButtons = qsa("[data-task-filter]");
  var clearDoneBtn = qs("[data-clear-done]");

  var editTaskId = null;
  var editTaskBodyEl = qs("[data-edit-task-body]");

  function sortTasks(tasks) {
    // pinned first, then newest first by id/createdAt
    return tasks.slice().sort(function (a, b) {
      var ap = !!a.pinned;
      var bp = !!b.pinned;
      if (ap !== bp) return ap ? -1 : 1;
      return (b.id || 0) - (a.id || 0);
    });
  }

  function getFilteredTasks() {
    var tasks = Array.isArray(state.data.tasks) ? state.data.tasks : [];
    if (state.taskFilter === "active") return tasks.filter(function (t) { return !t.done; });
    if (state.taskFilter === "done") return tasks.filter(function (t) { return !!t.done; });
    return tasks;
  }

  function taskCounts() {
    var all = state.data.tasks || [];
    var total = all.length;
    var active = all.filter(function (t) { return !t.done; }).length;
    return { total: total, active: active };
  }

  function taskItemHTML(t) {
    var created = t.createdAt ? t.createdAt : "";
    var updated = t.updatedAt ? t.updatedAt : "";
    var meta = created ? ("Добавлено: " + created) : "";
    if (updated) meta = (meta ? meta + " • " : "") + "Изменено: " + updated;

    var pinBadge = t.pinned
      ? '<div class="pin-badge"><svg class="icon" aria-hidden="true"><use href="#i-pin"></use></svg>Закреплено</div>'
      : "";

    return (
      '<article class="card-item ' + (t.done ? "is-done" : "") + '" data-task-id="' + t.id + '">' +
        '<button class="check" type="button" data-task-action="toggle" aria-label="Отметить выполненным">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg>' +
        "</button>" +
        '<div class="item-body">' +
          '<div class="item-title">' + (t.html || "") + "</div>" +
          (meta ? '<div class="item-meta">' + meta + "</div>" : "") +
          pinBadge +
        "</div>" +
        '<div class="item-actions">' +
          '<button class="mini" type="button" data-task-action="pin" aria-label="Закрепить">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-pin"></use></svg>' +
          "</button>" +
          '<button class="mini" type="button" data-task-action="edit" aria-label="Редактировать">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-edit"></use></svg>' +
          "</button>" +
          '<button class="mini mini--danger" type="button" data-task-action="delete" aria-label="Удалить">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>' +
          "</button>" +
        "</div>" +
      "</article>"
    );
  }

  function renderTasks() {
    if (!tasksListEl) return;

    var counts = taskCounts();
    if (tasksCounterEl) {
      tasksCounterEl.textContent = "Всего: " + counts.total + " • Активные: " + counts.active;
    }

    // filter ui
    taskFilterButtons.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-task-filter") === state.taskFilter);
    });

    var tasks = sortTasks(getFilteredTasks());

    if (!tasks.length) {
      tasksListEl.innerHTML =
        '<div class="muted small">Пока пусто. Добавь задачу сверху — можно с форматированием.</div>';
      return;
    }

    tasksListEl.innerHTML = tasks.map(taskItemHTML).join("");
    highlightAllCode(tasksListEl);
  }

  function addTaskFromComposer() {
    if (!tasksComposerEl) return;
    if (rteIsEmpty(tasksComposerEl)) {
      toast("Пустая задача — сначала введи текст.");
      return;
    }

    var raw = tasksComposerEl.innerHTML || "";
    var html = sanitizeHtml(raw);
    if (!html || !html.trim()) {
      toast("Не удалось распознать текст. Попробуй ещё раз.");
      return;
    }

    var now = new Date();
    var task = {
      id: nowId(),
      html: html,
      done: false,
      pinned: false,
      createdAt: formatDateTimeShort(now),
      updatedAt: "",
    };

state.data.tasks.unshift(task);
saveState();
tasksComposerEl.innerHTML = "";
clearDraft(DRAFT_TASK_KEY);
renderTasks();

toast("Задача добавлена.", {
  ttl: 6000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var tasks = state.data.tasks || [];
      var idx = tasks.findIndex(function (x) { return String(x.id) === String(task.id); });
      if (idx !== -1) {
        tasks.splice(idx, 1);
        saveState();
        renderTasks();
        toast("Отменено.");
      }
    }
  }]
});
  }

  function openEditTask(taskId) {
    var tasks = state.data.tasks || [];
    var t = tasks.find(function (x) { return String(x.id) === String(taskId); });
    if (!t) return;

    editTaskId = t.id;
    if (editTaskBodyEl) {
      editTaskBodyEl.innerHTML = t.html || "";
      try { editTaskBodyEl.focus(); } catch (e) {}
    }
    openModal("edit-task");
  }

  function saveEditTask() {
    if (!editTaskId) return;
    var tasks = state.data.tasks || [];
    var idx = tasks.findIndex(function (x) { return String(x.id) === String(editTaskId); });
    if (idx === -1) return;

    if (!editTaskBodyEl) return;
    if (rteIsEmpty(editTaskBodyEl)) {
      toast("Нельзя сохранить пустую задачу.");
      return;
    }

    var html = sanitizeHtml(editTaskBodyEl.innerHTML || "");
    if (!html) {
      toast("Не удалось сохранить — попробуй ещё раз.");
      return;
    }

    tasks[idx].html = html;
    tasks[idx].updatedAt = formatDateTimeShort(new Date());
    saveState();
    renderTasks();
    closeModal("edit-task");
    toast("Сохранено.");
  }
function mdFencesToHtml(text) {
  text = String(text || "");

  if (text.indexOf("```") === -1) {
    return escapeText(text).replace(/\n/g, "<br>");
  }

  var out = "";
  var parts = text.split("```");

  for (var i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      out += escapeText(parts[i]).replace(/\n/g, "<br>");
    } else {
      var block = parts[i] || "";
      var lang = "";

      // ловим "```js\n"
      var m = block.match(/^\s*([a-z0-9_-]+)\s*\n/i);
      if (m) {
        lang = String(m[1] || "").toLowerCase();
        block = block.slice(m[0].length);
      }

      block = block.replace(/^\n/, "").replace(/\n$/, "");

      var cls = lang ? ' class="language-' + escapeText(lang) + '"' : "";
      out += "<pre><code" + cls + ">" + escapeText(block) + "</code></pre>";
    }
  }

  return out;
}

function normalizeClipboardToSafeHtml(clipHtml, clipText) {
  // 1) если есть HTML — санитайзим и используем
  if (clipHtml && String(clipHtml).trim()) {
    var safe = sanitizeHtml(String(clipHtml));
    if (safe && safe.trim()) return safe;
  }

  // 2) иначе берём plain text и поддержим ``` ``` (чтобы код не “терялся”)
  return mdFencesToHtml(clipText || "");
}

function insertHtmlAtCursor(html) {
  try {
    document.execCommand("insertHTML", false, html);
  } catch (e) {
    // fallback: хотя бы текст
    try {
      document.execCommand("insertText", false, stripHtmlToText(html));
    } catch (e2) {}
  }
}

function bindRtePaste(el) {
  if (!el) return;
  el.addEventListener("paste", function (e) {
    // ВАЖНО: иначе браузер вставит “красивый” HTML со стилями
    e.preventDefault();

    var cd = e.clipboardData || window.clipboardData;
    var clipHtml = cd ? cd.getData("text/html") : "";
    var clipText = cd ? cd.getData("text/plain") : "";

    var safeHtml = normalizeClipboardToSafeHtml(clipHtml, clipText);
    insertHtmlAtCursor(safeHtml);
  });
}
  function initTasks() {
    // Add task
    var addBtn = qs("[data-add-task]");
    if (addBtn) addBtn.addEventListener("click", addTaskFromComposer);

    // Enter to add (Shift+Enter for newline)
    if (tasksComposerEl) {
      tasksComposerEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          // If inside list or formatting, still allow new line with Shift+Enter
          e.preventDefault();
          addTaskFromComposer();
        }
      });
    }

    // Filters
    taskFilterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-task-filter");
        if (!v) return;
        state.taskFilter = v;
        saveState();
        renderTasks();
      });
    });

    // Clear done
    if (clearDoneBtn) {
      clearDoneBtn.addEventListener("click", function () {
var prev = (state.data.tasks || []).slice();
var before = prev.length;

var next = prev.filter(function (t) { return !t.done; });
state.data.tasks = next;

saveState();
renderTasks();

var after = next.length;
if (before === after) {
  toast("Готовых задач нет.");
} else {
  toast("Готовые задачи удалены.", {
    ttl: 7000,
    actions: [{
      label: "Отменить",
      onClick: function () {
        state.data.tasks = prev;
        saveState();
        renderTasks();
        toast("Отменено.");
      }
    }]
  });
}
        var after = state.data.tasks.length;
        if (before === after) toast("Готовых задач нет.");
        else toast("Готовые задачи удалены.");
      });
    }

    // Task list actions
    if (tasksListEl) {
      tasksListEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-task-action]");
        if (!btn) return;

        var action = btn.getAttribute("data-task-action");
        var item = btn.closest("[data-task-id]");
        if (!item) return;
        var id = item.getAttribute("data-task-id");

        var tasks = state.data.tasks || [];
        var idx = tasks.findIndex(function (t) { return String(t.id) === String(id); });
        if (idx === -1) return;

        if (action === "toggle") {
          tasks[idx].done = !tasks[idx].done;
          saveState();
          renderTasks();
          return;
        }

        if (action === "pin") {
          tasks[idx].pinned = !tasks[idx].pinned;
          saveState();
          renderTasks();
          toast(tasks[idx].pinned ? "Закреплено." : "Откреплено.");
          return;
        }

        if (action === "edit") {
          openEditTask(id);
          return;
        }

        if (action === "delete") {
var removed = tasks[idx];
tasks.splice(idx, 1);
saveState();
renderTasks();

toast("Удалено.", {
  ttl: 7000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      // если уже вернули — не дублим
      var exists = tasks.some(function (x) { return String(x.id) === String(removed.id); });
      if (exists) return;
      tasks.unshift(removed);
      state.data.tasks = tasks;
      saveState();
      renderTasks();
      toast("Отменено.");
    }
  }]
});
return;
        }
      });
    }

    // Edit modal save
    var saveBtn = qs("[data-save-task]");
    if (saveBtn) saveBtn.addEventListener("click", saveEditTask);
bindRtePaste(tasksComposerEl);
bindRtePaste(editTaskBodyEl);
    // RTE toolbars
    initRteToolbar({
      container: document,
      cmdAttr: "data-rte-cmd",
      linkAttr: "data-rte-link",
      targetEl: tasksComposerEl,
    });

    initRteToolbar({
      container: document,
      cmdAttr: "data-edit-rte-cmd",
      linkAttr: "data-edit-rte-link",
      targetEl: editTaskBodyEl,
    });
  }

  /* =========================================================
     RTE Toolbar (execCommand)
     ========================================================= */
  function initRteToolbar(cfg) {
    var cmdButtons = qsa("[" + cfg.cmdAttr + "]", cfg.container);
    cmdButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!cfg.targetEl) return;
        try { cfg.targetEl.focus(); } catch (e) {}
        var cmd = btn.getAttribute(cfg.cmdAttr);
        if (!cmd) return;
        try {
          document.execCommand(cmd, false, null);
        } catch (e) {}
      });
    });

    var linkButtons = qsa("[" + cfg.linkAttr + "]", cfg.container);
    linkButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!cfg.targetEl) return;
        try { cfg.targetEl.focus(); } catch (e) {}
        var url = window.prompt("Вставь ссылку (https://...):");
        if (!url) return;
        url = url.trim();
        if (!url) return;
        // If user forgot scheme, try to help a bit
        if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
          url = "https://" + url;
        }
        try {
          document.execCommand("createLink", false, url);
        } catch (e) {}
      });
    });
  }

  /* =========================================================
     Shopping (trips + modal edit)
     ========================================================= */
  var shoppingForm = qs("[data-shopping-form]");
  var shoppingCurrentEl = qs("[data-shopping-current]");
  var shoppingHistoryEl = qs("[data-shopping-history]");
  var shoppingMetaEl = qs("[data-shopping-current-meta]");
  var shoppingNewTripBtn = qs("[data-shopping-new-trip]");
  var shoppingCopyBtn = qs("[data-shopping-copy]");

  var editShopping = { tripId: null, itemId: null };
  var editShopNameEl = qs("[data-edit-shopping-name]");
  var editShopQtyEl = qs("[data-edit-shopping-qty]");
  var saveShopBtn = qs("[data-save-shopping]");

  function renderShopping() {
    if (!shoppingCurrentEl || !shoppingHistoryEl) return;

    var trips = state.data.shopping || [];
    var active = ensureActiveTrip();
    trips = state.data.shopping || [];

    // meta
    var items = Array.isArray(active.items) ? active.items : [];
    var bought = items.filter(function (i) { return i.done; }).length;
    if (shoppingMetaEl) {
      if (!items.length) shoppingMetaEl.textContent = "Список пуст — добавь первый продукт.";
      else shoppingMetaEl.textContent = bought + " из " + items.length + " куплено";
    }

    // current list
    if (!items.length) {
      shoppingCurrentEl.innerHTML =
        '<div class="muted small">Добавь продукты — и отмечай купленное.</div>';
    } else {
      shoppingCurrentEl.innerHTML = items
        .slice()
        .map(function (it) {
          var qty = it.qty && String(it.qty).trim()
            ? '<div class="item-meta">Кол-во: ' + escapeText(it.qty) + "</div>"
            : "";
          return (
            '<article class="card-item ' + (it.done ? "is-done" : "") + '" data-shopping-item-id="' + it.id + '">' +
              '<button class="check" type="button" data-shopping-action="toggle" aria-label="Отметить купленным">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg>' +
              "</button>" +
              '<div class="item-body">' +
                '<p class="item-title">' + escapeText(it.name || "") + "</p>" +
                qty +
              "</div>" +
              '<div class="item-actions">' +
                '<button class="mini" type="button" data-shopping-action="edit" aria-label="Редактировать">' +
                  '<svg class="icon" aria-hidden="true"><use href="#i-edit"></use></svg>' +
                "</button>" +
                '<button class="mini mini--danger" type="button" data-shopping-action="delete" aria-label="Удалить">' +
                  '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>' +
                "</button>" +
              "</div>" +
            "</article>"
          );
        })
        .join("");
    }

    // history (skip active)
    var historyTrips = trips.slice(1);
    if (!historyTrips.length) {
      shoppingHistoryEl.innerHTML =
        '<div class="muted small">Пока нет прошлых походов. Нажми «Новый поход», чтобы начать следующий.</div>';
      return;
    }

    shoppingHistoryEl.innerHTML = historyTrips
      .map(function (trip) {
        var list = Array.isArray(trip.items) ? trip.items : [];
        var boughtCount = list.filter(function (i) { return i.done; }).length;
        var preview = list
          .slice(0, 3)
          .map(function (i) { return i.name; })
          .filter(Boolean)
          .join(", ");

        var meta =
          (trip.createdAt ? trip.createdAt + " • " : "") +
          list.length + " позиций • " + boughtCount + " куплено";

        return (
          '<article class="card-item" data-trip-id="' + trip.id + '">' +
            '<div class="check" aria-hidden="true" style="pointer-events:none;">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-cart"></use></svg>' +
            "</div>" +
            '<div class="item-body">' +
              '<p class="item-title">' + escapeText(trip.name || "Поход") + "</p>" +
              '<div class="item-meta">' + escapeText(meta) + "</div>" +
              (preview ? '<div class="item-meta">' + escapeText(preview + (list.length > 3 ? "…" : "")) + "</div>" : "") +
            "</div>" +
            '<div class="item-actions">' +
              '<button class="mini" type="button" data-shopping-action="reuse" aria-label="Повторить">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg>' +
              "</button>" +
              '<button class="mini mini--danger" type="button" data-shopping-action="delete-trip" aria-label="Удалить поход">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>' +
              "</button>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function startNewTrip() {
    var trips = state.data.shopping || [];
    var now = new Date();
    var label = "Поход от " + formatDateLabelFromKey(getDateKey(now));

    // If current trip is empty — reuse it
    if (trips.length && (!trips[0].items || !trips[0].items.length)) {
      trips[0].name = label;
      trips[0].createdAt = formatDateTimeShort(now);
      trips[0].dateKey = getDateKey(now);
    } else {
      trips.unshift({
        id: now.getTime(),
        name: label,
        createdAt: formatDateTimeShort(now),
        dateKey: getDateKey(now),
        items: [],
      });
    }

    state.data.shopping = trips;
    saveState();
    renderShopping();
    toast("Новый поход создан.");
  }

  function reuseTrip(tripId) {
    var trips = state.data.shopping || [];
    var original = trips.find(function (t) { return String(t.id) === String(tripId); });
    if (!original) return;

    var originalItems = Array.isArray(original.items) ? original.items : [];
    if (!originalItems.length) {
      toast("В этом походе нечего повторять.");
      return;
    }

    var now = new Date();
    var clone = {
      id: now.getTime(),
      name:
        original.name && original.name.indexOf("(повтор)") === -1
          ? (original.name || "Поход") + " (повтор)"
          : (original.name || "Поход"),
      createdAt: formatDateTimeShort(now),
      dateKey: getDateKey(now),
      items: originalItems.map(function (it) {
        return { id: nowId(), name: it.name || "", qty: it.qty || "", done: false };
      }),
    };

    // If active trip is empty — replace it
    if (trips.length && (!trips[0].items || !trips[0].items.length)) {
      trips[0] = clone;
    } else {
      trips.unshift(clone);
    }

    state.data.shopping = trips;
    saveState();
    renderShopping();
    toast("Список повторён.");
  }

  function deleteTrip(tripId) {
    var trips = state.data.shopping || [];
    var idx = trips.findIndex(function (t) { return String(t.id) === String(tripId); });
    if (idx === -1) return;

    // Don’t let user delete the active trip if it’s the only one; instead clear it
    if (idx === 0) {
      trips[0].items = [];
      saveState();
      renderShopping();
      toast("Текущий поход очищен.");
      return;
    }

var removedTrip = trips[idx];
trips.splice(idx, 1);
state.data.shopping = trips;
saveState();
renderShopping();

toast("Поход удалён.", {
  ttl: 8000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var arr = state.data.shopping || [];
      var exists = arr.some(function (t) { return String(t.id) === String(removedTrip.id); });
      if (exists) return;
      arr.splice(Math.min(idx, arr.length), 0, removedTrip);
      state.data.shopping = arr;
      saveState();
      renderShopping();
      toast("Отменено.");
    }
  }]
});
  }

  function openEditShoppingItem(itemId) {
    var active = ensureActiveTrip();
    var items = active.items || [];
    var it = items.find(function (x) { return String(x.id) === String(itemId); });
    if (!it) return;

    editShopping.tripId = active.id;
    editShopping.itemId = it.id;

    if (editShopNameEl) editShopNameEl.value = it.name || "";
    if (editShopQtyEl) editShopQtyEl.value = it.qty || "";

    openModal("edit-shopping");
    try { if (editShopNameEl) editShopNameEl.focus(); } catch (e) {}
  }

  function saveEditShoppingItem() {
    if (!editShopping.itemId) return;
    var active = ensureActiveTrip();
    if (!active || String(active.id) !== String(editShopping.tripId)) {
      // Active trip changed; still try to find it
      var t = (state.data.shopping || []).find(function (x) { return String(x.id) === String(editShopping.tripId); });
      if (!t) return;
      active = t;
    }

    var items = active.items || [];
    var idx = items.findIndex(function (x) { return String(x.id) === String(editShopping.itemId); });
    if (idx === -1) return;

    var name = editShopNameEl ? editShopNameEl.value.trim() : "";
    var qty = editShopQtyEl ? editShopQtyEl.value.trim() : "";

    if (!name) {
      toast("Название не может быть пустым.");
      return;
    }

    items[idx].name = name;
    items[idx].qty = qty;

    saveState();
    renderShopping();
    closeModal("edit-shopping");
    toast("Сохранено.");
  }

  function copyShoppingList() {
    var active = ensureActiveTrip();
    var items = Array.isArray(active.items) ? active.items : [];
    if (!items.length) {
      toast("Список пуст.");
      return;
    }

    // Copy only not-done first; if all done, copy all.
    var pending = items.filter(function (i) { return !i.done; });
    var list = pending.length ? pending : items;

    var text = list
      .map(function (i) {
        var q = i.qty && String(i.qty).trim() ? " — " + String(i.qty).trim() : "";
        return "- " + (i.name || "") + q;
      })
      .join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Список скопирован."); },
        function () { toast("Не удалось скопировать. (Проверь разрешения браузера)"); }
      );
    } else {
      // fallback
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("Список скопирован.");
      } catch (e) {
        toast("Не удалось скопировать.");
      }
    }
  }

  function initShopping() {
    if (shoppingForm) {
      shoppingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var product = qs('input[name="product"]', shoppingForm);
        var qty = qs('input[name="qty"]', shoppingForm);
        if (!product) return;

        var name = product.value.trim();
        var q = qty ? qty.value.trim() : "";
        if (!name) return;

        var trip = ensureActiveTrip();
        trip.items = Array.isArray(trip.items) ? trip.items : [];
var newItem = { id: nowId(), name: name, qty: q, done: false };
trip.items.unshift(newItem);

saveState();
renderShopping();

toast("Добавлено в список.", {
  ttl: 6000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var t = ensureActiveTrip();
      var items = t.items || [];
      var idx = items.findIndex(function (x) { return String(x.id) === String(newItem.id); });
      if (idx !== -1) {
        items.splice(idx, 1);
        saveState();
        renderShopping();
        toast("Отменено.");
      }
    }
  }]
});

product.value = "";
if (qty) qty.value = "";
        if (qty) qty.value = "";
      });
    }

    if (shoppingNewTripBtn) shoppingNewTripBtn.addEventListener("click", startNewTrip);
    if (shoppingCopyBtn) shoppingCopyBtn.addEventListener("click", copyShoppingList);
    if (saveShopBtn) saveShopBtn.addEventListener("click", saveEditShoppingItem);

    // current + history actions
    var shoppingView = qs('[data-view="shopping"]');
    if (shoppingView) {
      shoppingView.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-shopping-action]");
        if (!btn) return;

        var action = btn.getAttribute("data-shopping-action");

        // history trip actions
        var tripEl = btn.closest("[data-trip-id]");
        if (tripEl && (action === "reuse" || action === "delete-trip")) {
          var tripId = tripEl.getAttribute("data-trip-id");
          if (action === "reuse") reuseTrip(tripId);
          if (action === "delete-trip") deleteTrip(tripId);
          return;
        }

        // current item actions
        var itemEl = btn.closest("[data-shopping-item-id]");
        if (!itemEl) return;
        var itemId = itemEl.getAttribute("data-shopping-item-id");

        var active = ensureActiveTrip();
        var items = active.items || [];
        var idx = items.findIndex(function (x) { return String(x.id) === String(itemId); });
        if (idx === -1) return;

        if (action === "toggle") {
          items[idx].done = !items[idx].done;
          saveState();
          renderShopping();
          return;
        }

        if (action === "delete") {
var removed = items[idx];
items.splice(idx, 1);
saveState();
renderShopping();

toast("Удалено.", {
  ttl: 7000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var t = ensureActiveTrip();
      t.items = Array.isArray(t.items) ? t.items : [];
      var exists = t.items.some(function (x) { return String(x.id) === String(removed.id); });
      if (exists) return;
      t.items.splice(Math.min(idx, t.items.length), 0, removed);
      saveState();
      renderShopping();
      toast("Отменено.");
    }
  }]
});
return;
        }

        if (action === "edit") {
          openEditShoppingItem(itemId);
          return;
        }
      });
    }
  }

  /* =========================================================
     Code
     ========================================================= */
  var codeForm = qs("[data-code-form]");
  var codeListEl = qs("[data-code-list]");

  function renderCode() {
    if (!codeListEl) return;

    var items = Array.isArray(state.data.code) ? state.data.code : [];
    if (!items.length) {
      codeListEl.innerHTML = '<div class="muted small">Сохрани сюда команды, сниппеты и заметки — и быстро копируй.</div>';
      return;
    }

    codeListEl.innerHTML = items
      .slice()
      .map(function (it) {
        var title = it.title && String(it.title).trim() ? String(it.title).trim() : "Без названия";
        var meta = it.createdAt ? it.createdAt : "";
        return (
          '<article class="card-item code-item" data-code-id="' + it.id + '">' +
            '<div class="code-head">' +
              '<p class="code-title">' + escapeText(title) + "</p>" +
              (meta ? '<div class="item-meta">' + escapeText(meta) + "</div>" : "") +
              '<pre class="code-pre"><code>' + escapeText(it.code || "") + "</code></pre>" +
            "</div>" +
            '<div class="item-actions">' +
              '<button class="mini" type="button" data-code-action="copy" aria-label="Копировать">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg>' +
              "</button>" +
              '<button class="mini mini--danger" type="button" data-code-action="delete" aria-label="Удалить">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>' +
              "</button>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
    highlightAllCode(codeListEl);

  }

  function initCode() {
    if (codeForm) {
      codeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var titleInput = qs('input[name="title"]', codeForm);
        var codeInput = qs('textarea[name="code"]', codeForm);
        if (!codeInput) return;

        var code = codeInput.value.trim();
        var title = titleInput ? titleInput.value.trim() : "";
        if (!code) return;

        var now = new Date();
var item = {
  id: nowId(),
  title: title,
  code: code,
  createdAt: formatDateTimeShort(now)
};

state.data.code.unshift(item);

saveState();
renderCode();

if (titleInput) titleInput.value = "";
codeInput.value = "";

clearDraft(DRAFT_CODE_KEY);
clearDraft(DRAFT_CODE_TITLE_KEY);

toast("Сохранено.", {
  ttl: 7000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var items = state.data.code || [];
      var idx = items.findIndex(function (x) { return String(x.id) === String(item.id); });
      if (idx !== -1) {
        items.splice(idx, 1);
        saveState();
        renderCode();
        toast("Отменено.");
      }
    }
  }]
});
      });
    }

    var codeView = qs('[data-view="code"]');
    if (codeView) {
      codeView.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-code-action]");
        if (!btn) return;
        var action = btn.getAttribute("data-code-action");
        var itemEl = btn.closest("[data-code-id]");
        if (!itemEl) return;

        var id = itemEl.getAttribute("data-code-id");
        var items = state.data.code || [];
        var idx = items.findIndex(function (x) { return String(x.id) === String(id); });
        if (idx === -1) return;

        if (action === "delete") {
var removed = items[idx];
items.splice(idx, 1);
saveState();
renderCode();

toast("Удалено.", {
  ttl: 8000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      var arr = state.data.code || [];
      var exists = arr.some(function (x) { return String(x.id) === String(removed.id); });
      if (exists) return;
      arr.unshift(removed);
      state.data.code = arr;
      saveState();
      renderCode();
      toast("Отменено.");
    }
  }]
});
return;
        }

        if (action === "copy") {
          var txt = items[idx].code || "";
          if (!txt) return;

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(
              function () { toast("Скопировано."); },
              function () { toast("Не удалось скопировать."); }
            );
          } else {
            try {
              var ta = document.createElement("textarea");
              ta.value = txt;
              ta.style.position = "fixed";
              ta.style.left = "-9999px";
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              toast("Скопировано.");
            } catch (e2) {
              toast("Не удалось скопировать.");
            }
          }
        }
      });
    }
  }

  /* =========================================================
     Workout
     ========================================================= */
  var EXERCISE_META = {
    pullups: { label: "Подтягивания" },
    dips: { label: "Брусья" },
    pushups: { label: "Отжимания" },
  };

  function workoutAddSet() {
    var ex = state.workoutSelectedExercise;
    if (!EXERCISE_META[ex]) ex = "pullups";

    var now = new Date();
    var todayKey = getDateKey(now);

    var sessions = state.data.workout || [];
    var session = sessions.find(function (s) {
      return s.dateKey === todayKey && s.exercise === ex;
    });

    if (!session) {
      session = {
        id: nowId(),
        dateKey: todayKey,
        exercise: ex,
        sets: 0,
        totalReps: 0,
        updatedAt: "",
      };
      sessions.push(session);
    }

    session.sets += 1;
    session.totalReps += state.workoutRepsPerSet;
    session.updatedAt = formatTimeShort(now);

    state.data.workout = sessions;
    saveState();
    renderWorkout();

    var sessionId = session.id;
var exKey = ex;

toast("Подход добавлен.", {
  ttl: 7000,
  actions: [
    {
      label: "Отменить",
      onClick: function () {
        var sessions = state.data.workout || [];
        var s = sessions.find(function (x) { return String(x.id) === String(sessionId); });
        if (!s) return;

        // откат 1 подхода
        s.sets = Math.max(0, (s.sets || 0) - 1);
        s.totalReps = Math.max(0, (s.totalReps || 0) - state.workoutRepsPerSet);

        // если стало пусто — удалим запись дня/упражнения
        if ((s.sets || 0) === 0 && (s.totalReps || 0) === 0) {
          state.data.workout = sessions.filter(function (x) { return String(x.id) !== String(sessionId); });
        } else {
          state.data.workout = sessions;
        }

        saveState();
        renderWorkout();
        toast("Отменено.");
      }
    },
    {
      label: "Отдых 60с",
      onClick: function () { startRestTimer(60); }
    }
  ]
});
  }

  function workoutResetToday() {
    var todayKey = getDateKey(new Date());
var prev = (state.data.workout || []).slice();
state.data.workout = prev.filter(function (s) { return s.dateKey !== todayKey; });
saveState();
renderWorkout();

toast("Сегодня сброшено.", {
  ttl: 8000,
  actions: [{
    label: "Отменить",
    onClick: function () {
      state.data.workout = prev;
      saveState();
      renderWorkout();
      toast("Отменено.");
    }
  }]
});
  }

  function renderWorkout() {
    var repsEl = qs("[data-workout-reps]");
    var todayEl = qs("[data-workout-today]");
    var statsEl = qs("[data-workout-stats]");
    var historyEl = qs("[data-workout-history]");

    if (repsEl) repsEl.textContent = String(state.workoutRepsPerSet);

    var sessions = state.data.workout || [];
    var todayKey = getDateKey(new Date());

    // Today text (selected exercise)
    if (todayEl) {
      var sel = state.workoutSelectedExercise;
      var sessToday = sessions.find(function (s) { return s.dateKey === todayKey && s.exercise === sel; });
      if (!sessToday) {
        todayEl.textContent = "Сегодня для этого упражнения подходов пока нет.";
      } else {
        var msg =
          "Сегодня: " +
          (sessToday.sets || 0) +
          " подходов • " +
          (sessToday.totalReps || 0) +
          " повторений";
        if (sessToday.updatedAt) msg += " • " + sessToday.updatedAt;
        todayEl.textContent = msg;
      }
    }

    // Stats: all time + last 7 days
    if (statsEl) {
      var sevenDaysKeys = lastNDaysKeys(7);
      var totalsAll = initWorkoutTotals();
      var totals7 = initWorkoutTotals();

      sessions.forEach(function (s) {
        if (!s || !EXERCISE_META[s.exercise]) return;
        totalsAll[s.exercise].sets += s.sets || 0;
        totalsAll[s.exercise].reps += s.totalReps || 0;
        if (sevenDaysKeys.indexOf(s.dateKey) !== -1) {
          totals7[s.exercise].sets += s.sets || 0;
          totals7[s.exercise].reps += s.totalReps || 0;
        }
      });

      statsEl.innerHTML = Object.keys(EXERCISE_META)
        .map(function (k) {
          var a = totalsAll[k];
          var w = totals7[k];
          return (
            '<div class="stat">' +
              '<p class="stat-title">' + escapeText(EXERCISE_META[k].label) + "</p>" +
              '<div class="stat-sub">Всего: ' + a.sets + " подходов • " + a.reps + " повторений</div>" +
              '<div class="stat-sub">7 дней: ' + w.sets + " подходов • " + w.reps + " повторений</div>" +
            "</div>"
          );
        })
        .join("");
    }

    // History: last 14 days
    if (historyEl) {
      if (!sessions.length) {
        historyEl.innerHTML = '<div class="muted small">История появится после первых подходов.</div>';
        return;
      }

      var keys14 = lastNDaysKeys(14);
      var grouped = {};

      sessions.forEach(function (s) {
        if (!s || !s.dateKey || keys14.indexOf(s.dateKey) === -1) return;
        if (!grouped[s.dateKey]) grouped[s.dateKey] = [];
        grouped[s.dateKey].push(s);
      });

      var dateKeys = Object.keys(grouped).sort(function (a, b) {
        return a < b ? 1 : a > b ? -1 : 0;
      });

      if (!dateKeys.length) {
        historyEl.innerHTML = '<div class="muted small">За последние 14 дней записей нет.</div>';
        return;
      }

      historyEl.innerHTML = dateKeys
        .map(function (dk) {
          var daySessions = grouped[dk] || [];
          var totalSets = daySessions.reduce(function (acc, s) { return acc + (s.sets || 0); }, 0);

          var rows = daySessions
            .slice()
            .sort(function (a, b) {
              // stable-ish: by exercise label
              return (EXERCISE_META[a.exercise].label || "").localeCompare(EXERCISE_META[b.exercise].label || "");
            })
            .map(function (s) {
              var label = EXERCISE_META[s.exercise] ? EXERCISE_META[s.exercise].label : s.exercise;
              var right = (s.sets || 0) + " • " + (s.totalReps || 0) + (s.updatedAt ? " • " + s.updatedAt : "");
              return '<div class="day-row"><span>' + escapeText(label) + "</span><span>" + escapeText(right) + "</span></div>";
            })
            .join("");

          return (
            '<div class="day">' +
              '<div class="day-head">' +
                '<div class="day-date">' + escapeText(formatDateLabelFromKey(dk)) + "</div>" +
                '<div class="day-meta">' + escapeText(totalSets + " подходов") + "</div>" +
              "</div>" +
              '<div class="day-rows">' + rows + "</div>" +
            "</div>"
          );
        })
        .join("");
    }
  }

  function initWorkoutTotals() {
    return {
      pullups: { sets: 0, reps: 0 },
      dips: { sets: 0, reps: 0 },
      pushups: { sets: 0, reps: 0 },
    };
  }

  function lastNDaysKeys(n) {
    var out = [];
    var now = new Date();
    for (var i = 0; i < n; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push(getDateKey(d));
    }
    return out;
  }
function startRestTimer(seconds) {
  var sec = Number(seconds || 60) || 60;
  if (sec < 5) sec = 5;

  var toastEl = toast("Отдых: " + sec + "с", { ttl: 0 });
  if (!toastEl) return;

  var textEl = qs(".toast-text", toastEl);
  var closed = false;

  function closeTimer() {
    if (closed) return;
    closed = true;
    try {
      if (toastEl && toastEl.parentNode === toastsEl) toastsEl.removeChild(toastEl);
    } catch (e) {}
  }

  // вставим “Стоп” перед крестиком
  var actionsEl = qs(".toast-actions", toastEl);
  if (actionsEl) {
    var stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "toast-btn";
    stopBtn.textContent = "Стоп";
    stopBtn.addEventListener("click", function () {
      closeTimer();
    });
    actionsEl.insertBefore(stopBtn, actionsEl.firstChild);
  }

  var timer = setInterval(function () {
    if (closed) { clearInterval(timer); return; }
    sec -= 1;

    if (sec <= 0) {
      clearInterval(timer);
      closeTimer();
      toast("Отдых закончен ✅", { ttl: 2600 });
      try { if (navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch (e) {}
      return;
    }

    if (textEl) textEl.textContent = "Отдых: " + sec + "с";
  }, 1000);
}

  function initWorkout() {
    // Chips (exercise)
    qsa("[data-workout-exercise]").forEach(function (chip) {
      var key = chip.getAttribute("data-workout-exercise");
      chip.classList.toggle("is-active", key === state.workoutSelectedExercise);

      chip.addEventListener("click", function () {
        state.workoutSelectedExercise = key;
        saveState();
        qsa("[data-workout-exercise]").forEach(function (c) {
          c.classList.toggle("is-active", c.getAttribute("data-workout-exercise") === state.workoutSelectedExercise);
        });
        renderWorkout();
      });
    });

    // +/- reps
    var dec = qs("[data-workout-dec]");
    var inc = qs("[data-workout-inc]");

    if (dec) {
      dec.addEventListener("click", function () {
        if (state.workoutRepsPerSet > 1) {
          state.workoutRepsPerSet -= 1;
          saveState();
          renderWorkout();
        }
      });
    }

    if (inc) {
      inc.addEventListener("click", function () {
        if (state.workoutRepsPerSet < 200) {
          state.workoutRepsPerSet += 1;
          saveState();
          renderWorkout();
        }
      });
    }

    // add set
    var addBtn = qs("[data-workout-add]");
    if (addBtn) addBtn.addEventListener("click", workoutAddSet);

    // reset today
    var resetBtn = qs("[data-workout-reset-today]");
    if (resetBtn) resetBtn.addEventListener("click", workoutResetToday);
  }

  /* =========================================================
     Global Search
     ========================================================= */
  var searchInput = qs("#global-search");
  var searchView = qs('[data-view="search"]');
  var searchResultsEl = qs("[data-search-results]");
  var searchSubtitleEl = qs("[data-search-subtitle]");
  var searchCloseBtn = qs("[data-search-close]");

  var lastNonSearchView = state.activeView || "tasks";
  var searchTimer = null;

  function escapeText(str) {
    if (str == null) return "";
    return String(str).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        default: return ch;
      }
    });
  }
function escapeRegExp(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text, query) {
  var t = String(text || "");
  var q = String(query || "");
  if (!q) return escapeText(t);

  var re;
  try { re = new RegExp(escapeRegExp(q), "ig"); } catch (e) { return escapeText(t); }

  var out = [];
  var last = 0;

  t.replace(re, function (m, offset) {
    out.push(escapeText(t.slice(last, offset)));
    out.push('<mark class="mark">' + escapeText(m) + "</mark>");
    last = offset + m.length;
    return m;
  });

  out.push(escapeText(t.slice(last)));
  return out.join("");
}

  function isSearchActive() {
    return !!(searchView && searchView.classList.contains("is-active"));
  }

  function clearSearchUI() {
    if (searchInput) searchInput.value = "";
  }

  function openSearchView() {
    if (!searchView) return;
    lastNonSearchView = currentVisibleView() || lastNonSearchView;
    qsa(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.getAttribute("data-view") === "search");
    });
  }

  function closeSearch() {
    clearSearchUI();
    // show last view
    qsa(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.getAttribute("data-view") === lastNonSearchView);
    });
    setActiveClassByDataNav(lastNonSearchView);
  }

  function currentVisibleView() {
    var v = qsa(".view").find(function (el) { return el.classList.contains("is-active"); });
    return v ? v.getAttribute("data-view") : null;
  }

  function initSearch() {
    if (!searchInput || !searchResultsEl) return;

    function runSearch(q) {
      q = (q || "").trim();
      if (!q) {
        if (isSearchActive()) closeSearch();
        return;
      }

      openSearchView();
      renderSearchResults(q);
    }

    searchInput.addEventListener("input", function () {
      var q = searchInput.value || "";
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { runSearch(q); }, 180);
    });

    if (searchCloseBtn) {
      searchCloseBtn.addEventListener("click", function () {
        closeSearch();
      });
    }

    // Click on result -> jump to category (and optionally toggle to it)
    searchResultsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-search-open]");
      if (!btn) return;
      var cat = btn.getAttribute("data-search-open");
      if (!cat) return;

      // Close search and open the target view
      lastNonSearchView = cat;
      closeSearch();
      setActiveView(cat);
    });
  }

  function renderSearchResults(query) {
    var q = query.toLowerCase();
    var results = [];

    // tasks: search in textContent of sanitized html
    (state.data.tasks || []).forEach(function (t) {
      var text = stripHtmlToText(t.html || "");
      if (text.toLowerCase().indexOf(q) !== -1) {
        results.push({
          cat: "tasks",
          title: text,
          meta: t.done ? "Готово" : "Активно",
        });
      }
    });

    // shopping: active + history items
    (state.data.shopping || []).forEach(function (trip) {
      var items = Array.isArray(trip.items) ? trip.items : [];
      items.forEach(function (it) {
        var name = (it.name || "").toLowerCase();
        if (name.indexOf(q) !== -1) {
          results.push({
            cat: "shopping",
            title: (it.name || ""),
            meta: (trip.name || "Поход") + (it.done ? " • куплено" : ""),
          });
        }
      });
    });

    // code: title/code
    (state.data.code || []).forEach(function (c) {
      var title = (c.title || "").toLowerCase();
      var code = (c.code || "").toLowerCase();
      if (title.indexOf(q) !== -1 || code.indexOf(q) !== -1) {
        results.push({
          cat: "code",
          title: c.title && String(c.title).trim() ? c.title : "Без названия",
          meta: c.createdAt ? c.createdAt : "Сниппет",
        });
      }
    });

    // workout: exercise names and date keys
    (state.data.workout || []).forEach(function (s) {
      var label = EXERCISE_META[s.exercise] ? EXERCISE_META[s.exercise].label : s.exercise;
      var hay = (label + " " + (s.dateKey || "")).toLowerCase();
      if (hay.indexOf(q) !== -1) {
        results.push({
          cat: "workout",
          title: label,
          meta: formatDateLabelFromKey(s.dateKey) + " • " + (s.sets || 0) + " подходов",
        });
      }
    });

    if (searchSubtitleEl) {
      searchSubtitleEl.textContent =
        results.length ? ("Найдено: " + results.length + " • запрос: “" + query + "”") : ("Ничего не найдено • “" + query + "”");
    }

    if (!results.length) {
      searchResultsEl.innerHTML =
        '<div class="muted small">Ничего не найдено. Попробуй другой запрос.</div>';
      return;
    }

    // Limit + keep it readable
    results = results.slice(0, 60);

    searchResultsEl.innerHTML = results
      .map(function (r) {
        var icon =
          r.cat === "tasks" ? "#i-list" :
          r.cat === "shopping" ? "#i-cart" :
          r.cat === "code" ? "#i-code" :
          "#i-dumbbell";

        return (
          '<article class="card-item">' +
            '<button class="check" type="button" data-search-open="' + r.cat + '" aria-label="Открыть раздел">' +
              '<svg class="icon" aria-hidden="true"><use href="' + icon + '"></use></svg>' +
            "</button>" +
            '<div class="item-body">' +
              '<p class="item-title">' + highlightMatch(r.title, query) + "</p>" +
              (r.meta ? '<div class="item-meta">' + escapeText(r.meta) + "</div>" : "") +
            "</div>" +
            '<div class="item-actions">' +
              '<button class="mini" type="button" data-search-open="' + r.cat + '" aria-label="Перейти">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg>' +
              "</button>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function stripHtmlToText(html) {
    try {
      var div = document.createElement("div");
      div.innerHTML = html || "";
      return (div.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }

  /* =========================================================
     Settings: Export / Import / Wipe
     ========================================================= */
  function initSettings() {
    var exportBtn = qs("[data-export]");
    var importInput = qs("[data-import]");
    var wipeBtn = qs("[data-wipe]");

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var payload = {
          version: 4,
          exportedAt: new Date().toISOString(),
          state: state,
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);

        var a = document.createElement("a");
        a.href = url;
        a.download = "letget-backup-v4.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 3000);
        toast("Экспорт готов.");
      });
    }

    if (importInput) {
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function () {
          var raw = String(reader.result || "");
          var parsed = safeJsonParse(raw);
          if (!parsed) {
            toast("Импорт: файл не похож на JSON.");
            return;
          }

          // Accept {state:...} or direct state or direct data
          var incoming = null;
          if (parsed.state && typeof parsed.state === "object") incoming = parsed.state;
          else incoming = parsed;

          // If only data provided
          if (incoming && incoming.data && typeof incoming.data === "object") {
            state = normalizeStateShape(incoming);
          } else if (incoming && (incoming.tasks || incoming.shopping || incoming.code || incoming.workout)) {
            state = normalizeStateShape({ data: incoming });
          } else {
            toast("Импорт: структура не распознана.");
            return;
          }

          // Normalize internals (important)
          state.data.shopping = normalizeShoppingTrips(state.data.shopping);
          state.data.workout = normalizeWorkoutSessions(state.data.workout);

          saveState();
          closeModal("settings");
          renderAll();
          toast("Импорт выполнен.");
        };
        reader.readAsText(file);

        // reset input so same file can be imported again if needed
        importInput.value = "";
      });
    }

    if (wipeBtn) {
      wipeBtn.addEventListener("click", function () {
        var ok = window.confirm("Точно стереть все данные LETget на этом устройстве?");
        if (!ok) return;

        try {
          localStorage.removeItem(STORAGE_KEY_V4);
        } catch (e) {}

        // also optionally clean legacy keys (don’t touch unrelated stuff)
        try { localStorage.removeItem(STORAGE_KEY_V3); } catch (e2) {}
        try { localStorage.removeItem("tasks"); } catch (e3) {}

        // reload for clean UI
        window.location.reload();
      });
    }
  }
function loadDraft(key) {
  try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
}
function saveDraft(key, val) {
  try { localStorage.setItem(key, String(val || "")); } catch (e) {}
}
function clearDraft(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

function initDrafts() {
  // Tasks draft
  if (tasksComposerEl) {
    var tDraft = loadDraft(DRAFT_TASK_KEY);
    if (tDraft && rteIsEmpty(tasksComposerEl)) {
      tasksComposerEl.innerHTML = tDraft;
    }
    var saveTaskDraft = debounce(function () {
      saveDraft(DRAFT_TASK_KEY, tasksComposerEl.innerHTML || "");
    }, 250);
    tasksComposerEl.addEventListener("input", saveTaskDraft);
  }

  // Code draft
  if (codeForm) {
    var titleInput = qs('input[name="title"]', codeForm);
    var codeInput = qs('textarea[name="code"]', codeForm);

    var cTitle = loadDraft(DRAFT_CODE_TITLE_KEY);
    var cDraft = loadDraft(DRAFT_CODE_KEY);

    if (titleInput && cTitle && !titleInput.value) titleInput.value = cTitle;
    if (codeInput && cDraft && !codeInput.value) codeInput.value = cDraft;

    var saveCodeDraft = debounce(function () {
      if (titleInput) saveDraft(DRAFT_CODE_TITLE_KEY, titleInput.value || "");
      if (codeInput) saveDraft(DRAFT_CODE_KEY, codeInput.value || "");
    }, 250);

    if (titleInput) titleInput.addEventListener("input", saveCodeDraft);
    if (codeInput) codeInput.addEventListener("input", saveCodeDraft);
  }
}
  /* =========================================================
     Render all
     ========================================================= */
  function renderAll() {
    renderTasks();
    renderShopping();
    renderCode();
    renderWorkout();
  }
function initShortcuts() {
  document.addEventListener("keydown", function (e) {
    var meta = e.ctrlKey || e.metaKey;
    if (!meta) return;

    var key = String(e.key || "").toLowerCase();

    // Ctrl/Cmd+K — поиск
    if (key === "k") {
      e.preventDefault();
      if (searchInput) {
        try { searchInput.focus(); searchInput.select(); } catch (e1) {}
      }
      return;
    }

    // Ctrl/Cmd+Shift+1..4 — разделы
    if (e.shiftKey) {
      var map = { "1": "tasks", "2": "shopping", "3": "code", "4": "workout" };
      var target = map[String(e.key || "")];
      if (target) {
        e.preventDefault();
        clearSearchUI();
        setActiveView(target);
        return;
      }
    }

    // Ctrl/Cmd+N — фокус на “добавление” в текущем разделе
    if (key === "n") {
      e.preventDefault();
      var v = currentVisibleView();
      if (v === "tasks" && tasksComposerEl) { try { tasksComposerEl.focus(); } catch (e2) {} }
      if (v === "code" && codeForm) {
        var ci = qs('textarea[name="code"]', codeForm);
        if (ci) try { ci.focus(); } catch (e3) {}
      }
    }
  });
}

  /* =========================================================
     Boot
     ========================================================= */
function boot() {
  initClock();
  initNetworkBadge();

  initDrawer();
  initModals();
  initNavigation();

  initTasks();
  initShopping();
  initCode();
  initWorkout();
  initSearch();
  initSettings();

  initDrafts();
  initShortcuts();

  setActiveView(state.activeView || "tasks");
  renderAll();
}

  boot();
})();
