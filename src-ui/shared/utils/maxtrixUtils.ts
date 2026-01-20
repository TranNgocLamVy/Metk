export class MatrixUtils {
    public static ensureSize<T>(matrix: T[][], rows: number, cols: number, fillValue: T): T[][] {
        return Array.from({ length: rows }, (_, rowIndex) => {
            const existingRow = matrix[rowIndex] || [];
            return Array.from({ length: cols }, (_, colIndex) => {
                return colIndex < existingRow.length ? existingRow[colIndex] : fillValue;
            });
        });
    }

    public static ensureSizeWithFactory<T>(matrix: T[][], rows: number, cols: number, factory: () => T): T[][] {
        return Array.from({ length: rows }, (_, rowIndex) => {
            const existingRow = matrix[rowIndex] || [];
            return Array.from({ length: cols }, (_, colIndex) => {
                return colIndex < existingRow.length ? existingRow[colIndex] : factory();
            });
        });
    }
}