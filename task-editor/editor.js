const EXAMS = {
  oge: {
    label: "ОГЭ",
    taskCount: 25,
    folder: "tasks",
    dataKey: "OGE_TASKS",
    filePrefix: "task",
  },
  ege: {
    label: "ЕГЭ",
    taskCount: 19,
    folder: "ege-tasks",
    dataKey: "EGE_TASKS",
    filePrefix: "task",
  },
};

const DEFAULT_PROMPTS = {
  expression: "Найдите значение выражения.",
  choice: "Выберите правильный ответ.",
  "image-choice": "Выберите правильный ответ.",
  statement: "Укажите номера верных утверждений.",
  long: "Решите задачу.",
};

const state = {
  exam: "oge",
  number: 6,
  template: "expression",
  pendingTasks: [],
  lastTask: null,
};

const refs = {
  examSelect: document.querySelector("#examSelect"),
  taskNumberSelect: document.querySelector("#taskNumberSelect"),
  templateSelect: document.querySelector("#templateSelect"),
  targetFileName: document.querySelector("#targetFileName"),
  taskStats: document.querySelector("#taskStats"),
  taskForm: document.querySelector("#taskForm"),
  titleInput: document.querySelector("#titleInput"),
  groupInput: document.querySelector("#groupInput"),
  promptInput: document.querySelector("#promptInput"),
  introInput: document.querySelector("#introInput"),
  questionTextInput: document.querySelector("#questionTextInput"),
  questionRawInput: document.querySelector("#questionRawInput"),
  expressionInput: document.querySelector("#expressionInput"),
  optionsInput: document.querySelector("#optionsInput"),
  imageInput: document.querySelector("#imageInput"),
  imageAltInput: document.querySelector("#imageAltInput"),
  answerInput: document.querySelector("#answerInput"),
  solutionInput: document.querySelector("#solutionInput"),
  addTaskButton: document.querySelector("#addTaskButton"),
  downloadFileButton: document.querySelector("#downloadFileButton"),
  copyTaskButton: document.querySelector("#copyTaskButton"),
  validationStatus: document.querySelector("#validationStatus"),
  taskPreview: document.querySelector("#taskPreview"),
  pendingList: document.querySelector("#pendingList"),
};

function padNumber(value, size = 2) {
  return String(Number(value) || 0).padStart(size, "0");
}

function getExamConfig(exam = state.exam) {
  return EXAMS[exam] || EXAMS.oge;
}

