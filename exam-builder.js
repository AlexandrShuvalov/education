const EXAM_CONFIG = {
  oge: {
    label: "ОГЭ",
    taskCount: 25,
    shortAnswerMaxNumber: 19,
    taskFolder: "tasks",
    dataKey: "OGE_TASKS",
    filename: "oge-math-prototypes.pdf",
  },
  ege: {
    label: "ЕГЭ",
    taskCount: 19,
    shortAnswerMaxNumber: 12,
    taskFolder: "ege-tasks",
    dataKey: "EGE_TASKS",
    filename: "ege-math-prototypes.pdf",
  },
  mcko: {
    label: "МЦКО",
    taskCount: 9,
    shortAnswerMaxNumber: 9,
    taskFolder: "mcko-tasks",
    dataKey: "MCKO_TASKS",
    filename: "mcko-math-materials.pdf",
  },
};

const OGE_TEXT_GROUP_LABEL = "1-5";
const OGE_TEXT_GROUP_DATASET = "text-1-5";
const EGE_LEVELS = [
  {
    id: "profile",
    label: "Профиль",
    title: "Профильная математика ЕГЭ",
    description: "Текущая база заданий ЕГЭ: 19 номеров для профильной математики.",
    status: "База подключена",
  },
  {
    id: "base",
    label: "База",
    title: "Базовая математика ЕГЭ",
    description: "Отдельный раздел для будущей базы заданий по базовой математике ЕГЭ.",
    status: "Материалы скоро появятся",
  },
];
const MCKO_CLASSES = [
  {
    grade: 5,
    title: "5 класс",
    description: "Базовые вычисления, текстовые задачи, геометрические представления.",
    status: "Материалы скоро появятся",
  },
  {
    grade: 6,
    title: "6 класс",
    description: "Дроби, проценты, координатная прямая, простые уравнения и задачи.",
    status: "Материалы скоро появятся",
  },
  {
    grade: 7,
    title: "7 класс",
    description: "Алгебраические выражения, линейные уравнения, функции, начальная геометрия.",
    status: "Материалы скоро появятся",
  },
  {
    grade: 8,
    title: "8 класс",
    description: "Квадратные корни, неравенства, системы, четырехугольники и окружности.",
    status: "Материалы скоро появятся",
  },
  {
    grade: 9,
    title: "9 класс",
    description: "Диагностика перед ОГЭ: алгебра, геометрия, практико-ориентированные задачи.",
    status: "Можно связать с базой ОГЭ",
  },
  {
    grade: 10,
    title: "10 класс",
    description: "Функции, тригонометрия, уравнения, планиметрия и старт профильной подготовки.",
    status: "Материалы скоро появятся",
  },
  {
    grade: 11,
    title: "11 класс",
    description: "Итоговая диагностика, профильные темы и повторение перед ЕГЭ.",
    status: "Можно связать с базой ЕГЭ",
  },
];

const taskNumberGrid = document.querySelector("#taskNumberGrid");
const prototypeList = document.querySelector("#prototypeList");
const selectedSummary = document.querySelector("#selectedSummary");
const includeAnswers = document.querySelector("#includeAnswers");
const clearSelection = document.querySelector("#clearSelection");
const printWorksheet = document.querySelector("#printWorksheet");
const downloadWorksheet = document.querySelector("#downloadWorksheet");
const downloadHtmlWorksheet = document.querySelector("#downloadHtmlWorksheet");
const generateRandomVariant = document.querySelector("#generateRandomVariant");
const selectedList = document.querySelector("#selectedList");
const worksheetTitle = document.querySelector("#worksheetTitle");
const worksheetCount = document.querySelector("#worksheetCount");
const worksheetTasks = document.querySelector("#worksheetTasks");
const prototypeOverlay = document.querySelector("#prototypeOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayPrototypeList = document.querySelector("#overlayPrototypeList");
const closeOverlay = document.querySelector("#closeOverlay");
const examSwitch = document.querySelector("#examSwitch");
const examSubswitch = document.querySelector("#examSubswitch");
const catalogEyebrow = document.querySelector("#catalogEyebrow");
const catalogTitle = document.querySelector("#catalogTitle");
const catalogDescription = document.querySelector("#catalogDescription");

const taskSets = {
  oge: [],
  ege: [],
  mcko: [],
};
let tasks = [];
let activeExam = "oge";
let activeNumber = OGE_TEXT_GROUP_LABEL;
let activeEgeLevel = "profile";
let activeMckoClass = 6;
let activeTextTopic = "";
let loadError = "";
let useExamTaskNumbers = false;
let forcePlainMathRendering = false;
const selectedTaskIds = new Set();
const STATEMENT_GROUP_SIZE = 3;
const downloadImageCache = new Map();

function getExamConfig(exam = activeExam) {
  return EXAM_CONFIG[exam] || EXAM_CONFIG.oge;
}

function getTaskExamLabel(task) {
  return getExamConfig(task.exam).label;
}

function getAnswerType(number) {
  return number <= getExamConfig().shortAnswerMaxNumber ? "Краткий ответ" : "Полное решение";
}

function getTasksByNumber(number) {
  return tasks
    .filter((task) => task.number === number)
    .sort((first, second) => first.prototype - second.prototype);
}

function getMckoClass(grade = activeMckoClass) {
  return MCKO_CLASSES.find((entry) => entry.grade === Number(grade)) || MCKO_CLASSES[0];
}

function isMckoActive() {
  return activeExam === "mcko";
}

function isEgeActive() {
  return activeExam === "ege";
}

function getEgeLevel(level = activeEgeLevel) {
  return EGE_LEVELS.find((entry) => entry.id === level) || EGE_LEVELS[0];
}

function isEgeBaseActive() {
  return isEgeActive() && activeEgeLevel === "base";
}

function getMckoGrade(task) {
  return Number(task?.grade || task?.class || task?.mcko_class || 0);
}

function getActiveTaskSet() {
  const currentTasks = taskSets[activeExam] || [];

  if (isMckoActive()) {
    return currentTasks.filter((task) => getMckoGrade(task) === Number(activeMckoClass));
  }

  return currentTasks;
}

function isOgeTextGroupActive() {
  return activeExam === "oge" && String(activeNumber) === OGE_TEXT_GROUP_LABEL;
}

function isOgeTextGroupTask(task) {
  const number = Number(task?.number);
  return task?.exam === "oge" && number >= 1 && number <= 5 && Boolean(getTaskCase(task));
}

function getOgeTextGroupTasks() {
  return tasks
    .filter(isOgeTextGroupTask)
    .sort((first, second) =>
      String(first.case_id || "").localeCompare(String(second.case_id || ""), "ru")
      || first.number - second.number
      || first.prototype - second.prototype,
    );
}

function getCaseSortTitle(caseEntry) {
  return `${caseEntry.topic} ${caseEntry.title}`.trim();
}

function getOgeTextGroupCases() {
  const caseMap = new Map();

  getOgeTextGroupTasks().forEach((task) => {
    const taskCase = getTaskCase(task);
    const caseId = task.case_id || `${task.exam}-${task.prototype}`;

    if (!caseMap.has(caseId)) {
      const topic = taskCase.topic || taskCase.category || task.topic || task.block || "Без темы";

      caseMap.set(caseId, {
        id: caseId,
        topic,
        title: taskCase.variant_title || taskCase.variant || taskCase.title || topic,
        taskCase,
        tasks: [],
      });
    }

    caseMap.get(caseId).tasks.push(task);
  });

  return [...caseMap.values()]
    .map((entry) => ({
      ...entry,
      tasks: entry.tasks.sort((first, second) => first.number - second.number || first.prototype - second.prototype),
    }))
    .sort((first, second) => getCaseSortTitle(first).localeCompare(getCaseSortTitle(second), "ru"));
}

function getOgeTextGroupTopics() {
  const topicMap = new Map();

  getOgeTextGroupCases().forEach((caseEntry) => {
    if (!topicMap.has(caseEntry.topic)) {
      topicMap.set(caseEntry.topic, { topic: caseEntry.topic, count: 0 });
    }

    topicMap.get(caseEntry.topic).count += 1;
  });

  return [...topicMap.values()].sort((first, second) => first.topic.localeCompare(second.topic, "ru"));
}

function ensureActiveTextTopic() {
  const topics = getOgeTextGroupTopics();

  if (!topics.length) {
    activeTextTopic = "";
    return "";
  }

  if (!topics.some((entry) => entry.topic === activeTextTopic)) {
    activeTextTopic = topics[0].topic;
  }

  return activeTextTopic;
}

function getOgeTextGroupCasesByTopic(topic = ensureActiveTextTopic()) {
  return getOgeTextGroupCases().filter((caseEntry) => caseEntry.topic === topic);
}

function isCaseGroupedTask(task) {
  return isOgeTextGroupTask(task) && Boolean(task.case_id);
}

function getSelectedTasks() {
  return tasks.filter((task) => selectedTaskIds.has(task.id));
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function isGroupedSelectionTask(task) {
  return task.exam === "oge" && Number(task.number) === 19;
}

function isLongAnswerNumber(number) {
  return number > getExamConfig().shortAnswerMaxNumber && number <= getExamConfig().taskCount;
}

function isThreeColumnNumber(number) {
  return [6, 7, 8].includes(Number(number));
}

function isTwoColumnNumber(number) {
  if (isMckoActive() && Number(activeMckoClass) === 6) {
    return [1, 2, 3, 4, 6, 7, 9, 13].includes(Number(number));
  }

  return [9, 13].includes(Number(number));
}

function isOneColumnNumber(number) {
  return [7, 10, 12, 14].includes(Number(number));
}

function getGroupedSelectionKey(task) {
  if (isGroupedSelectionTask(task)) {
    return `${task.exam}-${task.number}-${Math.ceil(Number(task.prototype || 1) / STATEMENT_GROUP_SIZE)}`;
  }

  return `${task.exam}-${task.number}-${task.task_group || task.prototype}`;
}

function getWorksheetItemCount(taskList) {
  const statementGroups = new Set();
  let count = 0;

  taskList.forEach((task) => {
    if (!isGroupedSelectionTask(task)) {
      count += 1;
      return;
    }

    statementGroups.add(getGroupedSelectionKey(task));
  });

  return count + statementGroups.size;
}

function getAvailableNumbers() {
  return [...new Set(tasks.map((task) => task.number))].sort((first, second) => first - second);
}

function getAvailableMckoClasses() {
  return [...new Set((taskSets.mcko || []).map(getMckoGrade).filter(Boolean))]
    .sort((first, second) => first - second);
}

function getDefaultMckoClass() {
  const availableClasses = getAvailableMckoClasses();

  return availableClasses[0] || activeMckoClass || MCKO_CLASSES[0].grade;
}

function getDefaultActiveNumber() {
  if (isMckoActive()) {
    return getAvailableNumbers()[0] || 1;
  }

  if (isEgeBaseActive()) {
    return 1;
  }

  if (activeExam === "oge" && getOgeTextGroupCases().length) {
    ensureActiveTextTopic();
    return OGE_TEXT_GROUP_LABEL;
  }

  return getAvailableNumbers()[0] || 1;
}

function getSheetTitle(taskList) {
  const firstTask = taskList[0];
  const number = firstTask ? String(firstTask.number).padStart(2, "0") : "";

  return firstTask ? `${number}. ${firstTask.title}` : " ";
}

function getSheetBlock(taskList) {
  return normalizeBlockName(taskList[0]?.block || "");
}

function normalizeBlockName(value) {
  const block = String(value || "").trim();
  const normalizedBlock = block.toLowerCase();
  const hiddenBlockNames = new Set([
    "\u0441\u043a\u0440\u0438\u043d\u0448\u043e\u0442\u044b",
    "\u043f\u0440\u0438\u043c\u0435\u0440\u044b \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f\u043e\u0432",
    "\u0431\u043b\u043e\u043a 1. \u0444\u0438\u043f\u0438",
  ]);

  if (!block || hiddenBlockNames.has(normalizedBlock)) {
    return "";
  }

  return block;
}

function getTaskPrompt(taskList) {
  return taskList[0]?.prompt || "Найдите значение выражения";
}

function getExpression(task) {
  if (task.expression) {
    return task.expression;
  }

  if (task.question_raw) {
    return normalizeRawExpression(task.question_raw);
  }

  return (task.question || "")
    .replace(/^Вычислите:\s*/i, "")
    .replace(/^Найдите значение выражения:?\s*/i, "")
    .replace(/\.$/, "");
}

function isOperator(value) {
  return ["+", "-", "·", "*", ":", "/"].includes(value);
}

function normalizeOperator(value) {
  return value === "*" ? "·" : value;
}

function isNumericToken(value) {
  return /^-?\d+(?:,\d+)?$/.test(value);
}

function normalizeRawExpression(rawExpression) {
  const cleanExpression = String(rawExpression)
    .replace(/\s+/g, " ")
    .replace(/\s+([;,.])/g, "$1")
    .trim();

  if (cleanExpression.includes("\\frac")) {
    return cleanExpression;
  }

  const tokens = cleanExpression.split(" ");

  if (cleanExpression.includes("Представьте выражение")) {
    return normalizeTextWithExpression(cleanExpression);
  }

  if (
    tokens.length === 5 &&
    isOperator(tokens[0]) &&
    tokens.slice(1).every(isNumericToken)
  ) {
    return `${tokens[1]}/${tokens[2]} ${normalizeOperator(tokens[0])} ${tokens[3]}/${tokens[4]}`;
  }

  if (
    tokens.length === 5 &&
    isOperator(tokens[2]) &&
    [tokens[0], tokens[1], tokens[3], tokens[4]].every(isNumericToken)
  ) {
    return `${tokens[0]}/${tokens[1]} ${normalizeOperator(tokens[2])} ${tokens[3]}/${tokens[4]}`;
  }

  if (
    tokens.length === 2 &&
    tokens.every((token) => /^-?\d+,\d+$/.test(token))
  ) {
    return `${tokens[0]} : ${tokens[1]}`;
  }

  const parsedTokenExpression = parseTokenExpression(tokens);

  if (parsedTokenExpression) {
    return parsedTokenExpression;
  }

  return cleanExpression;
}

function normalizeTextWithExpression(text) {
  return text.replace(
    /выражение\s+(.+?)\s+в виде/i,
    (_, expression) => `выражение ${parseTokenExpression(expression.split(" ")) || expression} в виде`,
  );
}

function parseTokenExpression(tokens) {
  const usefulTokens = tokens
    .filter((token) => token && token !== "(" && token !== ")")
    .map((token) => token.replace(/^\+/, "+"));

  const allowed = usefulTokens.every((token) => {
    return isNumericToken(token) || isOperator(token) || /^[+-]?\d+,\d+$/.test(token);
  });

  if (!allowed || usefulTokens.length < 2) {
    return "";
  }

  const parts = [];
  let index = 0;

  function readNumber() {
    const current = usefulTokens[index];
    const next = usefulTokens[index + 1];

    if (!current) {
      return "";
    }

    if (isOperator(current)) {
      index += 1;
      return normalizeOperator(current);
    }

    if (
      isNumericToken(current) &&
      isNumericToken(next) &&
      !current.includes(",") &&
      !next.includes(",")
    ) {
      index += 2;
      return `${current}/${next}`;
    }

    index += 1;
    return current;
  }

  while (index < usefulTokens.length) {
    parts.push(readNumber());
  }

  const expression = parts
    .join(" ")
    .replace(/\s+([;,.])/g, "$1")
    .replace(/\s+([+\-·:])\s+/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^- \d+\/\d+ \d+\/\d+$/.test(expression)) {
    return expression.replace(/^(- \d+\/\d+) /, "$1 - ");
  }

  return expression;
}

function formatMath(text) {
  return renderMathExpression(normalizeKatexExpression(String(text || "")));
}

function formatTaskContent(task) {
  const expression = getExpression(task);

  if (/,\s*при\s+/i.test(expression)) {
    return renderFormulaWithCondition(expression);
  }

  if (shouldUseInlineKatexText(task, expression)) {
    return renderTextWithInlineKatex(expression);
  }

  if (shouldUseKatex(task, expression)) {
    return renderKatexMath(expression);
  }

  return formatMath(expression);
}

function formatChoiceContent(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (window.katex && !/[А-Яа-яЁё]/.test(text)) {
    return renderKatexMath(text);
  }

  if (window.katex && /[А-Яа-яЁё]/.test(text)) {
    return renderInlineFractions(renderTextWithInlineKatex(text));
  }

  return escapeHtml(text);
}

function getTaskAnswerText(task) {
  if (task.answer !== undefined && task.answer !== null && String(task.answer).trim() !== "") {
    return String(task.answer);
  }

  if (task.correct_answer !== undefined && task.correct_answer !== null && String(task.correct_answer).trim() !== "") {
    return String(task.correct_answer);
  }

  if (Array.isArray(task.answers) && task.correct !== undefined) {
    return String(task.answers[Number(task.correct)] || "");
  }

  if (task.correct !== undefined) {
    return String(task.correct);
  }

  return "";
}

function getTaskSolutionText(task) {
  return String(task.solution || task.explanation || "");
}

function renderAnswerDetails(task, title = "Ответ и решение") {
  const answer = getTaskAnswerText(task);
  const solution = getTaskSolutionText(task);

  return `
    <details class="task-answer">
      <summary>${escapeHtml(title)}</summary>
      <div class="task-answer__content">
        ${
          answer
            ? `<p><span>Ответ:</span> ${formatChoiceContent(answer)}</p>`
            : `<p>Ответ пока не добавлен в базе.</p>`
        }
        ${
          solution
            ? `<p><span>Решение:</span> ${formatChoiceContent(solution)}</p>`
            : ""
        }
      </div>
    </details>
  `;
}

function renderGroupAnswerDetails(group) {
  return `
    <details class="task-answer task-answer--group">
      <summary>Ответ и решение</summary>
      <div class="task-answer__content">
        ${group
          .map((task, index) => {
            const answer = getTaskAnswerText(task);
            const solution = getTaskSolutionText(task);

            return `
              <p>
                <span>${index + 1})</span>
                ${answer ? `Ответ: ${formatChoiceContent(answer)}` : "Ответ пока не добавлен в базе."}
                ${solution ? `<br>Решение: ${formatChoiceContent(solution)}` : ""}
              </p>
            `;
          })
          .join("")}
      </div>
    </details>
  `;
}

function shouldShowAnswerTable(task) {
  return Array.isArray(task?.answer_table) && task.answer_table.length;
}

function renderAnswerTable(task, className = "answer-table") {
  if (!shouldShowAnswerTable(task)) {
    return "";
  }

  const columnCount = task.answer_table.length;

  return `
    <table class="${className}" style="--answer-table-columns: ${columnCount};">
      <tbody>
        <tr>
          ${task.answer_table.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}
        </tr>
        <tr>
          ${task.answer_table.map(() => "<td></td>").join("")}
        </tr>
      </tbody>
    </table>
  `;
}

function getTaskOptionItems(task) {
  const textOptions = Array.isArray(task?.options)
    ? task.options.map((value) => ({ type: "text", value }))
    : [];
  const imageOptions = Array.isArray(task?.option_images)
    ? task.option_images
    .map((entry, index) => {
      const image = Array.isArray(entry)
        ? entry[0]
        : entry?.src || entry?.image || entry;
      const normalizedImage = normalizeTaskImagePath(image || "");

      if (!normalizedImage) {
        return null;
      }

      return {
        type: "image",
        src: normalizedImage,
        alt: entry?.alt || `Вариант ответа ${index + 1}`,
      };
    })
    .filter(Boolean)
    : [];

  if (!imageOptions.length) {
    return textOptions;
  }

  if (textOptions.length === 1 && imageOptions.length === 3) {
    return [imageOptions[0], textOptions[0], imageOptions[1], imageOptions[2]];
  }

  return imageOptions;
}

function renderTaskOptionContent(option) {
  if (option?.type === "image") {
    return `
      <strong class="task-option-image-wrap">
        <img class="task-option-image" src="${escapeHtml(option.src)}" alt="${escapeHtml(option.alt || "Вариант ответа")}">
      </strong>
    `;
  }

  return `<strong>${formatChoiceContent(option?.value ?? option ?? "")}</strong>`;
}

function getTaskCase(task) {
  if (!task) {
    return null;
  }

  if (task.case || task.task_case) {
    return task.case || task.task_case;
  }

  const caseId = task.case_id;
  const taskCases = window.OGE_TASK_CASES || {};
  return caseId ? taskCases[caseId] || null : null;
}

function getTaskCaseParagraphs(taskCase) {
  const intro = taskCase?.intro || taskCase?.text || taskCase?.description || "";
  const paragraphs = Array.isArray(intro) ? intro : [intro];
  return paragraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean);
}

