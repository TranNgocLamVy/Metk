


export class GeometryUtils {
    /**
     * Calculate line between two points or coordinates using Bresenham's algorithm
     * @param start Coordinate or Point2D
     * @param end Coordinate or Point2D
     * @returns Point2D[] or Coordinate[]
     */
    public static calculateLine(start: Point2D, end: Point2D): Point2D[];
    public static calculateLine(start: Coordinate, end: Coordinate): Coordinate[];
    public static calculateLine(start: Coordinate | Point2D, end: Coordinate | Point2D): Coordinate[] | Point2D[] {
        const isPosition = 'x' in start;

        let x0 = isPosition ? (start as Point2D).x : (start as Coordinate).col;
        let y0 = isPosition ? (start as Point2D).y : (start as Coordinate).row;

        const x1 = 'x' in end ? end.x : end.col;
        const y1 = 'y' in end ? end.y : end.row;

        const results: any[] = [];

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (isPosition) {
                results.push({ x: x0, y: y0 });
            } else {
                results.push({ col: x0, row: y0 });
            }

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return results;
    }
}