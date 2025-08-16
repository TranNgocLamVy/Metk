// import {
//     Application,
//     Graphics,
//     Sprite,
//     Text,
//     Texture
//     } from 'pixi.js';
// import { BaseTilelayer } from '@/@/plugin-api/models/tilemap/tilelayer';
// import { BaseTilemap } from '@/@/plugin-api/models/tilemap/tilemap';
// import { BaseTileset } from '@/@/plugin-api/models/tilemap/tileset';
// import { ColorUtils } from '@/@/appcoreutils/color-utils';
// import { MOUSEDOWN } from '@/@/appcoreenums/mouse/mouse';
// import { TextureUtils } from '@/@/appcoreutils/texture-utils';
// import { TileRenderer } from '@/@/plugin-api/models/tilemap/tilerenderer';
// import { Viewport } from 'pixi-viewport';
// import { Window } from '@tauri-apps/api/window';


// export class Drawing {
//     private app: Application;
//     private viewport: Viewport;
//     private previewTile: Sprite;

//     private grid: Graphics;
//     private gridSize: number = 16;

//     private tilemapRenderer: TileRenderer;

//     private mouseText: Text;

//     constructor(app: Application) {
//         this.app = app;

//         this.initViewport();
//         this.initGrid();
//         this.initMap();
        
//         this.mouseText = new Text({
//             text: "x: 0, y: 0",
//             style: {
//                 fill: "black",
//                 fontSize: 20,
//                 fontFamily: "JetBrains Mono"
//             }
//         });
//         this.mouseText.position.set(this.app.screen.width - this.mouseText.width - 10, this.app.screen.height - this.mouseText.height - 10);
//         this.app.stage.addChild(this.mouseText);
//     }

//     async initViewport() {
//         const canvas = this.app.canvas;

//         this.viewport = new Viewport({
//             screenWidth: this.app.screen.width,
//             screenHeight: this.app.screen.height,
//             worldWidth: this.app.screen.width,
//             worldHeight: this.app.screen.height,
//             passiveWheel: true,
//             stopPropagation: true,
//             allowPreserveDragOutside: true,
//             events: this.app.renderer.events,
//         })
//         this.viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
//         this.app.stage.addChild(this.viewport);

//         Window.getCurrent().onResized(() => {
//             setTimeout(() => {
//                 this.viewport.resize(this.app.screen.width, this.app.screen.height);
//                 this.drawGrid();
//             }, 50)
//         })

//         this.previewTile = new Sprite(Texture.WHITE);
//         this.previewTile.tint = 0xff0000;
//         this.previewTile.width = this.previewTile.height = this.gridSize;
//         this.previewTile.alpha = 0.5;

//         this.viewport.on("mouseenter", () => {
//             this.viewport.addChild(this.previewTile);
//         })

//         this.viewport.on("mouseleave", () => {
//             this.viewport.removeChild(this.previewTile);
//         })

//         this.viewport.on("mousedown", (event) => {
//             if (event.button == MOUSEDOWN.LEFT) {
//                 const x = event.clientX - canvas.offsetLeft;
//                 const y = event.clientY - canvas.offsetTop;

//                 const position = this.viewport.toWorld(x, y);

//                 position.x = Math.floor(position.x / this.gridSize) * this.gridSize;
//                 position.y = Math.floor(position.y / this.gridSize) * this.gridSize;

//                 this.tilemapRenderer.currentLayer.setTile(position.x / 16, position.y / 16, 1, 1);

//                 // const sprite = new Sprite(Texture.WHITE)
//                 // sprite.tint = 0x000000;
//                 // sprite.width = sprite.height = this.gridSize;
//                 // sprite.position.set(position.x, position.y);
//                 // this.viewport.addChild(sprite);
//             }
//         })

//         this.viewport.on("mousemove", (event) => {
//             let x = event.clientX - canvas.offsetLeft;
//             let y = event.clientY - canvas.offsetTop;

//             const position = this.viewport.toWorld(x, y);
//             this.mouseText.text = `x: ${Math.round(position.x)}, y: ${Math.round(position.y)}`;
//             this.mouseText.position.set(this.app.screen.width - this.mouseText.width - 10, this.app.screen.height - this.mouseText.height - 10)
//         })
//     }

//     async initMap() {
//         const imagePath = "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\json\\Grass.png"
//         const imageTexture = await TextureUtils.loadTextureFromFile(imagePath);
//         const tileset = new BaseTileset({
//             tilesetName: "Grass",
//             tilesetId: 1,
//             tileWidth: 16,
//             tileHeight: 16,
//             image: {
//                 path: imagePath,
//                 texture: imageTexture
//             }
//         })
//         const tilelayer = new BaseTilelayer({
//             layerName: "Tile Layer 1",
//             layerId: "1",
//             width: 64,
//             height: 64,
//             layerData: Array(64).fill(0).map(() => Array(64).fill(0).map(() => ({ tileId: 2, tilesetId: 1 })))
//         })
//         const tilemap = new BaseTilemap({
//             orientation: "orthogonal",
//             renderOrder: "right-down",
//             tileWidth: 16,
//             tileHeight: 16,
//             width: 64,
//             height: 64,
//             infinite: false,
//             nextLayerId: 2,
//             nextObjectId: 1,
//             tilesets: [tileset],
//             layers: [tilelayer]
//         })
//         this.tilemapRenderer = new TileRenderer(tilemap, this.viewport);
//     }

//     initGrid() {
//         this.grid = new Graphics();
//         this.viewport.addChild(this.grid);
//         this.drawGrid();

//         this.viewport.on("mousemove", (event) => {
//             let x = event.clientX - this.app.canvas.offsetLeft;
//             let y = event.clientY - this.app.canvas.offsetTop;

//             const position = this.viewport.toWorld(x, y);

//             position.x = Math.floor(position.x / this.gridSize) * this.gridSize;
//             position.y = Math.floor(position.y / this.gridSize) * this.gridSize;

//             this.previewTile.position.set(position.x, position.y);
//         });

//         this.viewport.on("zoomed", () => {
//             this.drawGrid();
//         })

//         this.viewport.on("moved", () => {
//             this.drawGrid();
//         })
//     }

//     drawGrid(gridSize = this.gridSize) {
//         const minX = Math.floor(this.viewport.left / gridSize) * gridSize;
//         const minY = Math.floor(this.viewport.top / gridSize) * gridSize;
//         const maxX = Math.ceil(this.viewport.right / gridSize) * gridSize;
//         const maxY = Math.ceil(this.viewport.bottom / gridSize) * gridSize;

//         this.grid.clear();

//         const numRows = (maxY - minY) / gridSize;
//         const numCols = (maxX - minX) / gridSize;

//         const gridColor = ColorUtils.getCSSColor('--canvas-grid-color') || '#000000';

//         for (let i = 0; i <= numRows; i++) {
//             const y = minY + i * gridSize;
//             this.grid.moveTo(minX, y).lineTo(maxX, y).stroke({ color: gridColor, pixelLine: true })
//         }

//         for (let j = 0; j <= numCols; j++) {
//             const x = minX + j * gridSize;
//             this.grid.moveTo(x, minY).lineTo(x, maxY).stroke({ color: gridColor, pixelLine: true })
//         }
//     }

//     destroy() {
//         this.viewport.destroy();
//         this.mouseText.destroy();
//     }
// }