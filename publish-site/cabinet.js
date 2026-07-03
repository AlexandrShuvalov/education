const CABINET_STORAGE_KEY = "exam-navigator-cabinet-demo-v1";
const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 22;
const CALENDAR_HOUR_HEIGHT = 64;

const demoSeed = {
  teacher: {
    id: "teacher-1",
    name: "Анна Сергеевна",
    subject: "Математика ОГЭ и ЕГЭ",
  },
  students: [
    {
      id: "student-1",
      name: "Иван Петров",
      email: "ivan@example.com",
      target: "ОГЭ, результат 4+",
      code: "NE-IVAN-25",
    },
    {
      id: "student-2",
      name: "Мария Соколова",
      email: "maria@example.com",
      target: "ЕГЭ профиль, 80+",
      code: "NE-MARIA-80",
    },
  ],
  homeworks: [
    {
      id: "homework-1",
      studentId: "student-1",
      title: "Дроби и степени",
      description: "Решить задания 6-8 из подборки. Записать вопросы к следующему занятию.",
      dueDate: "2026-06-05",
      status: "new",
    },
    {
      id: "homework-2",
      studentId: "student-2",
      title: "Планиметрия: треугольники",
      description: "Повторить теоремы и решить 8 задач по теме.",
      dueDate: "2026-06-07",
      status: "in-progress",
    },
  ],
  lessons: [
    {
      id: "lesson-1",
      studentId: "student-1",
      date: "2026-06-02",
      time: "16:00",
      duration: 60,
      format: "Онлайн",
      note: "Разобрать дроби и проверить домашнюю работу.",
    },
    {
      id: "lesson-2",
      studentId: "student-2",
      date: "2026-06-03",
      time: "18:30",
      duration: 90,
      format: "Онлайн",
      note: "Планиметрия: треугольники и окружности.",
    },
  ],
  materials: [
    {
      id: "material-1",
      studentId: "",
      title: "Памятка: действия с дробями",
      topic: "Числа и вычисления",
      link: "#",
      description: "Короткий конспект перед решением заданий 6.",
    },
    {
      id: "material-2",
      studentId: "student-2",
      title: "Формулы площадей",
      topic: "Планиметрия",
      link: "#",
      description: "Персональная памятка к следующему занятию.",
    },
  ],
  messages: [
    {
      id: "message-1",
      studentId: "student-1",
      author: "teacher",
      text: "Иван, добавила новую домашнюю работу. Если будут вопросы по дробям, пиши сюда.",
      createdAt: "2026-06-01T09:30:00",
    },
    {
      id: "message-2",
      studentId: "student-1",
      author: "student",
      text: "Спасибо! Посмотрю задания вечером.",
      createdAt: "2026-06-01T10:05:00",
    },
  ],
};

const cabinetApp = document.querySelector("#cabinetApp");
const roleButtons = [...document.querySelectorAll("[data-role-switch]")];

let data = loadData();
let ui = {
  role: "teacher",
  section: "overview",
  selectedStudentId: data.students[0]?.id || "",
  modal: "",
  studentSessionId: "",
  loginError: "",
  calendarWeekStart: formatDateKey(getStartOfWeek(new Date())),
  lessonDraft: null,
  draggedLessonId: "",
  suppressCalendarClickUntil: 0,
};

