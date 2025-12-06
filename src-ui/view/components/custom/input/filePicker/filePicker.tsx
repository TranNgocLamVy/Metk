import { FileFilter } from "@/shared/types/dialogs/formDialog";
import { FileDialogUtils } from "@/shared/utils/fileDialogUtils";
import { Input } from "@/view/components/shadcn/input";
import { Label } from "@/view/components/shadcn/label";
import { Tooltip, TooltipContent } from "@/view/components/shadcn/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

type FilePickerProps = {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultValue?: string;
	required?: boolean;
	multiple?: boolean;
    filter?: FileFilter;
	value: string[];
	handleChange?: (fieldName: string, raw: unknown) => void;
};

export default function FilePickerField(props: FilePickerProps) {
	const { id, name, label, placeholder, defaultValue, required, multiple, filter, value, handleChange } = props;

	const selectFile = async () => {
		const path = await FileDialogUtils.open({
            directory: false, // Only allow selecting files
            multiple: multiple ?? false, // Prevent multiple selection
            filters: filter ? [
                {
                    name: filter.name,
                    extensions: filter.extensions,
                },
            ] : undefined,
        });
        if (!path) return;
        if (Array.isArray(path)) {
            handleChange?.(name, path);
        } else {
            handleChange?.(name, [path]);
        }
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		if (value) return;
		switch (e.key) {
			case "Enter":
				selectFile();
				break;
		}
	};

    const inputValue = value ? (value.length > 0 ? value[0] : "") : "";

	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Input id={id} name={name} type="text" placeholder={placeholder} defaultValue={inputValue} required={required} className="w-full cursor-pointer caret-transparent" onClick={selectFile} onKeyDown={onKeyDown} />
				</TooltipTrigger>
				{value && (
					<TooltipContent side="bottom">
						{value.map((v, i) => <p key={i}>{v}</p>)}
					</TooltipContent>
				)}
			</Tooltip>
		</div>
	);
}
