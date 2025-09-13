let animId = null;
let ctx = null;
let cols = 0;
let drops = [];
let canvasRef = null;

function resizeCanvas(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const {clientWidth: w, clientHeight: h} = canvas;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const fontSize = 16 * dpr;
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    cols = Math.floor(canvas.width / (fontSize * 0.75));
    drops = Array(cols).fill(0).map(() => Math.floor(Math.random() * (-50)));
}

function step() {
    if (!ctx || !canvasRef) return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

    const ch = Math.random() < 0.5 ? "0" : "1";
    ctx.fillStyle = "#86efac";
    const fontSize = parseInt(ctx.font, 10);
    for (let i = 0; i < cols; i++) {
        const x = i * (fontSize * 0.75);
        const y = drops[i] * fontSize;
        ctx.fillText(ch, x, y);
        if (y > canvasRef.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
    animId = window.requestAnimationFrame(step);
}

function startMatrix(canvas) {
    canvasRef = canvas;
    ctx = canvas.getContext("2d");
    resizeCanvas(canvas);
    window.addEventListener("resize", onResize, {passive: true});
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    step();
}

function stopMatrix() {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    window.removeEventListener("resize", onResize);
    ctx = null;
    cols = 0;
    drops = [];
    canvasRef = null;
}

function onResize() {
    if (canvasRef) {
        resizeCanvas(canvasRef);
    }
}

export function showGameOver(score, best, onOk) {
    const overlay = document.getElementById("gameOver");
    const canvas = document.getElementById("matrixCanvas");
    const goScore = document.getElementById("goScore");
    const goBest = document.getElementById("goBest");
    const btn = document.getElementById("goOk");

    goScore.textContent = String(score);
    goBest.textContent = String(best);

    overlay.hidden = false;
    startMatrix(canvas);

    const handler = () => {
        btn.removeEventListener("click", handler);
        stopMatrix();
        overlay.hidden = true;
        if (typeof onOk === "function") onOk();
    };
    btn.addEventListener("click", handler);
}
