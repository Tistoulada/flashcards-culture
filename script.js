// URL de votre script Google Apps
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxYAZVc228RG4qdinTR1Y6UZT9LLiHne00a6OEEvhWHO2K0TYus818EsosATpCfrlg8/exec";

// Variables globales
let flashcards = [];
let currentCardIndex = 0;
let currentUser = null;
let currentScore = 0;
let characterPosition = 0;
let lives = 3;
let usedIndices = [];
let consecutiveCorrectAnswers = 0;
let isLoading = false;

// Fonction pour afficher les messages d'erreur de manière cohérente
function showError(message) {
    console.error(message);
    alert(`Erreur: ${message}\nVérifiez votre connexion internet et que le script Google Apps est correctement déployé.`);
}

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
    consecutiveCorrectAnswers = 0;
    document.getElementById("score-value").textContent = currentScore;
    document.getElementById("login-form").style.display = "none";
    document.getElementById("game").style.display = "block";
    loadScores();
    updateLives();
    loadFlashcards();
    resetCharacter();
}

// Réinitialiser le personnage
function resetCharacter() {
    const character = document.getElementById("character");
    characterPosition = 0;
    character.style.left = `${characterPosition}px`;
    usedIndices = [];
}

// Mettre à jour les vies
function updateLives() {
    const livesElement = document.getElementById("lives");
    livesElement.textContent = "❤️".repeat(lives);
}

// Mettre à jour la barre de progression
function updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    if (flashcards.length > 0) {
        const progress = ((usedIndices.length) / flashcards.length) * 100;
        progressBar.style.width = `${progress}%`;
    } else {
        progressBar.style.width = `0%`;
    }
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

// Fonction générique pour les requêtes fetch
async function fetchData(url, options = {}) {
    try {
        isLoading = true;
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur HTTP: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        isLoading = false;
        return data;
    } catch (error) {
        isLoading = false;
        showError(error.message);
        throw error;
    }
}

// Charge les flashcards depuis le script Google Apps
async function loadFlashcards() {
    try {
        const data = await fetchData(SHEET_URL);
        flashcards = data.map(item => ({
            type: item.Type,
            contenu: item["Contenu (Question)"],
            reponse: item.Réponse,
            categorie: item.Catégorie
        }));
        showCard();
    } catch (error) {
        console.error("Erreur de chargement des flashcards:", error);
    }
}

// Charge les scores depuis le script Google Apps
async function loadScores() {
    try {
        const scores = await fetchData(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: "getScores" })
        });
        updateScoreboard(scores);
    } catch (error) {
        console.error("Erreur de chargement des scores:", error);
    }
}

