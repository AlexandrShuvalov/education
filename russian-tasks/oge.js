(() => {
  const tasks = [
    /*
    {
      id: "rus-oge-001-p001",
      subject: "Русский язык",
      number: 1,
      title: "Название раздела",
      topic: "Тема задания",
      prototype: 1,
      prompt: "Формулировка задания",
      question: "Текст задания",
      answer: "Ответ",
      solution: "Решение или пояснение"
    }
    */
  ];

  window.OGE_TASKS = window.OGE_TASKS || [];
  window.OGE_TASKS.push(...tasks);
})();
