import { EMOJIS, TOTAL_PAIRS, MISMATCH_DELAY } from "./constants.js";
import { el, shuffle, clear } from "./utils.js";
import { saveResult } from "./storage.js";

export function createGame({ ui, modals }) {
  const state = {
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    moves: 0,
    matchedPairs: 0,
    mismatchTimerId: null,
    gameFinished: false,
  };

  function createCardElement(value) {
    const card = el("div", "card");
    card.dataset.value = value;

    const inner = el("div", "card-inner");
    const back = el("div", "card-face card-back", "?");
    const front = el("div", "card-face card-front", value);

    inner.append(back, front);
    card.appendChild(inner);
    card.addEventListener("click", () => onCardClick(card));
    return card;
  }

  function renderBoard() {
    clear(ui.board);
    const deck = shuffle(EMOJIS.flatMap((e) => [e, e]));
    deck.forEach((value) => ui.board.appendChild(createCardElement(value)));
  }

  function start() {
    // Отмена таймера несовпавшей пары — если был - больше не сработает
    if (state.mismatchTimerId !== null) {
      clearTimeout(state.mismatchTimerId);
      state.mismatchTimerId = null;
    }

    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.moves = 0;
    state.matchedPairs = 0;
    state.gameFinished = false;

    ui.movesLabel.textContent = "Ходы: 0";
    ui.pairsLabel.textContent = `Пары: 0 из ${TOTAL_PAIRS}`;

    renderBoard();
  }

  function onCardClick(card) {
    if (state.lockBoard) return;
    if (state.gameFinished) return;
    if (card.classList.contains("flipped")) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("flipped");

    if (!state.firstCard) {
      state.firstCard = card;
      return;
    }

    state.secondCard = card;
    state.moves++;
    ui.movesLabel.textContent = `Ходы: ${state.moves}`;

    if (state.firstCard.dataset.value === state.secondCard.dataset.value) {
      handleMatch();
    } else {
      handleMismatch();
    }
  }

  function handleMatch() {
    state.firstCard.classList.add("matched");
    state.secondCard.classList.add("matched");
    state.matchedPairs++;
    ui.pairsLabel.textContent = `Пары: ${state.matchedPairs} из ${TOTAL_PAIRS}`;

    state.firstCard = null;
    state.secondCard = null;

    if (state.matchedPairs === TOTAL_PAIRS) {
      state.gameFinished = true;
      saveResult(state.moves);
      modals.showVictory(state.moves);
    }
  }

  function handleMismatch() {
    state.lockBoard = true;

    state.mismatchTimerId = setTimeout(() => {
      if (state.firstCard) state.firstCard.classList.remove("flipped");
      if (state.secondCard) state.secondCard.classList.remove("flipped");

      state.mismatchTimerId = null;
      state.firstCard = null;
      state.secondCard = null;
      state.lockBoard = false;
    }, MISMATCH_DELAY);
  }

  // кнопка в хедере/кнопка в модалкt победы запускают одну и ту же функцию start()
  ui.newGameBtn.addEventListener("click", start);
  modals.setNewGameHandler(start);

  return { start };
}
