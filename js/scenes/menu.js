import {applySettings, state} from "../core/state.js";

function $(id) {
    return document.getElementById(id);
}

export function initMenu(onStart) {
    const menu = $("menu");
    const game = $("gameRoot");
    const timerRow = $("timerRow");
    const startBtn = $("startBtn");
    const timerSec = $("timerSec");
    const menuStrategy = $("menuStrategy");

    function getMode() {
        const radios = menu.querySelectorAll('input[name="mode"]');
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) return radios[i].value;
        }
        return "timed";
    }

    const initMode = getMode();
    timerRow.style.display = (initMode === "timed") ? "" : "none";

    menu.addEventListener("change", function (e) {
        if (e && e.target && e.target.name === "mode") {
            const mode = e.target.value;
            timerRow.style.display = (mode === "timed") ? "" : "none";
        }
    });

    startBtn.addEventListener("click", function () {
        const mode = getMode();
        let sec = parseInt(timerSec.value, 10);
        if (isNaN(sec)) sec = 7;
        if (sec < 3) sec = 3;
        if (sec > 20) sec = 20;
        const timerMs = sec * 1000;
        const strategy = menuStrategy.value;

        applySettings({mode: mode, timerMs: timerMs, strategy: strategy});

        menu.hidden = true;
        menu.style.display = "none";
        game.hidden = false;

        const settingsCopy = {
            mode: state.settings.mode,
            timerMs: state.settings.timerMs,
            strategy: state.settings.strategy
        };
        onStart(settingsCopy);
    });
}
