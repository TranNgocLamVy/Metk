import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Tooltip, TooltipContent } from "@/components/shadcn/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { open } from "@tauri-apps/plugin-dialog";

type FolderPickerProps = {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultValue?: string;
	required?: boolean;
	value: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
};

export default function FolderPickerField(props: FolderPickerProps) {
	const { id, name, label, placeholder, defaultValue, required, value, handleChange } = props;

	const selectFolder = async () => {
		const path = await open({
			directory: true, // Only allow selecting directories
			multiple: false, // Prevent multiple selection
		});
		if (path) handleChange?.(name, path);
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case "Enter":
				if (!value) {
                    selectFolder();
                    e.preventDefault();
                }
				break;
			case "ArrowRight":
			case "ArrowLeft":
            case "Tab":
				break;
            default:
                e.preventDefault();
		}
	};

	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Input id={id} name={name} type="text" placeholder={placeholder} defaultValue={value ?? ""} required={required} className="w-full cursor-pointer" onClick={selectFolder} onKeyDown={onKeyDown} />
				</TooltipTrigger>
				{value && (
					<TooltipContent side="bottom">
						<p>{value}</p>
					</TooltipContent>
				)}
			</Tooltip>
		</div>
	);
}
