import { Application, Texture, Sprite, ImageSource } from 'pixi.js';

export class TextureUtils {
    private static appPromise: Promise<Application> | null = null;

    private static getApplication(): Promise<Application> {
        if (!this.appPromise) {
            this.appPromise = (async () => {
                const app = new Application();
                await app.init({
                    width: 1,
                    height: 1,
                    autoStart: false,
                    backgroundAlpha: 0,
                    preference: 'webgl'
                });
                return app;
            })();
        }
        return this.appPromise;
    }

    public static async extractTexture(texture: Texture): Promise<string> {
        const sprite = new Sprite(texture);
        const application = await this.getApplication();
        return await application.renderer.extract.base64(sprite);
    }

    public static async processImage(buffer: Uint8Array): Promise<HTMLImageElement> {
        const blob = new Blob([new Uint8Array(buffer)], { type: 'image' });
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
    }

    public static async processTexture(buffer: Uint8Array): Promise<Texture> {
        const blob = new Blob([new Uint8Array(buffer)], { type: 'image' });
        const url = URL.createObjectURL(blob);

        const image = new Image();
        image.src = url;
        await image.decode();

        const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) })
        return texture;
    }
}