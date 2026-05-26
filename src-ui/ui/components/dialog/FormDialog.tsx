import { MouseEvent, useEffect, useState } from "react";

import { Field, FieldStateResolver, FormDialogOptions, GroupFieldInput, ShapeFromInputs, Simplify } from "@/shared/types/form-dialog";
import { Button } from "@/ui/components/shadcn/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/components/shadcn/dialog";

import { CheckBoxField } from "../formField/CheckboxField";
import { TextInputField } from "../formField/TextInputField";
import { NumberInputField } from "../formField/NumberInputField";
import FolderPickerField from "../formField/FolderPickerField";
import FilePickerField from "../formField/FilePickerField";
import { ColorPickerField } from "../formField/ColorPickerField";
import { SelectField } from "../formField/SelectField";
import { LocalizedText } from "../custom/LocalizeText";
import { BaseDialogProps } from "./dialogRegistry";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { ScrollArea } from "../shadcn/scroll-area";
import { VStack } from "../custom/stack/Stack";

interface FormDialogProps extends BaseDialogProps {
    formDialog: FormDialogOptions;
    resolve: (result: Simplify<ShapeFromInputs<any>> | null) => void;
}

export function FormDialog({ dialogId, formDialog, resolve }: FormDialogProps) {
    const [values, setValues] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!formDialog) {
            setValues({});
            return;
        }
        setValues(getInitialValues(formDialog.inputs));
    }, [formDialog]);

    const handleChange = (fieldName: string, raw: unknown) => {
        setValues((prev) => {
            const spec = findFieldByName(formDialog.inputs, fieldName);
            let nextVal: any = raw;

            switch (spec?.type) {
                case "number": {
                    if (typeof raw === "string") {
                        const n = raw.trim() === "" ? NaN : Number(raw);
                        nextVal = Number.isFinite(n) ? n : prev[fieldName] ?? 0;
                    } else if (typeof raw === "number") {
                        nextVal = raw;
                    }
                    break;
                }
                case "checkbox": {
                    if (typeof raw === "string") {
                        nextVal = raw === "true" ? true : raw === "false" ? false : Boolean(raw);
                    } else {
                        nextVal = Boolean(raw);
                    }
                    break;
                }
                default:
                    nextVal = raw;
                    break;
            }

            if (Object.is(prev[fieldName], nextVal)) return prev;
            return { ...prev, [fieldName]: nextVal };
        });
    };

    if (!formDialog) return null;

    const { title, description, okText = "OK", cancelText = "Cancel", size = "md", inputs, validateBeforeSubmit } = formDialog;

    const validateRecursive = async (inputList: readonly Field[], currentValues: Record<string, any>, rootValues: Record<string, any>, inheritedDisabled = false): Promise<boolean> => {
        for (const input of inputList) {
            const isVisible = resolveFieldState(input.visible, rootValues, true);
            if (!isVisible) continue;

            const isDisabled =
                inheritedDisabled ||
                resolveFieldState(input.disabled, rootValues, false);

            if (isDisabled) continue;

            const val = currentValues[input.name];

            if (input.validate) {
                const result = await input.validate(val);
                if (!result.valid) return false;
            }

            if (input.type === "group") {
                const validChildren = await validateRecursive(input.inputs, val || {}, rootValues, isDisabled);

                if (!validChildren) return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();

        const inputsValid = await validateRecursive(inputs, values, values);
        if (!inputsValid) return;

        if (validateBeforeSubmit) {
            const result = await validateBeforeSubmit(values);
            if (!result.valid) return;
        }

        resolve(values);
        useDialogStore.getState().closeDialog(dialogId);
    };

    const cancelFormDialog = () => {
        resolve(null);
        useDialogStore.getState().closeDialog(dialogId);
    };

    return (
        <Dialog open onOpenChange={() => cancelFormDialog()}>
            <form autoComplete="off">
                <DialogContent
                    className={`${sizeClasses[size]} max-h-[90vh] w-full overflow-y-auto p-3`}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            <p className="text-md font-medium">
                                <LocalizedText message={title ?? ""} />
                            </p>
                        </DialogTitle>
                        <DialogDescription>
                            <LocalizedText message={description ?? ""} />
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="min-h-0">
                        <VStack className="gap-3 py-1">
                            {inputs.map((input: Field, i: number) => (
                                <FieldRenderer
                                    key={input.id || i}
                                    input={input}
                                    value={values[input.name]}
                                    formValues={values}
                                    inheritedDisabled={false}
                                    onChange={handleChange}
                                />
                            ))}
                        </VStack>
                    </ScrollArea>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => cancelFormDialog()}
                            >
                                <LocalizedText message={cancelText ?? ""} />
                            </Button>
                        </DialogClose>

                        <Button type="button" onClick={handleSubmit}>
                            <LocalizedText message={okText ?? ""} />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}

const getInitialValues = (inputs: readonly Field[]): Record<string, any> => {
    const values: Record<string, any> = {};

    for (const field of inputs) {
        if (field.type === "group") {
            values[field.name] =
                field.defaultValue ?? getInitialValues(field.inputs);
        } else if (field.defaultValue !== undefined) {
            values[field.name] = field.defaultValue;
        }
    }

    return values;
};

const resolveFieldState = (
    resolver: FieldStateResolver | undefined,
    values: Record<string, any>,
    defaultValue: boolean,
): boolean => {
    if (resolver === undefined) return defaultValue;
    if (typeof resolver === "function") return resolver(values);
    return resolver;
};

const findFieldByName = (
    inputs: readonly Field[],
    fieldName: string,
): Field | undefined => {
    for (const input of inputs) {
        if (input.name === fieldName) return input;

        if (input.type === "group") {
            const child = findFieldByName(input.inputs, fieldName);
            if (child) return child;
        }
    }

    return undefined;
};

type FieldRendererProps = {
    input: Field;
    value: any;
    formValues: Record<string, any>;
    inheritedDisabled: boolean;
    onChange: (fieldName: string, val: any) => void;
};

const GroupField = ({ field, value = {}, formValues, inheritedDisabled, onChange }: {
    field: GroupFieldInput;
    value: Record<string, any>;
    formValues: Record<string, any>;
    inheritedDisabled: boolean;
    onChange: (fieldName: string, val: any) => void;
}) => {
    const { orientation = "vertical", showFrame = true, inputs, name, label } = field;

    const disabled = inheritedDisabled || resolveFieldState(field.disabled, formValues, false);

    const handleChildChange = (childName: string, childValue: any) => {
        if (disabled) return;

        const newValue = {
            ...value,
            [childName]: childValue,
        };

        onChange(name, newValue);
    };

    const layoutClasses = orientation === "horizontal" ? "flex flex-row gap-8 items-start h-full" : "flex flex-col gap-4";

    if (!showFrame) return (
        <div className={layoutClasses}>
            {inputs.map((subInput, i) => (
                <div key={subInput.id || i} className={orientation === "horizontal" ? "h-full flex-1" : "w-full"}>
                    <FieldRenderer
                        input={subInput}
                        value={value[subInput.name]}
                        formValues={formValues}
                        inheritedDisabled={disabled}
                        onChange={handleChildChange}
                    />
                </div>
            ))}
        </div>
    )

    return (
        <div className={`relative mt-3 h-full rounded-md border border-foreground/40 p-3 pt-6 ${disabled ? "opacity-60" : ""}`}>
            <label className="absolute -top-2.5 left-3 bg-surface-overlay px-1 text-xs font-medium text-foreground">
                <LocalizedText message={label} />
            </label>

            <div className={layoutClasses}>
                {inputs.map((subInput, i) => (
                    <div key={subInput.id || i} className={orientation === "horizontal" ? "h-full flex-1" : "w-full"}>
                        <FieldRenderer
                            input={subInput}
                            value={value[subInput.name]}
                            formValues={formValues}
                            inheritedDisabled={disabled}
                            onChange={handleChildChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const FieldRenderer = ({ input, value, formValues, inheritedDisabled, onChange }: FieldRendererProps) => {
    const visible = resolveFieldState(input.visible, formValues, true);
    if (!visible) return null;

    const disabled =
        inheritedDisabled ||
        resolveFieldState(input.disabled, formValues, false);

    switch (input.type) {
        case "text":
            return (
                <TextInputField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={onChange}
                />
            );

        case "number":
            return (
                <NumberInputField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={onChange}
                />
            );

        case "select":
            return (
                <SelectField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={onChange}
                />
            );

        case "folderPath":
            return (
                <FolderPickerField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={onChange}
                />
            );

        case "filePath":
            return (
                <FilePickerField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={onChange}
                />
            );

        case "group":
            return (
                <GroupField
                    field={input}
                    value={value}
                    formValues={formValues}
                    inheritedDisabled={disabled}
                    onChange={onChange}
                />
            );

        case "checkbox": {
            const handleChange = (checked: boolean) => {
                onChange(input.name, checked);
            };

            return (
                <CheckBoxField
                    {...input}
                    value={value}
                    disabled={disabled}
                    handleChange={handleChange}
                />
            );
        }

        case "color":
            return (
                <ColorPickerField
                    {...input}
                    value={value}
                    disabled={disabled}
                    onChange={onChange}
                />
            );

        default:
            return null;
    }
};

const sizeClasses: Record<string, string> = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[600px]",
    lg: "sm:max-w-[800px]",
    xl: "sm:max-w-[950px]",
    "2xl": "sm:max-w-[1100px]",
};