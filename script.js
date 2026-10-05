import { buildUI } from "./js/ui.js";
import { createModals } from "./js/modals.js";
import { createGame } from "./js/game.js";

//build interface
const ui = buildUI();

//create modal windows
const modals = createModals();

const game = createGame({ ui, modals });

//modalopen
ui.leadersBtn.addEventListener("click", () => modals.showLeaders());

game.start();
