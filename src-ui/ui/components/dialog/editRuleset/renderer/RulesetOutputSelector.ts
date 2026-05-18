import { Application, Container, Sprite, Graphics } from 'pixi.js';
import { Tileset } from '@/editor/model/tileset/tileset';
import { appKernel } from '@/application/bootstrap/app-kernel';
import { Ruleset } from '@/editor/model/ruleset/ruleset';
import { Rule } from '@/editor/model/ruleset/rule';
import { Viewport } from 'pixi-viewport';
import { DrawLineOption, GraphicUtils } from '@/shared/utils/graphic-utils';
import { Result } from '@/shared/types/result';

export class RulesetOutputSelector {
    private pixiApp: Application;
    public viewport: Viewport;
    private spriteContainer: Container;
    private highlightGraphics: Graphics;
    private gridGraphics: Graphics;

    private currentTileset: Tileset | null = null;
    private currentRule: Rule | null = null;

    private gridGap: number = 0;

    private isInit: boolean = false;


    constructor(
        private currentRuleset: Ruleset, 
        private triggerUpdate: () => void
    ) { }

    private initSession(pixiApp: Application) {
        this.pixiApp = pixiApp;

        this.spriteContainer = new Container();

        this.highlightGraphics = new Graphics();
        this.highlightGraphics.eventMode = 'none';

        this.gridGraphics = new Graphics();
        this.gridGraphics.eventMode = 'none';

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });

        this.viewport
            .drag({ mouseButtons: "middle " })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.5, maxScale: 50 })

        this.pixiApp.renderer.on("resize", () => {
            this.resizeViewport();
        });

        this.viewport.on("drag-start", (e) => {
            this.viewport.cursor = "grabbing";
        });

        this.viewport.on("drag-end", () => {
            this.viewport.cursor = "default";
        });

        this.viewport.addChild(this.spriteContainer);
        this.viewport.addChild(this.highlightGraphics);
        this.viewport.addChild(this.gridGraphics);
    }

    public async activatePixiApp(pixiApp: Application) {
        if (!this.isInit || this.pixiApp !== pixiApp) {
            this.initSession(pixiApp);
            this.isInit = true;
        }

        this.viewport.eventMode = 'static';
        this.viewport.plugins.resume('drag');
        this.viewport.plugins.resume('wheel');
        this.viewport.plugins.resume('decelerate');

        this.pixiApp.stage.addChild(this.viewport);
        this.renderHighlights();
        this.renderGrid();
    }

    public async setActiveTileset(tilesetId: string) {
        if (this.currentTileset?.id === tilesetId) return;

        const currentProject = appKernel.editorContext.currentProject;
        if (!currentProject) return;

        const tilesetManager = currentProject.tilesetManager;
        const tilesetResult = await tilesetManager.loadTileset(tilesetId);
        if (tilesetResult.status !== Result.Status.Success) return;

        const tileset = tilesetResult.data;
        
        const textureManager = appKernel.editorContext.textureManager;
        
        if (this.currentTileset) {
            textureManager.releaseTilesetGraphics(this.currentTileset.id);
            const childrenToDestroy = this.spriteContainer.removeChildren();
            childrenToDestroy.forEach(child => child.destroy());
        }

        await textureManager.retainTilesetGraphics(tileset);
        this.currentTileset = tileset;

        tileset.tiles.forEach((tile, index) => {
            const tex = textureManager.getTileTexture(tileset.id, index);
            if (!tex) return;
            const sprite = new Sprite(tex);
            const col = index % tileset.columns;
            const row = Math.floor(index / tileset.columns);
            const x = col * (tileset.tilewidth + this.gridGap);
            const y = row * (tileset.tileheight + this.gridGap);
            sprite.position.set(x, y);
            sprite.eventMode = 'static';
            sprite.cursor = 'pointer';
            sprite.on('pointerdown', (e) => {
                if (e.button === 0) this.selectOutput(index);
            });

            this.spriteContainer.addChild(sprite);
        });
        this.renderHighlights();
        this.renderGrid();
    }

    private selectOutput(tileId: number) {
        if (!this.currentRule) return;

        const currentOutputs = this.currentRule.getOutputs();
        const tilesetId = this.currentTileset!.id;

        const exists = currentOutputs.some(output => {
            const outputData = output.getOutputData();
            if (!outputData) return false;
            return outputData.tileId === tileId && outputData.tilesetId === tilesetId;
        })
        if (exists) {
            this.currentRule.removeOutput(tileId, tilesetId);
        } else {
            this.currentRule.addOutput(tileId, tilesetId, 1);
        }
        this.triggerUpdate();
        this.renderHighlights();
    }

    public async setCurrentRule(rule: Rule | null) {
        this.currentRule = rule;
        this.renderHighlights();
    }

    private renderHighlights() {
        if (!this.isInit) return;

        this.highlightGraphics.clear();
        if (!this.currentTileset) return;

        const { tilewidth, tileheight, columns } = this.currentTileset;
        const activeTilesetIndex = this.currentRuleset.tilesetRefManager.getTilesetRefIndex(this.currentTileset!.id);

        const outputs = this.currentRule?.getOutputs() || [];

        outputs.forEach((output) => {
            if (output.tilesetIndex !== activeTilesetIndex) return;

            const tx = output.tileId % columns;
            const ty = Math.floor(output.tileId / columns);

            const x = tx * (tilewidth + this.gridGap);
            const y = ty * (tileheight + this.gridGap);

            this.highlightGraphics.rect(x, y, tilewidth, tileheight);
            this.highlightGraphics.fill({ color: 0x3b82f6, alpha: 0.4 });
        });
    }

    private resizeViewport() {
        if (!this.isInit) return;
        const w = this.pixiApp.renderer.width;
        const h = this.pixiApp.renderer.height;
        this.viewport.resize(w, h);
    }

    private renderGrid() {
        if (!this.isInit) return;

        if (!this.currentTileset) {
            this.gridGraphics.clear();
            return;
        }

        const tileWidth = this.currentTileset.tilewidth;
        const tileHeight = this.currentTileset.tileheight;

        const columns = this.currentTileset.columns;
        const rows = Math.ceil(this.currentTileset.tiles.length / columns);

        const drawLineOptions: DrawLineOption = { color: 0xc9c9c9, alpha: 0.5, pixelLine: true }

        for (let col = 0; col <= columns; col++) {
            GraphicUtils.drawVerticelLine(this.gridGraphics, col * (tileWidth + this.gridGap), 0, rows * (tileHeight + this.gridGap), drawLineOptions);
        }

        for (let row = 0; row <= rows; row++) {
            GraphicUtils.drawHorizontalLine(this.gridGraphics, row * (tileHeight + this.gridGap), 0, columns * (tileWidth + this.gridGap), drawLineOptions);
        }
    }

    public destroy() {
        if (!this.isInit) return;
        if (this.currentTileset) appKernel.editorContext.textureManager.releaseTilesetGraphics(this.currentTileset.id)
        if (this.pixiApp) this.pixiApp.stage.removeChild(this.viewport);
        this.viewport.destroy({ children: true });
    }
}