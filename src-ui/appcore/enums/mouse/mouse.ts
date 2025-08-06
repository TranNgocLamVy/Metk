
export const MOUSEDOWN = {
    LEFT: 0,
    RIGHT: 1,
    MIDDLE: 2
}
export type MouseDown = typeof MOUSEDOWN[keyof typeof MOUSEDOWN];