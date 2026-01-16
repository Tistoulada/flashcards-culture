const SHEET_URL = "https://script.google.com/macros/s/AKfycbyfyE6GGFaP0P59B3Cgtyu-ECspliyXV2rQH368O_X7-O61jy3pZzIZiQ213y8Cequa/exec";

let flashcards = [];
let index = 0;
let currentUser = "";
let currentScore = 0;
let lives = 3;
let combo = 0;
let questionStartTime = 0;

// -------- FETCH --------
async function fetchData(body = null) {
    const options = body ? {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body)
    } : {};

    const res = await fetch(SHEET_URL, options);
    return res.json();
}

// -------- START --------
async function setPseudo() {
    const input = document.getElementById("pseudo-input");
    currentUser = input.value.trim();
    if (!currentUser) return alert("Pseudo requis");

    document.getElementById("login-form").style.display = "none";
    document.getElementById("game").style.display = "block";

    currentScore = 0;
    lives = 3;
    combo = 0;
    index = 0;

    updateUI();
    await loadScores();
    await loadFlashcards();
}

// -------- FLASHCARDS --------
async function loadFlashcards() {
    flashcards = await fetchData();
    showCard();
}

function showCard() {
    const card = flashcards[index];
    document.getElementById("flashcard-question").textContent = card["Contenu (Question)"];
    document.getElementById("user-answer").value = "";
    questionStartTime = Date.now();
}

// -------- GAMEPLAY --------
function checkAnswer() {
    const card = flashcards[index];
    const userAnswer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correct = card.Réponse.toLowerCase();

    const time = (Date.now() - questionStartTime) / 1000;

    if (userAnswer === correct) {
        combo++;
        let multiplier = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;
        let base = time < 3 ? 20 : time < 6 ? 15 : 10;

        currentScore += base * multiplier;
        moveCastle(true);
        flashScore(multiplier);
    } else {
        combo = 0;
        lives--;
        moveCastle(false);
        if (lives <= 0) return gameOver();
    }

    index++;
    updateUI();
    showCard();
}

// -------- END --------
async function gameOver() {
    await fetchData({
        action: "saveScore",
        user: currentUser,
        score: currentScore
    });

    alert("GAME OVER");
    location.reload();
}

// -------- SCOREBOARD --------
async function loadScores() {
    const scores = await fetchData({ action: "getScores" });
    const list = document.getElementById("score-list");
    list.innerHTML = "";

    scores.sort((a,b)=>b.Score-a.Score).slice(0,10).forEach(s => {
        const li = document.createElement("li");
        li.textContent = `${s.User} : ${s.Score}`;
        list.appendChild(li);
    });
}

// -------- UI --------
function updateUI() {
    document.getElementById("score-value").textContent = currentScore;
    document.getElementById("lives").textContent = "❤️".repeat(lives);
}

function moveCastle(success) {
    const castle = document.getElementById("character");
    const left = parseInt(castle.style.left || "0", 10);
    castle.style.left = success ? left + 30 + "px" : Math.max(left - 20, 0) + "px";
}

function flashScore(multiplier) {
    const score = document.querySelector(".score");
    if (multiplier > 1) {
        score.textContent = `SCORE: ${currentScore} x${multiplier}`;
        setTimeout(() => {
            score.textContent = `SCORE: ${currentScore}`;
        }, 600);
    }
}

