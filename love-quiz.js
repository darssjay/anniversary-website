(() => {
  const questions = [
    {
      question: "Saan tayo unang nagkakilala?",
      choices: ["Facebook Dating", "Facebook Groups", "Instagram", "Messenger"],
      answer: 0,
      correct: "Yes! Sa Facebook Dating tayo unang nagkakilala. ❤️",
      wrong: "Hala, Love! Balikan mo nga ang story natin. 😹"
    },
    {
      question: "Saan ang first meet-up natin?",
      choices: ["SM Calamba", "Plaza", "Coffee shop", "Park"],
      answer: 1,
      correct: "Tama! Sa Plaza ang first meet-up natin. 🥰",
      wrong: "Huyyy, hindi mo ba nakalimutan ang first meet-up natin? 😂"
    },
    {
      question: "Ano ang tawagan natin sa isa't isa?",
      choices: ["Baby", "Babe", "Love", "Honey"],
      answer: 2,
      correct: "Correct! Love ang tawagan natin. Kiss nga! 😘",
      wrong: "Ay, iba yata ang ka-chat mo. Charot! 😂"
    },
    {
      question: "Ano ang favorite nickname ko para sa'yo?",
      choices: ["Cassy", "Dang", "Bunso", "Pretty"],
      answer: 1,
      correct: "Yesss! Dang! Ikaw talaga. 💗",
      wrong: "Maliii! Nakalimutan mo na nickname mo? 😿"
    },
    {
      question: "Ano ang favorite activity natin together?",
      choices: ["Manood ng movies", "Maglaro", "Mag-travel", "Kumain"],
      answer: 3,
      correct: "Tama! Siyempre, kumain! Food trip lagi. 😂❤️",
      wrong: "Hmmm, parang gutom na naman tayo. Pero hindi iyan ang sagot! 😹"
    }
  ];

  const $ = id => document.getElementById(id);
  const quiz = $("loveQuiz");
  const card = $("quizCard");
  const questionEl = $("quizQuestion");
  const optionsEl = $("quizOptions");
  const dialogueEl = $("quizDialogue");
  const nextBtn = $("quizNext");
  const countEl = $("quizCount");
  const progressFill = $("quizProgressFill");
  const cat = $("quizCat");

  if (!quiz || !card || !questionEl || !optionsEl ||
      !dialogueEl || !nextBtn || !cat) {
    console.error("Love Quiz elements are incomplete.");
    return;
  }

  let current = 0;
  let score = 0;
  let answered = false;
  const completed = new Set();

  function setCat(image, alt) {
    cat.src = `cats/quiz/${image}`;
    cat.alt = alt;
  }

  function renderQuestion() {
    answered = false;
    const q = questions[current];

    setCat("thinking.jpg", "Thinking cat");

    countEl.textContent = `Question ${current + 1} of ${questions.length}`;
    progressFill.style.width = `${(completed.size / questions.length) * 100}%`;
    questionEl.textContent = q.question;
    optionsEl.innerHTML = "";
    dialogueEl.className = "quiz-character-dialogue";
    dialogueEl.textContent = "Thinking...";
    nextBtn.hidden = true;

    q.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "quiz-option";
      button.type = "button";
      button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
      button.addEventListener("click", () => selectAnswer(index, button));
      optionsEl.appendChild(button);
    });
  }

  function burstHearts(button) {
    const rect = button.getBoundingClientRect();

    for (let i = 0; i < 9; i++) {
      const heart = document.createElement("span");
      heart.className = "quiz-confetti";
      heart.textContent = ["♥", "💗", "✨"][i % 3];
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
      heart.style.animationDelay = `${Math.random() * .25}s`;
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 3200);
    }
  }

  function selectAnswer(index, button) {
    if (answered) return;
    answered = true;

    const q = questions[current];
    const correct = index === q.answer;
    const buttons = [...optionsEl.querySelectorAll("button")];

    buttons.forEach(item => {
      item.disabled = true;
    });

    if (correct) {
      button.classList.add("correct");
      completed.add(current);
      score = completed.size;
      setCat("correct.jpg", "Happy cat");
      burstHearts(button);
      dialogueEl.innerHTML = `<span class="quiz-reaction">😻💗</span>${q.correct}`;
    } else {
      setCat("wrong.jpg", "Sad cat");
      button.classList.add("wrong");
      dialogueEl.innerHTML = `<span class="quiz-reaction">😿</span>${q.wrong}`;
    }

    dialogueEl.classList.add("show");
    nextBtn.textContent = current === questions.length - 1
      ? "See my surprise ♥"
      : "Next question ♥";
    nextBtn.hidden = false;
  }

  function showEnding() {
    progressFill.style.width = "100%";
    countEl.textContent = "Quiz completed! ❤️";

    card.innerHTML = `
      <div class="quiz-final">
        <img src="cats/quiz/congratulations.gif"
             alt="Congratulations cat"
             style="display:block;width:min(220px,65vw);height:170px;object-fit:contain;margin:0 auto 12px">
        <div class="quiz-kicker">You made it, Love!</div>
        <h1 class="quiz-title">You finished!</h1>
        <div class="quiz-score">${score} / ${questions.length}</div>
        <p class="quiz-subtitle">
          ${score === 5
            ? "Perfect score! Alam na alam mo ang story natin. I love you! 🥹❤️"
            : "It's okay, Love. Hindi naman score ang importante. Ang importante, tayo pa rin at marami pa tayong memories na gagawin. ❤️"}
        </p>
        <p class="quiz-subtitle">Ready ka na bang makita ang little surprise ko para sa'yo?</p>
        <button class="quiz-next" id="unlockLove">Unlock our little world ♥</button>
      </div>
    `;

    for (let i = 0; i < 32; i++) {
      const piece = document.createElement("span");
      piece.className = "quiz-confetti";
      piece.textContent = ["♥", "💗", "✨", "🌸"][i % 4];
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
      piece.style.animationDelay = `${Math.random() * .8}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3500);
    }

    $("unlockLove").addEventListener("click", async () => {
      const button = $("unlockLove");
      button.disabled = true;

      if (window.fadeOutLoveMusic) {
        await window.fadeOutLoveMusic();
      }

      window.location.href = "intro.html";
    });
  }

  nextBtn.addEventListener("click", () => {
    if (!answered) return;

    if (completed.size === questions.length) {
      showEnding();
      return;
    }

    do {
      current = (current + 1) % questions.length;
    } while (completed.has(current));

    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
    renderQuestion();
  });

  renderQuestion();
  console.log("Love Quiz with cat reactions ready!");
})();
