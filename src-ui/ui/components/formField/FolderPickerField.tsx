import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { Tooltip, TooltipContent } from "@/ui/components/shadcn/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useTranslation } from "react-i18next";
import { LocalizedText } from "../custom/LocalizeText";

type FolderPickerProps = {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultDir?: string;
	required?: boolean;
	value: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
};

export default function FolderPickerField(props: FolderPickerProps) {
	const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, defaultDir, required, value, handleChange } = props;

	const selectFolder = async () => {
		const path = await FileDialogUtils.open({
			directory: true, // Only allow selecting directories
			defaultPath: defaultDir,
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
			<Label htmlFor={id}><LocalizedText message={label} /></Label>
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Input id={id} name={name} type="text" placeholder={translate(placeholder)} defaultValue={value ?? ""} required={required} className="w-full cursor-pointer caret-transparent" onClick={selectFolder} onKeyDown={onKeyDown} />
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
