import { MouseEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Fragment } from "react/jsx-runtime";

import { ToastService } from "@/shared/services/toastService";
import { Field, GroupFieldInput } from "@/shared/types/dialogs/formDialog";
import { Button } from "@/view/components/shadcn/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/view/components/shadcn/dialog";
import { useDialogStore } from "@/view/stores/menu/dialogStore";

import { CheckBoxField } from "../input/checkbox/checkbox";
import FilePickerField from "../input/filePicker/filePicker";
import FolderPickerField from "../input/folderPicker/folderPicker";
import { NumberInputField } from "../input/numberInput/numberInput";
import { TextInputField } from "../input/textInput/textInput";

// 1. Recursive Helper for Default Values
const getInitialValues = (inputs: readonly Field[]): Record<string, any> => {
	const values: Record<string, any> = {};
	for (const f of inputs) {
		if (f.type === "group") {
			// Recursively get defaults for children, or use the group's explicit default
			values[f.name] = f.defaultValue ?? getInitialValues(f.inputs);
		} else if (f.defaultValue !== undefined) {
			values[f.name] = f.defaultValue;
		}
	}
	return values;
};

// 2. The Group Component (Styled to match image)
// Inside FormDialog.tsx
const GroupField = ({ field, value = {}, onChange }: { field: GroupFieldInput; value: Record<string, any>; onChange: (fieldName: string, val: any) => void }) => {
	// 1. Destructure with defaults
	const { orientation = "vertical", visible = true, inputs, name, label } = field;

	// 2. Handle Child Changes
	const handleChildChange = (childName: string, childValue: any) => {
		const newValue = { ...value, [childName]: childValue };
		onChange(name, newValue);
	};

	// 3. Determine Layout Classes (Flex direction)
	const layoutClasses = orientation === "horizontal" ? "flex flex-row gap-4 items-start h-full" : "flex flex-col gap-4";

	// 4. Render the inner content (The Children)
	const content = (
		<div className={layoutClasses}>
			{inputs.map((subInput, i) => (
				<div key={subInput.id || i} className={orientation === "horizontal" ? "flex-1 h-full" : "w-full"}>
					<FieldRenderer input={subInput} value={value[subInput.name]} onChange={handleChildChange} />
				</div>
			))}
		</div>
	);

	// 5. Return based on Visibility
	// If visible is false, return content only (no border, no label)
	if (!visible) {
		return content;
	}

	// If visible is true (default), return with styled wrapper
	return (
		<div className="relative mt-3 rounded-md border border-input p-4 pt-6 h-full">
			<label className="absolute -top-2.5 left-3 bg-background px-1 text-sm font-semibold text-foreground">{label}</label>
			{content}
		</div>
	);
};

// 3. Recursive Field Renderer
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
            const handleChange = (checked: boolean) => {
                onChange(input.name, checked);
            }
            return <CheckBoxField {...input} value={value} handleChange={handleChange} />;
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

export function FormDialog() {
	const [values, setValues] = useState<Record<string, any>>({});
	const formDialog = useDialogStore((s) => s.formDialog);

	// Initialize values recursively
	useEffect(() => {
		if (!formDialog) {
			setValues({});
			return;
		}
		setValues(getInitialValues(formDialog.inputs));
	}, [formDialog]);

	// Handle updates (Top level)
	const handleChange = (fieldName: string, raw: unknown) => {
		setValues((prev) => {
			const spec = formDialog?.inputs.find((f: Field) => f.name === fieldName);
			let nextVal: any = raw;

			// Type coercion logic
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
				// 'group', 'text', 'filePath', etc. usually pass the correct type directly
				default:
					nextVal = raw;
					break;
			}

			if (Object.is(prev[fieldName], nextVal)) return prev;
			return { ...prev, [fieldName]: nextVal };
		});
	};

	const closeFormDialog = useDialogStore((s) => s.closeFormDialog);
	const cancelFormDialog = useDialogStore((s) => s.cancelFormDialog);

	if (!formDialog) return null;

	const { title, description, okText = "OK", cancelText = "Cancel", size = "md", inputs, validateBeforeSubmit } = formDialog;

	// Recursive validation helper
	const validateRecursive = async (inputList: readonly Field[], currentValues: Record<string, any>): Promise<boolean> => {
		for (const input of inputList) {
			const val = currentValues[input.name];

			// 1. Validate the field itself
			if (input.validate) {
				const result = await input.validate(val);
				if (!result.valid) {
					ToastService.warning({ message: result.message });
					return false;
				}
			}

			// 2. If it's a group, validate children recursively
			if (input.type === "group") {
				const validChildren = await validateRecursive(input.inputs, val || {});
				if (!validChildren) return false;
			}
		}
		return true;
	};

	const handleSubmit = async (e: MouseEvent) => {
		e.preventDefault();

		// 1. Run per-field validation (Recursive)
		const inputsValid = await validateRecursive(inputs, values);
		if (!inputsValid) return;

		// 2. Run form-level validation
		if (validateBeforeSubmit) {
			const result = await validateBeforeSubmit(values);
			if (!result.valid) {
				ToastService.warning({ message: result.message });
				return;
			}
		}

		closeFormDialog(values);
	};

	return (
		<Fragment>
			{createPortal(
				<Dialog defaultOpen onOpenChange={() => cancelFormDialog()}>
					<form autoComplete="off">
						{/* Apply the size class dynamically here.
                           We merge it with max-h and overflow settings to handle tall content gracefully.
                        */}
						<DialogContent className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto w-full`}>
							<DialogHeader>
								<DialogTitle>{title}</DialogTitle>
								<DialogDescription>{description}</DialogDescription>
							</DialogHeader>

							<div className="flex flex-col gap-4 py-4">
								{inputs.map((input: Field, i: number) => (
									<FieldRenderer key={input.id || i} input={input} value={values[input.name]} onChange={handleChange} />
								))}
							</div>

							<DialogFooter>
								<DialogClose asChild>
									<Button variant="outline" type="button" onClick={() => cancelFormDialog()}>
										{cancelText}
									</Button>
								</DialogClose>
								<Button type="button" onClick={handleSubmit}>{okText}</Button>
							</DialogFooter>
						</DialogContent>
					</form>
				</Dialog>,
				document.getElementById("main-container")!
			)}
		</Fragment>
	);
}
