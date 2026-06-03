import { EditorFacade } from "@/application/editor.facade";
import { Tile } from "@/editor/model/tileset/tileset";

export type SelectedRule = {
    id: string;
    color: string;
};

export type SelectedTile = {
    tileId: number;
    tilesetId: string;
};

export const coordinateKey = (coord: Coordinate): string => `${coord.col},${coord.row}`;

export const sameCoordinate = (first: Coordinate, second: Coordinate): boolean => {
    return first.col === second.col && first.row === second.row;
};

export const isSameTileRef = (
    first: { tileId: number | null; tilesetId: string | null } | null,
    second: { tileId: number | null; tilesetId: string | null } | null,
): boolean => {
    return (first?.tileId ?? null) === (second?.tileId ?? null)
        && (first?.tilesetId ?? null) === (second?.tilesetId ?? null);
};

export const isSameRuleRef = (
    first: { rulesetId: string | null } | null,
    secondRulesetId: string | null,
): boolean => {
    return (first?.rulesetId ?? null) === secondRulesetId;
};

export const getRectangleCoordinates = (
    start: Coordinate,
    end: Coordinate,
    isSquare: boolean,
): Coordinate[] => {
    let minCol = Math.min(start.col, end.col);
    let maxCol = Math.max(start.col, end.col);
    let minRow = Math.min(start.row, end.row);
    let maxRow = Math.max(start.row, end.row);

    if (isSquare) {
        const deltaCol = end.col - start.col;
        const deltaRow = end.row - start.row;
        const size = Math.max(Math.abs(deltaCol), Math.abs(deltaRow));
        const squareEnd = {
            col: start.col + (deltaCol >= 0 ? size : -size),
            row: start.row + (deltaRow >= 0 ? size : -size),
        };

        minCol = Math.min(start.col, squareEnd.col);
        maxCol = Math.max(start.col, squareEnd.col);
        minRow = Math.min(start.row, squareEnd.row);
        maxRow = Math.max(start.row, squareEnd.row);
    }

    const coordinates: Coordinate[] = [];
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            coordinates.push({ col, row });
        }
    }

    return coordinates;
};

export const getSelectedTiles = (editorFacade: EditorFacade): (Tile | null)[][] | null => {
    const session = editorFacade.getActiveTilesetSession();
    if (!session || session.selectionState.selectedTilesSet.length === 0) return null;

    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    session.selectionState.selectedTilesSet.forEach((tileId) => {
        const coordinate = session.tileset.getCoordinatesFromTile(tileId);
        if (!coordinate) return;
        minRow = Math.min(minRow, coordinate.row);
        maxRow = Math.max(maxRow, coordinate.row);
        minCol = Math.min(minCol, coordinate.col);
        maxCol = Math.max(maxCol, coordinate.col);
    });

    if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) return null;

    const rows: (Tile | null)[][] = [];
    for (let row = minRow; row <= maxRow; row++) {
        const rowTiles: (Tile | null)[] = [];
        for (let col = minCol; col <= maxCol; col++) {
            const tile = session.tileset.getTileFromCoordinates(row, col);
            rowTiles.push(tile && session.selectionState.selectedTilesSet.includes(tile.id) ? tile : null);
        }
        rows.push(rowTiles);
    }

    return rows;
};

export const getPrimarySelectedTile = (editorFacade: EditorFacade): SelectedTile | null => {
    const selectedTiles = getSelectedTiles(editorFacade);
    if (!selectedTiles) return null;

    for (const row of selectedTiles) {
        for (const tile of row) {
            if (tile) return { tileId: tile.id, tilesetId: tile.tileset.id };
        }
    }

    return null;
};

export const getSelectedRule = (editorFacade: EditorFacade): SelectedRule | null => {
    const selectedRuleId = editorFacade.currentWorkspace?.rulesetSessionManager.getSelectedRuleId();
    if (!selectedRuleId) return null;
    return editorFacade.currentProject?.rulesetManager.getRulesetById(selectedRuleId) ?? null;
};

