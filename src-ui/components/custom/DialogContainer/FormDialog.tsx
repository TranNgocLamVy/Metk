import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Fragment } from "react/jsx-runtime";

import { ToastService } from "@/appcore/services/ToastService";
import { Button } from "@/components/shadcn/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn/dialog";
import { useDialogStore } from "@/stores/menu/DialogStore";
import { Field } from "@/types/dialogs/formDialog";

import FilePickerField from "../Input/FilePicker/FilePicker";
import FolderPickerField from "../Input/FolderPicker/FolderPicker";
import { NumberInputField } from "../Input/NumberInput/NumberInput";
import { TextInputField } from "../Input/TextInput/TextInput";

export function FormDialog() {
	const [values, setValues] = useState<Record<string, any>>({});

	const formDialog = useDialogStore((s) => s.formDialog);

	useEffect(() => {
		if (!formDialog) {
			setValues({});
			return;
		}

		setValues(() => {
			const next: Record<string, any> = {};
			for (const f of formDialog.inputs as readonly Field[]) {
				const defVal = (f as any).defaultValue;
				if (defVal !== undefined) {
					next[f.name] = defVal;
					continue;
				}
			}
			return next;
		});
	}, [formDialog]);

	const handleChange = (fieldName: string, raw: unknown) => {
		setValues((prev) => {
			const spec = formDialog?.inputs.find((f: Field) => f.name === fieldName);
			let nextVal: any = raw;
			switch (spec?.type) {
				case "text":
					nextVal = raw;
					break;
				case "number": {
					if (typeof raw === "string") {
						const n = raw.trim() === "" ? NaN : Number(raw);
						nextVal = Number.isFinite(n) ? n : prev[fieldName] ?? 0;
					} else if (typeof raw === "number") {
                        nextVal = raw;
					}
					break;
				}
				case "boolean": {
					if (typeof raw === "string") {
						nextVal = raw === "true" ? true : raw === "false" ? false : Boolean(raw);
					} else {
						nextVal = Boolean(raw);
					}
					break;
				}
			}
			if (Object.is(prev[fieldName], nextVal)) return prev;
			return { ...prev, [fieldName]: nextVal };
		});
	};

	const closeFormDialog = useDialogStore((s) => s.closeFormDialog);
	const cancelFormDialog = useDialogStore((s) => s.cancelFormDialog);

	if (!formDialog) return null;

	const { title, description, okText = "OK", cancelText = "Cancel", inputs, validateBeforeSubmit } = formDialog;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const inputs = formDialog.inputs as Field[];
		for (const input of inputs) {
			if (input.validate) {
				const result = await input.validate(values[input.name]);
				if (!result.valid) {
					ToastService.warning({message: result.message});
					console.warn(`Validation failed for ${input.name}: ${result.message}`);
					return;
				}
			}
		}

		if (validateBeforeSubmit) {
            const result = await validateBeforeSubmit(values);
            if (!result.valid) {
                ToastService.warning({message: result.message});
                console.warn(result.message);
                return;
            }
		}

		closeFormDialog(values);
	};

	return (
		<Fragment>
			{createPortal(
				<Dialog defaultOpen onOpenChange={() => cancelFormDialog()}>
					<form onSubmit={handleSubmit} autoComplete="off">
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>{title}</DialogTitle>
								<DialogDescription>{description}</DialogDescription>
							</DialogHeader>
							{inputs.map((input: Field, i: number) => {
								switch (input.type) {
									case "text":
										return <TextInputField key={i} {...input} value={values[input.name]} handleChange={handleChange} />;
									case "number":
										return <NumberInputField key={i} {...input} value={values[input.name]} handleChange={handleChange} />;
                                    case "folderPath":
                                        return <FolderPickerField key={i} {...input} value={values[input.name]} handleChange={handleChange} />;
                                    case "filePath":
                                        return <FilePickerField key={i} {...input} value={values[input.name]} handleChange={handleChange} />;
								}
								// TODO: add other input renderers (NumberInputField, CheckboxField, etc.)
								return null;
							})}
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="outline" onClick={() => cancelFormDialog()}>
										{cancelText}
									</Button>
								</DialogClose>
								<Button type="submit">{okText}</Button>
							</DialogFooter>
						</DialogContent>
					</form>
				</Dialog>,
				document.body
			)}
		</Fragment>
	);
}
