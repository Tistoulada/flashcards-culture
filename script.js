// URL de ton script Google Apps
const SHEET_URL = "TU_REMPLACES_PAR_TON_URL_DE_SCRIPT";

// Variables globales
let flashcards = [];
let currentCardIndex = 0;
let score = 0;
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
    document.getElementById("score-value").textContent = scores[currentUser];
    updateScoreboard();
}

// Charge les flashcards depuis le script Google Apps
async function loadFlashcards() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        flashcards = data.map(item => ({
            type: item.Type,
            contenu: item.Contenu,
            reponse: item.Réponse,
            categorie: item.Catégorie
        }));
        showCard();
    } catch (error) {
        console.error("Erreur de chargement :", error);
        alert("Erreur de chargement. Vérifie la console (F12) pour plus de détails.");
    }
}

// Affiche une flashcard
function showCard() {
    if (flashcards.length === 0) {
        document.getElementById("flashcard").innerHTML = "<h2>Félicitations, tu as fini !</h2>";
        return;
    }
    const card = flashcards[currentCardIndex];
    document.getElementById("flashcard-question").textContent = card.contenu;
    document.getElementById("flashcard-answer").textContent = card.reponse;
    document.getElementById("user-answer").value = "";
    document.getElementById("back").style.display = "none";
    document.getElementById("front").style.display = "flex";
    document.getElementById("next-button").style.display = "none";
}

// Retourne la carte
function flipCard() {
    document.getElementById("front").style.display = "none";
    document.getElementById("back").style.display = "flex";
}

// Vérifie la réponse
function checkAnswer() {
    const userAnswer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correctAnswer = flashcards[currentCardIndex].reponse.toLowerCase();
    if (userAnswer === correctAnswer.split(' ')[0] || correctAnswer.includes(userAnswer)) {
        alert("Bonne réponse !");
        updateScore(1);
    } else {
        alert(`Mauvaise réponse. La bonne réponse était : ${flashcards[currentCardIndex].reponse}`);
    }
    document.getElementById("next-button").style.display = "block";
}

// Passer à la carte suivante
function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showCard();
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
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Type: "question",
                Contenu: contenu,
                Réponse: reponse,
                Catégorie: categorie
            })
        });
        alert("Flashcard ajoutée avec succès !");
        // Recharge les flashcards
        await loadFlashcards();
    } catch (error) {
        console.error("Erreur lors de l'ajout de la flashcard :", error);
        alert("Erreur lors de l'ajout de la flashcard. Voir la console pour plus de détails.");
    }

    // Réinitialise le formulaire
    document.getElementById("new-contenu").value = "";
    document.getElementById("new-reponse").value = "";
    document.getElementById("new-categorie").value = "";
}