function getTargetFileName() {
  const config = getExamConfig();
  return `${config.folder}/${config.filePrefix}-${padNumber(state.number)}.js`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function flattenLoadedTasks(exam = state.exam) {
  const config = getExamConfig(exam);
  const loaded = window[config.dataKey] || [];

  return loaded.flatMap((entry, entryIndex) => {
    if (!entry) {
      return [];
    }

    if (Array.isArray(entry.items)) {
      const { items, total_tasks, selection_rule, ...base } = entry;

      return items.map((item, itemIndex) => ({
        ...base,
        ...item,
        subject: item.subject || base.subject || "Математика",
        number: Number(item.number || base.number || 0),
        title: item.title || base.title || "",
        block: item.block ?? base.block ?? "",
        prototype: item.prototype || item.item_number || itemIndex + 1,
      }));
    }

    return [{
      ...entry,
      number: Number(entry.number || 0),
      prototype: entry.prototype || entry.item_number || entryIndex + 1,
    }];
  });
}

function getExistingTasks() {
  return flattenLoadedTasks(state.exam)
    .filter((task) => Number(task.number) === Number(state.number))
    .sort((first, second) => {
      const firstNumber = Number(first.item_number || first.prototype || 0);
      const secondNumber = Number(second.item_number || second.prototype || 0);
      return firstNumber - secondNumber || String(first.id || "").localeCompare(String(second.id || ""));
    });
}

function getPendingTasksForSelection() {
  return state.pendingTasks.filter((task) => task.exam === state.exam && Number(task.number) === Number(state.number));
}

function getAllTasksForSelection() {
  return [...getExistingTasks(), ...getPendingTasksForSelection()];
}

function getDefaultTitle() {
  const existingTask = getExistingTasks()[0];

  if (existingTask?.title) {
    return existingTask.title;
  }

  return `Задание ${state.number}`;
}

function getNextItemNumber() {
  const allNumbers = getAllTasksForSelection()
    .map((task) => Number(task.item_number || task.prototype || 0))
    .filter(Boolean);

  return allNumbers.length ? Math.max(...allNumbers) + 1 : 1;
}

function getNextTaskId() {
  return `math-${state.exam}-${padNumber(state.number, 3)}-p${padNumber(getNextItemNumber(), 3)}`;
}

function populateTaskNumbers() {
  const config = getExamConfig();
  const current = Number(refs.taskNumberSelect.value) || state.number;

  refs.taskNumberSelect.innerHTML = Array.from({ length: config.taskCount }, (_, index) => {
    const number = index + 1;
    return `<option value="${number}">Задание ${number}</option>`;
  }).join("");

  state.number = Math.min(config.taskCount, current || 1);
  refs.taskNumberSelect.value = String(state.number);
}

function syncDefaults() {
  const title = getDefaultTitle();
  refs.titleInput.value = title;
  refs.promptInput.value = DEFAULT_PROMPTS[state.template] || DEFAULT_PROMPTS.expression;
  refs.groupInput.value = "1";
}

function updateTemplateBlocks() {
  document.querySelectorAll("[data-template-block]").forEach((block) => {
    const allowed = block.dataset.templateBlock.split(/\s+/);
    block.classList.toggle("is-hidden", !allowed.includes(state.template));
  });
}

function updateStats() {
  const existingCount = getExistingTasks().length;
  const pendingCount = getPendingTasksForSelection().length;

  refs.targetFileName.textContent = getTargetFileName();
  refs.taskStats.textContent = `В базе найдено ${existingCount}. Новых за эту сессию: ${pendingCount}.`;
}

function renderMath(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (!window.katex) {
    return escapeHtml(text);
  }

  try {
    return window.katex.renderToString(text, {
      displayMode: false,
      throwOnError: false,
      strict: "ignore",
    });
  } catch (error) {
    return escapeHtml(text);
  }
}

function renderMaybeMath(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const looksLikeFormula = /\\frac|\\sqrt|\\begin|[_^=<>+\-*/]|^\d+\/\d+$/.test(text) && !/[а-яё]/i.test(text);
  return looksLikeFormula ? renderMath(text) : escapeHtml(text);
}

function getOptionsFromForm() {
  return refs.optionsInput.value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function getDraftTask() {
  const nextItemNumber = getNextItemNumber();
  const title = refs.titleInput.value.trim() || getDefaultTitle();
  const prompt = refs.promptInput.value.trim() || DEFAULT_PROMPTS[state.template] || DEFAULT_PROMPTS.expression;
  const task = {
    id: getNextTaskId(),
    subject: "Математика",
    number: Number(state.number),
    title,
    block: "",
    task_group: Number(refs.groupInput.value) || 1,
    item_number: nextItemNumber,
    prompt,
  };

  const intro = refs.introInput.value.trim();
  const questionText = refs.questionTextInput.value.trim();
  const questionRaw = refs.questionRawInput.value.trim();
  const expression = refs.expressionInput.value.trim();
  const options = getOptionsFromForm();
  const image = refs.imageInput.value.trim();
  const imageAlt = refs.imageAltInput.value.trim();
  const answer = refs.answerInput.value.trim();
  const solution = refs.solutionInput.value.trim();

  if (intro) {
    task.intro = intro;
  }

  if (questionText) {
    task.question_text = questionText;
  }

  if (questionRaw) {
    task.question_raw = questionRaw;
  }

  if (expression) {
    task.expression = expression;
  }

  if (options.length) {
    task.options = options;
  }

  if (image) {
    task.image = image.replace(/^tasks\//, "");
  }

  if (imageAlt) {
    task.image_alt = imageAlt;
  }

  if (answer) {
    task.answer = answer;
  }

  if (solution) {
    task.solution = solution;
  }

  return task;
}

function validateTask(task) {
  const errors = [];
  const allIds = new Set(getAllTasksForSelection().map((item) => item.id).filter(Boolean));

  if (allIds.has(task.id)) {
    errors.push("Такой id уже есть в файле.");
  }

  if (!task.title) {
    errors.push("Заполните заголовок раздела.");
  }

  if (!task.prompt) {
    errors.push("Заполните фразу задания.");
  }

  if (state.template === "expression" && !task.expression && !task.question_raw) {
    errors.push("Для выражения нужна формула или простая запись.");
  }

  if (state.template === "choice" && !task.question_text && !task.question_raw && !task.intro) {
    errors.push("Для задания с вариантами нужен текст условия.");
  }

  if (state.template === "image-choice" && !task.image) {
    errors.push("Для задания с картинкой нужен путь к изображению.");
  }

  if ((state.template === "choice" || state.template === "image-choice") && (!task.options || task.options.length < 2)) {
    errors.push("Добавьте хотя бы два варианта ответа.");
  }

  if (state.template === "statement" && !task.question_raw) {
    errors.push("Для утверждения заполните текст утверждения.");
  }

  if (state.template === "long" && !task.question_text && !task.question_raw) {
    errors.push("Для задачи с решением заполните условие.");
  }

  return errors;
}

function renderPreview() {
  const task = getDraftTask();
  const errors = validateTask(task);
  const expression = task.expression || task.question_raw || "";
  const options = Array.isArray(task.options) ? task.options : [];

  refs.validationStatus.textContent = errors.length ? errors[0] : "Можно добавлять";
  refs.validationStatus.classList.toggle("is-ok", !errors.length);
  refs.validationStatus.classList.toggle("is-error", errors.length > 0);

  refs.taskPreview.innerHTML = `
    <div class="task-preview__title">
      <strong>Задание ${task.item_number}.</strong> ${escapeHtml(task.prompt)}
    </div>
    ${task.intro ? `<p class="task-preview__text">${escapeHtml(task.intro)}</p>` : ""}
    ${expression ? `<p class="task-preview__text">${renderMaybeMath(expression)}</p>` : ""}
    ${task.image ? `<img class="task-preview__image" src="../tasks/${escapeHtml(task.image)}" alt="${escapeHtml(task.image_alt || "Изображение к заданию")}">` : ""}
    ${task.question_text ? `<p class="task-preview__text">${escapeHtml(task.question_text)}</p>` : ""}
    ${options.length ? `
      <div class="task-preview__options">
        ${options.map((option, index) => `
          <div class="task-preview__option">
            <span>${index + 1})</span>
            <span>${renderMaybeMath(option)}</span>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${(task.answer || task.solution) ? `
      <div class="task-preview__answer">
        ${task.answer ? `<strong>Ответ:</strong> ${escapeHtml(task.answer)}<br>` : ""}
        ${task.solution ? `<strong>Решение:</strong> ${escapeHtml(task.solution)}` : ""}
      </div>
    ` : ""}
  `;

  state.lastTask = task;
}

function renderPendingList() {
  const pending = getPendingTasksForSelection();

  if (!pending.length) {
    refs.pendingList.innerHTML = "<p>Пока новых заданий нет.</p>";
    return;
  }

  refs.pendingList.innerHTML = pending.map((task) => `
    <div class="pending-item">
      <div>
        <strong>${escapeHtml(task.id)}</strong>
        <span>Задание ${task.item_number}: ${escapeHtml(task.prompt)}</span>
      </div>
      <button type="button" data-remove-pending="${escapeHtml(task.id)}">Удалить</button>
    </div>
  `).join("");
}

function resetContentFields() {
  refs.introInput.value = "";
  refs.questionTextInput.value = "";
  refs.questionRawInput.value = "";
  refs.expressionInput.value = "";
  refs.optionsInput.value = "";
  refs.imageInput.value = "";
  refs.imageAltInput.value = "";
  refs.answerInput.value = "";
  refs.solutionInput.value = "";
}

function refreshAll({ resetForm = false } = {}) {
  if (resetForm) {
    syncDefaults();
    resetContentFields();
  }

  updateTemplateBlocks();
  updateStats();
  renderPreview();
  renderPendingList();
}

function cleanTaskForFile(task) {
  const allowedOrder = [
    "id",
    "subject",
    "number",
    "title",
    "block",
    "page",
    "task_group",
    "item_number",
    "prototype",
    "prompt",
    "intro",
    "question_raw",
    "expression",
    "question_text",
    "options",
    "image",
    "image_alt",
    "answer_table",
    "answer",
    "solution",
  ];
  const cleaned = {};
  const source = {
    ...task,
    subject: task.subject || "Математика",
    number: Number(task.number || state.number),
    title: task.title || getDefaultTitle(),
    block: task.block || "",
  };

  allowedOrder.forEach((key) => {
    const value = source[key];

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value) && !value.length) {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
}

function buildTaskFileContent() {
  const config = getExamConfig();
  const allTasks = getAllTasksForSelection()
    .map(cleanTaskForFile)
    .map((task, index) => ({
      ...task,
      item_number: Number(task.item_number || task.prototype || index + 1),
    }))
    .sort((first, second) => Number(first.item_number) - Number(second.item_number));

  const wrapper = {
    subject: "Математика",
    number: Number(state.number),
    title: refs.titleInput.value.trim() || getDefaultTitle(),
    block: "",
    total_tasks: allTasks.length,
    items: allTasks,
  };

  const variableName = config.dataKey;
  const json = JSON.stringify(wrapper, null, 2);
  return `window.${variableName} = window.${variableName} || [];\nwindow.${variableName}.push(\n${json}\n);\n`;
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function addCurrentTask() {
  const task = getDraftTask();
  const errors = validateTask(task);

  if (errors.length) {
    refs.validationStatus.textContent = errors[0];
    refs.validationStatus.classList.add("is-error");
    refs.validationStatus.classList.remove("is-ok");
    return;
  }

  state.pendingTasks.push({
    ...task,
    exam: state.exam,
  });
  resetContentFields();
  refreshAll();
}

async function copyCurrentTask() {
  const task = cleanTaskForFile(getDraftTask());
  const text = JSON.stringify(task, null, 2);

  try {
    await navigator.clipboard.writeText(text);
    refs.validationStatus.textContent = "Объект скопирован";
    refs.validationStatus.classList.add("is-ok");
    refs.validationStatus.classList.remove("is-error");
  } catch (error) {
    refs.validationStatus.textContent = "Не удалось скопировать";
    refs.validationStatus.classList.add("is-error");
    refs.validationStatus.classList.remove("is-ok");
  }
}

function setupEvents() {
  refs.examSelect.addEventListener("change", () => {
    state.exam = refs.examSelect.value;
    populateTaskNumbers();
    refreshAll({ resetForm: true });
  });

  refs.taskNumberSelect.addEventListener("change", () => {
    state.number = Number(refs.taskNumberSelect.value);
    refreshAll({ resetForm: true });
  });

  refs.templateSelect.addEventListener("change", () => {
    state.template = refs.templateSelect.value;
    refs.promptInput.value = DEFAULT_PROMPTS[state.template] || DEFAULT_PROMPTS.expression;
    refreshAll();
  });

  refs.taskForm.addEventListener("input", () => refreshAll());

  refs.addTaskButton.addEventListener("click", addCurrentTask);

  refs.downloadFileButton.addEventListener("click", () => {
    const filename = `${getExamConfig().filePrefix}-${padNumber(state.number)}.js`;
    downloadTextFile(filename, buildTaskFileContent());
  });

  refs.copyTaskButton.addEventListener("click", copyCurrentTask);

  document.addEventListener("click", (event) => {
    const formulaButton = event.target.closest("[data-insert-formula]");
    const removeButton = event.target.closest("[data-remove-pending]");

    if (formulaButton) {
      const insert = formulaButton.dataset.insertFormula;
      const input = refs.expressionInput;
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;
      input.value = `${input.value.slice(0, start)}${insert}${input.value.slice(end)}`;
      input.focus();
      input.setSelectionRange(start + insert.length, start + insert.length);
      refreshAll();
    }

    if (removeButton) {
      const id = removeButton.dataset.removePending;
      state.pendingTasks = state.pendingTasks.filter((task) => task.id !== id);
      refreshAll();
    }
  });
}

function init() {
  refs.examSelect.value = state.exam;
  refs.templateSelect.value = state.template;
  populateTaskNumbers();
  syncDefaults();
  setupEvents();
  refreshAll();
}

init();
