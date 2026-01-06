// Remplace cette URL par celle de ton Google Sheet (voir Étape 4)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/TON_ID_ICI/pub?output=json";

let flashcards = [];
let currentCardIndex = 0;
let score = 0;
let isQuestionSide = true;

// Charge les flashcards depuis Google Sheets
async function loadFlashcards() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        const entries = data.feed.entry;
        flashcards = entries.map(entry => ({
            type: entry.gsx$type.$t,
            contenu: entry.gsx$contenu.$t,
            reponse: entry.gsx$réponse.$t,
            lien: entry.gsx$lien.$t
        }));
        showCard();
    } catch (error) {
        console.error("Erreur de chargement :", error);
        alert("Impossible de charger les flashcards. Vérifie l’URL du Google Sheet.");
    }
}

// Affiche une flashcard
function showCard() {
    if (flashcards.length === 0) {
        document.getElementById("flashcard").innerHTML = "<h2>Félicitations, tu as fini !</h2>";
        return;
    }
    const card = flashcards[currentCardIndex];
    if (isQuestionSide) {
        if (card.type === "image") {
            document.getElementById("flashcard").innerHTML = `
                <div id="front">
                    <img id="flashcard-image" src="${card.lien}" alt="${card.contenu}">
                </div>
            `;
        } else {
            document.getElementById("flashcard").innerHTML = `
                <div id="front" style="display: flex; justify-content: center; align-items: center;">
                    <p>${card.contenu}</p>
                </div>
            `;
        }
    } else {
        document.getElementById("flashcard").innerHTML = `
            <div id="back">
                <h2>Réponse :</h2>
                <p>${card.reponse}</p>
            </div>
        `;
    }
}

// Retourne la carte
function flipCard() {
    isQuestionSide = !isQuestionSide;
    showCard();
}

// Je connais la réponse
function knowCard() {
    const userAnswer = prompt("Quelle est ta réponse ?").trim().toLowerCase();
    const correctAnswer = flashcards[currentCardIndex].reponse.toLowerCase();
    if (userAnswer === correctAnswer.split(' ')[0] || correctAnswer.includes(userAnswer)) {
        score++;
        document.getElementById("score-value").textContent = score;
        flashcards.splice(currentCardIndex, 1);
    } else {
        alert(`Réponse incorrecte. La bonne réponse était : ${flashcards[currentCardIndex].reponse}`);
        score = 0;
        document.getElementById("score-value").textContent = score;
        const card = flashcards.splice(currentCardIndex, 1)[0];
        flashcards.push(card);
    }
    currentCardIndex = 0;
    isQuestionSide = true;
    showCard();
}

// Je ne connais pas
function dontKnowCard() {
    score = 0;
    document.getElementById("score-value").textContent = score;
    const card = flashcards.splice(currentCardIndex, 1)[0];
    flashcards.push(card);
    currentCardIndex = 0;
    isQuestionSide = true;
    showCard();
}

// Ajouter une flashcard
function addFlashcard() {
    const type = document.getElementById("new-type").value;
    const contenu = document.getElementById("new-contenu").value;
    const reponse = document.getElementById("new-reponse").value;
    const lien = document.getElementById("new-lien").value;

    if (!contenu || !reponse) {
        alert("Veuillez remplir les champs 'Contenu' et 'Réponse' !");
        return;
    }

    flashcards.push({ type, contenu, reponse, lien });
    alert("Flashcard ajoutée !");

    // Réinitialise le formulaire
    document.getElementById("new-contenu").value = "";
    document.getElementById("new-reponse").value = "";
    document.getElementById("new-lien").value = "";
}

// Charge les flashcards au démarrage
loadFlashcards();