function getTaskCaseImage(taskCase) {
  return normalizeTaskImagePath(taskCase?.image || taskCase?.diagram || "");
}

function renderTaskCaseTable(taskCase) {
  const rows = Array.isArray(taskCase?.table) ? taskCase.table : [];

  if (!rows.length) {
    return "";
  }

  return `
    <table class="task-case__table">
      <tbody>
        ${rows
          .map((row) => {
            const cells = Array.isArray(row)
              ? row
              : [row?.name || row?.label || "", row?.value || row?.price || ""];

            return `
              <tr>
                ${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderTaskCaseBlock(task, className = "task-case") {
  const taskCase = getTaskCase(task);

  if (!taskCase) {
    return "";
  }

  const paragraphs = getTaskCaseParagraphs(taskCase);
  const image = getTaskCaseImage(taskCase);
  const imageAlt = taskCase.image_alt || taskCase.title || "Общее условие";
  const note = String(taskCase.note || "").trim();

  return `
    <div class="${className}">
      ${taskCase.title ? `<p class="task-case__title">${escapeHtml(taskCase.title)}</p>` : ""}
      ${paragraphs.map((paragraph) => `<p class="task-case__text">${formatChoiceContent(paragraph)}</p>`).join("")}
      ${image ? `<div class="task-case__image-wrap"><img class="task-case__image" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></div>` : ""}
      ${renderTaskCaseTable(taskCase)}
      ${note ? `<p class="task-case__text task-case__note">${formatChoiceContent(note)}</p>` : ""}
    </div>
  `;
}

function renderInlineFractions(html) {
  return String(html || "").replace(/\b(\d+)\/(\d+)\b/g, (_, numerator, denominator) =>
    renderKatexMath(`\\frac{${numerator}}{${denominator}}`),
  );
}

function hasVisualChoiceLayout(taskList) {
  return Number(taskList[0]?.number) === 7 && taskList.some((task) => Array.isArray(task.options));
}

function hasRichTaskLayout(taskList) {
  return taskList.some((task) => hasRichTaskContent(task));
}

function hasRichTaskContent(task) {
  return Boolean(
    task?.intro
      || task?.statement
      || task?.description
      || task?.case_id
      || task?.case
      || task?.image
      || task?.diagram
      || task?.question_text
      || task?.question_prompt
      || (Array.isArray(task?.option_images) && task.option_images.length),
  );
}

function renderFormulaWithCondition(text) {
  const source = String(text || "");
  const parts = source.split(/,\s*при\s+/i);

  if (parts.length < 2) {
    return renderTextWithInlineKatex(source);
  }

  const formula = parts.shift();
  const condition = parts.join(", при ");

  return `${renderKatexMath(formula)}<span class="task-inline-note">, при ${renderConditionAssignments(condition)}</span>`;
}

function renderConditionAssignments(text) {
  return String(text || "")
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)([.;])?$/);
      const body = (match?.[1] || "").trim();
      const punctuation = match?.[2] || "";

      if (!body) {
        return punctuation;
      }

      return `${renderKatexMath(body)}${escapeHtml(punctuation)}`;
    })
    .join(", ");
}

function shouldUseKatex(task, expression) {
  if (!window.katex) {
    return false;
  }

  const text = String(expression || "");
  const taskNumber = Number(task.number);

  if (/[А-Яа-яЁё]/.test(text)) {
    return false;
  }

  if (taskNumber >= 1 && taskNumber <= 20) {
    return true;
  }

  return Boolean(task.expression) || /\\(?:frac|sqrt|left|right|cdot)|[\^_/<>=≤≥≠]/.test(text);
}

function shouldUseInlineKatexText(task, expression) {
  if (!window.katex) {
    return false;
  }

  return [7, 8, 12, 13, 14].includes(Number(task.number)) && /[А-Яа-яЁё]/.test(String(expression || ""));
}

