import { Boxes, ChevronDown, ChevronRight, Eye, EyeOff, Folder, FolderOpen, Grid, Image, LockKeyhole, LockOpen } from "lucide-react";
import { DragEvent, MouseEvent, useEffect, useRef, useState } from "react";

import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { DropPosition, LayerView, useLayerManagerStore } from "@/ui/stores/layer-manager.store";

import { PropertyUpdateMeta } from "@/editor/model/base-object";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Button } from "@/ui/components/shadcn/button";
import { usePropertyStore } from "@/ui/stores/property.store";


const RENAME_INPUT_FOCUS_DELAY_MS = 100;
const DROP_EDGE_THRESHOLD_RATIO = 0.25;
const DROP_BOTTOM_THRESHOLD_RATIO = 0.75;
const LAYER_DEPTH_INDENT_PX = 20;
const ROOT_LAYER_INDENT_PX = 10;
const DROP_BORDER_WIDTH_PX = 2;
const DROP_HIGHLIGHT_COLOR = "#3b82f6";
const TRANSPARENT_DROP_BORDER = `${DROP_BORDER_WIDTH_PX}px solid transparent`;
const DROP_HIGHLIGHT_BORDER = `${DROP_BORDER_WIDTH_PX}px solid ${DROP_HIGHLIGHT_COLOR}`;
const DROP_HIGHLIGHT_OUTLINE = `${DROP_BORDER_WIDTH_PX}px dashed ${DROP_HIGHLIGHT_COLOR}`;
const TRANSPARENT_DROP_OUTLINE = `${DROP_BORDER_WIDTH_PX}px dashed transparent`;
const DROP_OUTLINE_OFFSET = `-${DROP_BORDER_WIDTH_PX}px`;

type LayerNodeRowProps = {
	view: LayerView;
	isSelected: boolean;
	updatedLayerView: () => void;
};