// Mettre à jour le scoreboard
function updateScoreboard(scores) {
    const scoreList = document.getElementById("score-list");
    scoreList.innerHTML = "";
    if (scores && scores.length > 0) {
        scores.sort((a, b) => b.Score - a.Score).forEach(score => {
            const li = document.createElement("li");
            li.textContent = `${score.User}: ${score.Score}`;
            scoreList.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "Aucun score enregistré";
        scoreList.appendChild(li);
    }
}

// Enregistrer le score
async function saveScore() {
    if (!currentUser) return;
    try {
        await fetchData(SHEET_URL, {
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
        loadScores(); // Recharge les scores
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du score:", error);
    }
}

// Affiche une flashcard aléatoire
function showCard() {
    if (flashcards.length === 0) {
        document.getElementById("flashcard-question").textContent = "FÉLICITATIONS: TU AS FINI!";
        document.getElementById("user-answer").style.display = "none";
        document.querySelector(".answer-section button").style.display = "none";
        return;
    }

    // Si toutes les questions ont été utilisées, réinitialiser
    if (usedIndices.length === flashcards.length) {
        usedIndices = [];
    }

    // Sélectionner un indice aléatoire non utilisé
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * flashcards.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);
    currentCardIndex = randomIndex;

    const card = flashcards[currentCardIndex];
    document.getElementById("flashcard-question").textContent = card.contenu;
    document.getElementById("user-answer").value = "";
    document.getElementById("user-answer").style.display = "block";
    document.querySelector(".answer-section button").style.display = "block";
    updateProgressBar();
}

// Fonction pour normaliser les réponses
function normalizeAnswer(answer) {
    // Remplace les accents et caractères spéciaux
    answer = answer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Supprime les espaces multiples
    answer = answer.replace(/\s+/g, " ").trim().toLowerCase();
    return answer;
}

// Fonction pour calculer la distance de Levenshtein
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // suppression
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Vérifie la réponse
function checkAnswer() {
    if (isLoading) {
        alert("Veuillez patienter, une opération est en cours...");
        return;
    }

    const userAnswer = document.getElementById("user-answer").value.trim();
    if (!userAnswer) {
        alert("Veuillez entrer une réponse.");
        return;
    }

    const correctAnswer = flashcards[currentCardIndex].reponse;
    const flashcardElement = document.querySelector(".flashcard");

    // Normalisation des réponses
    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

    // Vérification flexible des réponses
    if (
        normalizedUserAnswer === normalizedCorrectAnswer ||
        normalizedCorrectAnswer.startsWith(normalizedUserAnswer) ||
        normalizedUserAnswer.startsWith(normalizedCorrectAnswer) ||
        // Vérification des prénoms
        (normalizedCorrectAnswer.includes(" ") && normalizedUserAnswer === normalizedCorrectAnswer.split(" ")[1]) ||
        // Vérification des fautes courantes
        (normalizedCorrectAnswer === "arachnophobie" && (normalizedUserAnswer === "arachnophobe" || normalizedUserAnswer === "arachnophobies")) ||
        (normalizedCorrectAnswer === "acrophobie" && normalizedUserAnswer === "acrophobe") ||
        (normalizedCorrectAnswer === "aquaphobie" && normalizedUserAnswer === "aquaphobe") ||
        (normalizedCorrectAnswer === "mysophobie" && normalizedUserAnswer === "mysophobe") ||
        // Vérification des réponses numériques
        (!isNaN(normalizedUserAnswer) && !isNaN(normalizedCorrectAnswer) && parseInt(normalizedUserAnswer) === parseInt(normalizedCorrectAnswer)) ||
        // Ajoute d'autres cas spécifiques ici
        levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer) <= 2
    ) {
        document.querySelector(".flashcard").classList.add("flash");
        setTimeout(() => {
            document.querySelector(".flashcard").classList.remove("flash");
        }, 500);
        updateScore(1);
        consecutiveCorrectAnswers++;
        if (consecutiveCorrectAnswers % 10 === 0) {
            lives++;
            updateLives();
            alert(`FÉLICITATIONS ! Tu as eu 10 bonnes réponses d'affilée et tu gagnes un cœur ! 💚`);
        }
        moveCharacter(window.innerWidth < 600 ? 15 : 20);
        flashcardElement.classList.remove("shake");
        setTimeout(showCard, 500); // Attendre la fin de l'animation
    } else {
        flashcardElement.classList.add("shake");
        showBloodDrops();
        alert(`MAUVAISE RÉPONSE. La bonne réponse était : ${correctAnswer}`);
        lives--;
        updateLives();
        consecutiveCorrectAnswers = 0;
        if (lives <= 0) {
            saveScore(); // Enregistre le score
            setTimeout(() => {
                flashcardElement.classList.remove("shake");
                restartGame();
            }, 1000);
        } else {
            setTimeout(() => {
                flashcardElement.classList.remove("shake");
                showCard();
            }, 1000);
        }
    }
}

// Mettre à jour le score actuel
function updateScore(points) {
    currentScore += points;
    document.getElementById("score-value").textContent = currentScore;
}

// Relancer la série de questions depuis le début
function restartGame() {
    currentCardIndex = 0;
    currentScore = 0;
    lives = 3;
    consecutiveCorrectAnswers = 0;
    document.getElementById("score-value").textContent = currentScore;
    updateLives();
    resetCharacter();
    alert("PARTIE TERMINÉE. NOUVELLE PARTIE COMMENCÉE!");
    showCard();
}

// Afficher/Masquer le formulaire d'ajout de flashcard
function toggleAddFlashcard() {
    const form = document.getElementById("add-flashcard-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

// Ajouter une flashcard
async function addFlashcard() {
    if (isLoading) {
        alert("Veuillez patienter, une opération est en cours...");
        return;
    }

    const contenu = document.getElementById("new-contenu").value.trim();
    const reponse = document.getElementById("new-reponse").value.trim();
    const categorie = document.getElementById("new-categorie").value.trim();

    if (!contenu || !reponse) {
        alert("Veuillez remplir les champs 'Question' et 'Réponse' !");
        return;
    }

    try {
        await fetchData(SHEET_URL, {
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
        alert("Flashcard ajoutée avec succès !");
        document.getElementById("new-contenu").value = "";
        document.getElementById("new-reponse").value = "";
        document.getElementById("new-categorie").value = "";
        await loadFlashcards(); // Recharge les flashcards
    } catch (error) {
        console.error("Erreur lors de l'ajout de la flashcard:", error);
    }
}

// Charge les flashcards au démarrage
loadFlashcards();
loadScores();

// Charge les flashcards au démarrage
loadFlashcards();
loadScores();