function loadData() {
  try {
    const saved = localStorage.getItem(CABINET_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : structuredClone(demoSeed);

    return {
      ...parsed,
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : structuredClone(demoSeed.lessons),
    };
  } catch (error) {
    return structuredClone(demoSeed);
  }
}

function saveData() {
  localStorage.setItem(CABINET_STORAGE_KEY, JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStudent(studentId) {
  return data.students.find((student) => student.id === studentId);
}

function getSelectedStudent() {
  return getStudent(ui.selectedStudentId) || data.students[0];
}

function getStudentHomeworks(studentId) {
  return data.homeworks.filter((homework) => homework.studentId === studentId);
}

function getLessons() {
  return [...(data.lessons || [])]
    .sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`));
}

function getStudentLessons(studentId) {
  return getLessons().filter((lesson) => lesson.studentId === studentId);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDateKey(value) {
  const date = value instanceof Date ? value : parseLocalDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(value) {
  const date = value instanceof Date ? new Date(value) : parseLocalDate(value);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  date.setHours(12, 0, 0, 0);
  return date;
}

function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function isSameDate(first, second) {
  return formatDateKey(first) === formatDateKey(second);
}

function getStudentMaterials(studentId) {
  return data.materials.filter((material) => !material.studentId || material.studentId === studentId);
}

function getStudentMessages(studentId) {
  return data.messages
    .filter((message) => message.studentId === studentId)
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
}

function formatDate(value) {
  if (!value) {
    return "Без срока";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInviteCode(name) {
  const letters = String(name || "student")
    .replace(/[^a-zа-яё]/gi, "")
    .slice(0, 5)
    .toUpperCase();
  const digits = String(Math.floor(100 + Math.random() * 900));
  return `NE-${letters || "USER"}-${digits}`;
}

function getStatusLabel(status) {
  return {
    new: "Новое",
    "in-progress": "В работе",
    done: "Выполнено",
  }[status] || "Новое";
}

function getStatusClass(status) {
  return status === "done"
    ? ""
    : status === "in-progress"
      ? " portal-chip--yellow"
      : " portal-chip--orange";
}

function render() {
  updateRoleButtons();

  if (ui.role === "student" && !ui.studentSessionId) {
    cabinetApp.innerHTML = renderStudentGateway();
    return;
  }

  cabinetApp.innerHTML = ui.role === "teacher"
    ? renderTeacherCabinet()
    : renderStudentCabinet();

  openRenderedDialog();
}

function updateRoleButtons() {
  roleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.roleSwitch === ui.role);
  });
}

function renderTeacherCabinet() {
  const selectedStudent = getSelectedStudent();

  return `
    <div class="portal-shell">
      ${renderSidebar({
        name: data.teacher.name,
        note: data.teacher.subject,
        items: [
          ["overview", "Обзор", data.students.length],
          ["students", "Ученики", data.students.length],
          ["schedule", "Расписание", getLessons().length],
          ["homeworks", "Домашние работы", data.homeworks.length],
          ["materials", "Материалы", data.materials.length],
          ["messages", "Сообщения", getStudentMessages(selectedStudent?.id).length],
        ],
      })}
      <section class="portal-workspace">
        ${renderTeacherWorkspace(selectedStudent)}
      </section>
    </div>
    ${renderModal()}
  `;
}

function renderStudentCabinet() {
  const student = getStudent(ui.studentSessionId);

  if (!student) {
    ui.studentSessionId = "";
    return renderStudentGateway();
  }

  return `
    <div class="portal-shell">
      ${renderSidebar({
        name: student.name,
        note: student.target || "Личный кабинет ученика",
        items: [
          ["overview", "Сегодня", getStudentLessons(student.id).length],
          ["schedule", "Расписание", getStudentLessons(student.id).length],
          ["homeworks", "Домашние работы", getStudentHomeworks(student.id).length],
          ["materials", "Материалы", getStudentMaterials(student.id).length],
          ["messages", "Сообщения", getStudentMessages(student.id).length],
        ],
      })}
      <section class="portal-workspace">
        ${renderStudentWorkspace(student)}
      </section>
    </div>
  `;
}

function renderSidebar({ name, note, items }) {
  return `
    <aside class="portal-sidebar">
      <div class="portal-profile">
        <div class="portal-profile__avatar">${escapeHtml(getInitials(name))}</div>
        <div>
          <h2>${escapeHtml(name)}</h2>
          <p>${escapeHtml(note)}</p>
        </div>
      </div>
      <nav class="portal-nav" aria-label="Разделы кабинета">
        ${items
          .map(([section, label, count]) => `
            <button class="${ui.section === section ? "is-active" : ""}" type="button" data-section="${section}">
              ${escapeHtml(label)}
              <span>${count}</span>
            </button>
          `)
          .join("")}
      </nav>
    </aside>
  `;
}

function renderTeacherWorkspace(selectedStudent) {
  const headings = {
    overview: ["Кабинет репетитора", "Управляйте учениками и подготовкой в одном месте."],
    students: ["Мои ученики", "Создавайте отдельный кабинет для каждого ученика."],
    schedule: ["Расписание занятий", "Добавляйте учеников в расписание и планируйте следующие встречи."],
    homeworks: ["Домашние работы", "Назначайте задания и следите за сроками."],
    materials: ["Материалы по темам", "Добавляйте ссылки, конспекты и памятки."],
    messages: ["Сообщения", "Переписывайтесь с выбранным учеником."],
  };
  const [title, subtitle] = headings[ui.section] || headings.overview;

  return `
    ${renderWorkspaceHeader(title, subtitle, "Демо-режим: изменения сохраняются в вашем браузере.")}
    ${
      ui.section === "overview"
        ? renderTeacherOverview(selectedStudent)
        : ui.section === "students"
          ? renderStudentsSection()
          : ui.section === "schedule"
            ? renderScheduleSection()
          : ui.section === "homeworks"
            ? renderHomeworksSection()
            : ui.section === "materials"
              ? renderMaterialsSection()
              : renderMessagesSection(selectedStudent, "teacher")
    }
  `;
}

function renderStudentWorkspace(student) {
  const headings = {
    overview: ["План подготовки", "Все нужное к следующему занятию уже собрано здесь."],
    schedule: ["Моё расписание", "Ближайшие занятия с преподавателем."],
    homeworks: ["Домашние работы", "Открывайте задания и отмечайте выполненные работы."],
    materials: ["Материалы по темам", "Конспекты и полезные ссылки от преподавателя."],
    messages: ["Сообщения", "Задайте вопрос преподавателю, если что-то не получается."],
  };
  const [title, subtitle] = headings[ui.section] || headings.overview;

  return `
    ${renderWorkspaceHeader(title, subtitle, `Вы вошли как ${student.name}.`)}
    ${
      ui.section === "overview"
        ? renderStudentOverview(student)
        : ui.section === "schedule"
          ? renderStudentScheduleSection(student)
        : ui.section === "homeworks"
          ? renderStudentHomeworkSection(student)
          : ui.section === "materials"
            ? renderStudentMaterialsSection(student)
            : renderMessagesSection(student, "student")
    }
  `;
}

function renderWorkspaceHeader(title, subtitle, note) {
  return `
    <header class="portal-workspace__top">
      <div>
        <p class="eyebrow">Навигатор экзаменов</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="muted">${escapeHtml(subtitle)}</p>
      </div>
      <p class="demo-note">${escapeHtml(note)}</p>
    </header>
  `;
}

function renderTeacherOverview(selectedStudent) {
  return `
    <div class="stats-grid">
      ${renderStat("Учеников", data.students.length)}
      ${renderStat("Занятий", getLessons().length)}
      ${renderStat("Домашних работ", data.homeworks.length)}
      ${renderStat("Материалов", data.materials.length)}
    </div>
    <div class="dashboard-grid">
      <section class="portal-card">
        ${renderCardHeader("Ученики", "Добавить", "student")}
        ${renderStudentList(selectedStudent?.id)}
      </section>
      <section class="portal-card">
        ${renderCardHeader("Расписание", "Добавить занятие", "lesson")}
        ${renderLessonList(getLessons().slice(0, 4))}
      </section>
      <section class="portal-card">
        ${renderCardHeader("Ближайшие работы", "Назначить", "homework")}
        ${renderHomeworkList(data.homeworks.slice(0, 4))}
      </section>
      <section class="portal-card portal-card--wide">
        ${renderCardHeader("Материалы по темам", "Добавить", "material")}
        ${renderMaterialList(data.materials)}
      </section>
    </div>
  `;
}

function renderStudentOverview(student) {
  const homeworks = getStudentHomeworks(student.id);
  const materials = getStudentMaterials(student.id);

  return `
    <div class="stats-grid">
      ${renderStat("Домашних работ", homeworks.length)}
      ${renderStat("Занятий", getStudentLessons(student.id).length)}
      ${renderStat("Материалов", materials.length)}
      ${renderStat("Сообщений", getStudentMessages(student.id).length)}
    </div>
    <div class="dashboard-grid">
      <section class="portal-card">
        <div class="portal-card__header"><h2>Ближайшие занятия</h2></div>
        ${renderLessonList(getStudentLessons(student.id))}
      </section>
      <section class="portal-card">
        <div class="portal-card__header"><h2>Домашняя работа</h2></div>
        ${renderHomeworkList(homeworks)}
      </section>
      <section class="portal-card">
        <div class="portal-card__header"><h2>Полезные материалы</h2></div>
        ${renderMaterialList(materials)}
      </section>
    </div>
  `;
}

function renderStudentsSection() {
  const selectedStudent = getSelectedStudent();

  return `
    <div class="section-heading">
      <div>
        <h2>Ученики</h2>
        <p class="muted">У каждого ученика свой код входа и отдельный набор материалов.</p>
      </div>
      <button class="button button--primary" type="button" data-open-modal="student">Добавить ученика</button>
    </div>
    <section class="portal-card">
      ${renderStudentList(selectedStudent?.id, true)}
    </section>
  `;
}

function renderHomeworksSection() {
  return `
    <div class="section-heading">
      <div>
        <h2>Все домашние работы</h2>
        <p class="muted">Можно назначить работу конкретному ученику и указать срок.</p>
      </div>
      <button class="button button--primary" type="button" data-open-modal="homework">Назначить работу</button>
    </div>
    <section class="portal-card">
      ${renderHomeworkList(data.homeworks)}
    </section>
  `;
}

function renderScheduleSection() {
  return `
    <div class="section-heading">
      <div>
        <h2>Расписание</h2>
        <p class="muted">Недельный календарь занятий. Добавляйте учеников в свободные окна и переключайтесь между неделями.</p>
      </div>
      <button class="button button--primary" type="button" data-open-modal="lesson">Добавить занятие</button>
    </div>
    ${renderWeeklyCalendar(getLessons(), true)}
  `;
}

function renderMaterialsSection() {
  return `
    <div class="section-heading">
      <div>
        <h2>Библиотека материалов</h2>
        <p class="muted">Общий материал увидят все ученики, персональный только выбранный ученик.</p>
      </div>
      <button class="button button--primary" type="button" data-open-modal="material">Добавить материал</button>
    </div>
    <section class="portal-card">
      ${renderMaterialList(data.materials)}
    </section>
  `;
}

function renderStudentHomeworkSection(student) {
  return `
    <section class="portal-card">
      <div class="portal-card__header"><h2>Мои домашние работы</h2></div>
      ${renderHomeworkList(getStudentHomeworks(student.id), true)}
    </section>
  `;
}

function renderStudentScheduleSection(student) {
  return `
    ${renderWeeklyCalendar(getStudentLessons(student.id))}
  `;
}

function renderStudentMaterialsSection(student) {
  return `
    <section class="portal-card">
      <div class="portal-card__header"><h2>Мои материалы</h2></div>
      ${renderMaterialList(getStudentMaterials(student.id))}
    </section>
  `;
}

function renderMessagesSection(student, role) {
  if (!student) {
    return `<div class="empty-state">Сначала добавьте ученика.</div>`;
  }

  const messages = getStudentMessages(student.id);

  return `
    <div class="message-layout">
      ${
        role === "teacher"
          ? `<section class="portal-card"><h2>Ученики</h2>${renderStudentList(student.id)}</section>`
          : ""
      }
      <section class="message-thread">
        <div class="message-thread__top">
          <div>
            <p class="eyebrow">Диалог</p>
            <h2>${escapeHtml(role === "teacher" ? student.name : data.teacher.name)}</h2>
          </div>
        </div>
        <div class="message-thread__body">
          ${
            messages.length
              ? messages.map((message) => renderMessage(message, role)).join("")
              : `<div class="empty-state">Сообщений пока нет. Можно начать диалог.</div>`
          }
        </div>
        <form class="message-compose" data-message-form data-student-id="${escapeHtml(student.id)}">
          <input name="text" type="text" placeholder="Напишите сообщение" required>
          <button class="button button--primary" type="submit">Отправить</button>
        </form>
      </section>
    </div>
  `;
}

function renderStat(label, value) {
  return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function renderCardHeader(title, actionLabel, modal) {
  return `
    <div class="portal-card__header">
      <h2>${escapeHtml(title)}</h2>
      <button class="button button--ghost button--small" type="button" data-open-modal="${modal}">
        ${escapeHtml(actionLabel)}
      </button>
    </div>
  `;
}

function renderStudentList(selectedStudentId, showCode = false) {
  if (!data.students.length) {
    return `<div class="empty-state">Учеников пока нет. Добавьте первого ученика.</div>`;
  }

  return `
    <div class="student-list">
      ${data.students
        .map((student) => `
          <button
            class="student-row ${student.id === selectedStudentId ? "is-active" : ""}"
            type="button"
            data-select-student="${escapeHtml(student.id)}"
          >
            <span class="student-row__avatar">${escapeHtml(getInitials(student.name))}</span>
            <span>
              <strong>${escapeHtml(student.name)}</strong>
              <span class="student-row__meta">${escapeHtml(showCode ? `Код входа: ${student.code}` : student.target)}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        `)
        .join("")}
    </div>
  `;
}

function renderHomeworkList(homeworks, allowStudentStatus = false) {
  if (!homeworks.length) {
    return `<div class="empty-state">Домашних работ пока нет.</div>`;
  }

  return `
    <div class="item-list">
      ${homeworks
        .map((homework) => {
          const student = getStudent(homework.studentId);
          return `
            <article class="item-card">
              <div class="item-card__top">
                <div>
                  <strong>${escapeHtml(homework.title)}</strong>
                  <span class="item-card__meta">${escapeHtml(student?.name || "")} · до ${escapeHtml(formatDate(homework.dueDate))}</span>
                </div>
                <span class="portal-chip${getStatusClass(homework.status)}">${escapeHtml(getStatusLabel(homework.status))}</span>
              </div>
              <p>${escapeHtml(homework.description)}</p>
              ${
                allowStudentStatus && homework.status !== "done"
                  ? `<button class="button button--ghost button--small" type="button" data-complete-homework="${escapeHtml(homework.id)}">Отметить выполненной</button>`
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderLessonList(lessons) {
  if (!lessons.length) {
    return `<div class="empty-state">В расписании пока нет занятий.</div>`;
  }

  return `
    <div class="schedule-list">
      ${lessons
        .map((lesson) => {
          const student = getStudent(lesson.studentId);
          return `
            <article class="lesson-card">
              <div class="lesson-card__date">
                <strong>${escapeHtml(formatLessonDay(lesson.date))}</strong>
                <span>${escapeHtml(formatLessonMonth(lesson.date))}</span>
              </div>
              <div class="lesson-card__body">
                <div class="lesson-card__top">
                  <div>
                    <strong>${escapeHtml(student?.name || "Ученик")}</strong>
                    <span class="item-card__meta">${escapeHtml(lesson.time)} · ${escapeHtml(lesson.duration)} мин · ${escapeHtml(lesson.format)}</span>
                  </div>
                  <span class="portal-chip">${escapeHtml(formatLessonWeekday(lesson.date))}</span>
                </div>
                ${lesson.note ? `<p>${escapeHtml(lesson.note)}</p>` : ""}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderWeeklyCalendar(lessons, allowCreate = false) {
  const weekStart = parseLocalDate(ui.calendarWeekStart);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = new Date();
  const visibleLessons = lessons.filter((lesson) =>
    weekDays.some((day) => formatDateKey(day) === lesson.date),
  );
  const totalHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT;
  const monthTitle = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(weekDays[3]);

  return `
    <section class="weekly-calendar" style="--calendar-height: ${totalHeight}px; --hour-height: ${CALENDAR_HOUR_HEIGHT}px;">
      <header class="weekly-calendar__toolbar">
        <div class="weekly-calendar__toolbar-group">
          <button class="calendar-icon-button" type="button" data-calendar-action="previous" aria-label="Предыдущая неделя">‹</button>
          <button class="calendar-icon-button" type="button" data-calendar-action="next" aria-label="Следующая неделя">›</button>
          <button class="button button--ghost button--small" type="button" data-calendar-action="today">Сегодня</button>
        </div>
        <h3>${escapeHtml(monthTitle)}</h3>
        ${
          allowCreate
            ? `<button class="button button--primary button--small" type="button" data-open-modal="lesson">+ Занятие</button>`
            : `<span class="portal-chip">Неделя</span>`
        }
      </header>
      <div class="weekly-calendar__scroll">
        <div class="weekly-calendar__grid">
          <div class="weekly-calendar__corner">GMT+03</div>
          ${weekDays.map((day) => renderCalendarDayHeader(day, today)).join("")}
          <div class="weekly-calendar__time-axis">
            ${renderCalendarTimeLabels()}
          </div>
          ${weekDays
            .map((day) => renderCalendarDayTrack(day, visibleLessons, today))
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCalendarDayHeader(day, today) {
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
    .format(day)
    .replace(".", "")
    .toUpperCase();
  const isToday = isSameDate(day, today);

  return `
    <div class="weekly-calendar__day-header ${isToday ? "is-today" : ""}">
      <span>${escapeHtml(weekday)}</span>
      <strong>${day.getDate()}</strong>
    </div>
  `;
}

function renderCalendarTimeLabels() {
  return Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, index) => {
    const hour = CALENDAR_START_HOUR + index;
    return `<span style="top: ${index * CALENDAR_HOUR_HEIGHT}px">${String(hour).padStart(2, "0")}:00</span>`;
  }).join("");
}

function renderCalendarDayTrack(day, lessons, today) {
  const dayKey = formatDateKey(day);
  const dayLessons = lessons.filter((lesson) => lesson.date === dayKey);
  const allowChanges = ui.role === "teacher";

  return `
    <div
      class="weekly-calendar__day-track ${isSameDate(day, today) ? "is-today" : ""} ${allowChanges ? "is-interactive" : ""}"
      data-calendar-track
      data-calendar-date="${escapeHtml(dayKey)}"
    >
      ${allowChanges ? `<span class="weekly-calendar__slot-hint">Нажмите, чтобы добавить занятие</span>` : ""}
      ${dayLessons.map((lesson) => renderCalendarLesson(lesson, allowChanges)).join("")}
    </div>
  `;
}

function renderCalendarLesson(lesson, allowChanges = false) {
  const student = getStudent(lesson.studentId);
  const [hours, minutes] = lesson.time.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const calendarStartMinutes = CALENDAR_START_HOUR * 60;
  const top = Math.max(0, (startMinutes - calendarStartMinutes) / 60 * CALENDAR_HOUR_HEIGHT);
  const visibleDuration = Math.min(Number(lesson.duration), (CALENDAR_END_HOUR * 60) - startMinutes);
  const height = Math.max(30, visibleDuration / 60 * CALENDAR_HOUR_HEIGHT - 3);
  const endTime = formatLessonEndTime(lesson.time, Number(lesson.duration));
  const colorIndex = Math.max(0, data.students.findIndex((item) => item.id === lesson.studentId)) % 5;

  return `
    <article
      class="weekly-calendar__lesson weekly-calendar__lesson--${colorIndex + 1}"
      style="top: ${top}px; height: ${height}px"
      title="${escapeHtml(lesson.note || student?.name || "Занятие")}"
      data-calendar-lesson="${escapeHtml(lesson.id)}"
      ${allowChanges ? `draggable="true"` : ""}
    >
      <strong>${escapeHtml(student?.name || "Ученик")}</strong>
      <span>${escapeHtml(lesson.time)}-${escapeHtml(endTime)}</span>
      ${lesson.format ? `<small>${escapeHtml(lesson.format)}</small>` : ""}
    </article>
  `;
}

function formatLessonEndTime(time, duration) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hours, minutes + duration);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getCalendarSlotFromPointer(track, clientY, duration = 60) {
  const rect = track.getBoundingClientRect();
  const calendarMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
  const durationMinutes = Math.max(30, Number(duration) || 60);
  const maxStartMinutes = Math.max(0, calendarMinutes - durationMinutes);
  const rawMinutes = (clientY - rect.top) / CALENDAR_HOUR_HEIGHT * 60;
  const snappedMinutes = Math.round(rawMinutes / 30) * 30;
  const minutesFromStart = Math.min(maxStartMinutes, Math.max(0, snappedMinutes));

  return {
    date: track.dataset.calendarDate,
    time: formatMinutesAsTime(CALENDAR_START_HOUR * 60 + minutesFromStart),
  };
}

function formatMinutesAsTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatLessonDay(value) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit" }).format(new Date(`${value}T12:00:00`));
}

function formatLessonMonth(value) {
  return new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(new Date(`${value}T12:00:00`));
}

function formatLessonWeekday(value) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function renderMaterialList(materials) {
  if (!materials.length) {
    return `<div class="empty-state">Материалов пока нет.</div>`;
  }

  return `
    <div class="material-list">
      ${materials
        .map((material) => {
          const student = getStudent(material.studentId);
          return `
            <article class="material-card">
              <div class="material-card__top">
                <div>
                  <strong>${escapeHtml(material.title)}</strong>
                  <span class="item-card__meta">${escapeHtml(material.topic)}</span>
                </div>
                <span class="portal-chip">${escapeHtml(student ? student.name : "Для всех")}</span>
              </div>
              <p>${escapeHtml(material.description)}</p>
              <a class="button button--ghost button--small" href="${escapeHtml(material.link || "#")}" target="_blank" rel="noopener">
                Открыть материал
              </a>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMessage(message, role) {
  const isOwn = message.author === role;
  return `
    <article class="message ${isOwn ? "message--own" : ""}">
      ${escapeHtml(message.text)}
      <span class="message__time">${escapeHtml(formatTime(message.createdAt))}</span>
    </article>
  `;
}

function renderStudentGateway() {
  return `
    <section class="portal-gateway">
      <div class="portal-gateway__card">
        <p class="eyebrow">Кабинет ученика</p>
        <h1>Введите код от репетитора</h1>
        <p>
          Для каждого ученика создаётся отдельный кабинет. В демонстрации можно использовать
          код <strong>NE-IVAN-25</strong> или <strong>NE-MARIA-80</strong>.
        </p>
        <form class="portal-gateway__form" data-student-login-form>
          <input name="code" type="text" placeholder="Например, NE-IVAN-25" autocomplete="off" required>
          <button class="button button--primary" type="submit">Войти</button>
        </form>
        ${ui.loginError ? `<p class="portal-chip portal-chip--orange">${escapeHtml(ui.loginError)}</p>` : ""}
      </div>
    </section>
  `;
}

function renderModal() {
  if (!ui.modal) {
    return "";
  }

  const modalContent = {
    student: {
      title: "Новый ученик",
      fields: `
        <label>ФИО ученика<input name="name" type="text" required></label>
        <label>Email<input name="email" type="email" placeholder="student@example.com"></label>
        <label>Цель подготовки<input name="target" type="text" placeholder="Например, ОГЭ на оценку 5"></label>
      `,
    },
    homework: {
      title: "Новая домашняя работа",
      fields: `
        ${renderStudentSelect()}
        <label>Название<input name="title" type="text" placeholder="Например, Дроби и степени" required></label>
        <label>Описание<textarea name="description" placeholder="Что нужно выполнить" required></textarea></label>
        <label>Срок выполнения<input name="dueDate" type="date" required></label>
      `,
    },
    lesson: {
      title: "Новое занятие",
      fields: `
        ${renderStudentSelect()}
        <label>Дата занятия<input name="date" type="date" value="${escapeHtml(ui.lessonDraft?.date || "")}" required></label>
        <label>Время начала<input name="time" type="time" value="${escapeHtml(ui.lessonDraft?.time || "")}" required></label>
        <label>Продолжительность
          <select name="duration" required>
            <option value="45">45 минут</option>
            <option value="60" selected>60 минут</option>
            <option value="90">90 минут</option>
            <option value="120">120 минут</option>
          </select>
        </label>
        <label>Формат
          <select name="format" required>
            <option value="Онлайн">Онлайн</option>
            <option value="Очно">Очно</option>
          </select>
        </label>
        <label>Заметка<textarea name="note" placeholder="Например, проверить домашнюю работу"></textarea></label>
      `,
    },
    material: {
      title: "Новый материал",
      fields: `
        ${renderStudentSelect(true)}
        <label>Название<input name="title" type="text" required></label>
        <label>Тема<input name="topic" type="text" placeholder="Например, Планиметрия" required></label>
        <label>Ссылка<input name="link" type="url" placeholder="https://..."></label>
        <label>Описание<textarea name="description" placeholder="Коротко опишите материал"></textarea></label>
      `,
    },
  }[ui.modal];

  return `
    <dialog class="portal-dialog" data-portal-dialog>
      <div class="portal-dialog__body">
        <div class="portal-dialog__top">
          <h2>${escapeHtml(modalContent.title)}</h2>
          <button type="button" aria-label="Закрыть" data-close-modal>×</button>
        </div>
        <form class="portal-form" data-modal-form="${ui.modal}">
          ${modalContent.fields}
          <div class="portal-dialog__actions">
            <button class="button button--ghost" type="button" data-close-modal>Отмена</button>
            <button class="button button--primary" type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

function renderStudentSelect(allowAll = false) {
  return `
    <label>
      Ученик
      <select name="studentId" required>
        ${allowAll ? `<option value="">Для всех учеников</option>` : ""}
        ${data.students
          .map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function openRenderedDialog() {
  document.querySelector("[data-portal-dialog]")?.showModal();
}

function closeModal() {
  ui.modal = "";
  ui.lessonDraft = null;
  render();
}

function handleModalSubmit(form) {
  const values = Object.fromEntries(new FormData(form));

  if (form.dataset.modalForm === "student") {
    const student = {
      id: createId("student"),
      name: values.name.trim(),
      email: values.email.trim(),
      target: values.target.trim() || "Подготовка к экзамену",
      code: createInviteCode(values.name),
    };
    data.students.push(student);
    ui.selectedStudentId = student.id;
  }

  if (form.dataset.modalForm === "homework") {
    data.homeworks.unshift({
      id: createId("homework"),
      studentId: values.studentId,
      title: values.title.trim(),
      description: values.description.trim(),
      dueDate: values.dueDate,
      status: "new",
    });
  }

  if (form.dataset.modalForm === "lesson") {
    data.lessons = data.lessons || [];
    data.lessons.push({
      id: createId("lesson"),
      studentId: values.studentId,
      date: values.date,
      time: values.time,
      duration: Number(values.duration),
      format: values.format,
      note: values.note.trim(),
    });
  }

  if (form.dataset.modalForm === "material") {
    data.materials.unshift({
      id: createId("material"),
      studentId: values.studentId,
      title: values.title.trim(),
      topic: values.topic.trim(),
      link: values.link.trim() || "#",
      description: values.description.trim(),
    });
  }

  saveData();
  closeModal();
}

document.addEventListener("click", (event) => {
  const roleButton = event.target.closest("[data-role-switch]");
  const sectionButton = event.target.closest("[data-section]");
  const studentButton = event.target.closest("[data-select-student]");
  const modalButton = event.target.closest("[data-open-modal]");
  const closeButton = event.target.closest("[data-close-modal]");
  const homeworkButton = event.target.closest("[data-complete-homework]");
  const calendarButton = event.target.closest("[data-calendar-action]");
  const calendarTrack = event.target.closest("[data-calendar-track]");
  const calendarLesson = event.target.closest("[data-calendar-lesson]");

  if (roleButton) {
    ui.role = roleButton.dataset.roleSwitch;
    ui.section = "overview";
    ui.loginError = "";
    render();
  }

  if (sectionButton) {
    ui.section = sectionButton.dataset.section;
    render();
  }

  if (studentButton) {
    ui.selectedStudentId = studentButton.dataset.selectStudent;
    if (ui.section === "overview") {
      ui.section = "messages";
    }
    render();
  }

  if (modalButton) {
    ui.modal = modalButton.dataset.openModal;
    render();
  }

  if (closeButton) {
    closeModal();
  }

  if (homeworkButton) {
    const homework = data.homeworks.find((item) => item.id === homeworkButton.dataset.completeHomework);
    if (homework) {
      homework.status = "done";
      saveData();
      render();
    }
  }

  if (calendarButton) {
    const action = calendarButton.dataset.calendarAction;
    const currentWeek = parseLocalDate(ui.calendarWeekStart);
    const nextWeek = action === "today"
      ? getStartOfWeek(new Date())
      : addDays(currentWeek, action === "previous" ? -7 : 7);
    ui.calendarWeekStart = formatDateKey(nextWeek);
    render();
  }

  if (
    calendarTrack
    && !calendarLesson
    && ui.role === "teacher"
    && Date.now() > ui.suppressCalendarClickUntil
  ) {
    ui.lessonDraft = getCalendarSlotFromPointer(calendarTrack, event.clientY);
    ui.modal = "lesson";
    render();
  }
});

document.addEventListener("dragstart", (event) => {
  const lessonElement = event.target.closest("[data-calendar-lesson]");

  if (!lessonElement || ui.role !== "teacher") {
    return;
  }

  ui.draggedLessonId = lessonElement.dataset.calendarLesson;
  lessonElement.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", ui.draggedLessonId);
});

document.addEventListener("dragover", (event) => {
  const track = event.target.closest("[data-calendar-track]");

  if (!track || !ui.draggedLessonId || ui.role !== "teacher") {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  document.querySelectorAll(".weekly-calendar__day-track.is-drag-over").forEach((element) => {
    element.classList.toggle("is-drag-over", element === track);
  });
});

document.addEventListener("drop", (event) => {
  const track = event.target.closest("[data-calendar-track]");
  const lessonId = ui.draggedLessonId || event.dataTransfer.getData("text/plain");
  const lesson = data.lessons?.find((item) => item.id === lessonId);

  if (!track || !lesson || ui.role !== "teacher") {
    return;
  }

  event.preventDefault();
  const slot = getCalendarSlotFromPointer(track, event.clientY, lesson.duration);
  lesson.date = slot.date;
  lesson.time = slot.time;
  ui.draggedLessonId = "";
  ui.suppressCalendarClickUntil = Date.now() + 350;
  saveData();
  render();
});

document.addEventListener("dragend", () => {
  ui.draggedLessonId = "";
  document.querySelectorAll(".weekly-calendar__day-track.is-drag-over").forEach((element) => {
    element.classList.remove("is-drag-over");
  });
  document.querySelectorAll(".weekly-calendar__lesson.is-dragging").forEach((element) => {
    element.classList.remove("is-dragging");
  });
});

document.addEventListener("submit", (event) => {
  event.preventDefault();

  if (event.target.matches("[data-modal-form]")) {
    handleModalSubmit(event.target);
  }

  if (event.target.matches("[data-student-login-form]")) {
    const code = new FormData(event.target).get("code").trim().toUpperCase();
    const student = data.students.find((item) => item.code.toUpperCase() === code);

    if (!student) {
      ui.loginError = "Код не найден. Проверьте написание или используйте один из демо-кодов.";
      render();
      return;
    }

    ui.studentSessionId = student.id;
    ui.section = "overview";
    ui.loginError = "";
    render();
  }

  if (event.target.matches("[data-message-form]")) {
    const formData = new FormData(event.target);
    const text = formData.get("text").trim();

    if (!text) {
      return;
    }

    data.messages.push({
      id: createId("message"),
      studentId: event.target.dataset.studentId,
      author: ui.role,
      text,
      createdAt: new Date().toISOString(),
    });
    saveData();
    render();
  }
});

render();
