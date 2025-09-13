import {state, savePersisted, isProgrammersDay} from "../core/state.js";
import {randInt, idName, colorFor} from "../core/utils.js";
import {memState, resetMemory, holes, placeAt, freeId, defrag as doDefrag, fragmentation} from "../core/memory.js";
import {chooseHole} from "../core/allocator.js";
import {
    els,
    showGame,
    renderHearts,
    updateHUD,
    renderMemory,
    setReqLabels,
    setStatus,
    setHint,
    startBar,
    stopBar,
    showTimer,
    addBadge,
    confetti01
} from "../ui/render.js";
import {showGameOver} from "../ui/gameover.js";

let lives = 3, score = 0, current = null, queue = [], timer = null, startMs = 0;
let stalls = 0;
const STALL_LIMIT = 5;

function reqText(r) {
    return !r ? "—" : (r.kind === 'malloc' ? `malloc(${r.size})` : `free(${r.name})`);
}

function genSize() {
    const r = Math.random();
    if (r < 0.55) return randInt(4, 16);
    if (r < 0.85) return randInt(17, 32);
    return randInt(33, 48);
}

function nextId() {
    return memState.lastId++;
}

function makeRequest() {
    const roll = Math.random();
    if (memState.aliveIds.length === 0 || roll < 0.65) {
        const id = nextId();
        const size = genSize();
        return {kind: 'malloc', id, name: idName(id), size, color: colorFor(id)};
    }
    const pool = memState.aliveIds;
    const pick = pool[(Math.random() * pool.length) | 0];
    return {kind: 'free', id: pick, name: idName(pick)};
}

function fillQueue() {
    while (queue.length < 3) queue.push(makeRequest());
}

function popRequest() {
    if (queue.length === 0) fillQueue();
    const cur = queue.shift();
    fillQueue();
    return cur;
}

function onAllocSuccess(req, auto = false) {
    stalls = 0;
    score += req.size + Math.max(0, 20 - Math.round(fragmentation() * 100) / 5);
    addBadge(`${auto ? 'AUTO ' : ''}ALLOC ${req.name}[${req.size}]`);
    updateHUD(score, state.best);
}

function tryAutoPlace(req) {
    const h = chooseHole(req.size, els.controls.strategy.value);
    if (!h) return false;
    return placeAt(h, req.size, req.id, req.color);
}

function onTimeout() {
    if (!current) return;
    if (current.kind === 'malloc') {
        const ok = tryAutoPlace(current);
        if (ok) {
            onAllocSuccess(current, true);
            next();
        } else {
            loseLife('OOM: нет подходящего окна. Используйте Defrag!');
            next();
        }
    }
}

function startTimer() {
    const dur = state.settings.timerMs / parseFloat(els.controls.speed.value);
    startMs = performance.now();
    clearTimeout(timer);
    timer = setTimeout(onTimeout, dur);
    startBar(dur);
}

function next() {
    clearTimeout(timer);
    timer = null;
    if (state.settings.mode === 'timed') stopBar();
    current = popRequest();
    setReqLabels(current, queue);
    if (!current) return;
    if (current.kind === 'free') {
        const s = freeId(current.id);
        if (s > 0) {
            addBadge(`FREE ${current.name}[${s}]`);
        } else {
            addBadge(`FREE ${current.name} (не найден)`);
        }
        renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
        updateHUD(score, state.best);
        setTimeout(() => next(), 300 / parseFloat(els.controls.speed.value));
        return;
    }
    setStatus(`Запрос ${reqText(current)} → ${els.controls.strategy.value === 'manual' ? 'кликните по свободному окну' : els.controls.strategy.options[els.controls.strategy.selectedIndex].text}`);
    renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
    if (state.settings.mode === 'timed') startTimer();
    else {
        if (els.controls.strategy.value !== 'manual') {
            if (tryAutoPlace(current)) {
                onAllocSuccess(current, true);
                renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
                updateHUD(score, state.best);
                setTimeout(() => next(), 200);
            } else {
                setHint(`Нет подходящего окна. Попробуйте Defrag или дождитесь free. Пропуски: ${stalls}/${STALL_LIMIT}. Кнопка «Далее» засчитает пропуск.`);
            }
        } else {
            setHint(`Клик по подходящему окну — разместить. «Далее» засчитает пропуск (${stalls}/${STALL_LIMIT}).`);
        }
    }
}

function onManualPlace(hole) {
    if (!current || current.kind !== 'malloc') return;
    if (hole.size < current.size) return;
    if (placeAt(hole, current.size, current.id, current.color)) {
        onAllocSuccess(current, false);
        renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
        updateHUD(score, state.best);
        next();
    }
}

