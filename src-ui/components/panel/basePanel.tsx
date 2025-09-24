import { IDockviewPanelProps } from "dockview";

export abstract class BasePanel {
	public abstract id: string;
	public abstract title: string;
	public abstract component: React.FC<IDockviewPanelProps>;
}

type PanelWrapperProps = {
	dock: BasePanel;
};

export function PanelWrapper(props: IDockviewPanelProps<PanelWrapperProps>) {
	const Component = props.params.dock.component;
	return (
		<div className="h-full overflow-hidden relative">
			<Component {...props} />
		</div>
	);
}

export const PanelComponents = {
    default: PanelWrapper,
} as const;
