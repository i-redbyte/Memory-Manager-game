const STORE = "memory-manager-v2";


export const defaults = {
    mode: "timed",
    timerMs: 7000,
    strategy: "manual", // manual | first | best | worst
};


export const state = {
    settings: { ...defaults },
    best: 0,
    devDayClaimed: false,
};


export function dayOfYear(d){ const s=new Date(d.getFullYear(),0,0); return Math.floor((d-s)/86400000); }
export const isProgrammersDay = dayOfYear(new Date()) === 256;


export function loadPersisted(){
    try{
        const raw = localStorage.getItem(STORE);
        if(raw){
            const o = JSON.parse(raw);
            state.best = o.best || 0;
            state.devDayClaimed = !!o.devDayClaimed;
        }
    }catch{}
}
export function savePersisted(){
    localStorage.setItem(STORE, JSON.stringify({ best: state.best, devDayClaimed: state.devDayClaimed }));
}


export function applySettings(s){
    state.settings = { ...defaults, ...s };
}