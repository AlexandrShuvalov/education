(() => {
  const tasks = [
    /*
    {
      id: "rus-mcko-06-001-p001",
      subject: "Русский язык",
      exam: "mcko",
      grade: 6,
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

  window.MCKO_TASKS = window.MCKO_TASKS || [];
  window.MCKO_TASKS.push(...tasks);
})();