function renderTextWithInlineKatex(text) {
  const source = String(text || "");
  const formulaPattern =
    /(\{?\s*[-+()A-Za-zΑ-Ωα-ω0-9_.·,\/\\^{}\s]+(?:[=<>≤≥]\s*[-+()A-Za-zΑ-Ωα-ω0-9_.·,\/\\^{}\s;]+)+\}?|\\?sqrt\([^()]+\)|\\sqrt\{[^{}]+\}|\\frac\{[^{}]+\}\{[^{}]+\}|[A-Za-zΑ-Ωα-ω]+_[A-Za-z0-9]+(?:[A-Za-zΑ-Ωα-ω]+_[A-Za-z0-9]+)*|[A-Za-zΑ-Ωα-ω0-9]+\^-?\d+|\b[A-Za-zΑ-Ωα-ω]\d+\b|\b(?:sin|cos|tg|ctg)\([^()]+\)|\b[A-Za-zΑ-Ωα-ω]\([^()]+\))/g;

  let result = "";
  let lastIndex = 0;

  for (const match of source.matchAll(formulaPattern)) {
    const index = match.index ?? 0;
    result += escapeHtml(source.slice(lastIndex, index));
    result += renderInlineMathMatch(match[0]);
    lastIndex = index + match[0].length;
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
}

function renderInlineMathMatch(expression) {
  const source = String(expression || "");
  const leadingSpace = source.match(/^\s*/)?.[0] || "";
  const trailingSpace = source.match(/\s*$/)?.[0] || "";
  let body = source.slice(leadingSpace.length, source.length - trailingSpace.length);
  const trailingPunctuation = body.match(/[,.]+$/)?.[0] || "";

  if (trailingPunctuation) {
    body = body.slice(0, -trailingPunctuation.length).trimEnd();
  }

  return `${escapeHtml(leadingSpace)}${renderMathSnippet(body)}${escapeHtml(trailingPunctuation)}${escapeHtml(trailingSpace)}`;
}

function renderMathSnippet(expression) {
  const source = String(expression || "").trim();

  if (!source) {
    return "";
  }

  if (isSystemExpression(source)) {
    return renderSystemExpression(source);
  }

  return renderKatexMath(source);
}

function isSystemExpression(expression) {
  const source = String(expression || "").trim();
  return source.startsWith("{") && source.endsWith("}") && source.includes(";") && /[=<>≤≥]/.test(source);
}

function renderSystemExpression(expression) {
  const rows = String(expression || "")
    .trim()
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .split(";")
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    return renderKatexMath(String(expression || "").replace(/[{}]/g, ""));
  }

  return `
    <span class="math-system">
      <span class="math-system__brace">{</span>
      <span class="math-system__rows">
        ${rows.map((row) => `<span>${renderKatexMath(row)}</span>`).join("")}
      </span>
    </span>
  `;
}

function renderKatexMath(expression) {
  const cleanExpression = String(expression || "").trim();

  if (!cleanExpression) {
    return "";
  }

  if (isSystemExpression(cleanExpression)) {
    return renderSystemExpression(cleanExpression);
  }

  if (forcePlainMathRendering) {
    return `<span class="math-plain">${renderMathExpression(normalizeKatexExpression(cleanExpression))}</span>`;
  }

  try {
    return window.katex.renderToString(normalizeKatexExpression(cleanExpression), {
      throwOnError: false,
      displayMode: false,
      strict: "ignore",
      trust: false,
    });
  } catch (error) {
    console.warn("Не удалось отрисовать формулу через KaTeX:", expression, error);
    return formatMath(expression);
  }
}

function restoreBrokenLatexEscapes(expression) {
  return String(expression || "")
    .replace(/\f\s*rac/g, "\\frac")
    .replace(/\r\s*ight/g, "\\right")
    .replace(/(^|[^\\])\bleft(?=\s*[\({])/g, "$1\\left")
    .replace(/(^|[^\\])\bcdot\b/g, "$1\\cdot");
}

function normalizeKatexExpression(expression) {
  return normalizeSlashFractions(
    normalizeSqrtFunctionSyntax(restoreBrokenLatexEscapes(expression))
    .replace(/·/g, "\\cdot ")
    .replace(/\*/g, "\\cdot ")
    .replace(/:/g, "\\div ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/([A-Za-zА-Яа-я0-9)])\^\((-?\d+)\)/g, "$1^{$2}")
    .replace(/\b([A-Za-zА-Яа-я])(\d+)\b/g, "$1_{$2}")
    .replace(/\b(?!sin\b|cos\b|tg\b|ctg\b|sqrt\b)([A-Za-zА-Яа-я])\(([^()]+)\)/g, "$1_{$2}")
    .replace(/([A-Za-zА-Яа-я])_([A-Za-z0-9]+)/g, "$1_{$2}")
    .replace(/([A-Za-zА-Яа-я0-9)])\^(-?\d+)/g, "$1^{$2}")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/ρ/g, "\\rho ")
    .replace(/ω/g, "\\omega ")
    .replace(/\bsin\(/g, "\\sin(")
    .replace(/\bcos\(/g, "\\cos(")
    .replace(/\btg\(/g, "\\tg(")
    .replace(/\bctg\(/g, "\\ctg(")
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, "$1\\frac{$2}{$3}")
    .replace(/;/g, "\\quad;\\quad "),
  );
}

function normalizeSlashFractions(text) {
  let result = String(text || "");
  const token = String.raw`(?:\\sqrt\{[^{}]+\}|\\frac\{[^{}]+\}\{[^{}]+\}|[A-Za-zА-Яа-я0-9]+(?:_\{[^{}]+\}|_[A-Za-z0-9+\-]+)?(?:\^\{[^{}]+\}|\^-?\d+)?|\d+(?:[.,]\d+)?)`;
  const product = String.raw`(?:${token}(?:\s*\\cdot\s*${token})+)`;
  const grouped = String.raw`(?:\((?:[^()]|\([^()]*\))+\)(?:\^\{[^{}]+\}|\^-?\d+)?)`;
  const patterns = [
    new RegExp(String.raw`(${grouped})\s*\/\s*(${grouped})`, "g"),
    new RegExp(String.raw`(${product})\s*\/\s*(${token})`, "g"),
    new RegExp(String.raw`(${grouped})\s*\/\s*(${token})`, "g"),
    new RegExp(String.raw`(${token})\s*\/\s*(${grouped})`, "g"),
    new RegExp(String.raw`(${token})\s*\/\s*(${token})`, "g"),
  ];

  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result
      .replace(patterns[0], (_, left, right) => `\\frac{${stripFractionOperand(left)}}{${stripFractionOperand(right)}}`)
      .replace(patterns[1], (_, left, right) => `\\frac{${left}}{${right}}`)
      .replace(patterns[2], (_, left, right) => `\\frac{${stripFractionOperand(left)}}{${right}}`)
      .replace(patterns[3], (_, left, right) => `\\frac{${left}}{${stripFractionOperand(right)}}`)
      .replace(patterns[4], (_, left, right) => `\\frac{${left}}{${right}}`);
  }

  return result;
}

function stripFractionOperand(value) {
  const source = String(value || "").trim();

  if (/^\([\s\S]+\)(?:\^\{[^{}]+\}|\^-?\d+)$/.test(source)) {
    return source;
  }

  if (source.startsWith("(") && source.endsWith(")")) {
    return source.slice(1, -1);
  }

  return source;
}

function normalizeSqrtFunctionSyntax(text) {
  let result = String(text || "");

  while (result.includes("sqrt(")) {
    const start = result.indexOf("sqrt(");
    let depth = 0;
    let end = -1;

    for (let index = start + 4; index < result.length; index += 1) {
      if (result[index] === "(") {
        depth += 1;
      }

      if (result[index] === ")") {
        depth -= 1;

        if (depth === 0) {
          end = index;
          break;
        }
      }
    }

    if (end === -1) {
      break;
    }

    const inner = result.slice(start + 5, end);
    result = `${result.slice(0, start)}\\sqrt{${inner}}${result.slice(end + 1)}`;
  }

  return result;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPlainMathText(text) {
  return formatSimpleFractions(
    escapeHtml(text)
      .replace(/\\cdot/g, " · ")
      .replace(/\\times/g, " · ")
      .replace(/\\div/g, " : ")
      .replace(/\\le/g, "≤")
      .replace(/\\ge/g, "≥")
      .replace(/\\ne/g, "≠")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\rho/g, "ρ")
      .replace(/\\omega/g, "ω")
      .replace(/\\sin/g, "sin")
      .replace(/\\cos/g, "cos")
      .replace(/\\tg/g, "tg")
      .replace(/\\ctg/g, "ctg")
      .replace(/\\quad/g, " ")
      .replace(/\\left/g, "")
      .replace(/\\right/g, ""),
  );
}

function formatSimpleFractions(text) {
  return String(text).replace(
    /(\d+)\/(\d+)/g,
    '<span class="math-frac"><span>$1</span><span>$2</span></span>',
  );
}

function renderMathExpression(text) {
  let index = 0;
  let html = "";

  while (index < text.length) {
    if (text.startsWith("\\frac{", index)) {
      const numeratorStart = index + "\\frac".length;
      const numerator = readBraceGroup(text, numeratorStart);

      if (!numerator) {
        html += formatPlainMathText(text.slice(index));
        break;
      }

      const denominator = readBraceGroup(text, numerator.end);

      if (!denominator) {
        html += formatPlainMathText(text.slice(index));
        break;
      }

      html += `
        <span class="math-frac">
          <span>${formatMath(numerator.value)}</span>
          <span>${formatMath(denominator.value)}</span>
        </span>
      `;
      index = denominator.end;
      continue;
    }

    if (text.startsWith("\\sqrt{", index)) {
      const radicandStart = index + "\\sqrt".length;
      const radicand = readBraceGroup(text, radicandStart);

      if (!radicand) {
        html += formatPlainMathText(text.slice(index));
        break;
      }

      html += `
        <span class="math-root">
          <span class="math-root__sign">√</span>
          <span class="math-root__value">${formatMath(radicand.value)}</span>
        </span>
      `;
      index = radicand.end;
      continue;
    }

    if (text.startsWith("\\left", index)) {
      index += "\\left".length;
      continue;
    }

    if (text.startsWith("\\right", index)) {
      index += "\\right".length;
      continue;
    }

    if (text.startsWith("\\cdot", index)) {
      html += " · ";
      index += "\\cdot".length;
      continue;
    }

    if (text.startsWith("\\times", index)) {
      html += " · ";
      index += "\\times".length;
      continue;
    }

    if (text.startsWith("\\div", index)) {
      html += " : ";
      index += "\\div".length;
      continue;
    }

    if (text[index] === "^") {
      const power = readPower(text, index + 1);

      if (power) {
        html += `<sup>${formatMath(power.value)}</sup>`;
        index = power.end;
        continue;
      }
    }

    if (text[index] === "_") {
      const subscript = readPower(text, index + 1);

      if (subscript) {
        html += `<sub>${formatMath(subscript.value)}</sub>`;
        index = subscript.end;
        continue;
      }
    }

    const nextSpecialIndex = findNextMathSpecial(text, index + 1);
    html += formatPlainMathText(text.slice(index, nextSpecialIndex));
    index = nextSpecialIndex;
  }

  return html;
}

function findNextMathSpecial(text, startIndex) {
  const specialIndexes = [
    text.indexOf("\\frac{", startIndex),
    text.indexOf("\\sqrt{", startIndex),
    text.indexOf("\\left", startIndex),
    text.indexOf("\\right", startIndex),
    text.indexOf("\\cdot", startIndex),
    text.indexOf("\\times", startIndex),
    text.indexOf("\\div", startIndex),
    text.indexOf("^", startIndex),
    text.indexOf("_", startIndex),
  ].filter((position) => position !== -1);

  return specialIndexes.length ? Math.min(...specialIndexes) : text.length;
}

function readPower(text, startIndex) {
  if (text[startIndex] === "{") {
    return readBraceGroup(text, startIndex);
  }

  if (text[startIndex] === "(") {
    const match = text.slice(startIndex).match(/^\((-?\d+)\)/);

    if (match) {
      return {
        value: match[1],
        end: startIndex + match[0].length,
      };
    }
  }

  const match = text.slice(startIndex).match(/^-?\d+/);

  if (match) {
    return {
      value: match[0],
      end: startIndex + match[0].length,
    };
  }

  if (text[startIndex]) {
    return {
      value: text[startIndex],
      end: startIndex + 1,
    };
  }

  return null;
}

function readBraceGroup(text, startIndex) {
  if (text[startIndex] !== "{") {
    return null;
  }

  let depth = 0;

  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === "{") {
      depth += 1;
    }

    if (text[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          value: text.slice(startIndex + 1, index),
          end: index + 1,
        };
      }
    }
  }

  return null;
}

function groupTasksByTopic(taskList) {
  return taskList.reduce((groups, task) => {
    const key = isGroupedSelectionTask(task)
      ? getGroupedSelectionKey(task)
      : task.groupKey || task.topic || "Прототипы";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(task);
    return groups;
  }, {});
}

