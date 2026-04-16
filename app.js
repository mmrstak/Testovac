// app.js - Hlavní logika aplikace
if (typeof window.QUESTIONS2 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS2);
if (typeof window.QUESTIONS3 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS3);
if (typeof window.QUESTIONS4 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS4);
if (typeof window.QUESTIONS5 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS5);
if (typeof window.QUESTIONS6 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS6);
if (typeof window.QUESTIONS7 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS7);
if (typeof window.QUESTIONS8 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS8);
if (typeof window.QUESTIONS9 !== "undefined") window.QUESTIONS = window.QUESTIONS.concat(window.QUESTIONS9);
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let testMode = "quick";
let selectedTopic = "all";
let weakQuestions = [];
let stats = { tests: 0, sumPercent: 0, streak: 0, lastDate: null };

// Uložení chyb do local storage
const weakStorageKey = "chemWeakQ";

function initApp() {
  loadStats();
  updateHomeStats();
  showScreen("screen-home");

  // Eventy - Hlavní menu
  document.getElementById("btn-quick-test").onclick = () => startTest("quick", "all");
  document.getElementById("btn-thematic-test").onclick = () => showScreen("screen-topic-select");
  document.getElementById("btn-exam-sim").onclick = () => startTest("exam", "all");
  
  // Eventy - Výběr tématu
  document.getElementById("btn-back-home").onclick = () => showScreen("screen-home");
  document.querySelectorAll(".topic-card").forEach(card => {
    card.onclick = () => startTest("thematic", card.dataset.topic);
  });

  // Eventy - Testovací rozhraní
  document.getElementById("btn-quit-test").onclick = () => {
    if (confirm("Opravdu chceš ukončit probíhající test? Skóre nebude uloženo.")) {
      showScreen("screen-home");
    }
  };
  document.getElementById("btn-next").onclick = () => nextQuestion();

  // Eventy - Výsledky
  document.getElementById("btn-retry").onclick = () => startTest(testMode, selectedTopic);
  document.getElementById("btn-home").onclick = () => showScreen("screen-home");
  document.getElementById("btn-weak").onclick = () => startWeakTest();
}

function loadStats() {
  const saved = localStorage.getItem("chemStats");
  if (saved) {
    stats = JSON.parse(saved);
    checkStreak();
  }
}

function checkStreak() {
  const today = new Date().toDateString();
  if (stats.lastDate === today) return; // already played today
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (stats.lastDate === yesterday.toDateString()) {
    // continues
  } else if (stats.lastDate !== null && stats.lastDate !== today) {
    // reset
    stats.streak = 0;
  }
}

function saveStats(percent) {
  stats.tests++;
  stats.sumPercent += percent;
  const today = new Date().toDateString();
  if (stats.lastDate !== today) {
    stats.streak++;
    stats.lastDate = today;
  }
  localStorage.setItem("chemStats", JSON.stringify(stats));
  updateHomeStats();
}

function updateHomeStats() {
  document.getElementById("stat-tests").innerText = stats.tests;
  let avg = stats.tests > 0 ? Math.round(stats.sumPercent / stats.tests) : 0;
  document.getElementById("stat-avg").innerText = avg + "%";
  document.getElementById("stat-streak").innerText = stats.streak;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0,0);
}

