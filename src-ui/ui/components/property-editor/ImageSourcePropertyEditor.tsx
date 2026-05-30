import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";

import { ImageSourcePropertyClass } from "@/editor/properties/properties";
import type { ImageSourceData } from "@/shared/data-types/image-source.data";
import { Result } from "@/shared/types/result";
import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { TextureUtils } from "@/shared/utils/texture.utils";
import { Button } from "@/ui/components/shadcn/button";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";

import { LocalizedText } from "../custom/LocalizeText";
import { HStack } from "../custom/stack/Stack";
import { clonePropertyValue, executeUpdatePropertyCommand } from "./property-command.utils";
import { usePropertyStoreVersion } from "@/ui/stores/property.store";

export interface ImageSourcePropertyEditorProps {
    property: ImageSourcePropertyClass<any>;
}

export function ImageSourcePropertyEditor({ property }: ImageSourcePropertyEditorProps) {
    const version = usePropertyStoreVersion();

    const initialValue = useMemo(() => normalizeImageSource(property.getter()), [property]);

    const [draft, setDraft] = useState<string>(initialValue.source);
    const [error, setError] = useState<TranslatableMessage | null>(null);
    const isEditingRef = useRef(false);

    const disabled = property.disabled() || property.readonly();

    useEffect(() => {
        if (isEditingRef.current) return;

        setDraft(normalizeImageSource(property.getter()).source);
        setError(null);
    }, [property, version]);

    const resetDraft = useCallback(() => {
        setDraft(normalizeImageSource(property.getter()).source);
        setError(null);
    }, [property]);

    const commitValue = useCallback((value: ImageSourceData, oldValue: ImageSourceData = clonePropertyValue(normalizeImageSource(property.getter()))) => {
        const validateResult = property.validate(value);

        setError(null);

        switch (validateResult.status) {
            case Result.Status.Error:
                setError(validateResult.message ?? null);
                resetDraft();
                break;

            case Result.Status.Cancel:
                resetDraft();
                break;

            case Result.Status.Success: {
                const result = executeUpdatePropertyCommand(property, oldValue, value);

                if (result.status === Result.Status.Error) {
                    setError(result.message ?? null);
                    resetDraft();
                    return;
                }

                setDraft(normalizeImageSource(property.getter()).source);
                break;
            }
        }
    }, [property, resetDraft]);

    const handleManualChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value);
        setError(null);
    }, []);

    const handleManualConfirm = useCallback((source: string) => {
        const current = normalizeImageSource(property.getter());
        const nextSource = source.trim();

        if (nextSource === current.source) {
            resetDraft();
            return;
        }

        commitValue(
            {
                source: nextSource,
                width: current.width,
                height: current.height,
            },
            current,
        );
    }, [property, commitValue, resetDraft]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleManualConfirm(draft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            resetDraft();
            event.currentTarget.blur();
        }
    }, [draft, handleManualConfirm, resetDraft]);

    const selectImage = useCallback(async () => {
        if (disabled) return;

        const oldValue = clonePropertyValue(normalizeImageSource(property.getter()));

        const selectedPath = await FileDialogUtils.open({
            directory: false,
            multiple: false,
            filters: [
                {
                    name: "Image",
                    extensions: ["png", "jpg", "jpeg"],
                },
            ],
        });

        if (!selectedPath || Array.isArray(selectedPath)) return;

        try {
            const buffer = await readFile(selectedPath);
            const image = await TextureUtils.processImage(buffer);
            const source = property.absToRef(selectedPath);

            commitValue(
                {
                    source,
                    width: image.width,
                    height: image.height,
                },
                oldValue,
            );
        } catch (error) {
            setError({
                key: "property.imageSource.invalidImage",
            } as TranslatableMessage);
        }
    }, [commitValue, disabled, property]);

    const title = useMemo(() => {
        const value = normalizeImageSource(property.getter());

        if (!value.source) return "";

        return `${value.source}\n${value.width} × ${value.height}`;
    }, [property, draft, version]);

    return (
        <div className="px-2 h-8">
            <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] h-full items-center gap-2">
                <Label title={property.label} className="text-2xs min-w-0 truncate">
                    <LocalizedText message={property.label} />
                </Label>

                <HStack className="gap-2 min-w-0">
                    <Input
                        type="text"
                        value={draft}
                        title={title}
                        readOnly={property.readonly()}
                        disabled={disabled}
                        onFocus={() => {
                            isEditingRef.current = true;
                        }}
                        onChange={handleManualChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            isEditingRef.current = false;
                            handleManualConfirm(draft);
                        }}
                        className="h-6 text-2xs"
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={disabled}
                        className="text-2xs border-foreground/40 shrink-0"
                        onClick={selectImage}
                    >
                        <LocalizedText message="form.tileset.image.browse" />
                    </Button>
                </HStack>
            </div>

            {error && (
                <span className="mt-1 pl-[calc(40%+0.5rem)] text-2xs text-destructive">
                    <LocalizedText message={error} />
                </span>
            )}
        </div>
    );
}

function normalizeImageSource(value: unknown): ImageSourceData {
    if (!value || typeof value !== "object") {
        return { source: "", width: 0, height: 0 };
    }

    const imageSource = value as Partial<ImageSourceData>;

    return {
        source: imageSource.source ?? "",
        width: imageSource.width ?? 0,
        height: imageSource.height ?? 0,
    };
}