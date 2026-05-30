import { TilemapOrientation } from "@/shared/data-types/tilemap.data";
import { FormUtils } from "@/shared/utils/form.utils";

export const createTilemapForm = () => {
    return FormUtils.createForm({
        title: "form.tilemap.title",
        okText: "form.tilemap.action.create",
        cancelText: "form.tilemap.action.cancel",
        size: "md",
        inputs: [
            {
                id: "tilemap",
                name: "tilemap",
                type: "group",
                label: "form.tilemap.tilemap",
                orientation: "vertical",
                inputs: [
                    {
                        id: "name",
                        name: "name",
                        type: "text",
                        label: "form.tilemap.name.label",
                        placeholder: "form.tilemap.name.placeholder",
                        required: true,
                    },
                    {
                        id: "type",
                        name: "type",
                        type: "select",
                        label: "form.tilemap.type.label",
                        defaultValue: "orthogonal",
                        required: true,
                        options: [
                            {
                                label: "form.tilemap.type.orthogonal",
                                value: TilemapOrientation.Orthogonal,
                            },
                            {
                                label: "form.tilemap.type.isometric",
                                value: TilemapOrientation.Isometric,
                                disabled: true,
                            },
                            {
                                label: "form.tilemap.type.oblique",
                                value: TilemapOrientation.Oblique,
                                disabled: true,
                            },
                            {
                                label: "form.tilemap.type.staggered",
                                value: TilemapOrientation.Staggered,
                                disabled: true,
                            },
                            {
                                label: "form.tilemap.type.hexagonal",
                                value: TilemapOrientation.Hexagonal,
                                disabled: true,
                            },
                        ],
                    },
                ]
            },
            {
                id: "options",
                name: "options",
                type: "group",
                label: "form.tilemap.options",
                orientation: "horizontal",
                inputs: [
                    {
                        id: "map",
                        name: "map",
                        type: "group",
                        label: "form.tilemap.size.label",
                        inputs: [
                            {
                                id: "mapwidth",
                                name: "mapwidth",
                                type: "number",
                                label: "form.tilemap.size.width",
                                defaultValue: 64,
                                required: true,
                            },
                            {
                                id: "mapheight",
                                name: "mapheight",
                                type: "number",
                                label: "form.tilemap.size.height",
                                defaultValue: 64,
                                required: true,
                            },
                        ]
                    },
                    {
                        id: "tile",
                        name: "tile",
                        type: "group",
                        label: "form.tilemap.tileSize.label",
                        inputs: [
                            {
                                id: "tilewidth",
                                name: "tilewidth",
                                type: "number",
                                label: "form.tilemap.tileSize.width",
                                defaultValue: 16,
                                required: true,
                            },
                            {
                                id: "tileheight",
                                name: "tileheight",
                                type: "number",
                                label: "form.tilemap.tileSize.height",
                                defaultValue: 16,
                                required: true,
                            },
                        ]
                    },
                ]
            },
        ]
    })
}