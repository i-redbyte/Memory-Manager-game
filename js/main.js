import { initMenu } from "./scenes/menu.js";
import { startGameWithSettings } from "./scenes/game.js";
import { loadPersisted } from "./core/state.js";


window.addEventListener("DOMContentLoaded", () => {
    loadPersisted();
    initMenu((settings) => {
        startGameWithSettings(settings);
    });
});