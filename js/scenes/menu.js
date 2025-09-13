import { applySettings, state } from "../core/state.js";

const $ = (id)=> document.getElementById(id);

export function initMenu(onStart){
    const menu = $("menu");
    const game = $("gameRoot");
    const timerRow = $("timerRow");
    const startBtn = $("startBtn");
    const timerSec = $("timerSec");
    const menuStrategy = $("menuStrategy");

    const initMode = [...menu.querySelectorAll('input[name="mode"]')].find(r=>r.checked)?.value || 'timed';
    timerRow.style.display = (initMode==='timed')? '' : 'none';

    menu.addEventListener('change', (e)=>{
        if(e.target.name==='mode'){
            const mode = e.target.value;
            timerRow.style.display = (mode==='timed')? '' : 'none';
        }
    });

    startBtn.addEventListener('click', ()=>{
        const mode = [...menu.querySelectorAll('input[name="mode"]')].find(r=>r.checked)?.value || 'timed';
        const timerMs = Math.max(3, Math.min(20, parseInt(timerSec.value,10)||7)) * 1000;
        const strategy = menuStrategy.value;

        applySettings({ mode, timerMs, strategy });

        menu.hidden = true;
        menu.style.display = 'none';
        game.hidden = false;

        onStart({ ...state.settings });
    });
}
