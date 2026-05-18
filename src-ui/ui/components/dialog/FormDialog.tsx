import { MouseEvent, useEffect, useState } from "react";

import { Field, FormDialogOptions, GroupFieldInput, ShapeFromInputs, Simplify } from "@/shared/types/form-dialog";
import { Button } from "@/ui/components/shadcn/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/components/shadcn/dialog";

import { CheckBoxField } from "../formField/CheckboxField";
import { TextInputField } from "../formField/TextInputField";
import { NumberInputField } from "../formField/NumberInputField";
import FolderPickerField from "../formField/FolderPickerField";
import FilePickerField from "../formField/FilePickerField";
import { BaseDialogProps } from "./dialogRegistry";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { ColorPickerField } from "../formField/ColorPickerField";
import { LocalizedText } from "../custom/LocalizeText";
import { Console } from "@/shared/services/console.service";

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
            const spec = formDialog?.inputs.find((f: Field) => f.name === fieldName);
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

    const validateRecursive = async (inputList: readonly Field[], currentValues: Record<string, any>): Promise<boolean> => {
        for (const input of inputList) {
            const val = currentValues[input.name];

            if (input.validate) {
                const result = await input.validate(val);
                if (!result.valid) return false;
            }

            if (input.type === "group") {
                const validChildren = await validateRecursive(input.inputs, val || {});
                if (!validChildren) return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();

        const inputsValid = await validateRecursive(inputs, values);
        if (!inputsValid) return;

        if (validateBeforeSubmit) {
            const result = await validateBeforeSubmit(values);
            if (!result.valid) {
                return;
            }
        }

        resolve(values);
        useDialogStore.getState().closeDialog(dialogId);
    };

    const cancelFormDialog = () => {
        resolve(null);
        useDialogStore.getState().closeDialog(dialogId);
    }

    return (
        <Dialog open onOpenChange={() => cancelFormDialog()}>
            <form autoComplete="off">
                <DialogContent className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto w-full`} onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle><LocalizedText message={title ?? ""} /></DialogTitle>
                        <DialogDescription><LocalizedText message={description ?? ""} /></DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        {inputs.map((input: Field, i: number) => (
                            <FieldRenderer key={input.id || i} input={input} value={values[input.name]} onChange={handleChange} />
                        ))}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={() => cancelFormDialog()}>
                                <LocalizedText message={cancelText ?? ""} />
                            </Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSubmit}><LocalizedText message={okText ?? ""} /></Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}

const getInitialValues = (inputs: readonly Field[]): Record<string, any> => {
    const values: Record<string, any> = {};
    for (const f of inputs) {
        if (f.type === "group") {
            values[f.name] = f.defaultValue ?? getInitialValues(f.inputs);
        } else if (f.defaultValue !== undefined) {
            values[f.name] = f.defaultValue;
        }
    }
    return values;
};

const GroupField = ({ field, value = {}, onChange }: { field: GroupFieldInput; value: Record<string, any>; onChange: (fieldName: string, val: any) => void }) => {
    const { orientation = "vertical", visible = true, inputs, name, label } = field;

    const handleChildChange = (childName: string, childValue: any) => {
        const newValue = { ...value, [childName]: childValue };
        onChange(name, newValue);
    };

    const layoutClasses = orientation === "horizontal" ? "flex flex-row gap-4 items-start h-full" : "flex flex-col gap-4";

    const content = (
        <div className={layoutClasses}>
            {inputs.map((subInput, i) => (
                <div key={subInput.id || i} className={orientation === "horizontal" ? "flex-1 h-full" : "w-full"}>
                    <FieldRenderer input={subInput} value={value[subInput.name]} onChange={handleChildChange} />
                </div>
            ))}
        </div>
    );

    if (!visible) {
        return content;
    }

    return (
        <div className="relative mt-3 rounded-md border border-foreground/40 p-4 pt-6 h-full">
            <label className="absolute -top-2.5 left-3 bg-surface-overlay px-1 text-sm font-semibold text-foreground"><LocalizedText message={label} /></label>
            {content}
        </div>
    );
};

const FieldRenderer = ({ input, value, onChange }: { input: Field; value: any; onChange: (fieldName: string, val: any) => void }) => {
    switch (input.type) {
        case "text":
            return <TextInputField {...input} value={value} handleChange={onChange} />;
        case "number":
            return <NumberInputField {...input} value={value} handleChange={onChange} />;
        case "folderPath":
            return <FolderPickerField {...input} value={value} handleChange={onChange} />;
        case "filePath":
            return <FilePickerField {...input} value={value} handleChange={onChange} />;
        case "group":
            return <GroupField field={input} value={value} onChange={onChange} />;
        case "checkbox":
            const handleChange = (checked: boolean) => onChange(input.name, checked);
            return <CheckBoxField {...input} value={value} handleChange={handleChange} />;
        case "color":
            return <ColorPickerField {...input} value={value} onChange={onChange} />;
        default:
            return null;
    }
};

const sizeClasses: Record<string, string> = {
    "sm": "sm:max-w-[425px]",
    "md": "sm:max-w-[600px]",
    "lg": "sm:max-w-[800px]",
    "xl": "sm:max-w-[950px]",
    "2xl": "sm:max-w-[1100px]",
};
