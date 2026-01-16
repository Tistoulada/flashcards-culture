const SHEET_URL = "TON_URL_GOOGLE_SCRIPT";

let flashcards = [];
let currentIndex = 0;
let currentUser = "";
let score = 0;
let lives = 3;
let combo = 0;
let multiplier = 1;
let startTime = 0;
let suddenDeath = false;
let bestScore = 0;

// -------- FETCH --------
async function fetchData(body) {
    const res = await fetch(SHEET_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body)
    });
    return res.json();
}

// -------- START --------
async function setPseudo() {
    currentUser = pseudo-input.value.trim();
    if (!currentUser) return alert("Pseudo requis");

    document.getElementById("login-form").style.display = "none";
    document.getElementById("game").style.display = "block";

    score = 0;
    combo = 0;
    multiplier = 1;
    lives = suddenDeath ? 1 : 3;

    updateUI();
    await loadScores();
    await loadFlashcards();
}

function startSuddenDeath() {
    suddenDeath = true;
    setPseudo();
}

// -------- FLASHCARDS --------
async function loadFlashcards() {
    const data = await fetch(SHEET_URL).then(r => r.json());
    flashcards = data;
    currentIndex = 0;
    showCard();
}

function showCard() {
    const card = flashcards[currentIndex];
    document.getElementById("flashcard-question").textContent = card["Contenu (Question)"];
    document.getElementById("user-answer").value = "";
    startTime = Date.now();
}

// -------- GAMEPLAY --------
function checkAnswer() {
    const card = flashcards[currentIndex];
    const userAnswer = document.getElementById("user-answer").value.trim().toLowerCase();
    const goodAnswer = card.Réponse.toLowerCase();

    const timeTaken = (Date.now() - startTime) / 1000;

    if (userAnswer === goodAnswer) {
        combo++;
        multiplier = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;

        let base = timeTaken < 3 ? 20 : timeTaken < 6 ? 10 : 5;
        score += base * multiplier;

        moveKnight(true);
    } else {
        combo = 0;
        multiplier = 1;
        lives--;
        moveKnight(false);
        if (lives <= 0) return gameOver();
    }

    currentIndex++;
    updateUI();
    showCard();
}

// -------- END --------
async function gameOver() {
    await saveScore();
    alert("GAME OVER");
    location.reload();
}

// -------- SCORE --------
async function saveScore() {
    await fetchData({
        action: "saveScore",
        user: currentUser,
        score: score
    });
}

async function loadScores() {
    const scores = await fetchData({action:"getScores"});
    updateScoreboard(scores);
}

function updateScoreboard(scores) {
    const list = document.getElementById("score-list");
    list.innerHTML = "";

    scores.sort((a,b)=>b.Score-a.Score);

    bestScore = scores[0]?.Score || 0;

    scores.slice(0,10).forEach(s=>{
        const li = document.createElement("li");
        li.textContent = `${s.User} — ${s.Score}`;
        if (s.User === currentUser) li.style.color = "#0ff";
        list.appendChild(li);
    });

    if (score > bestScore) {
        document.getElementById("highscore-banner").style.display = "block";
    }
}

// -------- UI --------
function updateUI() {
    document.getElementById("score-value").textContent = score;
    document.getElementById("lives").textContent = "❤️".repeat(lives);
    document.getElementById("combo").textContent =
        combo >= 2 ? `COMBO x${multiplier}` : "";
}

function moveKnight(success) {
    const knight = document.getElementById("character");
    const pos = parseInt(knight.style.left || 0);
    knight.style.left = success ? pos + 30 + "px" : pos - 20 + "px";
}

// Le reste de votre code (les fonctions existantes comme showCard, checkAnswer, etc.)
// reste inchangé