export default function LayerNodeRow({ view, isSelected, updatedLayerView }: LayerNodeRowProps) {
	const { editingId, selectedLayers, setEditingId } = useLayerManagerStore();
	const { setObjectId } = usePropertyStore();

	const layer = view.layer;
	const isGroup = layer instanceof GroupLayer;
	const isRenaming = editingId === layer.id;

	useEffect(() => {
		const onUpdate = (key: string, _value: unknown, meta?: PropertyUpdateMeta) => {
			if (meta?.origin === "preview") return;
			if (key !== "name" && key !== "_visible" && key !== "visible" && key !== "_locked" && key !== "locked" && key !== "isOpen") {
				return;
			}

			updatedLayerView();
		};

		layer.eventEmitter.on("updateProperty", onUpdate);

		return () => {
			layer.eventEmitter.off("updateProperty", onUpdate);
		};
	}, [layer, updatedLayerView]);

	const isRenameByUI = useRef(false);
	const [dragOverPos, setDragOverPos] = useState<DropPosition | null>(null);

	const handleClick = (e: MouseEvent) => {
		e.stopPropagation();
		setObjectId(layer.objectId);
		TilemapLayerActions.selectLayer(layer.id, e.ctrlKey || e.metaKey);
	};

	const handleDoubleClick = (e: MouseEvent) => {
		e.stopPropagation();
		setEditingId(layer.id);
		isRenameByUI.current = true;
	};

	// Drag Handlers
	const handleDragStart = (e: DragEvent) => {
		let idsToDrag = [layer.id];

		if (!isSelected) {
			TilemapLayerActions.selectLayer(layer.id, false);
			idsToDrag = [layer.id];
		} else {
			idsToDrag = Array.from(selectedLayers);
		}

		e.dataTransfer.setData("application/json", JSON.stringify({ ids: idsToDrag }));
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const rect = e.currentTarget.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const height = rect.height;

		if (y < height * DROP_EDGE_THRESHOLD_RATIO) {
			setDragOverPos("top");
		} else if (y > height * DROP_BOTTOM_THRESHOLD_RATIO) {
			setDragOverPos("bottom");
		} else {
			if (isGroup) {
				setDragOverPos("inside");
			} else {
				setDragOverPos("bottom");
			}
		}
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOverPos(null);
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOverPos(null);

		const data = e.dataTransfer.getData("application/json");
		if (!data) return;

		try {
			const { ids } = JSON.parse(data); // Expect array of IDs
			if (Array.isArray(ids) && ids.length > 0 && dragOverPos) {
				TilemapLayerActions.moveLayers(ids, layer.id, dragOverPos);
			}
		} catch (err) {
			console.error("Drop error:", err);
		}
	};

	const onContextMenu = (e: MouseEvent) => {
		if (!selectedLayers.includes(layer.id)) {
			TilemapLayerActions.selectLayer(layer.id, e.ctrlKey || e.metaKey);
		}
	};

	// Styles for Drop Feedback
	const getOuterDropStyle = () => {
		if (!dragOverPos) return { borderTop: TRANSPARENT_DROP_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "top") return { borderTop: TRANSPARENT_DROP_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "bottom") return { borderBottom: TRANSPARENT_DROP_BORDER, borderTop: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "inside") return { outline: DROP_HIGHLIGHT_OUTLINE, outlineOffset: DROP_OUTLINE_OFFSET, borderTop: TRANSPARENT_DROP_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		return {};
	};

	const getInnerDropStyle = () => {
		if (!dragOverPos) return { borderTop: TRANSPARENT_DROP_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "top") return { borderTop: DROP_HIGHLIGHT_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "bottom") return { borderBottom: DROP_HIGHLIGHT_BORDER, borderTop: TRANSPARENT_DROP_BORDER };
		if (dragOverPos === "inside") return { outline: TRANSPARENT_DROP_OUTLINE, outlineOffset: DROP_OUTLINE_OFFSET, borderTop: TRANSPARENT_DROP_BORDER, borderBottom: TRANSPARENT_DROP_BORDER };
		return {};
	}

	const getIcon = () => {
		if (layer instanceof TileLayer) return <Grid size={16} className="text-emerald-500" />;
		if (layer instanceof RuleLayer) return <Grid size={16} className="text-yellow-300" />;
		if (layer instanceof GroupLayer) return layer.isOpen ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-500" />;
		if (layer instanceof ImageLayer) return <Image size={16} className="text-fuchsia-500" />;
		if (layer instanceof EntityLayer) return <Boxes size={16} className="text-cyan-400" />;
		return null
	}

	return (
		<div draggable={!isRenaming} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick} onContextMenu={onContextMenu} className={`pr-2 w-full h-full group ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`} style={{ paddingLeft: view.depth * LAYER_DEPTH_INDENT_PX + ROOT_LAYER_INDENT_PX, ...getOuterDropStyle() }}>
			<div style={{ ...getInnerDropStyle() }} className="flex items-center gap-2">
				{isGroup ? (
					<div className="w-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); TilemapLayerActions.toggleOpenGroupLayer(layer.id) }}>
						{(layer as GroupLayer).isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
					</div>
				) : (
					<div className="w-4" />
				)}
				{/* Icon */}
				<div>
					{getIcon()}
				</div>
				{isRenaming ? (
					<RenameLayerInput layerId={layer.id} initialName={layer.name} isRenameByUIRef={isRenameByUI} />
				) : (
					<span onDoubleClick={handleDoubleClick} className="truncate text-xs font-medium border border-transparent flex-1">{layer.name}</span>
				)}
				<Button
					variant={"ghost"}
					size={"icon-xs"}
					className={`ml-auto hover:bg-white/20 ${isSelected && "text-accent-foreground"}`}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						TilemapLayerActions.toggleVisibility([layer.id]);
					}}>
					{layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
				</Button>
				<Button
					variant={"ghost"}
					size={"icon-xs"}
					className={`hover:bg-white/20 ${isSelected && "text-accent-foreground"}`}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						TilemapLayerActions.toggleLock([layer.id]);
					}}>
					{layer.locked ? <LockKeyhole size={16} /> : <LockOpen size={16} />}
				</Button>
			</div>
		</div>
	);
}

type RenameLayerInputProps = {
	layerId: string;
	initialName: string;
	isRenameByUIRef: React.MutableRefObject<boolean>;
};

export function RenameLayerInput({ layerId, initialName, isRenameByUIRef }: RenameLayerInputProps) {
	const store = useLayerManagerStore();
	const [tempName, setTempName] = useState(initialName);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const timeOut = setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.focus();
				inputRef.current.select();
			}
		}, RENAME_INPUT_FOCUS_DELAY_MS);
		return () => clearTimeout(timeOut);
	}, []);

	const handleRename = () => {
		if (tempName.trim()) {
			TilemapLayerActions.renameLayer(layerId, tempName, isRenameByUIRef.current);
		}
		isRenameByUIRef.current = false;
		store.setEditingId(null);
	};

	return (
		<input
			ref={inputRef}
			value={tempName}
			onChange={(e) => setTempName(e.target.value)}
			onBlur={handleRename}
			onKeyDown={(e) => {
				if (e.key === "Enter") handleRename();
				if (e.key === "Escape") store.setEditingId(null);
			}}
			onClick={(e) => e.stopPropagation()}
			className="truncate w-40 text-xs border bg-surface-base/50"
		/>
	);
}
