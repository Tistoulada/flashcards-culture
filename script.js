// Remplace cette URL par celle de ton script Google Apps
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxYAZVc228RG4qdinTR1Y6UZT9LLiHne00a6OEEvhWHO2K0TYus818EsosATpCfrlg8/exec";

// Variables globales
let flashcards = [];
let currentCardIndex = 0;
let currentUser = null;
let scores = JSON.parse(localStorage.getItem('scores')) || {};

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
    loadFlashcards();
}

// Mettre à jour le score
function updateScore(points) {
    if (!currentUser) return;
    scores[currentUser] = (scores[currentUser] || 0) + points;
    localStorage.setItem('scores', JSON.stringify(scores));
    document.getElementById("score-value").textContent = scores[currentUser];
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
    if (userAnswer === correctAnswer || correctAnswer.startsWith(userAnswer)) {
        alert("BONNE RÉPONSE!");
        updateScore(1);
    } else {
        alert(`MAUVAISE RÉPONSE. LA BONNE RÉPONSE ÉTAIT: ${flashcards[currentCardIndex].reponse}`);
    }
    nextCard();
}

// Passer à la carte suivante
function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showCard();
}

// Charge les flashcards au démarrage
loadFlashcards();




