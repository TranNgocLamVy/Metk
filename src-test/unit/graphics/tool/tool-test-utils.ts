import { vi } from "vitest";

import { IDrawStrategy, DrawPayload } from "@/graphics/strategies/draw-strategy.interface";
import { EditorFacade } from "@/application/editor.facade";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";

import { createTilemap } from "../../application/commands/layer/layer-command-test-utils";

type Handler = (event: any) => void;

export const createSprite = () => ({
    destroyed: false,
    alpha: 1,
    width: 0,
    height: 0,
    tint: null,
    position: {
        x: 0,
        y: 0,
        set(x: number, y: number) {
            this.x = x;
            this.y = y;
        },
    },
    destroy: vi.fn(function (this: any) {
        this.destroyed = true;
    }),
});

export const createViewport = () => {
    const handlers = new Map<string, Handler[]>();
    const addHandler = vi.fn((eventName: string, handler: Handler) => {
        handlers.set(eventName, [...(handlers.get(eventName) ?? []), handler]);
    });
    const removeHandler = vi.fn((eventName: string, handler: Handler) => {
        handlers.set(eventName, (handlers.get(eventName) ?? []).filter((item) => item !== handler));
    });
    const wheelPlugin = {
        wheel: vi.fn(() => true),
    };

    return {
        handlers,
        wheelPlugin,
        on: addHandler,
        off: removeHandler,
        addEventListener: addHandler,
        removeEventListener: removeHandler,
        toLocal: vi.fn((point: Position) => ({ x: point.x, y: point.y })),
        plugins: {
            get: vi.fn((name: string) => name === "wheel" ? wheelPlugin : null),
        },
        emitPointer(eventName: string, event: Partial<any>) {
            for (const handler of handlers.get(eventName) ?? []) {
                handler({
                    button: 0,
                    shiftKey: false,
                    ctrlKey: false,
                    deltaY: 0,
                    global: { x: 0, y: 0 },
                    ...event,
                });
            }
        },
    };
};

export const createOverlayContainer = () => ({
    children: [] as any[],
    addChild: vi.fn(function (this: any, child: any) {
        this.children.push(child);
        return child;
    }),
});

export const createEditorHarness = () => {
    const tilemap = createTilemap();
    const objectRegistry = new EditorObjectRegistry();
    objectRegistry.registerTree(tilemap);
    const historyManager = {
        startTransaction: vi.fn(),
        execute: vi.fn((command: any, editorFacade: EditorFacade) => command.execute(editorFacade)),
        commitTransaction: vi.fn(),
        pushToUndoStack: vi.fn(),
    };
    const session = {
        tilemap,
        layerState: { selectedLayers: ["tile-root"] },
        markAsDirty: vi.fn(),
        markLayerChange: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    };
    const tilemapSessionManager = {
        getSessionByTilemapId: vi.fn((tilemapId: string) => tilemapId === tilemap.id ? session : null),
    };
    const editorFacade = {
        getActiveTilemapSession: vi.fn(() => session),
        getCurrentHistoryManager: vi.fn(() => historyManager),
        objectRegistry,
        currentWorkspace: { tilemapSessionManager },
    } as unknown as EditorFacade;

    return { tilemap, session, historyManager, editorFacade };
};

export const createViewHarness = (session: any) => {
    const viewport = createViewport();
    const overlayerContainer = createOverlayContainer();
    const view = {
        viewport,
        overlayerContainer,
        session,
    };

    return { view, viewport, overlayerContainer };
};

export const createTileLayerRenderer = (layer: TileLayer, tilemap: ReturnType<typeof createTilemap>) => ({
    layer,
    tilemap,
    width: 4,
    height: 4,
    posToCoord: vi.fn((pos: Position) => ({
        col: Math.floor(pos.x / 16),
        row: Math.floor(pos.y / 16),
    })),
    coordToPos: vi.fn((coordinate: Coordinate) => ({
        x: coordinate.col * 16,
        y: coordinate.row * 16,
    })),
});

export const createPayload = (coordinate: Coordinate): DrawPayload => ({
    key: `${coordinate.col},${coordinate.row}`,
    coordinate,
    position: { x: coordinate.col * 16, y: coordinate.row * 16 },
    sprite: createSprite() as any,
    tileId: coordinate.col + coordinate.row * 4 + 1,
    tilesetId: "tileset-a",
});

export const createDrawStrategy = (overrides: Partial<IDrawStrategy> = {}): IDrawStrategy => ({
    canHandle: vi.fn(() => true),
    getBrushSize: vi.fn(() => ({ width: 1, height: 1 })),
    comparePosition: vi.fn((first: Position, second: Position, layerRenderer: any) => {
        if (!first || !second) return false;
        const firstCoordinate = layerRenderer.posToCoord(first);
        const secondCoordinate = layerRenderer.posToCoord(second);
        return firstCoordinate.col === secondCoordinate.col && firstCoordinate.row === secondCoordinate.row;
    }),
    getRefAt: vi.fn(() => null),
    drawHoverPreview: vi.fn((_pos, _layer, _editor, _session, overlay) => {
        const sprite = createSprite() as any;
        overlay.addChild(sprite);
        return [sprite];
    }),
    getPayload: vi.fn((pos: Position, layerRenderer: any) => {
        const coordinate = layerRenderer.posToCoord(pos);
        return [createPayload(coordinate)];
    }),
    commit: vi.fn(),
    ...overrides,
});

export const pointer = (col: number, row: number, overrides: Partial<any> = {}) => ({
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    global: {
        x: col * 16,
        y: row * 16,
    },
    ...overrides,
});