function shuffleArray(arr) {
  let array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTest(mode, topic) {
  testMode = mode;
  selectedTopic = topic;
  
  let pool = [...window.QUESTIONS];
  if (topic !== "all") {
    pool = pool.filter(q => q.topic === topic);
  }

  pool = shuffleArray(pool);

  if (mode === "quick") {
    currentQuestions = pool.slice(0, 20);
  } else if (mode === "exam") {
    currentQuestions = pool.slice(0, 40);
  } else {
    currentQuestions = pool; // thematic - all from topic
  }

  if (currentQuestions.length === 0) {
    alert("Pro toto téma zatím nejsou otázky.");
    return;
  }

  currentIndex = 0;
  score = 0;
  weakQuestions = [];
  showQuestion(0);
  showScreen("screen-test");
}

function startWeakTest() {
  let savedWeak = JSON.parse(localStorage.getItem(weakStorageKey) || "[]");
  if (savedWeak.length === 0) return;
  
  let pool = window.QUESTIONS.filter(q => savedWeak.includes(q.id));
  pool = shuffleArray(pool);
  
  currentQuestions = pool.slice(0, 20); // max 20 at a time
  currentIndex = 0;
  score = 0;
  weakQuestions = [];
  testMode = "weak";
  showQuestion(0);
  showScreen("screen-test");
}

function showQuestion(index) {
  const q = currentQuestions[index];
  answered = false;

  // Header info
  document.getElementById("question-counter").innerText = `Otázka ${index + 1} / ${currentQuestions.length}`;
  let dt = q.difficulty === 1 ? "★☆☆" : q.difficulty === 2 ? "★★☆" : "★★★";
  document.getElementById("question-difficulty").innerText = dt;
  document.getElementById("question-topic-label").innerText = q.subtopic || q.topic;
  
  // Progress bar
  document.getElementById("progress-bar").style.width = ((index / currentQuestions.length) * 100) + "%";

  // Text
  document.getElementById("question-text").innerText = q.question;

  // Options
  const opCont = document.getElementById("options-container");
  opCont.innerHTML = "";
  
  q.options.forEach((optText, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = optText;
    btn.dataset.index = i;
    btn.onclick = () => handleAnswer(i, btn);
    opCont.appendChild(btn);
  });

  // Reset ui
  document.getElementById("explanation-box").style.display = "none";
  document.getElementById("btn-next").style.display = "none";
}

function handleAnswer(selectedIndex, btnElement) {
  if (answered) return;
  answered = true;

  const q = currentQuestions[currentIndex];
  const allBtns = document.querySelectorAll(".option-btn");
  
  // Disable all
  allBtns.forEach(b => b.disabled = true);
  
  if (selectedIndex === q.correct) {
    score++;
    btnElement.classList.add("correct", "selected");
    
    // remove from weak questions if it was a weak test and answered correctly
    if(testMode === "weak") {
      let savedWeak = JSON.parse(localStorage.getItem(weakStorageKey) || "[]");
      savedWeak = savedWeak.filter(id => id !== q.id);
      localStorage.setItem(weakStorageKey, JSON.stringify(savedWeak));
    }
  } else {
    btnElement.classList.add("wrong", "selected");
    allBtns[q.correct].classList.add("correct"); // highlight correct
    
    // add to weak questions
    let savedWeak = JSON.parse(localStorage.getItem(weakStorageKey) || "[]");
    if (!savedWeak.includes(q.id)) {
      savedWeak.push(q.id);
      localStorage.setItem(weakStorageKey, JSON.stringify(savedWeak));
    }
    weakQuestions.push(q.id);
  }

  // Show explanation
  const eb = document.getElementById("explanation-box");
  let explHTML = "";
  if (selectedIndex === q.correct) {
    explHTML = `<div style="color: var(--accent-green); margin-bottom: 12px; font-size: 18px;"><strong>✓ Přesně tak.</strong></div>`;
  } else {
    explHTML = `<div style="color: var(--accent-red); margin-bottom: 12px; font-size: 18px;"><strong>✗ Tohle jsi pokazil. Zastav a poslouchej.</strong></div>`;
    explHTML += `<div style="margin-bottom: 4px; padding-left: 10px; border-left: 3px solid var(--accent-red);"><em>Tvoje neuvážená volba:</em> <span style="opacity:0.8">${q.options[selectedIndex]}</span></div>`;
    explHTML += `<div style="margin-bottom: 16px; padding-left: 10px; border-left: 3px solid var(--accent-green);"><em>Správně má být:</em> <strong>${q.options[q.correct]}</strong></div>`;
  }
  explHTML += `<div style="background-color: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-sm); border-left: 4px solid var(--accent-blue);">
                 <strong>Rozbor (Walter říká):</strong><br><br>
                 ${q.explanation || "Není nad čím přemýšlet, prostě to tak je."}
               </div>`;
               
  eb.innerHTML = explHTML;
  eb.style.display = "block";
  
  document.getElementById("btn-next").style.display = "block";
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) {
    finishTest();
  } else {
    showQuestion(currentIndex);
  }
}

function finishTest() {
  // Update progress to 100%
  document.getElementById("progress-bar").style.width = "100%";
  
  let percent = Math.round((score / currentQuestions.length) * 100);
  if (testMode !== "weak") saveStats(percent);

  // setup results screen
  const circle = document.getElementById("score-circle");
  circle.className = "score-circle"; // reset
  if (percent >= 80) circle.classList.add("ok");
  else if (percent < 60) circle.classList.add("bad");

  document.getElementById("score-percent").innerText = percent + "%";
  document.getElementById("score-fraction").innerText = `${score}/${currentQuestions.length}`;
  
  let rating = "Procvičuj víc 📖";
  if (percent === 100) rating = "Mistrovské! 🏅";
  else if (percent >= 80) rating = "Výborně! 🎉";
  else if (percent >= 60) rating = "Dobrá práce 💪";
  document.getElementById("score-rating").innerText = rating;

  // Breakdown handling (simplified for now)
  document.getElementById("topic-breakdown").innerHTML = `
    <div class="breakdown-item">
      <span>Správně zodpovězeno</span>
      <span style="color:var(--accent-green);font-weight:bold">${score}</span>
    </div>
    <div class="breakdown-item">
      <span>Chybně zodpovězeno</span>
      <span style="color:var(--accent-red);font-weight:bold">${currentQuestions.length - score}</span>
    </div>
  `;

  // Weak tests button visibility
  let totalWeak = JSON.parse(localStorage.getItem(weakStorageKey) || "[]").length;
  const bw = document.getElementById("btn-weak");
  if (totalWeak > 0) {
    bw.style.display = "block";
    bw.innerText = `Správně odpovědět na chyby (${totalWeak} ot.)`;
  } else {
    bw.style.display = "none";
  }

  showScreen("screen-results");
}

window.onload = initApp;