function normalizeLoadedTasks(loadedTasks, exam) {
  return loadedTasks.flatMap((entry, entryIndex) => {
    if (!entry || !Array.isArray(entry.items)) {
      if (!entry) {
        return [];
      }

      const block = normalizeBlockName(entry.block || "");

      return [{
        ...entry,
        exam,
        block,
        topic: entry.topic || `Группа ${entry.task_group || 1}`,
        groupKey: block
          ? `${block} / группа ${entry.task_group || 1}`
          : `Группа ${entry.task_group || 1}`,
        prototype: entry.prototype || entry.item_number || entryIndex + 1,
        question: entry.question || entry.question_raw || entry.question_text || "",
        image: normalizeTaskImagePath(entry.image || entry.diagram || ""),
        answer: entry.answer || "",
        solution: entry.solution || "",
      }];
    }

    return entry.items.map((item, index) => ({
      ...item,
      exam,
      source_file: entry.source_file,
      grade: item.grade || entry.grade || entry.class || entry.mcko_class,
      subject: item.subject || entry.subject,
      number: item.number || entry.number,
      title: item.title || entry.title,
      block: normalizeBlockName(item.block || entry.block || ""),
      topic: item.topic || `Группа ${item.task_group || 1}`,
      groupKey: normalizeBlockName(item.block || entry.block)
        ? `${normalizeBlockName(item.block || entry.block)} / группа ${item.task_group || 1}`
        : `Группа ${item.task_group || 1}`,
      prototype: item.prototype || index + 1,
      question: item.question || item.question_raw || item.question_text || "",
      image: normalizeTaskImagePath(item.image || item.diagram || ""),
      answer: item.answer || "",
      solution: item.solution || "",
    }));
  });
}

function normalizeTaskImagePath(path) {
  const value = String(path || "").trim();

  if (!value || value.startsWith("tasks/") || value.startsWith("ege-tasks/") || value.startsWith("mcko-tasks/") || value.startsWith("http")) {
    return value;
  }

  if (value.startsWith("images/")) {
    return `tasks/${value}`;
  }

  return value;
}

