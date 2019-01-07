
export function wordToHex(w: number): string { return (w >>> 0 & 0xFFFF).toString(16).padStart(4,"0") }
