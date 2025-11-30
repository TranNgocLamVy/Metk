import { create } from "zustand";

import { Tilemap } from "@/core/domain/tilemap";
import { Tileset } from "@/core/domain/tileset";
import { ProjectData } from "@/core/schema/projectSchema";

type ProjectState = {
    currentProject: ProjectData | null;
    tilemaps: Tilemap[];
    tilesets: Tileset[];

    setTilemaps: (tilemaps: Tilemap[]) => void;
    setTilesets: (tilesets: Tileset[]) => void;
    addTilemap: (tilemap: Tilemap) => void;
    addTileset: (tileset: Tileset) => void;
    removeTilemap: (tilemap: Tilemap) => void;
    removeTileset: (tileset: Tileset) => void;
    setCurrentProject: (project: ProjectData | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
    return {
        currentProject: null,
        tilemaps: [],
        tilesets: [],

        setTilemaps: (tilemaps) => {
            set((state) => {
                return { tilemaps };
            })
        },
        setTilesets: (tilesets) => {
            set((state) => {
                return { tilesets };
            })
        },
        addTilemap: (tilemap: Tilemap) => {
            set((state) => {
                const tilemaps = [...state.tilemaps, tilemap];
                return { tilemaps };
            })
        },
        addTileset: (tileset: Tileset) => {
            set((state) => {
                const tilesets = [...state.tilesets, tileset];
                return { tilesets };
            })
        },
        removeTilemap: (tilemap: Tilemap) => {
            set((state) => {
                const tilemaps = state.tilemaps.filter((t) => t.id !== tilemap.id);
                return { tilemaps };
            })
        },
        removeTileset: (tileset: Tileset) => {
            set((state) => {
                const tilesets = state.tilesets.filter((t) => t.id !== tileset.id);
                return { tilesets };
            })
        },
        setCurrentProject: (project: ProjectData | null) => {
            set((state) => {
                return { currentProject: project };
            })
        },
    }
})