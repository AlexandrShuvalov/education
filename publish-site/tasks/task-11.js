window.OGE_TASKS = window.OGE_TASKS || [];

const TASK_11_ITEMS = [
  {
    intro: "На рисунках изображены графики функций вида y = kx + b. Установите соответствие между знаками коэффициентов k и b и графиками функций.",
    image_alt: "Графики линейных функций",
    solution: "Знак k — по наклону, знак b — по пересечению с Oy.",
  },
  ...Array.from({ length: 9 }, () => ({
    intro: "На рисунках изображены графики функций вида y = kx + b.",
    image_alt: "Графики линейных функций",
  })),
  {
    intro: "На рисунках изображены графики функций вида y = ax^2 + bx + c. Установите соответствие между графиками функций и знаками коэффициентов a и c.",
    image_alt: "Графики квадратичных функций",
    solution: "a — направление ветвей, c — точка пересечения с Oy.",
  },
  ...Array.from({ length: 4 }, () => ({
    intro: "На рисунках изображены графики функций вида y = ax^2 + bx + c.",
    image_alt: "Графики квадратичных функций",
  })),
  ...Array.from({ length: 4 }, () => ({
    intro: "Установите соответствие между формулами, которыми заданы функции, и графиками этих функций.",
    image_alt: "Графики функций и формулы",
  })),
  ...Array.from({ length: 2 }, () => ({
    intro: "Установите соответствие между графиками функций и формулами, которые их задают.",
    image_alt: "Графики функций и формулы",
  })),
];

window.OGE_TASKS.push(
  ...TASK_11_ITEMS.map((task, index) => {
    const number = index + 1;
    const paddedNumber = String(number).padStart(3, "0");

    return {
      id: `math-oge-011-p${paddedNumber}`,
      subject: "Математика",
      number: 11,
      title: "Графики функций",
      block: "",
      task_group: 1,
      item_number: number,
      prompt: "Установите соответствие и впишите ответ.",
      intro: task.intro,
      image: `images/task-11/task-11-${paddedNumber}.png`,
      image_alt: task.image_alt,
      question_text: "В таблице под каждой буквой укажите соответствующий номер.",
      answer_table: ["А", "Б", "В"],
      answer: "",
      solution: task.solution || "",
    };
  })
);
