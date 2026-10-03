'use strict';

/* ============================================================
   1. КОНСТАНТЫ
   ============================================================ */

// 8 разных эмодзи → 8 пар → 16 карточек
const EMOJIS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸'];
const TOTAL_PAIRS = EMOJIS.length;

// Задержка перед закрытием несовпавшей пары (700–1500 мс по заданию)
const MISMATCH_DELAY = 1000;

// Ключ для localStorage
const STORAGE_KEY = 'memory-game-results';

// Сколько результатов храним
const TOP_LIMIT = 10;


/* ============================================================
   2. ХЕЛПЕР: создание элемента (обёртка над document.createElement)
   ============================================================ */

/**
 * Создаёт HTML-элемент.
 * @param {string} tag — имя тега
 * @param {string} [className] — классы через пробел
 * @param {string} [text] — текстовое содержимое
 */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}


/* ============================================================
   3. КОМПОНЕНТ МОДАЛЬНОГО ОКНА
   ============================================================ */

// Счётчик открытых модалок — чтобы правильно блокировать скролл
let openModalCount = 0;

function updateBodyScroll() {
    document.body.style.overflow = openModalCount > 0 ? 'hidden' : '';
}

class Modal {
    constructor() {
        this.isOpen = false;

        // Затемнённый фон
        this.overlay = el('div', 'modal-overlay');

        // Само окно
        this.modal = el('div', 'modal');

        // Контейнер для содержимого (меняется для каждого модального окна)
        this.content = el('div', 'modal-content');

        this.modal.appendChild(this.content);
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        // Закрытие кликом по фону (но не по содержимому)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    /**
     * Устанавливает содержимое модального окна.
     * @param {HTMLElement} node
     */
    setContent(node) {
        // Очищаем контейнер без innerHTML
        while (this.content.firstChild) {
            this.content.removeChild(this.content.firstChild);
        }
        this.content.appendChild(node);
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.overlay.classList.add('visible');
        openModalCount++;
        updateBodyScroll();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        openModalCount--;
        updateBodyScroll();
    }
}

// Два экземпляра одного и того же компонента
const victoryModal = new Modal();
const leadersModal = new Modal();


/* ============================================================
   4. СОСТОЯНИЕ ИГРЫ
   ============================================================ */

const state = {
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    moves: 0,
    matchedPairs: 0,
    mismatchTimerId: null,
    gameFinished: false,
};


/* ============================================================
   5. UI: СОЗДАНИЕ ИНТЕРФЕЙСА
   ============================================================ */

const ui = {};

function buildUI() {
    const app = el('div', 'app');

    // --- Хедер ---
    const header = el('header', 'header');
    const title = el('h1', 'title', 'Memory Game');

    const newGameBtn = el('button', 'btn btn-primary', 'Новая игра');
    newGameBtn.type = 'button';

    const leadersBtn = el('button', 'btn btn-secondary', 'Таблица лидеров');
    leadersBtn.type = 'button';

    header.appendChild(title);
    header.appendChild(newGameBtn);
    header.appendChild(leadersBtn);

    // --- Счётчики ---
    const stats = el('div', 'stats');
    const movesLabel = el('span', 'stat-moves', 'Ходы: 0');
    const pairsLabel = el('span', 'stat-pairs', `Пары: 0 из ${TOTAL_PAIRS}`);
    stats.appendChild(movesLabel);
    stats.appendChild(pairsLabel);

    // --- Игровое поле ---
    const board = el('div', 'board');

    app.appendChild(header);
    app.appendChild(stats);
    app.appendChild(board);
    document.body.appendChild(app);

    // Сохраняем ссылки
    ui.board = board;
    ui.movesLabel = movesLabel;
    ui.pairsLabel = pairsLabel;
    ui.newGameBtn = newGameBtn;
    ui.leadersBtn = leadersBtn;

    // Слушатели кнопок хедера
    ui.newGameBtn.addEventListener('click', startNewGame);
    ui.leadersBtn.addEventListener('click', showLeadersModal);
}


/* ============================================================
   6. УТИЛИТЫ
   ============================================================ */

/** Перемешивание массива (Fisher–Yates) */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/** Формат даты ДД.ММ.ГГГГ */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}


/* ============================================================
   7. ИГРОВОЕ ПОЛЕ
   ============================================================ */

/** Создаёт DOM-элемент одной карточки */
function createCardElement(value) {
    const card = el('div', 'card');
    card.dataset.value = value;

    const inner = el('div', 'card-inner');
    const back = el('div', 'card-face card-back', '?');
    const front = el('div', 'card-face card-front', value);

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener('click', () => onCardClick(card));
    return card;
}

/** Очищает поле и раскладывает новые карточки */
function renderBoard() {
    while (ui.board.firstChild) {
        ui.board.removeChild(ui.board.firstChild);
    }
    const deck = shuffle(EMOJIS.flatMap((e) => [e, e]));
    deck.forEach((value) => ui.board.appendChild(createCardElement(value)));
}


/* ============================================================
   8. ЛОГИКА ИГРЫ
   ============================================================ */

