import {MEM, pct, idName} from "../core/utils.js";
import {holes, fragmentation, totalFree} from "../core/memory.js";

const $ = (id) => document.getElementById(id);

export const els = {
    root: $("gameRoot"), mem: $("mem"), tbar: $("tbar"), timerWrap: $("timerWrap"),
    score: $("score"), best: $("best"), frag: $("frag"), free: $("free"),
    reqLabel: $("reqLabel"), q1: $("q1"), q2: $("q2"), q3: $("q3"),
    status: $("status"), hint: $("hint"), hearts: $("hearts"), badges: $("badges"),
    devday: $("devday"),
    btn: {defrag: $("defrag"), pause: $("pause"), restart: $("restart"), next: $("nextReq")},
    controls: {strategy: $("strategy"), speed: $("speed"), speedVal: $("speedVal")},
};

export function showGame() {
    els.root.hidden = false;
}

export function hideGame() {
    els.root.hidden = true;
}

export function renderHearts(lives) {
    els.hearts.innerHTML = "";
    if (lives <= 0) return;
    for (let i = 0; i < lives; i++) {
        const h = document.createElement("span");
        h.className = "heart";
        els.hearts.appendChild(h);
    }
}

export function updateHUD(score, best) {
    els.score.textContent = String(score);
    els.best.textContent = String(best);
    const fr = fragmentation();
    els.frag.textContent = Math.round(fr * 100) + "%";
    els.free.textContent = String(totalFree());
}

export function setReqLabels(cur, q) {
    const label = (r) => !r ? "—" : (r.kind === 'malloc' ? `malloc(${r.size})` : `free(${r.name})`);
    els.reqLabel.textContent = label(cur);
    els.q1.textContent = label(q[0]);
    els.q2.textContent = label(q[1]);
    els.q3.textContent = label(q[2]);
}

export function setStatus(txt) {
    els.status.textContent = txt;
}

export function setStatusHTML(html) {
    els.status.innerHTML = html;
}

export function setHint(txt) {
    els.hint.textContent = txt || "";
}

export function renderMemory(blocks, current, strategy, onManualPlace) {
    const memEl = els.mem;
    memEl.innerHTML = "";
    for (let i = 1; i < 16; i++) {
        const tk = document.createElement('div');
        tk.className = 'tick';
        tk.style.left = (i * 100 / 16) + '%';
        memEl.appendChild(tk);
    }
    if (current && current.kind === 'malloc' && strategy === 'manual') {
        for (const h of holes()) {
            const div = document.createElement('div');
            div.className = 'hole';
            div.style.left = pct(h.start) + '%';
            div.style.width = pct(h.size) + '%';
            div.textContent = h.size;
            if (h.size < current.size) {
                div.classList.add('bad');
            } else {
                div.addEventListener('click', () => onManualPlace(h));
            }
            memEl.appendChild(div);
        }
    }
    for (const b of blocks) {
        const div = document.createElement('div');
        div.className = 'block';
        div.style.left = pct(b.start) + '%';
        div.style.width = pct(b.size) + '%';
        div.innerHTML = `<span class="label">${idName(b.id)}·${b.size}</span>`;
        memEl.appendChild(div);
    }
}

export function startBar(durationMs) {
    const tbar = els.tbar;
    tbar.style.transition = 'none';
    tbar.style.transform = 'scaleX(1)';
    requestAnimationFrame(() => {
        tbar.style.transition = `transform ${durationMs}ms linear`;
        tbar.style.transform = 'scaleX(0)';
    });
}

export function stopBar() {
    const tbar = els.tbar;
    tbar.style.transition = 'none';
    tbar.style.transform = 'scaleX(0)';
}

export function showTimer(show) {
    els.timerWrap.style.display = show ? '' : 'none';
}

export function addBadge(text, green = false) {
    const el = document.createElement('span');
    el.className = 'badge' + (green ? ' green' : '');
    el.textContent = text;
    els.badges.prepend(el);
    setTimeout(() => el.remove(), 8000);
}

export function confetti01() {
    const chars = ['0', '1'];
    const N = 80;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < N; i++) {
        const s = document.createElement('span');
        s.className = 'confetti';
        s.textContent = chars[(Math.random() * chars.length) | 0];
        const x = Math.random() * W;
        const rot = (Math.random() * 360) | 0;
        const size = 12 + Math.random() * 14;
        s.style.left = x + 'px';
        s.style.fontSize = size + 'px';
        s.style.transform = `translateY(-10px) rotate(${rot}deg)`;
        document.body.appendChild(s);
        const d = 900 + Math.random() * 1100;
        const dx = (Math.random() * 2 - 1) * 140;
        const finalY = H + 40;
        s.animate([{
            transform: `translate(${0}px,-10px) rotate(${rot}deg)`,
            opacity: 1
        }, {transform: `translate(${dx}px, ${finalY}px) rotate(${rot + 180}deg)`, opacity: 0.8}], {
            duration: d,
            easing: 'cubic-bezier(.2,.8,.2,1)'
        }).onfinish = () => s.remove();
    }
}
