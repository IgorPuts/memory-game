import { Modal } from "./modal.js";
import { el } from "./utils.js";
import { loadResults } from "./storage.js";

export function createModals() {
  const victory = new Modal();
  const leaders = new Modal();

  // Сюда положит свой обработчик game.js — чтобы кнопка «Новая игра»
  // внутри модалки победы запускала ту же логику, что и в хедере.
  let onNewGame = null;

  function showVictory(moves) {
    const wrap = el("div", "modal-inner");
    wrap.appendChild(el("h2", "modal-title", "🎉 Победа!"));
    wrap.appendChild(
      el("p", "modal-text", `Вы нашли все пары за ${moves} ходов.`),
    );

    const buttons = el("div", "modal-buttons");

    const newGameBtn = el("button", "btn btn-primary", "Новая игра");
    newGameBtn.type = "button";
    newGameBtn.addEventListener("click", () => {
      victory.close();
      if (onNewGame) onNewGame();
    });

    const closeBtn = el("button", "btn btn-secondary", "Закрыть");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => victory.close());

    buttons.append(newGameBtn, closeBtn);
    wrap.appendChild(buttons);

    victory.setContent(wrap);
    victory.open();
  }

  function showLeaders() {
    const wrap = el("div", "modal-inner");
    wrap.appendChild(el("h2", "modal-title", "Таблица лидеров"));

    const results = loadResults();

    if (results.length === 0) {
      wrap.appendChild(el("p", "modal-text", "Пока нет результатов"));
    } else {
      const table = el("table", "leaders-table");

      const thead = el("thead");
      const headRow = el("tr");
      headRow.append(
        el("th", "", "Место"),
        el("th", "", "Ходы"),
        el("th", "", "Дата"),
      );
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = el("tbody");
      results.forEach((item, i) => {
        const row = el("tr");
        row.append(
          el("td", "", String(i + 1)),
          el("td", "", String(item.moves)),
          el("td", "", item.date),
        );
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
    }

    const buttons = el("div", "modal-buttons");
    const closeBtn = el("button", "btn btn-secondary", "Закрыть");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => leaders.close());
    buttons.appendChild(closeBtn);
    wrap.appendChild(buttons);

    leaders.setContent(wrap);
    leaders.open();
  }

  function setNewGameHandler(fn) {
    onNewGame = fn;
  }

  return { showVictory, showLeaders, setNewGameHandler };
}
