interface Window {
  webkitAudioContext?: typeof AudioContext
}

interface CanvasRenderingContext2D {
  roundRect?(x: number, y: number, w: number, h: number, radii?: number | number[]): void
}
