import { el } from './utils.js';
import { TOTAL_PAIRS } from './constants.js';

export function buildUI() {
    const app = el('div', 'app');

    // --- Хедер ---
    const header = el('header', 'header');
    const title = el('h1', 'title', 'Memory Game');

    const newGameBtn = el('button', 'btn btn-primary', 'Новая игра');
    newGameBtn.type = 'button';

    const leadersBtn = el('button', 'btn btn-secondary', 'Таблица лидеров');
    leadersBtn.type = 'button';

    header.append(title, newGameBtn, leadersBtn);

    // --- Счётчики ---
    const stats = el('div', 'stats');
    const movesLabel = el('span', 'stat-moves', 'Ходы: 0');
    const pairsLabel = el('span', 'stat-pairs', `Пары: 0 из ${TOTAL_PAIRS}`);
    stats.append(movesLabel, pairsLabel);

    // --- Поле ---
    const board = el('div', 'board');

    app.append(header, stats, board);
    document.body.appendChild(app);

    return { board, movesLabel, pairsLabel, newGameBtn, leadersBtn };
}