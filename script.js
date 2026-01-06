// Remplace cette URL par celle de ton Google Sheet publié en JSON
const SHEET_URL = "https://docs.google.com/spreadsheets/.../pub?output=json";

let flashcards = [];
let currentCardIndex = 0;
let score = 0;
let isQuestionSide = true;

// Charge les flashcards depuis Google Sheets
async function loadFlashcards() {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    const entries = data.feed.entry;
    flashcards = entries.map(entry => ({
        title: entry.gsx$titre.$t,
        author: entry.gsx$auteur.$t,
        date: entry.gsx$date.$t,
        image: entry.gsx$liendeimage.$t
    }));
    showCard();
}

// Affiche une flashcard
function showCard() {
    if (flashcards.length === 0) {
        document.getElementById("flashcard").innerHTML = "<h2>Félicitations, tu as fini !</h2>";
        return;
    }
    const card = flashcards[currentCardIndex];
    if (isQuestionSide) {
        document.getElementById("flashcard-image").src = card.image;
        document.getElementById("front").style.display = "flex";
        document.getElementById("back").style.display = "none";
    } else {
        document.getElementById("flashcard-title").textContent = card.title;
        document.getElementById("flashcard-author").textContent = `Auteur : ${card.author}`;
        document.getElementById("flashcard-date").textContent = `Date : ${card.date}`;
        document.getElementById("front").style.display = "none";
        document.getElementById("back").style.display = "block";
    }
}

// Retourne la carte
function flipCard() {
    isQuestionSide = !isQuestionSide;
    showCard();
}

// Je connais la réponse
function knowCard() {
    score++;
    document.getElementById("score-value").textContent = score;
    flashcards.splice(currentCardIndex, 1);
    currentCardIndex = 0;
    isQuestionSide = true;
    showCard();
}

// Je ne connais pas la réponse
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
async function addFlashcard() {
    const title = document.getElementById("new-title").value;
    const author = document.getElementById("new-author").value;
    const date = document.getElementById("new-date").value;
    const image = document.getElementById("new-image").value;

    if (!title || !author || !date || !image) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    // Ajoute la nouvelle flashcard à la liste
    flashcards.push({ title, author, date, image });

    // Réinitialise le formulaire
    document.getElementById("new-title").value = "";
    document.getElementById("new-author").value = "";
    document.getElementById("new-date").value = "";
    document.getElementById("new-image").value = "";

    alert("Flashcard ajoutée !");
    showCard();
}

// Charge les flashcards au démarrage
loadFlashcards();