function renderPrototypeSheet(taskList, options = {}) {
  const { interactive = false, showAnswers = false } = options;
  const groups = Object.values(groupTasksByTopic(taskList));
  const sheetNumber = Number(taskList[0]?.number);
  const isStatementSheet = sheetNumber === 19;
  const isLongAnswerSheet = isLongAnswerNumber(sheetNumber);
  const isThreeColumnSheet = isThreeColumnNumber(sheetNumber);
  const isTwoColumnSheet = isTwoColumnNumber(sheetNumber);
  const isOneColumnSheet = isOneColumnNumber(sheetNumber);
  const taskSpecificClass = [
    isStatementSheet ? "prototype-sheet--statements" : "",
    isThreeColumnSheet ? "prototype-sheet--three-columns" : "",
    isTwoColumnSheet ? "prototype-sheet--two-columns" : "",
    isOneColumnSheet ? "prototype-sheet--one-column" : "",
    isLongAnswerSheet ? "prototype-sheet--long-tasks" : "",
  ].filter(Boolean).join(" ");
  const className = taskSpecificClass ? `prototype-sheet ${taskSpecificClass}` : "prototype-sheet";

  if (isLongAnswerSheet) {
    return renderLongAnswerSheet(taskList, { interactive, showAnswers, className });
  }

  if (!isStatementSheet && hasVisualChoiceLayout(taskList)) {
    return renderVisualChoiceSheet(taskList, { interactive, showAnswers, className });
  }

  if (!isStatementSheet && hasRichTaskLayout(taskList)) {
    return renderRichTaskSheet(taskList, { interactive, showAnswers, className });
  }

  return `
    <section class="${className}">
      <header class="prototype-sheet__header">
        <h3>${getSheetTitle(taskList)}</h3>
        <p>${getSheetBlock(taskList)}</p>
      </header>
      <div class="prototype-sheet__groups">
        ${groups
          .map((group, groupIndex) => {
            const groupTaskIds = group.map((task) => task.id);
            const groupChecked = groupTaskIds.every((taskId) => selectedTaskIds.has(taskId)) ? " checked" : "";
            const groupTitle = `<span>Задание ${groupIndex + 1}.</span> ${getTaskPrompt(group)}`;

            return `
              <section class="prototype-group">
                <h4>
                  ${
                    interactive && isStatementSheet
                      ? `
                        <label class="prototype-group__selector">
                          <input
                            type="checkbox"
                            value="${groupTaskIds.join(",")}"
                            data-task-group-checkbox
                            ${groupChecked}
                          >
                          <span>${groupTitle}</span>
                        </label>
                      `
                      : groupTitle
                  }
                </h4>
                <div class="prototype-options">
                  ${group
                    .map((task, taskIndex) => {
                      const checked = selectedTaskIds.has(task.id) ? " checked" : "";
                      const expression = formatTaskContent(task);

                      return interactive && !isStatementSheet
                        ? `
                          <div class="prototype-option prototype-option--interactive">
                            <label class="prototype-option__select">
                              <input type="checkbox" value="${task.id}" data-task-checkbox${checked}>
                              <span>${taskIndex + 1})</span>
                              <strong>${expression};</strong>
                            </label>
                            ${renderAnswerDetails(task)}
                          </div>
                        `
                        : `
                          <div class="prototype-option prototype-option--static">
                            <span>${taskIndex + 1})</span>
                            <strong>${expression};</strong>
                            ${!isStatementSheet ? renderAnswerDetails(task) : ""}
                          </div>
                        `;
                    })
                    .join("")}
                </div>
                ${isStatementSheet ? renderGroupAnswerDetails(group) : ""}
                ${
                  showAnswers
                    ? `
                      <div class="prototype-solutions">
                        ${group
                          .map(
                            (task, taskIndex) => `
                              <p><strong>${taskIndex + 1})</strong> Ответ: ${task.answer}. ${task.solution}</p>
                            `,
                          )
                          .join("")}
                      </div>
                    `
                    : ""
                }
              </section>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderVisualChoiceSheet(taskList, options = {}) {
  const { interactive = false, showAnswers = false, className = "prototype-sheet" } = options;

  return `
    <section class="${className} prototype-sheet--visual-choice">
      <header class="prototype-sheet__header">
        <h3>${getSheetTitle(taskList)}</h3>
        <p>${getSheetBlock(taskList)}</p>
      </header>
      <div class="visual-task-list">
        ${taskList
          .map((task, taskIndex) => {
            const checked = selectedTaskIds.has(task.id) ? " checked" : "";
            const intro = task.intro || task.statement || task.description || "";
            const question = task.question_text || task.question_prompt || task.question || task.question_raw || "";
            const image = task.image || task.diagram || "";
            const imageAlt = task.image_alt || `Схема к заданию ${taskIndex + 1}`;
            const imageSizeClass = Number(task.number) === 11 ? " task-image--large" : "";
            const optionItems = getTaskOptionItems(task);
            const optionsMarkup = optionItems
              .map(
                (item, optionIndex) => `
                  <div class="visual-task__option">
                    <span>${optionIndex + 1})</span>
                    ${renderTaskOptionContent(item)}
                  </div>
                `,
              )
              .join("");
            const content = `
              ${renderTaskCaseBlock(task, "task-case task-case--visual")}
              <p class="visual-task__heading"><span class="visual-task__title">Задание ${taskIndex + 1}.</span>${intro ? ` ${formatChoiceContent(intro)}` : ""}</p>
              ${image ? `<div class="visual-task__image-wrap"><img class="visual-task__image${imageSizeClass}" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></div>` : ""}
              ${question ? `<p class="visual-task__question">${formatChoiceContent(question)}</p>` : ""}
              ${optionsMarkup ? `<div class="visual-task__options">${optionsMarkup}</div>` : ""}
              ${renderAnswerTable(task)}
            `;

            return interactive
              ? `
                <div class="visual-task">
                  <label class="visual-task__select">
                    <input type="checkbox" value="${task.id}" data-task-checkbox${checked}>
                    <span class="visual-task__body">${content}</span>
                  </label>
                  ${renderAnswerDetails(task)}
                </div>
              `
              : `
                <div class="visual-task visual-task--static">
                  <span class="visual-task__body">${content}</span>
                  ${renderAnswerDetails(task)}
                </div>
              `;
          })
          .join("")}
      </div>
      ${
        showAnswers
          ? `
            <div class="prototype-solutions">
              ${taskList
                .map(
                  (task, taskIndex) => `
                    <p><strong>${taskIndex + 1})</strong> Ответ: ${task.answer}. ${task.solution}</p>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderRichTaskSheet(taskList, options = {}) {
  const { interactive = false, showAnswers = false, className = "prototype-sheet" } = options;

  return `
    <section class="${className} prototype-sheet--rich-tasks">
      <header class="prototype-sheet__header">
        <h3>${getSheetTitle(taskList)}</h3>
        <p>${getSheetBlock(taskList)}</p>
      </header>
      <div class="long-task-list">
        ${taskList
          .map((task, taskIndex) => {
            const checked = selectedTaskIds.has(task.id) ? " checked" : "";
            const content = renderRichTaskBody(task, taskIndex + 1);

            return interactive
              ? `
                <div class="long-task long-task--rich">
                  <label class="long-task__select">
                    <input type="checkbox" value="${task.id}" data-task-checkbox${checked}>
                    <span class="long-task__body">${content}</span>
                  </label>
                  ${renderAnswerDetails(task)}
                </div>
              `
              : `
                <div class="long-task long-task--rich long-task--static">
                  <span class="long-task__body">${content}</span>
                  ${renderAnswerDetails(task)}
                </div>
              `;
          })
          .join("")}
      </div>
      ${
        showAnswers
          ? `
            <div class="prototype-solutions">
              ${taskList
                .map(
                  (task, taskIndex) => `
                    <p><strong>${taskIndex + 1})</strong> Ответ: ${task.answer}. ${task.solution}</p>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderRichTaskBody(task, taskNumber) {
  const intro = task.intro || task.statement || task.description || "";
  const question = task.question_text || task.question_prompt || task.question || task.question_raw || "";
  const image = task.image || task.diagram || "";
  const imageAlt = task.image_alt || `Схема к заданию ${taskNumber}`;
  const imageSizeClass = Number(task.number) === 11 ? " task-image--large" : "";
  const optionItems = getTaskOptionItems(task);
  const fallback = !intro && !question && !image ? formatTaskContent(task) : "";

  return `
    ${renderTaskCaseBlock(task, "task-case task-case--rich")}
    <span class="long-task__title">Задание ${taskNumber}. ${task.prompt || "Решите задачу."}</span>
    ${intro ? `<span class="long-task__text">${formatChoiceContent(intro)}</span>` : ""}
    ${image ? `<span class="long-task__image-wrap"><img class="long-task__image${imageSizeClass}" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></span>` : ""}
    ${question ? `<span class="long-task__text">${formatChoiceContent(question)}</span>` : ""}
    ${fallback ? `<span class="long-task__text">${fallback}</span>` : ""}
    ${optionItems.length ? renderLongTaskOptions(optionItems) : ""}
    ${renderAnswerTable(task)}
  `;
}

function renderLongTaskOptions(optionItems) {
  return `
    <span class="long-task__options">
      ${optionItems
        .map(
          (option, index) => `
            <span class="long-task__option">
              <span>${index + 1})</span>
              ${renderTaskOptionContent(option)}
            </span>
          `,
        )
        .join("")}
    </span>
  `;
}

function renderLongAnswerSheet(taskList, options = {}) {
  const { interactive = false, showAnswers = false, className = "prototype-sheet" } = options;

  return `
    <section class="${className}">
      <header class="prototype-sheet__header">
        <h3>${getSheetTitle(taskList)}</h3>
        <p>${getSheetBlock(taskList)}</p>
      </header>
      <div class="long-task-list">
        ${taskList
          .map((task, taskIndex) => {
            const checked = selectedTaskIds.has(task.id) ? " checked" : "";
            const expression = formatTaskContent(task);
            const taskTitle = `Задание ${taskIndex + 1}. ${task.prompt || "Решите задачу."}`;
            const content = `
              <span class="long-task__title">${taskTitle}</span>
              <span class="long-task__text">${expression}</span>
            `;

            return interactive
              ? `
                <div class="long-task">
                  <label class="long-task__select">
                    <input type="checkbox" value="${task.id}" data-task-checkbox${checked}>
                    <span class="long-task__body">${content}</span>
                  </label>
                  ${renderAnswerDetails(task)}
                </div>
              `
              : `
                <div class="long-task long-task--static">
                  <span class="long-task__body">${content}</span>
                  ${renderAnswerDetails(task)}
                </div>
              `;
          })
          .join("")}
      </div>
      ${
        showAnswers
          ? `
            <div class="prototype-solutions">
              ${taskList
                .map(
                  (task, taskIndex) => `
                    <p><strong>${taskIndex + 1})</strong> Ответ: ${task.answer}. ${task.solution}</p>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function getSelectedListEntries() {
  const entries = [];
  const statementGroups = new Map();
  const caseGroups = new Map();

  getSelectedTasks().forEach((task) => {
    if (isCaseGroupedTask(task)) {
      const key = task.case_id;

      if (!caseGroups.has(key)) {
        caseGroups.set(key, []);
      }

      caseGroups.get(key).push(task);
      return;
    }

    if (!isGroupedSelectionTask(task)) {
      entries.push({ type: "task", task });
      return;
    }

    const key = getGroupedSelectionKey(task);

    if (!statementGroups.has(key)) {
      statementGroups.set(key, []);
    }

    statementGroups.get(key).push(task);
  });

  statementGroups.forEach((group) => {
    entries.push({ type: "statementGroup", tasks: group });
  });

  caseGroups.forEach((group) => {
    entries.push({ type: "caseGroup", tasks: group });
  });

  return entries.sort((first, second) => {
    const firstTask = first.task || first.tasks[0];
    const secondTask = second.task || second.tasks[0];

    return firstTask.number - secondTask.number || firstTask.prototype - secondTask.prototype;
  });
}

function renderNumberGrid() {
  if (isMckoActive()) {
    const cards = getAvailableNumbers().map((number) => {
      const count = getTasksByNumber(number).length;
      const isActive = Number(activeNumber) === number ? " is-active" : "";

      return `
        <button class="number-card${isActive}" type="button" data-number="${number}">
          <strong>${number}</strong>
          <span>МЦКО ${activeMckoClass} класс</span>
          <small>${count} прототипов</small>
        </button>
      `;
    });

    taskNumberGrid.innerHTML = cards.join("");
    return;
  }

  if (isEgeBaseActive()) {
    taskNumberGrid.innerHTML = "";
    return;
  }

  const config = getExamConfig();
  const cards = [];

  if (activeExam === "oge") {
    const caseCount = getOgeTextGroupCases().length;
    const activeClass = isOgeTextGroupActive() ? " is-active" : "";

    cards.push(`
      <button class="number-card number-card--wide${activeClass}" type="button" data-number-group="${OGE_TEXT_GROUP_DATASET}">
        <strong>${OGE_TEXT_GROUP_LABEL}</strong>
        <span>Группы задач по тексту</span>
        <small>${caseCount} вариантов</small>
      </button>
    `);
  }

  const startNumber = activeExam === "oge" ? 6 : 1;

  for (let number = startNumber; number <= config.taskCount; number += 1) {
    const count = getTasksByNumber(number).length;
    const isActive = Number(activeNumber) === number && !isOgeTextGroupActive() ? " is-active" : "";

    cards.push(`
      <button class="number-card${isActive}" type="button" data-number="${number}">
        <strong>${number}</strong>
        <span>${getAnswerType(number)}</span>
        <small>${count} прототипов</small>
      </button>
    `);
  }

  taskNumberGrid.innerHTML = cards.join("");
}

function renderExamSubswitch() {
  if (!examSubswitch) {
    return;
  }

  if (!isMckoActive() && !isEgeActive()) {
    examSubswitch.innerHTML = "";
    examSubswitch.hidden = true;
    return;
  }

  examSubswitch.hidden = false;

  if (isMckoActive()) {
    examSubswitch.innerHTML = MCKO_CLASSES
      .map((classEntry) => {
        const activeClass = Number(activeMckoClass) === classEntry.grade ? " is-active" : "";

        return `
          <button class="exam-subswitch__button${activeClass}" type="button" data-mcko-class="${classEntry.grade}">
            ${classEntry.grade} класс
          </button>
        `;
      })
      .join("");
    return;
  }

  examSubswitch.innerHTML = EGE_LEVELS
    .map((level) => {
      const activeClass = activeEgeLevel === level.id ? " is-active" : "";

      return `
        <button class="exam-subswitch__button${activeClass}" type="button" data-ege-level="${level.id}">
          ${escapeHtml(level.label)}
        </button>
      `;
    })
    .join("");
}

function renderExamSwitch() {
  if (!examSwitch) {
    return;
  }

  examSwitch.innerHTML = Object.entries(EXAM_CONFIG)
    .map(([exam, config]) => {
      const activeClass = exam === activeExam ? " is-active" : "";
      return `
        <button class="exam-switch__button${activeClass}" type="button" data-exam="${exam}">
          ${config.label}
        </button>
      `;
    })
    .join("");

  if (catalogEyebrow) {
    if (isMckoActive()) {
      catalogEyebrow.textContent = "Классы МЦКО";
    } else if (isEgeActive()) {
      catalogEyebrow.textContent = "Раздел ЕГЭ";
    } else {
      catalogEyebrow.textContent = `Номера ${getExamConfig().label}`;
    }
  }

  if (catalogTitle) {
    if (isMckoActive()) {
      catalogTitle.textContent = "Выберите класс и номер задания МЦКО";
    } else if (isEgeBaseActive()) {
      catalogTitle.textContent = "Базовая математика ЕГЭ";
    } else if (isEgeActive()) {
      catalogTitle.textContent = `Выберите номер задания от 1 до ${getExamConfig().taskCount}`;
    } else {
      catalogTitle.textContent = "Выберите группу 1-5 или номер задания от 6 до 25";
    }
  }

  if (catalogDescription) {
    if (isMckoActive()) {
      catalogDescription.textContent = "Сначала выберите класс в подпунктах ниже переключателя, затем номер задания справа. Прототипы можно открыть на весь экран и добавить в подборку.";
    } else if (isEgeBaseActive()) {
      catalogDescription.textContent = "Подпункт для базовой математики ЕГЭ. Здесь можно будет подключить отдельную базу заданий, не смешивая ее с профильной.";
    } else if (isEgeActive()) {
      catalogDescription.textContent = "Выбран профильный ЕГЭ. После выбора номера справа появятся все прототипы из базы. Отметьте галочками те задания, которые нужно добавить в PDF или распечатать.";
    } else {
      catalogDescription.textContent = "Задания 1-5 собраны в общий раздел по тексту: сначала выбирается тема, затем конкретный вариант. Остальные номера открываются как обычные прототипы.";
    }
  }
}

function renderMckoCatalog() {
  const classEntry = getMckoClass();
  const availableNumbers = getAvailableNumbers();
  const prototypes = getTasksByNumber(activeNumber);

  if (prototypes.length) {
    return `
      <div class="empty-state">
        МЦКО, ${escapeHtml(classEntry.title)}. Для задания ${activeNumber} найдено прототипов: ${prototypes.length}.
        <div class="empty-state__links">
          <button type="button" data-number="${activeNumber}">
            Открыть прототипы на весь экран
          </button>
        </div>
      </div>
    `;
  }

  return `
    <section class="mcko-class-preview">
      <p class="eyebrow">МЦКО · ${escapeHtml(classEntry.title)}</p>
      <h3>${escapeHtml(classEntry.title)}: материалы по математике</h3>
      <p>${escapeHtml(classEntry.description)}</p>
      <div class="mcko-class-preview__actions">
        <span class="mcko-class-card__status">
          ${availableNumbers.length ? "Выберите номер задания справа" : escapeHtml(classEntry.status)}
        </span>
        <span>
          ${
            availableNumbers.length
              ? `В ${escapeHtml(classEntry.title)} доступны задания: ${availableNumbers.join(", ")}.`
              : `Позже сюда можно подключить отдельный файл с заданиями для ${escapeHtml(classEntry.title)}.`
          }
        </span>
      </div>
    </section>
  `;
}

function renderEgeBaseCatalog() {
  const level = getEgeLevel("base");

  return `
    <section class="mcko-class-preview">
      <p class="eyebrow">ЕГЭ · ${escapeHtml(level.label)}</p>
      <h3>${escapeHtml(level.title)}</h3>
      <p>${escapeHtml(level.description)}</p>
      <div class="mcko-class-preview__actions">
        <span class="mcko-class-card__status">${escapeHtml(level.status)}</span>
        <span>Позже сюда можно подключить отдельную папку или файл с заданиями базовой математики.</span>
      </div>
    </section>
  `;
}

function renderTextGroupCatalog() {
  const topics = getOgeTextGroupTopics();

  if (!topics.length) {
    return `
      <div class="empty-state">
        Для раздела 1-5 пока нет вариантов. Добавьте общий блок в файл tasks/task-01.js через OGE_TASK_CASES и задания с тем же case_id.
      </div>
    `;
  }

  return `
    <section class="text-group-catalog">
      <div class="text-group-catalog__header">
        <p class="eyebrow">№№1-5. Группы задач по тексту</p>
        <h3>Выберите тему</h3>
        <p>Каждая тема содержит варианты с общим условием и отдельными вопросами 1, 2, 3, 4, 5.</p>
      </div>
      <div class="text-topic-grid">
        ${topics
          .map(
            (entry, index) => `
              <button class="text-topic-card" type="button" data-text-topic="${escapeHtml(entry.topic)}">
                <span>${String(index + 1).padStart(2, "0")}. ${escapeHtml(entry.topic)}</span>
                <small>${entry.count} вариантов</small>
              </button>
            `,
          )
          .join("")}
      </div>
      <button class="text-group-catalog__open" type="button" data-number-group="${OGE_TEXT_GROUP_DATASET}">
        Открыть раздел 1-5 на весь экран
      </button>
    </section>
  `;
}

function renderTextGroupTaskRows(tasksToRender, { interactive = false, showAnswers = false } = {}) {
  return tasksToRender
    .map((task) => {
      const checked = selectedTaskIds.has(task.id) ? " checked" : "";
      const prompt = task.prompt || "";
      const question = task.question_text || task.question_prompt || task.question || task.question_raw || "";
      const content = `
        <span class="text-case-task__content">
          <strong>Задание ${task.number}.</strong>
          ${prompt ? `<span>${escapeHtml(prompt)}</span>` : ""}
          ${question ? `<span>${formatChoiceContent(question)}</span>` : ""}
        </span>
      `;

      return `
        <div class="text-case-task">
          ${
            interactive
              ? `
                <label class="text-case-task__select">
                  <input type="checkbox" value="${task.id}" data-task-checkbox${checked}>
                  ${content}
                </label>
              `
              : content
          }
          ${showAnswers ? renderPlainAnswer(task) : ""}
          ${interactive ? renderAnswerDetails(task) : ""}
        </div>
      `;
    })
    .join("");
}

function renderTextGroupCase(caseEntry, options = {}) {
  const firstTask = caseEntry.tasks[0];
  const taskIds = caseEntry.tasks.map((task) => task.id).join(",");

  return `
    <article class="text-case-card">
      <header class="text-case-card__header">
        <span>${escapeHtml(caseEntry.topic)}</span>
        <h3>${escapeHtml(caseEntry.title)}</h3>
        ${
          options.interactive
            ? `
              <label class="text-case-card__select-all">
                <input type="checkbox" value="${taskIds}" data-task-group-checkbox${caseEntry.tasks.every((task) => selectedTaskIds.has(task.id)) ? " checked" : ""}>
                <span>Выбрать все задания этого варианта</span>
              </label>
            `
            : ""
        }
      </header>
      ${renderTaskCaseBlock(firstTask, "task-case task-case--text-group")}
      <div class="text-case-card__tasks">
        ${renderTextGroupTaskRows(caseEntry.tasks, options)}
      </div>
    </article>
  `;
}

function renderTextGroupOverlay() {
  const topics = getOgeTextGroupTopics();
  const activeTopic = ensureActiveTextTopic();
  const cases = getOgeTextGroupCasesByTopic(activeTopic);

  if (!topics.length) {
    return `
      <div class="empty-state">
        Для раздела 1-5 пока нет вариантов. Добавьте общий блок и задания с case_id.
      </div>
    `;
  }

  return `
    <section class="text-group-browser">
      <header class="prototype-sheet__header text-group-browser__header">
        <h3>№№1-5. Группы задач по тексту</h3>
        <p>Сначала выберите тему, затем отметьте нужные задания внутри варианта.</p>
      </header>
      <div class="text-topic-tabs">
        ${topics
          .map((entry) => {
            const activeClass = entry.topic === activeTopic ? " is-active" : "";

            return `
              <button class="text-topic-tab${activeClass}" type="button" data-text-topic="${escapeHtml(entry.topic)}">
                ${escapeHtml(entry.topic)}
              </button>
            `;
          })
          .join("")}
      </div>
      <h4 class="text-group-browser__title">Разделы подтемы ${escapeHtml(activeTopic)}</h4>
      <div class="text-variant-pills">
        ${cases
          .map(
            (caseEntry) => `
              <a href="#${escapeHtml(caseEntry.id)}">${escapeHtml(caseEntry.title)}</a>
            `,
          )
          .join("")}
      </div>
      <div class="text-case-list">
        ${cases.map((caseEntry) => `<div id="${escapeHtml(caseEntry.id)}">${renderTextGroupCase(caseEntry, { interactive: true })}</div>`).join("")}
      </div>
    </section>
  `;
}

function renderPrototypes() {
  if (isMckoActive()) {
    prototypeList.innerHTML = renderMckoCatalog();
    return;
  }

  if (isEgeBaseActive()) {
    prototypeList.innerHTML = renderEgeBaseCatalog();
    return;
  }

  if (isOgeTextGroupActive()) {
    prototypeList.innerHTML = renderTextGroupCatalog();
    return;
  }

  const prototypes = getTasksByNumber(activeNumber);
  const availableNumbers = getAvailableNumbers().filter((number) => !(activeExam === "oge" && number >= 1 && number <= 5));
  const config = getExamConfig();

  if (loadError) {
    prototypeList.innerHTML = `
      <div class="empty-state">
        ${loadError}
      </div>
    `;
    return;
  }

  prototypeList.innerHTML = prototypes.length
    ? `
      <div class="empty-state">
        Для задания ${activeNumber} найдено прототипов: ${prototypes.length}.
        <div class="empty-state__links">
          <button type="button" data-number="${activeNumber}">
            Открыть прототипы на весь экран
          </button>
        </div>
      </div>
    `
    : `
      <div class="empty-state">
        Для задания ${activeNumber} пока нет прототипов. Добавьте их в файл ${config.taskFolder}/task-${String(activeNumber).padStart(2, "0")}.js
        или выберите номер, где прототипы уже есть:
        <div class="empty-state__links">
          ${
            availableNumbers.length
              ? availableNumbers
                  .map(
                    (number) => `
                      <button type="button" data-number="${number}">
                        Задание ${number}: ${getTasksByNumber(number).length}
                      </button>
                    `,
                  )
                  .join("")
              : "в базе пока нет задач"
          }
        </div>
      </div>
    `;
}

function renderOverlayPrototypes() {
  if (isMckoActive()) {
    const classEntry = getMckoClass();
    const prototypes = getTasksByNumber(activeNumber);

    overlayTitle.textContent = `МЦКО. ${classEntry.title}. Задание ${activeNumber}`;
    overlayPrototypeList.innerHTML = prototypes.length
      ? renderPrototypeSheet(prototypes, { interactive: true })
      : renderMckoCatalog();
    return;
  }

  if (isEgeBaseActive()) {
    overlayTitle.textContent = "ЕГЭ. База";
    overlayPrototypeList.innerHTML = renderEgeBaseCatalog();
    return;
  }

  if (isOgeTextGroupActive()) {
    overlayTitle.textContent = `${getExamConfig().label}. Задания 1-5`;
    overlayPrototypeList.innerHTML = renderTextGroupOverlay();
    return;
  }

  const prototypes = getTasksByNumber(activeNumber);
  const config = getExamConfig();

  overlayTitle.textContent = `${config.label}. Задание ${activeNumber}`;
  overlayPrototypeList.innerHTML = prototypes.length
    ? renderPrototypeSheet(prototypes, { interactive: true })
    : `
      <div class="empty-state">
        Для задания ${activeNumber} пока нет прототипов. Добавьте их в файл ${config.taskFolder}/task-${String(activeNumber).padStart(2, "0")}.js.
      </div>
    `;
}

function openPrototypeOverlay() {
  renderOverlayPrototypes();
  prototypeOverlay.classList.add("is-open");
  prototypeOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");
}

function closePrototypeOverlay() {
  prototypeOverlay.classList.remove("is-open");
  prototypeOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
}

function renderSelectedSummary() {
  const selectedTasks = getSelectedTasks();
  const selectedCount = getWorksheetItemCount(selectedTasks);

  selectedSummary.textContent = selectedCount
    ? `Выбрано прототипов: ${selectedCount}`
    : "Пока ничего не выбрано";
}

function getSelectedListDescription(task) {
  const parts = [
    task.title,
    task.topic && task.topic !== task.title ? task.topic : "",
    task.prompt,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Задание из базы";
}

function renderSelectedList() {
  const selectedEntries = getSelectedListEntries();

  selectedList.innerHTML = selectedEntries.length
    ? selectedEntries
        .map((entry) => {
          if (entry.type === "statementGroup") {
            const firstTask = entry.tasks[0];
            const taskIds = entry.tasks.map((task) => task.id).join(",");

            return `
              <div class="selected-item">
                <div>
                  <strong>${getTaskExamLabel(firstTask)} ${firstTask.number}, задание ${firstTask.task_group || firstTask.prototype}</strong>
                  <span>${entry.tasks.length} строк внутри задания</span>
                </div>
                <button type="button" data-remove-selected-group="${taskIds}">Удалить</button>
              </div>
            `;
          }

          if (entry.type === "caseGroup") {
            const firstTask = entry.tasks[0];
            const taskCase = getTaskCase(firstTask);
            const taskIds = entry.tasks.map((task) => task.id).join(",");
            const topic = taskCase?.topic || firstTask.topic || firstTask.block || "Группа задач";
            const title = taskCase?.variant_title || taskCase?.title || topic;

            return `
              <div class="selected-item">
                <div>
                  <strong>${getTaskExamLabel(firstTask)} 1-5, ${escapeHtml(topic)}</strong>
                  <span>${escapeHtml(title)} · выбрано заданий: ${entry.tasks.length}</span>
                </div>
                <button type="button" data-remove-selected-group="${taskIds}">Удалить</button>
              </div>
            `;
          }

          const { task } = entry;

          return `
            <div class="selected-item">
              <div>
                <strong>${getTaskExamLabel(task)} ${task.number}, прототип ${task.prototype}</strong>
                <span>${escapeHtml(getSelectedListDescription(task))}</span>
              </div>
              <button type="button" data-remove-selected="${task.id}">Удалить</button>
            </div>
          `;
        })
        .join("")
    : "";
}

function renderWorksheet() {
  const selectedTasks = getSelectedTasks();
  const showAnswers = includeAnswers.checked;
  const worksheetItemCount = getWorksheetItemCount(selectedTasks);
  const config = getExamConfig();

  worksheetTitle.textContent = `Подборка прототипов ${config.label} по математике`;
  worksheetCount.textContent = `${worksheetItemCount} заданий`;
  worksheetTasks.innerHTML = getWorksheetContent(selectedTasks, showAnswers);
}

async function prepareTasksForDownload(taskList) {
  return Promise.all(taskList.map(inlineTaskImagesForDownload));
}

async function inlineTaskImagesForDownload(task) {
  const copy = { ...task };

  if (copy.image) {
    copy.image = await getDownloadImageSource(copy.image);
  }

  if (copy.diagram) {
    copy.diagram = await getDownloadImageSource(copy.diagram);
  }

  const taskCase = getTaskCase(copy);

  if (taskCase) {
    copy.case = { ...taskCase };

    if (copy.case.image) {
      copy.case.image = await getDownloadImageSource(copy.case.image);
    }

    if (copy.case.diagram) {
      copy.case.diagram = await getDownloadImageSource(copy.case.diagram);
    }
  }

  return copy;
}

async function getDownloadImageSource(source) {
  const value = String(source || "").trim();

  if (!value || value.startsWith("data:")) {
    return value;
  }

  const localImages = window.LOCAL_IMAGE_DATA || {};
  const normalizedValue = normalizeTaskImagePath(value);
  const cachedImage = localImages[value] || localImages[normalizedValue];

  if (cachedImage) {
    return cachedImage;
  }

  const url = new URL(value, document.baseURI).href;

  if (downloadImageCache.has(url)) {
    return downloadImageCache.get(url);
  }

  const promise = loadImageAsDataUrl(url).catch(() => value);
  downloadImageCache.set(url, promise);
  return promise;
}

async function loadImageAsDataUrl(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Не удалось загрузить картинку: ${url}`);
    }

    return await blobToDataUrl(await response.blob());
  } catch (error) {
    return imageElementToDataUrl(url);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function imageElementToDataUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => reject(new Error(`Не удалось загрузить картинку: ${url}`));
    image.src = url;
  });
}

