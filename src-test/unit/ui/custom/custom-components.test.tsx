import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const customMocks = vi.hoisted(() => ({
    appKernel: {
        textureManager: {
            getErrorTexture: vi.fn(),
        },
    },
    textureUtils: {
        extractTexture: vi.fn(),
    },
    translate: vi.fn((key: string, options?: Record<string, any>) => options?.name ? `${key}:${options.name}` : key),
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: customMocks.appKernel }));
vi.mock("@/shared/utils/texture.utils", () => ({ TextureUtils: customMocks.textureUtils }));
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: customMocks.translate,
    }),
}));

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import PixiImage from "@/ui/components/custom/PixiImage";

describe("custom UI components", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        customMocks.appKernel.textureManager.getErrorTexture.mockResolvedValue({ id: "error-texture" });
        customMocks.textureUtils.extractTexture.mockResolvedValue("data:image/png;base64,texture");
    });

    it("renders a Pixi texture after extracting it to an image source", async () => {
        const texture = { id: "tile-texture" };

        render(<PixiImage texture={texture as any} />);

        expect(screen.queryByAltText("tile")).not.toBeInTheDocument();

        const image = await screen.findByAltText("tile");
        expect(image).toHaveAttribute("src", "data:image/png;base64,texture");
        expect(customMocks.textureUtils.extractTexture).toHaveBeenCalledWith(texture);
        expect(customMocks.appKernel.textureManager.getErrorTexture).not.toHaveBeenCalled();
    });

    it("uses the shared error texture when no texture is provided", async () => {
        customMocks.textureUtils.extractTexture.mockResolvedValue("data:image/png;base64,error");

        render(<PixiImage texture={null} />);

        const image = await screen.findByAltText("tile");
        expect(image).toHaveAttribute("src", "data:image/png;base64,error");
        expect(customMocks.appKernel.textureManager.getErrorTexture).toHaveBeenCalledTimes(1);
        expect(customMocks.textureUtils.extractTexture).toHaveBeenCalledWith({ id: "error-texture" });
    });

    it("updates rendered image when the texture prop changes", async () => {
        customMocks.textureUtils.extractTexture
            .mockResolvedValueOnce("data:image/png;base64,first")
            .mockResolvedValueOnce("data:image/png;base64,second");

        const { rerender } = render(<PixiImage texture={{ id: "first" } as any} />);
        expect(await screen.findByAltText("tile")).toHaveAttribute("src", "data:image/png;base64,first");

        rerender(<PixiImage texture={{ id: "second" } as any} />);

        await waitFor(() => {
            expect(screen.getByAltText("tile")).toHaveAttribute("src", "data:image/png;base64,second");
        });
    });

    it("delegates string and object messages to the translation hook", () => {
        const { rerender } = render(<LocalizedText message="menu.file.label" />);

        expect(screen.getByText("menu.file.label")).toBeVisible();
        expect(customMocks.translate).toHaveBeenCalledWith("menu.file.label");

        rerender(<LocalizedText message={{ key: "project.loaded", options: { name: "Metk" } }} />);

        expect(screen.getByText("project.loaded:Metk")).toBeVisible();
        expect(customMocks.translate).toHaveBeenCalledWith("project.loaded", { name: "Metk" });
    });
});
