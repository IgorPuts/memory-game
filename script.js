import { buildUI } from "./js/ui.js";
import { createModals } from "./js/modals.js";
import { createGame } from "./js/game.js";

// 1. Собираем интерфейс
const ui = buildUI();

// 2. Создаём модальные окна
const modals = createModals();

// 3. Создаём игру, передавая ей ссылки на UI и модалки
const game = createGame({ ui, modals });

// 4. Кнопка «Таблица лидеров» просто открывает модалку
ui.leadersBtn.addEventListener("click", () => modals.showLeaders());

// 5. Старт первой игры
game.start();
