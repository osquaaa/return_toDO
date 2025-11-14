(function () {
  "use strict";

  var STORAGE_KEY = "letget_v3";
  var THEME_KEY = "letget_theme";
  var categories = ["tasks", "shopping", "code", "workout"];

  var selectedExercise = "pullups";
  var workoutRepsPerSet = 8;
  var taskFilter = "all";

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.data) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function migrateLegacyTasks() {
    var legacyRaw = localStorage.getItem("tasks");
    var tasks = [];
    if (!legacyRaw) return tasks;
    try {
      var legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy)) {
        tasks = legacy.map(function (item) {
          return {
            id: item.id || Date.now() + Math.random(),
            text: item.text || "",
            done: !!item.done,
            createdAt: item.createdAt || null,
          };
        });
      }
    } catch (e) {}
    return tasks;
  }

  function createInitialData() {
    return {
      tasks: migrateLegacyTasks(),
      shopping: [],
      code: [],
      workout: [],
    };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  var state = loadState();
  if (!state) {
    state = {
      activeCategory: "tasks",
      data: createInitialData(),
      taskFilter: "all",
      workoutSelectedExercise: "pullups",
      workoutRepsPerSet: 8,
    };
    saveState(state);
  } else {
    if (!state.data) {
      state.data = createInitialData();
    }
    if (!Array.isArray(state.data.tasks)) {
      state.data.tasks = [];
    }
    if (!Array.isArray(state.data.shopping)) {
      state.data.shopping = [];
    }
    if (!Array.isArray(state.data.code)) {
      state.data.code = [];
    }
    if (!Array.isArray(state.data.workout)) {
      state.data.workout = [];
    }
    if (
      !state.activeCategory ||
      categories.indexOf(state.activeCategory) === -1
    ) {
      state.activeCategory = "tasks";
    }
  }
  if (!state.hiddenHints || typeof state.hiddenHints !== "object") {
    state.hiddenHints = {};
  }
  // ---- helpers: dates ----
  function getDateKey(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatDateTimeShort(date) {
    try {
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function formatDateLabelFromKey(key) {
    var parts = key ? key.split("-") : null;
    if (!parts || parts.length !== 3) return "";
    var year = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var day = Number(parts[2]);
    var d = new Date(year, month, day);
    try {
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch (e) {
      return key;
    }
  }

  // ---- migrations for shopping & workout ----
  function migrateShoppingFromFlatItems() {
    var arr = state.data.shopping;
    if (!Array.isArray(arr) || !arr.length) return;
    // if first element already looks like trip with items -> assume new format
    if (arr[0] && Array.isArray(arr[0].items)) {
      return;
    }
    var items = arr;
    var now = new Date();
    var trip = {
      id: now.getTime(),
      name: "Поход в магазин",
      createdAt: formatDateTimeShort(now),
      dateKey: getDateKey(now),
      items: [],
    };
    trip.items = items.map(function (item) {
      return {
        id: item.id || Date.now() + Math.random(),
        name: item.text || "",
        qty: "",
        done: !!item.done,
      };
    });
    state.data.shopping = [trip];
  }

  function migrateWorkoutFromOldFormat() {
    var arr = state.data.workout;
    if (!Array.isArray(arr) || !arr.length) return;
    if (
      !arr[0] ||
      !Object.prototype.hasOwnProperty.call(arr[0], "completedSets")
    ) {
      // already new format or empty
      return;
    }
    var sessions = [];
    arr.forEach(function (oldItem) {
      if (!oldItem || !oldItem.exercise) return;
      var sets = Number(oldItem.completedSets || oldItem.totalSets || 0) || 0;
      var reps = Number(oldItem.reps || 0) || 0;
      var totalReps = sets * reps;
      var dateKey = getDateKey(new Date());
      if (oldItem.createdAt) {
        // best-effort parse "dd.mm, hh:mm"
        var parts = oldItem.createdAt.split(",");
        if (parts[0]) {
          var dp = parts[0].trim().split(".");
          if (dp.length >= 2) {
            var day = Number(dp[0]) || 1;
            var month = Number(dp[1]) - 1 || 0;
            var now = new Date();
            var year = now.getFullYear();
            dateKey = getDateKey(new Date(year, month, day));
          }
        }
      }
      sessions.push({
        id: oldItem.id || Date.now() + Math.random(),
        dateKey: dateKey,
        dateLabel: oldItem.createdAt || "",
        exercise: normalizeExerciseKey(oldItem.exercise),
        sets: sets,
        totalReps: totalReps,
      });
    });
    state.data.workout = sessions;
  }

  function normalizeExerciseKey(name) {
    if (!name) return "pullups";
    var lower = String(name).toLowerCase();
    if (lower.indexOf("подтяг") !== -1) return "pullups";
    if (lower.indexOf("брусь") !== -1) return "dips";
    if (lower.indexOf("отжим") !== -1) return "pushups";
    return "pullups";
  }

  migrateShoppingFromFlatItems();
  migrateWorkoutFromOldFormat();

  // initialize filter & workout settings from state
  if (state.taskFilter) {
    taskFilter = state.taskFilter;
  }
  if (state.workoutSelectedExercise) {
    selectedExercise = state.workoutSelectedExercise;
  }
  if (state.workoutRepsPerSet) {
    workoutRepsPerSet = state.workoutRepsPerSet;
  }

  saveState(state);

  // ---- clock ----
  function updateClock() {
    var hoursEl = document.querySelector("[data-time='hours']");
    var minutesEl = document.querySelector("[data-time='minutes']");
    var dateEl = document.querySelector("[data-time='date']");
    if (!hoursEl || !minutesEl || !dateEl) return;

    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");

    hoursEl.textContent = h;
    minutesEl.textContent = m;

    try {
      var dateStr = now.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (dateStr && dateStr.length) {
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }
      dateEl.textContent = dateStr;
    } catch (e) {
      dateEl.textContent = "";
    }
  }

  function initClock() {
    updateClock();
    setInterval(updateClock, 60 * 1000);
  }

  // ---- theme ----
  function initTheme() {
    var toggle = document.getElementById("theme-toggle");
    var saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {}

    if (saved === "light") {
      document.body.classList.add("light-theme");
    }

    if (!toggle) return;

    toggle.addEventListener("click", function () {
      document.body.classList.toggle("light-theme");
      var theme = document.body.classList.contains("light-theme")
        ? "light"
        : "dark";
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {}
    });
  }

  // ---- tabs ----
  // ---- tabs ----
  function initTabs() {
    var tabButtons = document.querySelectorAll(".tab");
    var panels = document.querySelectorAll(".panel");
    var indicator = document.querySelector(".tabs__indicator");

    if (!tabButtons.length || !panels.length) return;

    function moveIndicator(name) {
      if (!indicator) return;
      var activeBtn = document.querySelector('.tab[data-tab="' + name + '"]');
      if (!activeBtn) return;

      var rect = activeBtn.getBoundingClientRect();
      var parentRect = activeBtn.parentElement.getBoundingClientRect();
      var width = rect.width;
      var offset = rect.left - parentRect.left;

      indicator.style.width = width + "px";
      indicator.style.transform = "translateX(" + offset + "px)";
    }

    function setActiveTab(name) {
      state.activeCategory = name;
      saveState(state);

      tabButtons.forEach(function (btn) {
        btn.classList.toggle(
          "is-active",
          btn.getAttribute("data-tab") === name
        );
      });
      panels.forEach(function (panel) {
        panel.classList.toggle(
          "is-active",
          panel.getAttribute("data-panel") === name
        );
      });

      moveIndicator(name);
    }

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab");
        if (!target || categories.indexOf(target) === -1) return;
        setActiveTab(target);
      });
    });

    // начальная установка
    var initial = state.activeCategory || "tasks";
    setActiveTab(initial);

    // на ресайз подстраиваем индикатор
    window.addEventListener("resize", function () {
      moveIndicator(state.activeCategory || "tasks");
    });
  }

  // ---- utils ----
  function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return ch;
      }
    });
  }

  // ---- render helpers ----
  function renderTaskItem(item) {
    var created =
      item.createdAt && item.createdAt.length
        ? '<span class="item-meta">' + escapeHTML(item.createdAt) + "</span>"
        : "";
    return (
      '<article class="item ' +
      (item.done ? "item--done" : "") +
      '" data-id="' +
      item.id +
      '" data-category="tasks">' +
      '<div class="item-main">' +
      '<div class="item-bullet">✓</div>' +
      '<div class="item-content">' +
      '<div class="item-title">' +
      escapeHTML(item.text || "") +
      "</div>" +
      created +
      "</div>" +
      "</div>" +
      '<div class="item-actions">' +
      '<button class="icon-button" type="button" data-action="toggle" title="Отметить как выполненное">' +
      '<span class="icon">✓</span>' +
      "</button>" +
      '<button class="icon-button" type="button" data-action="edit" title="Изменить текст">' +
      '<span class="icon">✎</span>' +
      "</button>" +
      '<button class="icon-button icon-button--danger" type="button" data-action="delete" title="Удалить">' +
      '<span class="icon">✕</span>' +
      "</button>" +
      "</div>" +
      "</article>"
    );
  }

  function renderCodeItem(item) {
    var title =
      item.title && item.title.trim() ? item.title.trim() : "Без названия";
    var createdCode = item.createdAt
      ? '<span class="item-meta">' + escapeHTML(item.createdAt) + "</span>"
      : "";
    return (
      '<article class="item item--code" data-id="' +
      item.id +
      '" data-category="code">' +
      '<header class="item-header">' +
      '<div class="item-header-main">' +
      '<h3 class="item-title">' +
      escapeHTML(title) +
      "</h3>" +
      createdCode +
      "</div>" +
      '<div class="item-actions">' +
      '<button class="icon-button" type="button" data-action="copy" title="Скопировать">' +
      '<span class="icon">⧉</span>' +
      "</button>" +
      '<button class="icon-button icon-button--danger" type="button" data-action="delete" title="Удалить">' +
      '<span class="icon">✕</span>' +
      "</button>" +
      "</div>" +
      "</header>" +
      '<pre class="code-block"><code>' +
      escapeHTML(item.code || "") +
      "</code></pre>" +
      "</article>"
    );
  }

  function renderTasks() {
    var listEl = document.querySelector('.items-list[data-category="tasks"]');
    if (!listEl) return;

    var items = state.data.tasks || [];
    var totalCount = items.length;
    var activeCount = items.filter(function (i) {
      return !i.done;
    }).length;

    var filtered = items;
    if (taskFilter === "active") {
      filtered = items.filter(function (i) {
        return !i.done;
      });
    } else if (taskFilter === "done") {
      filtered = items.filter(function (i) {
        return i.done;
      });
    }

    if (!filtered.length) {
      listEl.innerHTML =
        '<div class="empty">' +
        '<div class="empty-icon">🌿</div>' +
        '<div class="empty-title">Нет задач</div>' +
        '<div class="empty-hint">Добавьте задачу, чтобы ничего не забыть.</div>' +
        "</div>";
    } else {
      var html = filtered
        .slice()
        .map(function (item) {
          return renderTaskItem(item);
        })
        .join("");
      listEl.innerHTML = html;
    }

    var counterEl = document.querySelector("[data-tasks-counter]");
    if (counterEl) {
      counterEl.textContent =
        "Всего: " + totalCount + " • Активные: " + activeCount;
    }

    var chips = document.querySelectorAll("[data-task-filter]");
    chips.forEach(function (chip) {
      var value = chip.getAttribute("data-task-filter");
      chip.classList.toggle("is-active", value === taskFilter);
    });
  }

  function renderCode() {
    var listEl = document.querySelector('.items-list[data-category="code"]');
    if (!listEl) return;

    var items = state.data.code || [];
    if (!items.length) {
      listEl.innerHTML =
        '<div class="empty">' +
        '<div class="empty-icon">⌘</div>' +
        '<div class="empty-title">Нет сохранённого кода</div>' +
        '<div class="empty-hint">Сохраните часто используемые куски кода.</div>' +
        "</div>";
      return;
    }

    var html = items
      .slice()
      .map(function (item) {
        return renderCodeItem(item);
      })
      .join("");
    listEl.innerHTML = html;
  }

  // ---- shopping ----
  function ensureActiveTrip() {
    if (!Array.isArray(state.data.shopping)) {
      state.data.shopping = [];
    }
    if (!state.data.shopping.length) {
      var now = new Date();
      var trip = {
        id: now.getTime(),
        name: "Поход в магазин",
        createdAt: formatDateTimeShort(now),
        dateKey: getDateKey(now),
        items: [],
      };
      state.data.shopping.unshift(trip);
      saveState(state);
      return trip;
    }
    return state.data.shopping[0];
  }

  function renderShopping() {
    var currentContainer = document.querySelector("[data-shopping-current]");
    var historyContainer = document.querySelector("[data-shopping-history]");
    var metaEl = document.querySelector("[data-shopping-current-meta]");

    if (!currentContainer || !historyContainer) return;

    var trips = state.data.shopping || [];
    var activeTrip = ensureActiveTrip();
    trips = state.data.shopping || [];

    // current trip meta
    var items = activeTrip.items || [];
    var bought = items.filter(function (i) {
      return i.done;
    }).length;
    if (metaEl) {
      if (!items.length) {
        metaEl.textContent = "Список пуст — добавьте первый продукт.";
      } else {
        metaEl.textContent = bought + " из " + items.length + " куплено";
      }
    }

    // current items list
    if (!items.length) {
      currentContainer.innerHTML =
        '<div class="empty">' +
        '<div class="empty-icon">🛒</div>' +
        '<div class="empty-title">Список покупок пуст</div>' +
        '<div class="empty-hint">Напишите, что взять в магазине.</div>' +
        "</div>";
    } else {
      var html = items
        .slice()
        .map(function (item) {
          var qty =
            item.qty && String(item.qty).trim().length
              ? '<div class="shopping-item-qty">' +
                escapeHTML(String(item.qty)) +
                "</div>"
              : "";
          return (
            '<article class="item ' +
            (item.done ? "item--done" : "") +
            '" data-shopping-item-id="' +
            item.id +
            '">' +
            '<div class="item-main">' +
            '<div class="item-bullet">🛒</div>' +
            '<div class="item-content">' +
            '<div class="shopping-item-name">' +
            escapeHTML(item.name || "") +
            "</div>" +
            qty +
            "</div>" +
            "</div>" +
            '<div class="item-actions">' +
            '<button class="icon-button" type="button" data-shopping-action="toggle-item" title="Отметить как купленное">' +
            '<span class="icon">✓</span>' +
            "</button>" +
            '<button class="icon-button" type="button" data-shopping-action="edit-item" title="Изменить">' +
            '<span class="icon">✎</span>' +
            "</button>" +
            '<button class="icon-button icon-button--danger" type="button" data-shopping-action="delete-item" title="Удалить">' +
            '<span class="icon">✕</span>' +
            "</button>" +
            "</div>" +
            "</article>"
          );
        })
        .join("");
      currentContainer.innerHTML = html;
    }

    // history
    var historyTrips = trips.slice(1); // everything except active
    if (!historyTrips.length) {
      historyContainer.innerHTML =
        '<div class="shopping-history-list">' +
        '<div class="shopping-history-hint">Пока нет прошлых походов. Каждый новый поход появится здесь.</div>' +
        "</div>";
      return;
    }

    var historyHtml = historyTrips
      .map(function (trip) {
        var list = trip.items || [];
        var boughtCount = list.filter(function (i) {
          return i.done;
        }).length;
        var previewNames = list
          .slice(0, 3)
          .map(function (i) {
            return i.name || "";
          })
          .filter(function (name) {
            return name && name.trim().length;
          });
        var preview =
          previewNames.length > 0
            ? '<div class="shopping-trip-preview">' +
              escapeHTML(previewNames.join(", ")) +
              (list.length > previewNames.length ? "…" : "") +
              "</div>"
            : "";

        return (
          '<article class="shopping-trip" data-trip-id="' +
          trip.id +
          '">' +
          '<div class="shopping-trip-main">' +
          '<div class="shopping-trip-title">' +
          escapeHTML(trip.name || "Поход") +
          "</div>" +
          '<div class="shopping-trip-meta">' +
          (trip.createdAt ? escapeHTML(trip.createdAt) + " · " : "") +
          list.length +
          " позиций · " +
          boughtCount +
          " куплено" +
          "</div>" +
          preview +
          "</div>" +
          '<div class="shopping-trip-actions">' +
          '<button class="pill-button" type="button" data-shopping-action="reuse-trip">Повторить</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    historyContainer.innerHTML =
      '<div class="shopping-history-list">' + historyHtml + "</div>";
  }

  function initShopping() {
    var form = document.querySelector(".shopping-form");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var productInput = form.querySelector('input[name="product"]');
        var qtyInput = form.querySelector('input[name="qty"]');
        if (!productInput) return;

        var name = productInput.value.trim();
        var qty = qtyInput && qtyInput.value ? qtyInput.value.trim() : "";
        if (!name) return;

        var trip = ensureActiveTrip();
        var newItem = {
          id: Date.now(),
          name: name,
          qty: qty,
          done: false,
        };
        trip.items.unshift(newItem);
        saveState(state);
        renderShopping();
        productInput.value = "";
        if (qtyInput) qtyInput.value = "";
      });
    }

    var panel = document.querySelector('[data-panel="shopping"]');
    if (!panel) return;

    panel.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-shopping-action]");
      if (!btn) return;

      var action = btn.getAttribute("data-shopping-action");
      if (!action) return;

      if (action === "new-trip") {
        var now = new Date();
        var newTrip = {
          id: now.getTime(),
          name: "Поход от " + formatDateLabelFromKey(getDateKey(now)),
          createdAt: formatDateTimeShort(now),
          dateKey: getDateKey(now),
          items: [],
        };
        state.data.shopping.unshift(newTrip);
        saveState(state);
        renderShopping();
        return;
      }

      if (action === "reuse-trip") {
        var tripEl = btn.closest(".shopping-trip");
        if (!tripEl) return;
        var tripId = Number(tripEl.getAttribute("data-trip-id"));
        if (!tripId) return;
        var trips = state.data.shopping || [];
        var original = trips.find(function (t) {
          return t.id === tripId;
        });
        if (!original) return;
        var now2 = new Date();
        var clone = {
          id: now2.getTime(),
          name: (original.name || "Поход") + " (повтор)",
          createdAt: formatDateTimeShort(now2),
          dateKey: getDateKey(now2),
          items: (original.items || []).map(function (item) {
            return {
              id: Date.now() + Math.random(),
              name: item.name || "",
              qty: item.qty || "",
              done: false,
            };
          }),
        };
        state.data.shopping.unshift(clone);
        saveState(state);
        renderShopping();
        return;
      }

      // actions with current trip items
      var itemEl = btn.closest("[data-shopping-item-id]");
      if (!itemEl) return;
      var itemId = Number(itemEl.getAttribute("data-shopping-item-id"));
      if (!itemId) return;

      var activeTrip = ensureActiveTrip();
      var items = activeTrip.items || [];
      var index = items.findIndex(function (i) {
        return i.id === itemId;
      });
      if (index === -1) return;
      var item = items[index];

      if (action === "toggle-item") {
        item.done = !item.done;
        saveState(state);
        renderShopping();
        return;
      }

      if (action === "delete-item") {
        items.splice(index, 1);
        saveState(state);
        renderShopping();
        return;
      }

      if (action === "edit-item") {
        if (itemEl.classList.contains("item--editing")) return;
        itemEl.classList.add("item--editing");
        var contentEl = itemEl.querySelector(".item-content");
        if (!contentEl) return;
        var currentName = item.name || "";
        var currentQty = item.qty || "";
        contentEl.innerHTML =
          '<div class="edit-inline">' +
          '<input class="input input--inline-edit" type="text" name="editName" value="' +
          escapeHTML(currentName) +
          '" />' +
          "</div>" +
          '<div class="edit-inline" style="margin-top:6px;">' +
          '<input class="input input--inline-edit" type="text" name="editQty" placeholder="Кол-во" value="' +
          escapeHTML(currentQty) +
          '" />' +
          "</div>" +
          '<div class="edit-inline" style="margin-top:6px;">' +
          '<button class="icon-button" type="button" data-shopping-action="save-edit-item"><span class="icon">✓</span></button>' +
          '<button class="icon-button" type="button" data-shopping-action="cancel-edit-item"><span class="icon">✕</span></button>' +
          "</div>";
        var nameInput = contentEl.querySelector('input[name="editName"]');
        if (nameInput) {
          nameInput.focus();
          var len = nameInput.value.length;
          try {
            nameInput.setSelectionRange(len, len);
          } catch (e) {}
        }
        return;
      }

      if (action === "save-edit-item") {
        var content = itemEl.querySelector(".item-content");
        if (!content) return;
        var nameInput2 = content.querySelector('input[name="editName"]');
        var qtyInput2 = content.querySelector('input[name="editQty"]');
        if (!nameInput2) return;
        var newName = nameInput2.value.trim();
        var newQty = qtyInput2 && qtyInput2.value ? qtyInput2.value.trim() : "";
        if (newName) {
          item.name = newName;
          item.qty = newQty;
          saveState(state);
        }
        renderShopping();
        return;
      }

      if (action === "cancel-edit-item") {
        renderShopping();
        return;
      }
    });
  }

  // ---- workout ----
  var EXERCISE_META = {
    pullups: { label: "Подтягивания" },
    dips: { label: "Брусья" },
    pushups: { label: "Отжимания" },
  };

  function addWorkoutSet(exerciseKey) {
    if (!EXERCISE_META[exerciseKey]) {
      exerciseKey = "pullups";
    }
    var todayKey = getDateKey(new Date());
    var sessions = state.data.workout || [];
    var session = sessions.find(function (s) {
      return s.dateKey === todayKey && s.exercise === exerciseKey;
    });
    if (!session) {
      session = {
        id: Date.now(),
        dateKey: todayKey,
        dateLabel: "",
        exercise: exerciseKey,
        sets: 0,
        totalReps: 0,
      };
      sessions.push(session);
    }
    session.sets += 1;
    session.totalReps += workoutRepsPerSet;
    state.data.workout = sessions;
    saveState(state);
    renderWorkout();
  }

  function resetWorkoutToday() {
    var todayKey = getDateKey(new Date());
    var sessions = state.data.workout || [];
    sessions = sessions.filter(function (s) {
      return s.dateKey !== todayKey;
    });
    state.data.workout = sessions;
    saveState(state);
    renderWorkout();
  }

  function renderWorkout() {
    var summaryEl = document.querySelector("[data-workout-summary]");
    var historyEl = document.querySelector("[data-workout-history]");
    var todayEl = document.querySelector("[data-workout-today]");
    var repsEl = document.querySelector('[data-workout="reps-value"]');

    var sessions = state.data.workout || [];
    var todayKey = getDateKey(new Date());

    if (repsEl) {
      repsEl.textContent = String(workoutRepsPerSet);
    }

    // totals
    var totalsByExercise = {
      pullups: { sets: 0, reps: 0 },
      dips: { sets: 0, reps: 0 },
      pushups: { sets: 0, reps: 0 },
    };
    var todayTotals = {
      pullups: { sets: 0, reps: 0 },
      dips: { sets: 0, reps: 0 },
      pushups: { sets: 0, reps: 0 },
    };

    sessions.forEach(function (s) {
      if (!EXERCISE_META[s.exercise]) return;
      totalsByExercise[s.exercise].sets += s.sets || 0;
      totalsByExercise[s.exercise].reps += s.totalReps || 0;
      if (s.dateKey === todayKey) {
        todayTotals[s.exercise].sets += s.sets || 0;
        todayTotals[s.exercise].reps += s.totalReps || 0;
      }
    });

    // summary cards
    if (summaryEl) {
      var sumHtml = Object.keys(EXERCISE_META)
        .map(function (key) {
          var meta = EXERCISE_META[key];
          var totals = totalsByExercise[key];
          return (
            '<div class="workout-summary-card">' +
            '<div class="workout-summary-label">' +
            escapeHTML(meta.label) +
            "</div>" +
            '<div class="workout-summary-value">' +
            totals.sets +
            " подходов" +
            (totals.reps ? " · " + totals.reps + " повторений" : "") +
            "</div>" +
            "</div>"
          );
        })
        .join("");
      summaryEl.innerHTML = sumHtml;
    }

    // today text
    if (todayEl) {
      var todayForCurrent = todayTotals[selectedExercise] || {
        sets: 0,
        reps: 0,
      };
      if (!todayForCurrent.sets) {
        todayEl.textContent = "Сегодня для этого упражнения подходов пока нет.";
      } else {
        todayEl.textContent =
          "Сегодня: " +
          todayForCurrent.sets +
          " подходов · " +
          todayForCurrent.reps +
          " повторений.";
      }
    }

    // history
    if (!historyEl) return;
    historyEl.innerHTML = "";
    var titleHtml =
      '<div class="workout-history-title">История тренировок</div>';
    if (!sessions.length) {
      historyEl.innerHTML =
        titleHtml +
        '<div class="workout-history-empty">Здесь появятся ваши тренировки — следите за прогрессом.</div>';
      return;
    }

    // group by dateKey
    var grouped = {};
    sessions.forEach(function (s) {
      if (!grouped[s.dateKey]) grouped[s.dateKey] = [];
      grouped[s.dateKey].push(s);
    });

    var dateKeys = Object.keys(grouped).sort(function (a, b) {
      return a < b ? 1 : a > b ? -1 : 0;
    });

    var historyHtml = titleHtml;
    dateKeys.slice(0, 14).forEach(function (key) {
      // limit
      var daySessions = grouped[key];
      var totalSetsDay = 0;
      daySessions.forEach(function (s) {
        totalSetsDay += s.sets || 0;
      });
      historyHtml +=
        '<div class="workout-history-day">' +
        '<div class="workout-history-day-header">' +
        '<div class="workout-history-day-date">' +
        formatDateLabelFromKey(key) +
        "</div>" +
        '<div class="workout-history-day-meta">' +
        totalSetsDay +
        " подходов" +
        "</div>" +
        "</div>" +
        '<div class="workout-history-list">';
      daySessions.forEach(function (s) {
        var meta = EXERCISE_META[s.exercise];
        if (!meta) return;
        var line =
          (s.sets || 0) +
          " подходов" +
          (s.totalReps ? " · " + s.totalReps + " повторений" : "");
        historyHtml +=
          '<div class="workout-history-row">' +
          "<span>" +
          escapeHTML(meta.label) +
          "</span>" +
          "<span>" +
          escapeHTML(line) +
          "</span>" +
          "</div>";
      });
      historyHtml += "</div></div>";
    });

    historyEl.innerHTML = historyHtml;
  }

  function initWorkout() {
    var chips = document.querySelectorAll("[data-workout-exercise]");
    if (chips.length) {
      chips.forEach(function (chip) {
        var key = chip.getAttribute("data-workout-exercise");
        chip.classList.toggle("is-active", key === selectedExercise);
        chip.addEventListener("click", function () {
          selectedExercise = key;
          state.workoutSelectedExercise = key;
          saveState(state);
          chips.forEach(function (c) {
            var ck = c.getAttribute("data-workout-exercise");
            c.classList.toggle("is-active", ck === selectedExercise);
          });
          renderWorkout();
        });
      });
    }

    var panel = document.querySelector('[data-panel="workout"]');
    if (!panel) return;

    panel.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-workout-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-workout-action");
      if (!action) return;

      if (action === "inc-reps") {
        if (workoutRepsPerSet < 200) {
          workoutRepsPerSet += 1;
          state.workoutRepsPerSet = workoutRepsPerSet;
          saveState(state);
          renderWorkout();
        }
        return;
      }

      if (action === "dec-reps") {
        if (workoutRepsPerSet > 1) {
          workoutRepsPerSet -= 1;
          state.workoutRepsPerSet = workoutRepsPerSet;
          saveState(state);
          renderWorkout();
        }
        return;
      }

      if (action === "add-set") {
        addWorkoutSet(selectedExercise);
        return;
      }

      if (action === "reset-today") {
        resetWorkoutToday();
        return;
      }
    });
  }

  // ---- forms ----
  function handleSimpleSubmit(form) {
    var input = form.querySelector('input[name="text"]');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    var newItem = {
      id: Date.now(),
      text: text,
      done: false,
      createdAt: formatDateTimeShort(new Date()),
    };

    state.data.tasks.unshift(newItem);
    saveState(state);
    renderTasks();
    input.value = "";
  }

  function handleCodeSubmit(form) {
    var titleInput = form.querySelector('input[name="title"]');
    var codeInput = form.querySelector('textarea[name="code"]');
    if (!codeInput) return;

    var code = codeInput.value.trim();
    var title = titleInput ? titleInput.value.trim() : "";
    if (!code) return;

    var newItem = {
      id: Date.now(),
      title: title,
      code: code,
      done: false,
      createdAt: formatDateTimeShort(new Date()),
    };

    state.data.code.unshift(newItem);
    saveState(state);
    renderCode();

    if (titleInput) titleInput.value = "";
    codeInput.value = "";
  }
  // ---- panel hints (обучалки) ----
  function initHints() {
    var hintBlocks = document.querySelectorAll("[data-hint-id]");
    if (!hintBlocks.length) return;

    if (!state.hiddenHints || typeof state.hiddenHints !== "object") {
      state.hiddenHints = {};
    }

    hintBlocks.forEach(function (block) {
      var id = block.getAttribute("data-hint-id");
      if (!id) return;

      // если уже скрывали — не показываем
      if (state.hiddenHints[id]) {
        block.classList.add("is-hidden");
      }

      var closeBtn = block.querySelector("[data-hint-close]");
      if (!closeBtn) return;

      closeBtn.addEventListener("click", function () {
        block.classList.add("is-hidden");
        state.hiddenHints[id] = true;
        saveState(state);
      });
    });
  }
  function initForms() {
    var forms = document.querySelectorAll(".task-form");
    if (!forms.length) return;

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var category = form.getAttribute("data-category");
        if (category === "tasks") {
          handleSimpleSubmit(form);
        } else if (category === "code") {
          handleCodeSubmit(form);
        }
      });
    });
  }

  // ---- tasks filter controls ----
  function initTaskFilterControls() {
    var container = document.querySelector('[data-panel="tasks"]');
    if (!container) return;

    container.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-task-filter]");
      if (!chip) return;
      var value = chip.getAttribute("data-task-filter");
      if (!value) return;
      taskFilter = value;
      state.taskFilter = value;
      saveState(state);
      renderTasks();
    });
  }

  // ---- list actions for tasks & code ----
  function startInlineEdit(itemEl, item) {
    if (itemEl.classList.contains("item--editing")) return;
    itemEl.classList.add("item--editing");
    var contentEl = itemEl.querySelector(".item-content");
    if (!contentEl) return;
    var currentText = item.text || "";
    contentEl.innerHTML =
      '<div class="edit-inline">' +
      '<input class="input input--inline-edit" type="text" value="' +
      escapeHTML(currentText) +
      '" />' +
      '<div class="edit-inline-actions">' +
      '<button class="icon-button" type="button" data-action="save-edit"><span class="icon">✓</span></button>' +
      '<button class="icon-button" type="button" data-action="cancel-edit"><span class="icon">✕</span></button>' +
      "</div>" +
      "</div>";
    var input = contentEl.querySelector("input");
    if (input) {
      input.focus();
      var len = input.value.length;
      try {
        input.setSelectionRange(len, len);
      } catch (e) {}
    }
  }

  function initListActions() {
    var container = document.querySelector(".app-main");
    if (!container) return;

    container.addEventListener("click", function (event) {
      var actionBtn = event.target.closest("[data-action]");
      if (!actionBtn) return;

      var action = actionBtn.getAttribute("data-action");
      var itemEl = actionBtn.closest("[data-id]");
      if (!itemEl) return;

      var category = itemEl.getAttribute("data-category");
      var id = Number(itemEl.getAttribute("data-id"));
      if (!category || !id) return;

      if (category !== "tasks" && category !== "code") {
        return;
      }

      var items = state.data[category] || [];
      var index = items.findIndex(function (item) {
        return item.id === id;
      });
      if (index === -1) return;
      var item = items[index];

      if (action === "delete") {
        items.splice(index, 1);
        saveState(state);
        if (category === "tasks") {
          renderTasks();
        } else if (category === "code") {
          renderCode();
        }
        return;
      }

      if (category === "tasks") {
        if (action === "toggle") {
          item.done = !item.done;
          saveState(state);
          renderTasks();
          return;
        }

        if (action === "edit") {
          startInlineEdit(itemEl, item);
          return;
        }

        if (action === "save-edit") {
          var input = itemEl.querySelector(".input--inline-edit");
          if (!input) return;
          var newText = input.value.trim();
          if (newText) {
            item.text = newText;
            saveState(state);
          }
          renderTasks();
          return;
        }

        if (action === "cancel-edit") {
          renderTasks();
          return;
        }
      }

      if (category === "code") {
        if (action === "copy") {
          if (
            item.code &&
            navigator.clipboard &&
            navigator.clipboard.writeText
          ) {
            navigator.clipboard.writeText(item.code).catch(function () {});
          }
          return;
        }
      }
    });
  }

  // ---- render all ----
  function renderCategory(category) {
    if (category === "tasks") {
      renderTasks();
    } else if (category === "shopping") {
      renderShopping();
    } else if (category === "code") {
      renderCode();
    } else if (category === "workout") {
      renderWorkout();
    }
  }

  function renderAll() {
    categories.forEach(renderCategory);
  }

  initTheme();
  initClock();
  initTabs();
  initHints();
  initForms();
  initTaskFilterControls();
  initListActions();
  initShopping();
  initWorkout();
  renderAll();
})();