function loseLife(msg) {
    if (state.settings.mode !== 'timed') {
        setHint(msg);
        return;
    }
    lives--;
    setStatus(`⛔ ${msg}`);
    renderHearts(lives);
    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    clearTimeout(timer);
    timer = null;
    stopBar();
    if (score > state.best) {
        state.best = score;
        savePersisted();
    }
    els.best.textContent = String(state.best);

    showGameOver(score, state.best, () => {
        document.getElementById('menu').hidden = false;
        document.getElementById('menu').style.display = '';
        document.getElementById('gameRoot').hidden = true;
    });
}

function doDefragAndReward() {
    const moved = doDefrag();
    renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
    const fr = fragmentation();
    if (fr === 0 && moved) {
        addBadge('FULL DEFRAG +256', true);
        score += 128;
        stalls = 0;
        if (isProgrammersDay && !state.devDayClaimed) {
            score += 256;
            state.devDayClaimed = true;
            els.devday.style.display = 'none';
        }
        confetti01();
        updateHUD(score, state.best);
        savePersisted();
    } else if (moved) {
        addBadge('Compaction');
        stalls = 0;
    }
}

function wireUI() {
    els.btn.defrag.addEventListener('click', () => doDefragAndReward());
    els.btn.pause.addEventListener('click', () => {
        if (state.settings.mode !== 'timed') return;
        const running = !!timer;
        if (running) {
            clearTimeout(timer);
            timer = null;
            stopBar();
            els.btn.pause.textContent = 'Продолжить';
        } else {
            startTimer();
            els.btn.pause.textContent = 'Пауза';
        }
    });
    els.btn.restart.addEventListener('click', () => {
        clearTimeout(timer);
        timer = null;
        stopBar();
        document.getElementById('menu').hidden = false;
        document.getElementById('gameRoot').hidden = true;
    });
    els.btn.next.addEventListener('click', () => {
        if (state.settings.mode !== 'timed' && current && current.kind === 'malloc') {
            stalls++;
            setStatus(`Пропуск malloc: ${stalls}/${STALL_LIMIT}`);
            if (stalls >= STALL_LIMIT) {
                setStatus('⛔ Слишком много пропусков невыполненных запросов.');
                gameOver();
                return;
            }
        }
        next();
    });
    els.controls.strategy.addEventListener('change', () => {
        setStatus(els.controls.strategy.value === 'manual' ? 'Режим ручного размещения — клик по свободному окну.' : 'Автоматическая стратегия: размещение будет выполнено автоматически.');
        renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
    });
    els.controls.speed.addEventListener('input', () => {
        els.controls.speedVal.textContent = els.controls.speed.value + '×';
        if (timer) {
            const elapsed = performance.now() - startMs;
            const remain = Math.max(0, (state.settings.timerMs - elapsed));
            clearTimeout(timer);
            const dur = remain / parseFloat(els.controls.speed.value);
            const tbar = els.tbar;
            tbar.style.transition = 'none';
            const ratio = remain / state.settings.timerMs;
            tbar.style.transform = 'scaleX(' + ratio + ')';
            requestAnimationFrame(() => {
                tbar.style.transition = `transform ${dur}ms linear`;
                tbar.style.transform = 'scaleX(0)';
            });
            timer = setTimeout(onTimeout, dur);
        }
    });
}

function initHUD() {
    els.best.textContent = String(state.best);
    showTimer(state.settings.mode === 'timed');
    els.btn.pause.style.display = state.settings.mode === 'timed' ? '' : 'none';
    renderHearts(state.settings.mode === 'timed' ? lives : 0);
    if (isProgrammersDay && !state.devDayClaimed) els.devday.style.display = 'inline-flex';
    else els.devday.style.display = 'none';
}

export function startGameWithSettings(settings) {
    state.settings = settings;
    lives = 3;
    score = 0;
    current = null;
    queue = [];
    clearTimeout(timer);
    timer = null;
    startMs = 0;
    stalls = 0;
    resetMemory();
    showGame();
    wireUI();
    initHUD();
    for (let i = 0; i < 3; i++) queue.push(makeRequest());
    renderMemory(memState.blocks, current, els.controls.strategy.value, onManualPlace);
    updateHUD(score, state.best);
    setReqLabels(current, queue);
    setStatus('Готово. Обрабатывайте запросы и следите за фрагментацией.');
    setHint(`В «Без таймера» «Далее» засчитывает пропуск. Лимит: ${STALL_LIMIT}.`);
    next();
}