function getWorksheetContent(selectedTasks, showAnswers) {
  return selectedTasks.length
    ? `<section class="worksheet-plain-list">
        ${getWorksheetEntries(selectedTasks)
          .map((entry, index) => renderPlainWorksheetTask(entry, getWorksheetTaskNumber(entry, index), showAnswers))
          .join("")}
      </section>`
    : `<p class="empty-state">Отметьте галочками прототипы, которые нужно добавить в PDF или распечатать.</p>`;
}

function getWorksheetTaskNumber(entry, index) {
  if (!useExamTaskNumbers) {
    return index + 1;
  }

  const task = entry.task || entry.tasks?.[0];
  return Number(task?.number) || index + 1;
}

function getWorksheetEntries(selectedTasks) {
  const entries = [];
  const statementGroups = new Map();
  const caseGroups = new Map();

  selectedTasks.forEach((task) => {
    if (isCaseGroupedTask(task)) {
      const key = task.case_id;

      if (!caseGroups.has(key)) {
        caseGroups.set(key, []);
      }

      caseGroups.get(key).push(task);
      return;
    }

    if (!isGroupedSelectionTask(task)) {
      entries.push({ type: "task", task });
      return;
    }

    const key = getGroupedSelectionKey(task);

    if (!statementGroups.has(key)) {
      statementGroups.set(key, []);
    }

    statementGroups.get(key).push(task);
  });

  statementGroups.forEach((group) => {
    entries.push({ type: "statementGroup", tasks: group });
  });

  caseGroups.forEach((group) => {
    entries.push({ type: "caseGroup", tasks: group });
  });

  return entries.sort((first, second) => {
    const firstTask = first.task || first.tasks[0];
    const secondTask = second.task || second.tasks[0];

    return firstTask.number - secondTask.number || firstTask.prototype - secondTask.prototype;
  });
}

function renderPlainWorksheetTask(entry, taskNumber, showAnswers) {
  if (entry.type === "statementGroup") {
    return renderPlainStatementGroup(entry.tasks, taskNumber, showAnswers);
  }

  if (entry.type === "caseGroup") {
    return renderPlainCaseGroup(entry.tasks, showAnswers);
  }

  return renderPlainSingleTask(entry.task, taskNumber, showAnswers);
}

function renderPlainCaseGroup(tasksToRender, showAnswers) {
  const sortedTasks = [...tasksToRender].sort((first, second) => first.number - second.number || first.prototype - second.prototype);
  const firstTask = sortedTasks[0];

  return `
    <article class="plain-task plain-task--case-group">
      ${renderTaskCaseBlock(firstTask, "task-case task-case--plain")}
      <div class="plain-case-questions">
        ${renderTextGroupTaskRows(sortedTasks, { interactive: false, showAnswers })}
      </div>
    </article>
  `;
}

function renderPlainSingleTask(task, taskNumber, showAnswers) {
  if (Array.isArray(task.options) || hasRichTaskContent(task)) {
    return renderPlainVisualChoiceTask(task, taskNumber, showAnswers);
  }

  const text = formatTaskContent(task);
  const prompt = task.prompt || (isLongAnswerNumber(task.number) ? "Решите задачу." : "");

  return `
    <article class="plain-task">
      <p class="plain-task__text">
        <strong>Задание ${taskNumber}.</strong>${prompt ? ` ${escapeHtml(prompt)}` : ""} ${text}
      </p>
      ${showAnswers ? renderPlainAnswer(task) : ""}
    </article>
  `;
}

function renderPlainVisualChoiceTask(task, taskNumber, showAnswers) {
  const intro = task.intro || task.statement || task.description || "";
  const heading = intro || task.prompt || "";
  const question = task.question_text || task.question_prompt || task.question || task.question_raw || "";
  const image = task.image || task.diagram || "";
  const imageAlt = task.image_alt || `Схема к заданию ${taskNumber}`;
  const imageSizeClass = Number(task.number) === 11 ? " task-image--large" : "";
  const optionItems = getTaskOptionItems(task);

  return `
    <article class="plain-task plain-task--visual">
      ${renderTaskCaseBlock(task, "task-case task-case--plain")}
      <p class="plain-task__text">
        <strong>Задание ${taskNumber}.</strong>${heading ? ` ${formatChoiceContent(heading)}` : ""}
      </p>
      ${image ? `<div class="plain-task__image-wrap"><img class="plain-task__image${imageSizeClass}" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></div>` : ""}
      ${question ? `<p class="plain-task__text">${formatChoiceContent(question)}</p>` : ""}
      ${optionItems.length ? renderPlainOptions(optionItems) : ""}
      ${renderAnswerTable(task, "answer-table answer-table--plain")}
      ${showAnswers ? renderPlainAnswer(task) : ""}
    </article>
  `;
}