function startNewGame() {
    // 1. Отменяем таймер несовпавшей пары, если он есть
    if (state.mismatchTimerId !== null) {
        clearTimeout(state.mismatchTimerId);
        state.mismatchTimerId = null;
    }

    // 2. Сбрасываем состояние
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.moves = 0;
    state.matchedPairs = 0;
    state.gameFinished = false;

    // 3. Обновляем счётчики
    ui.movesLabel.textContent = 'Ходы: 0';
    ui.pairsLabel.textContent = `Пары: 0 из ${TOTAL_PAIRS}`;

    // 4. Пересобираем поле
    renderBoard();

    // 5. Закрываем модалку победы, если открыта
    victoryModal.close();
}

function onCardClick(card) {
    // Игнорируем клики, если:
    if (state.lockBoard) return;
    if (state.gameFinished) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    // Открываем карточку
    card.classList.add('flipped');

    // Первая карточка — просто запоминаем
    if (!state.firstCard) {
        state.firstCard = card;
        return;
    }

    // Вторая карточка — считаем ход
    state.secondCard = card;
    state.moves++;
    ui.movesLabel.textContent = `Ходы: ${state.moves}`;

    checkMatch();
}

function checkMatch() {
    const isMatch = state.firstCard.dataset.value === state.secondCard.dataset.value;
    if (isMatch) {
        handleMatch();
    } else {
        handleMismatch();
    }
}

function handleMatch() {
    state.firstCard.classList.add('matched');
    state.secondCard.classList.add('matched');
    state.matchedPairs++;
    ui.pairsLabel.textContent = `Пары: ${state.matchedPairs} из ${TOTAL_PAIRS}`;

    resetSelection();

    if (state.matchedPairs === TOTAL_PAIRS) {
        finishGame();
    }
}

function handleMismatch() {
    // Блокируем поле, пока пара открыта
    state.lockBoard = true;

    state.mismatchTimerId = setTimeout(() => {
        // Карточки могли быть удалены новой игрой — проверяем
        if (state.firstCard) state.firstCard.classList.remove('flipped');
        if (state.secondCard) state.secondCard.classList.remove('flipped');

        state.mismatchTimerId = null;
        resetSelection();
    }, MISMATCH_DELAY);
}

function resetSelection() {
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
}

function finishGame() {
    state.gameFinished = true;
    saveResult(state.moves);
    showVictoryModal(state.moves);
}


/* ============================================================
   9. РЕЗУЛЬТАТЫ И localStorage
   ============================================================ */

function loadResults() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveResult(moves) {
    const now = new Date();
    const record = {
        moves: moves,
        date: formatDate(now),
        timestamp: now.getTime(),
    };

    const results = loadResults();
    results.push(record);

    // Сортировка: меньше ходов — выше; при равенстве — раньше сыгранная выше
    results.sort((a, b) => a.moves - b.moves || a.timestamp - b.timestamp);

    // Оставляем только TOP_LIMIT лучших
    const top = results.slice(0, TOP_LIMIT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
}


/* ============================================================
   10. МОДАЛКА ПОБЕДЫ
   ============================================================ */

function showVictoryModal(moves) {
    const wrap = el('div', 'modal-inner');
    wrap.appendChild(el('h2', 'modal-title', '🎉 Победа!'));
    wrap.appendChild(
        el('p', 'modal-text', `Вы нашли все пары за ${moves} ходов.`)
    );

    const buttons = el('div', 'modal-buttons');

    const newGameBtn = el('button', 'btn btn-primary', 'Новая игра');
    newGameBtn.type = 'button';
    newGameBtn.addEventListener('click', () => {
        victoryModal.close();
        startNewGame();
    });

    const closeBtn = el('button', 'btn btn-secondary', 'Закрыть');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => victoryModal.close());

    buttons.appendChild(newGameBtn);
    buttons.appendChild(closeBtn);
    wrap.appendChild(buttons);

    victoryModal.setContent(wrap);
    victoryModal.open();
}


/* ============================================================
   11. МОДАЛКА ТАБЛИЦЫ ЛИДЕРОВ
   ============================================================ */

function showLeadersModal() {
    const wrap = el('div', 'modal-inner');
    wrap.appendChild(el('h2', 'modal-title', 'Таблица лидеров'));

    const results = loadResults();

    if (results.length === 0) {
        wrap.appendChild(el('p', 'modal-text', 'Пока нет результатов'));
    } else {
        const table = el('table', 'leaders-table');

        // Заголовок
        const thead = el('thead');
        const headRow = el('tr');
        headRow.appendChild(el('th', '', 'Место'));
        headRow.appendChild(el('th', '', 'Ходы'));
        headRow.appendChild(el('th', '', 'Дата'));
        thead.appendChild(headRow);
        table.appendChild(thead);

        // Тело
        const tbody = el('tbody');
        results.forEach((item, index) => {
            const row = el('tr');
            row.appendChild(el('td', '', String(index + 1)));
            row.appendChild(el('td', '', String(item.moves)));
            row.appendChild(el('td', '', item.date));
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        wrap.appendChild(table);
    }

    const buttons = el('div', 'modal-buttons');
    const closeBtn = el('button', 'btn btn-secondary', 'Закрыть');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => leadersModal.close());
    buttons.appendChild(closeBtn);
    wrap.appendChild(buttons);

    leadersModal.setContent(wrap);
    leadersModal.open();
}


/* ============================================================
   12. ЗАПУСК
   ============================================================ */

buildUI();
startNewGame();