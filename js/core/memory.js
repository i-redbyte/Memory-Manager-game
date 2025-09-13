import {MEM} from "./utils.js";


export const memState = {
    blocks: [], // {id,start,size,color}
    aliveIds: [],
    lastId: 0,
};


export function resetMemory() {
    memState.blocks = [];
    memState.aliveIds = [];
    memState.lastId = 0;
}


export function holes() {
    const hs = [];
    const blocks = [...memState.blocks].sort((a, b) => a.start - b.start);
    let pos = 0;
    for (const b of blocks) {
        if (b.start > pos) hs.push({start: pos, size: b.start - pos});
        pos = b.start + b.size;
    }
    if (pos < MEM) hs.push({start: pos, size: MEM - pos});
    return hs;
}

export const totalFree = () => MEM - memState.blocks.reduce((s, b) => s + b.size, 0);
export const largestHole = () => {
    const hs = holes();
    return hs.length ? Math.max(...hs.map(h => h.size)) : 0;
};
export const fragmentation = () => {
    const free = totalFree();
    if (free === 0) return 0;
    const maxH = largestHole();
    return 1 - (maxH / free);
};


export function placeAt(hole, size, id, color) {
    if (hole.size < size) return false;
    const block = {id, start: hole.start, size, color};
    memState.blocks.push(block);
    memState.blocks.sort((a, b) => a.start - b.start);
    memState.aliveIds.push(id);
    return true;
}

export function freeId(id) {
    const idx = memState.blocks.findIndex(b => b.id === id);
    if (idx >= 0) {
        const b = memState.blocks[idx];
        memState.blocks.splice(idx, 1);
        const aidx = memState.aliveIds.indexOf(id);
        if (aidx >= 0) memState.aliveIds.splice(aidx, 1);
        return b.size;
    }
    return 0;
}

export function defrag() {
    const blocks = [...memState.blocks].sort((a, b) => a.start - b.start);
    let pos = 0;
    let moved = false;
    for (const b of blocks) {
        if (b.start !== pos) {
            b.start = pos;
            moved = true;
        }
        pos += b.size;
    }
    memState.blocks = blocks;
    return moved;
}