function renderPlainStatementGroup(tasks, taskNumber, showAnswers) {
  const firstTask = tasks[0];
  const prompt = firstTask?.prompt || "Укажите номера верных утверждений.";

  return `
    <article class="plain-task">
      <p class="plain-task__text"><strong>Задание ${taskNumber}.</strong> ${escapeHtml(prompt)}</p>
      <div class="plain-task__statements">
        ${tasks
          .map(
            (task, index) => `
              <p><strong>${index + 1})</strong> ${formatTaskContent(task)}</p>
            `,
          )
          .join("")}
      </div>
      ${showAnswers ? renderPlainAnswer(firstTask) : ""}
    </article>
  `;
}

function renderPlainOptions(options) {
  const optionItems = options.every((option) => option && typeof option === "object" && "type" in option)
    ? options
    : options.map((value) => ({ type: "text", value }));

  return `
    <div class="plain-task__options">
      ${optionItems
        .map(
          (option, index) => `
            <div class="plain-task__option">
              <span>${index + 1})</span>
              ${renderTaskOptionContent(option)}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPlainAnswer(task) {
  return `
    <p class="plain-task__answer">
      <strong>Ответ:</strong> ${escapeHtml(task.answer || "")}${task.solution ? `. ${escapeHtml(task.solution)}` : ""}
    </p>
  `;
}

function createPdfDocument(selectedTasks, showAnswers) {
  const pdfDocument = document.createElement("article");
  const config = getExamConfig();

  pdfDocument.className = "pdf-document";
  pdfDocument.innerHTML = `
    <header class="pdf-document__header">
      <h1>Подборка прототипов ${config.label} по математике</h1>
      <p>${getWorksheetItemCount(selectedTasks)} заданий</p>
    </header>
    ${getWorksheetContent(selectedTasks, showAnswers)}
  `;

  document.body.append(pdfDocument);
  return pdfDocument;
}

