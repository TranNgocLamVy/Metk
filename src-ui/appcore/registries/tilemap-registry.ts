// import { Appcore } from "../core";
// import { ITilemap } from '@/appcore/interface/tile/ITilemap';

// export class TileMapRestry {
//     private tileMaps: Map<string, typeof ITilemap>;

//     public static getInstance(): TileMapRestry {
//         return Appcore.getInstance().pluginRegistry.tileMapRegistry;
//     }

//     public constructor() {
//         this.tileMaps = new Map();
//     }

//     public registerTileMap(name: string, tileMap: typeof BaseTilemap): void {
//         this.tileMaps.set(name, tileMap);
//     }

//     public getTileMap(name: string): typeof BaseTilemap | undefined {
//         return this.tileMaps.get(name);
//     }

// }