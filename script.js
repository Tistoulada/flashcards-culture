// Remplace cette URL par celle de ton script Google Apps
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxYAZVc228RG4qdinTR1Y6UZT9LLiHne00a6OEEvhWHO2K0TYus818EsosATpCfrlg8/exec";

// Variables globales
let flashcards = [];
let currentCardIndex = 0;
let currentUser = null;
let currentScore = 0;
let characterPosition = 0;
let lives = 3;

// Définir le pseudo de l'utilisateur
function setPseudo() {
    const pseudo = document.getElementById("pseudo-input").value.trim();
    if (!pseudo) {
        alert("Veuillez entrer un pseudo.");
        return;
    }
    currentUser = pseudo;
    currentScore = 0;
    lives = 3;
    document.getElementById("score-value").textContent = currentScore;
    document.getElementById("login-form").style.display = "none";
    document.getElementById("game").style.display = "block";
    updateLives();
    loadFlashcards();
    loadScores();
    resetCharacter();
}

// Réinitialiser le personnage
function resetCharacter() {
    const character = document.getElementById("character");
    characterPosition = 0;
    character.style.left = `${characterPosition}px`;
}

// Mettre à jour les vies
function updateLives() {
    const livesElement = document.getElementById("lives");
    livesElement.textContent = "❤️".repeat(lives);
}

// Mettre à jour la barre de progression
function updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    const progress = ((currentCardIndex + 1) / flashcards.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Afficher l'animation de gouttes de sang
function showBloodDrops() {
    const bloodContainer = document.getElementById("blood-splat-container");
    bloodContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const bloodDrop = document.createElement("div");
        bloodDrop.className = "blood-drop";
        bloodDrop.style.left = `${characterPosition + Math.random() * (window.innerWidth < 600 ? 80 : 100)}px`;
        bloodDrop.style.top = `${Math.random() * (window.innerWidth < 600 ? 30 : 50)}px`;
        bloodDrop.style.animationDelay = `${i * 0.2}s`;
        bloodContainer.appendChild(bloodDrop);
        bloodDrop.style.display = "block";
        setTimeout(() => {
            bloodDrop.remove();
        }, 1000);
    }
}

// Déplacer le personnage
function moveCharacter(steps) {
    const character = document.getElementById("character");
    characterPosition += steps;
    character.style.left = `${characterPosition}px`;
    if (characterPosition > (window.innerWidth < 600 ? 150 : 200)) {
        characterPosition = window.innerWidth < 600 ? 150 : 200;
        character.style.left = `${characterPosition}px`;
    }
}

// Charge les flashcards depuis le script Google Apps
async function loadFlashcards() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        flashcards = data.map(item => ({
            type: item.Type,
            contenu: item["Contenu (Question)"],
            reponse: item.Réponse,
            categorie: item.Catégorie
        }));
        showCard();
    } catch (error) {
        console.error("Erreur de chargement :", error);
        alert(`Erreur de chargement : ${error.message}.`);
    }
}

// Charge les scores depuis le script Google Apps
async function loadScores() {
    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: "getScores" })
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const scores = await response.json();
        updateScoreboard(scores);
    } catch (error) {
        console.error("Erreur de chargement des scores :", error);
    }
}

// Mettre à jour le scoreboard
function updateScoreboard(scores) {
    const scoreList = document.getElementById("score-list");
    scoreList.innerHTML = "";
    scores.sort((a, b) => b.Score - a.Score).forEach(score => {
        const li = document.createElement("li");
        li.textContent = `${score.User}: ${score.Score}`;
        scoreList.appendChild(li);
    });
}

// Enregistrer le score
async function saveScore() {
    if (!currentUser) return;
    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: "saveScore",
                user: currentUser,
                score: currentScore
            })
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        loadScores(); // Recharge les scores
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du score :", error);
    }
}

// Affiche une flashcard
function showCard() {
    if (flashcards.length === 0) {
        document.getElementById("flashcard-question").textContent = "FÉLICITATIONS: TU AS FINI!";
        document.getElementById("user-answer").style.display = "none";
        document.querySelector(".answer-section button").style.display = "none";
        return;
    }
    const card = flashcards[currentCardIndex];
    document.getElementById("flashcard-question").textContent = card.contenu;
    document.getElementById("user-answer").value = "";
    document.getElementById("user-answer").style.display = "block";
    document.querySelector(".answer-section button").style.display = "block";
    updateProgressBar();
}

// Vérifie la réponse
function checkAnswer() {
    const userAnswer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correctAnswer = flashcards[currentCardIndex].reponse.toLowerCase();
    const flashcardElement = document.querySelector(".flashcard");

    if (userAnswer === correctAnswer || correctAnswer.startsWith(userAnswer)) {
        document.querySelector(".flashcard").classList.add("flash");
        setTimeout(() => {
            document.querySelector(".flashcard").classList.remove("flash");
        }, 500);
        updateScore(1);
        moveCharacter(window.innerWidth < 600 ? 15 : 20);
        flashcardElement.classList.remove("shake");
        nextCard();
    } else {
        flashcardElement.classList.add("shake");
        showBloodDrops();
        lives--;
        updateLives();
        if (lives <= 0) {
            saveScore(); // Enregistre le score
            setTimeout(() => {
                flashcardElement.classList.remove("shake");
                restartGame();
            }, 1000);
        } else {
            setTimeout(() => {
                flashcardElement.classList.remove("shake");
                nextCard();
            }, 1000);
        }
    }
}

// Relancer la série de questions depuis le début
function restartGame() {
    currentCardIndex = 0;
    currentScore = 0;
    lives = 3;
    document.getElementById("score-value").textContent = currentScore;
    updateLives();
    resetCharacter();
    showCard();
    alert("PARTIE TERMINÉE. NOUVELLE PARTIE COMMENCÉE!");
}

// Passer à la carte suivante
function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showCard();
}

// Afficher/Masquer le formulaire d'ajout de flashcard
function toggleAddFlashcard() {
    const form = document.getElementById("add-flashcard-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

// Ajouter une flashcard
async function addFlashcard() {
    const contenu = document.getElementById("new-contenu").value;
    const reponse = document.getElementById("new-reponse").value;
    const categorie = document.getElementById("new-categorie").value;

    if (!contenu || !reponse) {
        alert("Veuillez remplir les champs 'Question' et 'Réponse' !");
        return;
    }

    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Type: "question",
                "Contenu (Question)": contenu,
                Réponse: reponse,
                Catégorie: categorie
            })
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        alert("Flashcard ajoutée avec succès !");
        await loadFlashcards(); // Recharge les flashcards
    } catch (error) {
        console.error("Erreur lors de l'ajout de la flashcard :", error);
        alert(`Erreur lors de l'ajout de la flashcard : ${error.message}.`);
    }

    // Réinitialise le formulaire
    document.getElementById("new-contenu").value = "";
    document.getElementById("new-reponse").value = "";
    document.getElementById("new-categorie").value = "";
}

// Charge les flashcards au démarrage
loadFlashcards();

