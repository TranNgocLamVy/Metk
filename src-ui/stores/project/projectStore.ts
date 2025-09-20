import { create } from "zustand";

import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { ProjectData } from "@/appcore/schemas/projectSchema";

type ProjectState = {
    currentProject: ProjectData | null;
    tilemaps: DefaultTilemap[];
    tilesets: DefaultTileset[];

    setTilemaps: (tilemaps: DefaultTilemap[]) => void;
    setTilesets: (tilesets: DefaultTileset[]) => void;
    addTilemap: (tilemap: DefaultTilemap) => void;
    addTileset: (tileset: DefaultTileset) => void;
    removeTilemap: (tilemap: DefaultTilemap) => void;
    removeTileset: (tileset: DefaultTileset) => void;
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
        addTilemap: (tilemap: DefaultTilemap) => {
            set((state) => {
                const tilemaps = [...state.tilemaps, tilemap];
                return { tilemaps };
            })
        },
        addTileset: (tileset: DefaultTileset) => {
            set((state) => {
                const tilesets = [...state.tilesets, tileset];
                return { tilesets };
            })
        },
        removeTilemap: (tilemap: DefaultTilemap) => {
            set((state) => {
                const tilemaps = state.tilemaps.filter((t) => t.id !== tilemap.id);
                return { tilemaps };
            })
        },
        removeTileset: (tileset: DefaultTileset) => {
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