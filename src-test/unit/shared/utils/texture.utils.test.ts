import { beforeEach, describe, expect, it, vi } from "vitest";

import { TextureUtils } from "@/shared/utils/texture.utils";
import { Application, ImageSource, Sprite, Texture } from "pixi.js";

const pixiMock = vi.hoisted(() => {
    const base64 = vi.fn(() => Promise.resolve("data:image/png;base64,texture"));
    const init = vi.fn(() => Promise.resolve());

    class MockApplication {
        public renderer = {
            extract: { base64 },
        };

        public init = init;
    }

    class MockSprite {
        constructor(public texture: unknown) {}
    }

    class MockImageSource {
        constructor(public options: unknown) {}
    }

    class MockTexture {
        constructor(public options: unknown = {}) {}
    }

    return {
        base64,
        init,
        Application: vi.fn(MockApplication),
        Sprite: vi.fn(MockSprite),
        ImageSource: vi.fn(MockImageSource),
        Texture: vi.fn(MockTexture),
    };
});

vi.mock("pixi.js", () => ({
    Application: pixiMock.Application,
    Sprite: pixiMock.Sprite,
    ImageSource: pixiMock.ImageSource,
    Texture: pixiMock.Texture,
}));

describe("TextureUtils", () => {
    beforeEach(() => {
        pixiMock.base64.mockClear();
        pixiMock.init.mockClear();
        pixiMock.Application.mockClear();
        pixiMock.Sprite.mockClear();
        pixiMock.ImageSource.mockClear();
        pixiMock.Texture.mockClear();

        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: vi.fn(() => "blob:metk-test"),
        });

        class TestImage {
            public src = "";
            public decode = vi.fn(() => Promise.resolve());
        }
        Object.defineProperty(globalThis, "Image", {
            configurable: true,
            value: TestImage,
        });
    });

    it("extracts a texture through a lazily-created Pixi application", async () => {
        const texture = new Texture({}) as any;

        await expect(TextureUtils.extractTexture(texture)).resolves.toBe("data:image/png;base64,texture");

        expect(Application).toHaveBeenCalledTimes(1);
        expect(pixiMock.init).toHaveBeenCalledWith({
            width: 1,
            height: 1,
            autoStart: false,
            backgroundAlpha: 0,
            preference: "webgl",
        });
        expect(Sprite).toHaveBeenCalledWith(texture);
        expect(pixiMock.base64).toHaveBeenCalledTimes(1);
    });

    it("decodes image buffers into HTML images", async () => {
        const image = await TextureUtils.processImage(new Uint8Array([1, 2, 3]));

        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(image.src).toBe("blob:metk-test");
        expect((image.decode as any)).toHaveBeenCalledTimes(1);
    });

    it("creates nearest-neighbor Pixi textures from image buffers", async () => {
        const texture = await TextureUtils.processTexture(new Uint8Array([4, 5, 6]));

        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(ImageSource).toHaveBeenCalledWith({
            resource: expect.objectContaining({ src: "blob:metk-test" }),
            scaleMode: "nearest",
        });
        expect(Texture).toHaveBeenCalledWith({
            source: expect.any(pixiMock.ImageSource),
        });
        expect(texture).toBeInstanceOf(pixiMock.Texture);
    });
});
