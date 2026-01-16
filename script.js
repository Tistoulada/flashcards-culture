// URL de votre script Google Apps (déjà active)
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

// Fonction utilitaire pour afficher les messages d'erreur
function showError(message) {
    console.error("Erreur:", message);
    alert(`Erreur: ${message}\nVérifiez votre connexion internet.`);
}

// Fonction générique pour les requêtes fetch avec gestion d'erreur améliorée
async function fetchData(options = {}) {
    try {
        isLoading = true;
        document.body.style.cursor = 'wait';

        let url = SHEET_URL;
        let fetchOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors', // Important pour les requêtes cross-origin
            cache: 'no-cache',
        };

        if (options.body) {
            fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur HTTP: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        isLoading = false;
        document.body.style.cursor = 'default';
        return data;
    } catch (error) {
        isLoading = false;
        document.body.style.cursor = 'default';
        showError(error.message);
        throw error;
    }
}

// Charge les flashcards depuis le script Google Apps
async function loadFlashcards() {
    try {
        const data = await fetchData();
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
        const scores = await fetchData({
            method: 'POST',
            body: { action: "getScores" }
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
        await fetchData({
            method: 'POST',
            body: {
                action: "saveScore",
                user: currentUser,
                score: currentScore
            }
        });
        loadScores(); // Recharge les scores
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du score:", error);
    }
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
        await fetchData({
            method: 'POST',
            body: {
                action: "addFlashcard",
                Type: "question",
                "Contenu (Question)": contenu,
                Réponse: reponse,
                Catégorie: categorie
            }
        });
        alert("Flashcard ajoutée avec succès !");
        document.getElementById("new-contenu").value = "";
        document.getElementById("new-reponse").value = "";
        document.getElementById("new-categorie").value = "";
        await loadFlashcards(); // Recharge les flashcards
    } catch (error) {
        console.error("Erreur lors de l'ajout de la flashcard:", error);
        alert(`Erreur lors de l'ajout de la flashcard. Vérifiez que l'URL du script est correcte et que le script est déployé.`);
    }
}

// Le reste de votre code (les fonctions existantes comme setPseudo, showCard, checkAnswer, etc.)
// reste inchangé, sauf pour les appels à fetchData qui doivent être mis à jour comme ci-dessus.

