// Remplace cette URL par celle de ton script Google Apps
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxYAZVc228RG4qdinTR1Y6UZT9LLiHne00a6OEEvhWHO2K0TYus818EsosATpCfrlg8/exec";

// Variables globales
let flashcards = [];
let currentCardIndex = 0;
let currentUser = null;
let scores = JSON.parse(localStorage.getItem('scores')) || {};
let characterPosition = 0;
let scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};

// Définir le pseudo de l'utilisateur
function setPseudo() {
    const pseudo = document.getElementById("pseudo-input").value.trim();
    if (!pseudo) {
        alert("Veuillez entrer un pseudo.");
        return;
    }
    currentUser = pseudo;
    document.getElementById("login-form").style.display = "none";
    document.getElementById("game").style.display = "block";
    updateScoreboard();
    loadFlashcards();
}

// Mettre à jour le scoreboard
function updateScoreboard() {
    const scoreList = document.getElementById("score-list");
    scoreList.innerHTML = "";
    for (const user in scores) {
        const li = document.createElement("li");
        li.textContent = `${user}: ${scores[user]}`;
        scoreList.appendChild(li);
    }
}

// Mettre à jour le score
function updateScore(points) {
    if (!currentUser) return;
    scores[currentUser] = (scores[currentUser] || 0) + points;
    localStorage.setItem('scores', JSON.stringify(scores));

    if (!scoreHistory[currentUser]) {
        scoreHistory[currentUser] = [];
    }
    scoreHistory[currentUser].push(scores[currentUser]);
    localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));

    document.getElementById("score-value").textContent = scores[currentUser];
    updateScoreboard();
}

// Déplacer le personnage
function moveCharacter(steps) {
    const character = document.getElementById("character");
    characterPosition += steps;
    character.style.left = `${characterPosition}px`;
    if (characterPosition > 200) {
        characterPosition = 200;
        character.style.left = `${characterPosition}px`;
    }
}

// Afficher l'animation de sang
function showBlood() {
    const bloodSplat = document.getElementById("blood-splat");
    bloodSplat.style.display = "block";
    setTimeout(() => {
        bloodSplat.style.display = "none";
    }, 1000);
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
}

// Vérifie la réponse
function checkAnswer() {
    const userAnswer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correctAnswer = flashcards[currentCardIndex].reponse.toLowerCase();
    const flashcardElement = document.querySelector(".flashcard");

    if (userAnswer === correctAnswer || correctAnswer.startsWith(userAnswer)) {
        alert("BONNE RÉPONSE!");
        updateScore(1);
        moveCharacter(20); // Le personnage avance
        flashcardElement.classList.remove("shake");
    } else {
        alert(`MAUVAISE RÉPONSE. LA BONNE RÉPONSE ÉTAIT: ${flashcards[currentCardIndex].reponse}`);
        flashcardElement.classList.add("shake");
        showBlood(); // Animation de sang
        updateScore(-1); // Réduit le score en cas de mauvaise réponse
        setTimeout(() => {
            flashcardElement.classList.remove("shake");
        }, 500);
    }
    nextCard();
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


