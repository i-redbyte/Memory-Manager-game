import { holes } from "./memory.js";


export function chooseHole(size, alg){
    const hs = holes();
    if(alg==="first") return hs.find(h=>h.size>=size) || null;
    if(alg==="best") return hs.filter(h=>h.size>=size).sort((a,b)=>a.size-b.size)[0] || null;
    if(alg==="worst") return hs.filter(h=>h.size>=size).sort((a,b)=>b.size-a.size)[0] || null;
    return null;
}