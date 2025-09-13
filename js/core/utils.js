export const MEM = 256;
export const pct = (x) => (x * 100 / MEM);
export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

export function idName(n) {
    let s = "";
    n++;
    while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

export const colorFor = (seed) => `linear-gradient(135deg, hsl(${(seed * 47) % 360} 80% 50% / .92), hsl(${(seed * 47 + 25) % 360} 85% 45% / .92))`;