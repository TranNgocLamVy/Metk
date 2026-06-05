import { DEFAULT_TILESET_TILE_HEIGHT, DEFAULT_TILESET_TILE_WIDTH } from "@/shared/data-types/tileset.data";
import { createForm } from "./form.utils";

export const createTilesetForm = (textureDefaultDir?: string) => {
    return createForm({
        title: "form.tileset.title",
        okText: "form.tileset.action.saveAs",
        cancelText: "form.tileset.action.cancel",
        size: "md",
        inputs: [
            {
                id: "tileset",
                name: "tileset",
                type: "group",
                label: "form.tileset.tileset",
                inputs: [
                    {
                        id: "name",
                        name: "name",
                        type: "text",
                        label: "form.tileset.name.label",
                        placeholder: "form.tileset.name.placeholder",
                        required: true,
                    },
                    {
                        id: "type",
                        name: "type",
                        type: "select",
                        label: "form.tileset.type.label",
                        defaultValue: "single-image",
                        required: true,
                        options: [
                            {
                                label: "form.tileset.type.singleImage",
                                value: "single-image",
                            },
                            {
                                label: "form.tileset.type.imageCollection",
                                value: "image-collection",
                            },
                        ],
                    },
                ],
            },
            {
                id: "image",
                name: "image",
                type: "group",
                label: "form.tileset.image.label",
                visible: (value) => value.tileset?.type === "single-image",
                inputs: [
                    {
                        id: "source",
                        name: "source",
                        type: "filePath",
                        defaultDir: textureDefaultDir,
                        multiple: false,
                        label: "form.tileset.image.source",
                        required: true,
                        filter: {
                            name: "Image",
                            extensions: ["png", "jpg", "jpeg"],
                        },
                    },
                    {
                        id: "setting",
                        name: "setting",
                        type: "group",
                        label: "Setting",
                        showFrame: false,
                        orientation: "horizontal",
                        inputs: [
                            {
                                id: "tile",
                                name: "tile",
                                type: "group",
                                label: "form.tileset.size.label",
                                showFrame: false,
                                orientation: "vertical",
                                inputs: [
                                    {
                                        id: "tileWidth",
                                        name: "tileWidth",
                                        type: "number",
                                        label: "form.tileset.size.width",
                                        defaultValue: DEFAULT_TILESET_TILE_WIDTH,
                                        required: true,
                                    },
                                    {
                                        id: "tileHeight",
                                        name: "tileHeight",
                                        type: "number",
                                        label: "form.tileset.size.height",
                                        defaultValue: DEFAULT_TILESET_TILE_HEIGHT,
                                        required: true,
                                    },
                                ],
                            },
                            {
                                id: "marginSpacing",
                                name: "marginAndSpacing",
                                type: "group",
                                label: "MarginAndSpacing",
                                showFrame: false,
                                orientation: "vertical",
                                inputs: [
                                    {
                                        id: "margin",
                                        name: "margin",
                                        type: "number",
                                        label: "form.tileset.margin",
                                        defaultValue: 0,
                                        required: true,
                                    },
                                    {
                                        id: "spacing",
                                        name: "spacing",
                                        type: "number",
                                        label: "form.tileset.spacing",
                                        defaultValue: 0,
                                        required: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });
};