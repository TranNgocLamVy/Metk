import { Field, FormDialogOptions } from "@/shared/types/form-dialog";

export function createForm<const I extends readonly Field[]>(opts: FormDialogOptions<I>) {
    return opts;
}