function getDownloadHtml(selectedTasks, showAnswers) {
  const config = getExamConfig();
  const baseHref = document.baseURI;
  const html2pdfSrc = new URL("html2pdf.bundle.min.js", baseHref).href;
  const previousPlainMathRendering = forcePlainMathRendering;
  let worksheetContent = "";

  try {
    forcePlainMathRendering = true;
    worksheetContent = getWorksheetContent(selectedTasks, showAnswers);
  } finally {
    forcePlainMathRendering = previousPlainMathRendering;
  }

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <base href="${baseHref}">
    <title>Подборка прототипов ${config.label} по математике</title>
    <link rel="stylesheet" href="lib/katex/katex.min.css">
    <script src="${html2pdfSrc}"></script>
    <style>
      @page {
        margin: 14mm;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html {
        background: #fff;
      }

      body {
        margin: 0;
        color: #111;
        background: #fff;
        font-family: Georgia, "Times New Roman", serif;
      }

      .print-content {
        width: 100%;
        max-width: 176mm;
        margin: 0 auto;
        padding: 0;
        overflow: hidden;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 0 0 18px;
        padding: 12px;
        border-radius: 12px;
        background: #f2f2f2;
        font-family: Arial, sans-serif;
      }

      .toolbar button {
        padding: 10px 14px;
        border: 0;
        border-radius: 999px;
        color: #fff;
        background: #246b5f;
        cursor: pointer;
        font-weight: 700;
      }

      .toolbar button.secondary {
        color: #111;
        background: #e4ddcf;
      }

      .prototype-sheet {
        margin-bottom: 42px;
        break-inside: avoid;
      }

      .prototype-sheet__header {
        margin-bottom: 24px;
        text-align: center;
      }

      .prototype-sheet__header h3,
      .prototype-sheet__header p {
        margin: 0;
        color: #111;
        font-size: 36px;
        font-weight: 900;
        line-height: 1.05;
      }

      .prototype-sheet__header strong {
        display: block;
        margin-top: 10px;
        color: #0000cc;
        font-size: 30px;
        letter-spacing: 0.08em;
      }

      .prototype-sheet__groups {
        display: grid;
        gap: 34px;
      }

      .prototype-group {
        break-inside: avoid;
      }

      .prototype-group h4 {
        margin: 0 0 22px;
        font-size: 32px;
        font-weight: 400;
        line-height: 1.2;
      }

      .prototype-group h4 span {
        font-weight: 900;
      }

      .prototype-options {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 22px 44px;
      }

      .prototype-sheet--three-columns .prototype-options {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .prototype-sheet--two-columns .prototype-options {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .prototype-sheet--one-column .prototype-options {
        grid-template-columns: 1fr;
      }

      .prototype-option {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: center;
        font-size: 30px;
      }

      .prototype-option input {
        display: none;
      }

      .prototype-option strong {
        font-weight: 400;
        min-width: 0;
        overflow-wrap: anywhere;
        text-align: left;
      }

      .prototype-sheet--statements .prototype-options {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .prototype-sheet--statements .prototype-option {
        align-items: start;
        font-size: 24px;
        line-height: 1.25;
      }

      .prototype-sheet--visual-choice .visual-task-list {
        display: grid;
        gap: 22px;
      }

      .prototype-sheet--visual-choice .visual-task {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .prototype-sheet--visual-choice .visual-task input {
        display: none;
      }

      .prototype-sheet--visual-choice .visual-task__body {
        display: grid;
        gap: 8px;
      }

      .prototype-sheet--visual-choice .visual-task__heading,
      .prototype-sheet--visual-choice .visual-task__title {
        font-size: 22px;
        font-weight: 900;
      }

      .prototype-sheet--visual-choice .visual-task__question,
      .prototype-sheet--visual-choice .visual-task__option strong {
        font-size: 20px;
        line-height: 1.3;
        overflow-wrap: anywhere;
        text-align: left;
      }

      .prototype-sheet--visual-choice .visual-task__heading .katex {
        font-size: 0.9em;
      }

      .prototype-sheet--visual-choice .visual-task__image-wrap {
        display: flex;
        justify-content: center;
      }

      .prototype-sheet--visual-choice .visual-task__image {
        display: block;
        max-width: 560px;
        max-height: 130px;
        object-fit: contain;
      }

      .prototype-sheet--visual-choice .visual-task__options {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px 18px;
      }

      .answer-table {
        width: 300px;
        margin: 10px auto 4px;
        border-collapse: collapse;
        table-layout: fixed;
        font-family: Georgia, "Times New Roman", serif;
        color: #111;
        background: #fff;
      }

      .answer-table th,
      .answer-table td {
        width: calc(100% / var(--answer-table-columns, 4));
        height: 30px;
        border: 1.5px solid #111;
        text-align: center;
        vertical-align: middle;
      }

      .answer-table th {
        font-size: 16px;
        font-weight: 900;
      }

      .prototype-sheet--visual-choice .visual-task__option {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        align-items: baseline;
      }

      .long-task-list {
        display: grid;
        gap: 18px;
      }

      .long-task {
        display: grid;
        grid-template-columns: 1fr;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .long-task__body {
        display: grid;
        gap: 8px;
      }

      .long-task__title {
        font-size: 24px;
        font-weight: 900;
        line-height: 1.15;
      }

      .long-task__text {
        font-size: 18px;
        line-height: 1.32;
        overflow-wrap: anywhere;
        text-align: left;
      }

      .long-task__text .katex,
      .prototype-option strong .katex {
        font-size: 1em;
      }

      .long-task__text .katex-display {
        margin: 0;
      }

      .task-inline-note {
        margin-left: 0.22em;
        white-space: normal;
      }

      .worksheet-plain-list {
        display: grid;
        gap: 14px;
        font-family: Georgia, "Times New Roman", serif;
      }

      .plain-task {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .task-case {
        display: grid;
        gap: 6px;
        margin: 0 0 10px;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .task-case__title {
        margin: 0;
        font-size: 20px;
        font-weight: 900;
        line-height: 1.2;
      }

      .task-case__text {
        margin: 0;
        font-size: 16px;
        line-height: 1.24;
        text-align: justify;
      }

      .task-case__image-wrap {
        display: flex;
        justify-content: center;
        margin: 4px 0;
      }

      .task-case__image {
        display: block;
        max-width: min(100%, 520px);
        max-height: 220px;
        object-fit: contain;
      }

      .task-case__table {
        width: 440px;
        max-width: 100%;
        margin: 4px auto;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .task-case__table td {
        border: 1px solid #444;
        padding: 5px 7px;
        font-size: 14px;
        line-height: 1.2;
      }

      .plain-case-questions {
        display: grid;
        gap: 8px;
      }

      .text-case-task {
        display: grid;
        gap: 5px;
      }

      .text-case-task__content {
        display: inline;
        font-size: 18px;
        line-height: 1.28;
      }

      .text-case-task__content strong {
        font-weight: 900;
      }

      .plain-task__text {
        margin: 0 0 8px;
        font-size: 18px;
        line-height: 1.28;
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: normal;
        text-align: left;
      }

      .plain-task__text strong {
        font-weight: 900;
      }

      .plain-task__image-wrap {
        display: flex;
        justify-content: center;
        margin: 8px 0 10px;
      }

      .plain-task__image {
        display: block;
        max-width: min(100%, 520px);
        max-height: 115px;
        object-fit: contain;
      }

      .plain-task__image.task-image--large {
        max-width: min(100%, 879px);
        max-height: 195px;
      }

      .plain-task__options {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px 18px;
        margin-top: 8px;
      }

      .plain-task__option {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 7px;
        align-items: baseline;
        font-size: 17px;
        line-height: 1.2;
        min-width: 0;
      }

      .plain-task__option strong {
        font-weight: 400;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .task-option-image-wrap {
        display: inline-flex;
        align-items: center;
        min-width: 0;
      }

      .task-option-image {
        display: block;
        max-width: 100%;
        max-height: 42px;
        object-fit: contain;
      }

      .plain-task__statements {
        display: grid;
        gap: 6px;
        max-width: 100%;
      }

      .plain-task__statements p,
      .plain-task__answer {
        margin: 0;
        font-size: 16px;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .math-plain {
        display: inline-block;
        white-space: nowrap;
        vertical-align: middle;
      }

      .math-plain sub,
      .math-plain sup {
        font-size: 0.72em;
        line-height: 0;
      }

      .math-frac {
        display: inline-grid;
        grid-template-rows: auto auto;
        min-width: 0.9em;
        margin: 0 0.08em;
        vertical-align: middle;
        text-align: center;
        line-height: 1;
      }

      .math-frac span:first-child {
        padding: 0 0.12em 0.08em;
        border-bottom: 0.08em solid currentColor;
      }

      .math-frac span:last-child {
        padding-top: 0.08em;
      }

      .math-frac .math-frac {
        font-size: 0.74em;
      }

      .math-root {
        display: inline-flex;
        align-items: baseline;
        margin: 0 0.08em;
        vertical-align: baseline;
        line-height: 1;
      }

      .math-root__sign {
        font-size: 1.14em;
        line-height: 1;
        transform: translateY(0.03em);
      }

      .math-root__value {
        display: inline-block;
        padding: 0.02em 0.12em 0;
        border-top: 0.08em solid currentColor;
        line-height: 1;
      }

      .math-system {
        display: inline-flex;
        align-items: center;
        gap: 0.16em;
        margin: 0 0.14em;
        vertical-align: middle;
      }

      .math-system__brace {
        font-size: 2.35em;
        line-height: 0.95;
        transform: scaleX(0.72);
        transform-origin: center;
      }

      .math-system__rows {
        display: inline-grid;
        gap: 0.08em;
        line-height: 1.08;
      }

      .math-system__rows > span {
        display: block;
      }

      .prototype-solutions {
        display: grid;
        gap: 8px;
        margin-top: 20px;
        padding: 14px;
        border: 1px solid #aaa;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .prototype-solutions p {
        margin: 0;
      }

      .print-content .katex {
        font-size: 1em;
        font-family: Georgia, "Times New Roman", serif;
      }

      .print-content .katex .katex-html {
        display: none !important;
      }

      .print-content .katex .katex-mathml {
        position: static !important;
        display: inline-block !important;
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        border: 0 !important;
        clip: auto !important;
        overflow: visible !important;
      }

      .print-content .katex math {
        display: inline math;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 0.98em;
      }

      @media print {
        body {
          margin: 0;
        }

        .toolbar {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button onclick="downloadPdfFromPage(this)">Скачать PDF</button>
      <button class="secondary" onclick="previewPdfFromPage(this)">Предпросмотр PDF</button>
      <button class="secondary" onclick="window.print()">Распечатать</button>
    </div>
    <main class="print-content" id="printContent">
      ${worksheetContent}
    </main>
    <script>
      function loadPdfLibrary() {
        if (window.html2pdf) {
          return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '${html2pdfSrc}';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Не удалось загрузить html2pdf.bundle.min.js'));
          document.head.appendChild(script);
        });
      }

      function waitForImages(root) {
        const images = Array.from(root.querySelectorAll('img'));
        return Promise.all(images.map((image) => {
          if (image.complete && image.naturalWidth > 0) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
          });
        }));
      }

      async function waitForPdfAssets(root) {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready.catch(() => {});
        }

        await waitForImages(root);
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      function setButtonLoading(button, text) {
        if (button) {
          button.disabled = true;
          button.dataset.originalText = button.textContent;
          button.textContent = text;
        }
      }

      function resetButton(button) {
        if (button) {
          button.disabled = false;
          button.textContent = button.dataset.originalText || 'Скачать PDF';
          delete button.dataset.originalText;
        }
      }

      function getPdfOptions() {
        return {
          margin: 12,
          filename: '${config.filename}',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: false, allowTaint: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };
      }

      async function preparePdfElement() {
        const element = document.getElementById('printContent');

        await loadPdfLibrary();
        await waitForPdfAssets(element);

        return element;
      }

      function handlePdfError(error) {
        console.error(error);
        const message = error && error.message ? error.message : error;

        if (String(message).includes('Tainted canvases')) {
          alert('Браузер заблокировал прямое создание PDF из-за локальных картинок. Сейчас откроется окно печати: выберите "Сохранить как PDF".');
          window.print();
          return;
        }

        alert('Не удалось создать PDF: ' + message);
      }

      async function previewPdfFromPage(button) {
        const previewWindow = window.open('', '_blank');

        if (!previewWindow) {
          alert('Браузер заблокировал окно предпросмотра. Разрешите всплывающие окна и попробуйте снова.');
          return;
        }

        previewWindow.document.open();
        previewWindow.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Предпросмотр PDF</title></head><body style="font-family: Arial, sans-serif; padding: 24px;">Готовлю предпросмотр PDF...</body></html>');
        previewWindow.document.close();

        setButtonLoading(button, 'Готовлю предпросмотр...');

        try {
          const element = await preparePdfElement();
          const blob = await window.html2pdf()
            .set(getPdfOptions())
            .from(element)
            .outputPdf('blob');
          const url = URL.createObjectURL(blob);

          previewWindow.location.href = url;
          setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
        } catch (error) {
          previewWindow.close();
          handlePdfError(error);
        } finally {
          resetButton(button);
        }
      }

      async function downloadPdfFromPage(button) {
        setButtonLoading(button, 'Создаю PDF...');

        try {
          const element = await preparePdfElement();

          await window.html2pdf()
            .set(getPdfOptions())
            .from(element)
            .save();
        } catch (error) {
          handlePdfError(error);
        } finally {
          resetButton(button);
        }
      }
    </script>
  </body>
</html>`;
}

async function downloadWorksheetFile() {
  renderWorksheet();

  const selectedTasks = getSelectedTasks();

  if (!selectedTasks.length) {
    alert("Сначала отметьте галочками хотя бы один прототип.");
    return;
  }

  const pdfWindow = window.open("", "_blank");

  if (!pdfWindow) {
    alert("Браузер заблокировал новое окно. Разрешите всплывающие окна для этого файла и попробуйте снова.");
    return;
  }

  pdfWindow.document.open();
  pdfWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Подготовка PDF</title></head><body style="font-family: Arial, sans-serif; padding: 24px;">Готовлю страницу для PDF...</body></html>`);
  pdfWindow.document.close();

  const originalText = downloadWorksheet.textContent;
  downloadWorksheet.disabled = true;
  downloadWorksheet.textContent = "Готовлю PDF...";

  let downloadTasks = selectedTasks;

  try {
    downloadTasks = await prepareTasksForDownload(selectedTasks);
  } catch (error) {
    console.error(error);
    alert("Не удалось подготовить картинки для PDF. Попробуйте открыть страницу через локальный сервер.");
    pdfWindow.close();
    return;
  } finally {
    downloadWorksheet.disabled = false;
    downloadWorksheet.textContent = originalText;
  }

  pdfWindow.document.open();
  pdfWindow.document.write(getDownloadHtml(downloadTasks, includeAnswers.checked));
  pdfWindow.document.close();
}

function getWorksheetHtmlFilename() {
  const today = new Date().toISOString().slice(0, 10);
  return `${activeExam}-math-worksheet-${today}.html`;
}

async function downloadWorksheetHtmlFile() {
  renderWorksheet();

  const selectedTasks = getSelectedTasks();

  if (!selectedTasks.length) {
    alert("Сначала отметьте галочками хотя бы один прототип.");
    return;
  }

  const originalText = downloadHtmlWorksheet.textContent;
  downloadHtmlWorksheet.disabled = true;
  downloadHtmlWorksheet.textContent = "Готовлю HTML...";

  let downloadTasks = selectedTasks;

  try {
    downloadTasks = await prepareTasksForDownload(selectedTasks);
  } catch (error) {
    console.error(error);
    alert("Не удалось подготовить картинки для HTML-файла.");
    return;
  } finally {
    downloadHtmlWorksheet.disabled = false;
    downloadHtmlWorksheet.textContent = originalText;
  }

  const html = getDownloadHtml(downloadTasks, includeAnswers.checked);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = getWorksheetHtmlFilename();
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getRandomGroupedTasks(taskList) {
  const groups = new Map();

  taskList.forEach((task) => {
    const groupKey = getGroupedSelectionKey(task);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }

    groups.get(groupKey).push(task);
  });

  return getRandomItem([...groups.values()]);
}

function selectRandomVariant() {
  if (isEgeBaseActive()) {
    alert("Для базового ЕГЭ случайные варианты появятся после подключения отдельной базы заданий.");
    return;
  }

  const availableNumbers = Array.from({ length: getExamConfig().taskCount }, (_, index) => index + 1)
    .filter((number) => !(activeExam === "oge" && number >= 1 && number <= 5))
    .filter((number) => getTasksByNumber(number).length);

  const textGroupCases = activeExam === "oge" ? getOgeTextGroupCases() : [];

  if (!availableNumbers.length && !textGroupCases.length) {
    alert(`В базе ${getExamConfig().label} пока нет заданий для случайного варианта.`);
    return;
  }

  selectedTaskIds.clear();
  useExamTaskNumbers = true;

  if (textGroupCases.length) {
    getRandomItem(textGroupCases).tasks.forEach((task) => selectedTaskIds.add(task.id));
  }

  availableNumbers.forEach((number) => {
    const numberTasks = getTasksByNumber(number);

    if (numberTasks.some(isGroupedSelectionTask)) {
      getRandomGroupedTasks(numberTasks).forEach((task) => selectedTaskIds.add(task.id));
      return;
    }

    selectedTaskIds.add(getRandomItem(numberTasks).id);
  });

  closePrototypeOverlay();
  renderApp();
}

function renderApp() {
  renderExamSwitch();
  renderExamSubswitch();
  renderNumberGrid();
  renderPrototypes();
  renderOverlayPrototypes();
  renderSelectedSummary();
  renderSelectedList();
  renderWorksheet();
}

function bindEvents() {
  function activateExam(exam) {
    if (!EXAM_CONFIG[exam] || exam === activeExam) {
      return;
    }

    activeExam = exam;

    if (isMckoActive()) {
      activeMckoClass = getDefaultMckoClass();
    }

    tasks = getActiveTaskSet();
    activeNumber = getDefaultActiveNumber();
    selectedTaskIds.clear();
    useExamTaskNumbers = false;
    closePrototypeOverlay();
    renderApp();
  }

  function selectTextGroup(topic = "") {
    activeNumber = OGE_TEXT_GROUP_LABEL;

    if (topic) {
      activeTextTopic = topic;
    }

    ensureActiveTextTopic();
    renderApp();
    openPrototypeOverlay();
  }

  function selectNumber(number) {
    activeNumber = number;
    renderApp();
    openPrototypeOverlay();
  }

  taskNumberGrid.addEventListener("click", (event) => {
    const groupButton = event.target.closest("[data-number-group]");

    if (groupButton) {
      selectTextGroup();
      return;
    }

    const button = event.target.closest("[data-number]");

    if (!button) {
      return;
    }

    selectNumber(Number(button.dataset.number));
  });

  if (examSwitch) {
    examSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("[data-exam]");

      if (!button) {
        return;
      }

      activateExam(button.dataset.exam);
    });
  }

  if (examSubswitch) {
    examSubswitch.addEventListener("click", (event) => {
      const levelButton = event.target.closest("[data-ege-level]");

      if (levelButton) {
        activeEgeLevel = levelButton.dataset.egeLevel;
        activeNumber = getDefaultActiveNumber();
        selectedTaskIds.clear();
        useExamTaskNumbers = false;
        closePrototypeOverlay();
        renderApp();
        return;
      }

      const button = event.target.closest("[data-mcko-class]");

      if (!button) {
        return;
      }

      activeMckoClass = Number(button.dataset.mckoClass);
      tasks = getActiveTaskSet();
      activeNumber = getDefaultActiveNumber();
      selectedTaskIds.clear();
      useExamTaskNumbers = false;
      closePrototypeOverlay();
      renderApp();
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-exam-link]");

    if (!link) {
      return;
    }

    activateExam(link.dataset.examLink);
  });

  prototypeList.addEventListener("click", (event) => {
    const topicButton = event.target.closest("[data-text-topic]");

    if (topicButton) {
      selectTextGroup(topicButton.dataset.textTopic);
      return;
    }

    const groupButton = event.target.closest("[data-number-group]");

    if (groupButton) {
      selectTextGroup();
      return;
    }

    const button = event.target.closest("[data-number]");

    if (!button) {
      return;
    }

    selectNumber(Number(button.dataset.number));
  });

  overlayPrototypeList.addEventListener("click", (event) => {
    const topicButton = event.target.closest("[data-text-topic]");

    if (!topicButton) {
      return;
    }

    activeTextTopic = topicButton.dataset.textTopic;
    renderApp();
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-task-group-checkbox]")) {
      event.target.value
        .split(",")
        .filter(Boolean)
        .forEach((taskId) => {
          if (event.target.checked) {
            selectedTaskIds.add(taskId);
          } else {
            selectedTaskIds.delete(taskId);
          }
        });

      renderApp();
      return;
    }

    if (!event.target.matches("[data-task-checkbox]")) {
      return;
    }

    if (event.target.checked) {
      selectedTaskIds.add(event.target.value);
    } else {
      selectedTaskIds.delete(event.target.value);
    }

    renderApp();
  });

  selectedList.addEventListener("click", (event) => {
    const groupButton = event.target.closest("[data-remove-selected-group]");

    if (groupButton) {
      groupButton.dataset.removeSelectedGroup
        .split(",")
        .filter(Boolean)
        .forEach((taskId) => selectedTaskIds.delete(taskId));
      renderApp();
      return;
    }

    const button = event.target.closest("[data-remove-selected]");

    if (!button) {
      return;
    }

    selectedTaskIds.delete(button.dataset.removeSelected);
    renderApp();
  });

  prototypeOverlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-overlay]")) {
      closePrototypeOverlay();
    }
  });

  closeOverlay.addEventListener("click", closePrototypeOverlay);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && prototypeOverlay.classList.contains("is-open")) {
      closePrototypeOverlay();
    }
  });

  includeAnswers.addEventListener("change", () => {
    renderWorksheet();
  });

  clearSelection.addEventListener("click", () => {
    selectedTaskIds.clear();
    useExamTaskNumbers = false;
    renderApp();
  });

  printWorksheet.addEventListener("click", () => {
    renderWorksheet();
    window.print();
  });

  downloadWorksheet.addEventListener("click", downloadWorksheetFile);

  if (downloadHtmlWorksheet) {
    downloadHtmlWorksheet.addEventListener("click", downloadWorksheetHtmlFile);
  }

  if (generateRandomVariant) {
    generateRandomVariant.addEventListener("click", selectRandomVariant);
  }
}

function loadTasks() {
  try {
    Object.entries(EXAM_CONFIG).forEach(([exam, config]) => {
      if (config.skipTaskLoading) {
        taskSets[exam] = [];
        return;
      }

      const loadedTasks = window[config.dataKey] || [];
      taskSets[exam] = normalizeLoadedTasks(loadedTasks, exam)
        .filter((task) => String(task.subject).trim() === "Математика")
        .map((task) => ({
          ...task,
          exam,
          number: Number(task.number),
          prototype: Number(task.prototype),
        }));
    });

    if (isMckoActive()) {
      activeMckoClass = getDefaultMckoClass();
    }

    tasks = getActiveTaskSet();
    activeNumber = getDefaultActiveNumber();
    loadError = "";
  } catch (error) {
    console.error(error);
    tasks = [];
    loadError =
      "Не удалось прочитать базу задач. Проверьте файлы в папках tasks и ege-tasks.";
  }

  renderApp();
}

bindEvents();
loadTasks();
