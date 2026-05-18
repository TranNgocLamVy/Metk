import { Field, FormDialogOptions } from "@/shared/types/form-dialog";

export class FormUtils {
    public static createForm<const I extends readonly Field[]>(opts: FormDialogOptions<I>) {
        return opts;
    }
}