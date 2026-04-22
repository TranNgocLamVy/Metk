import { ChevronDown, ChevronRight, Eye, EyeOff, File, Folder, FolderOpen, Grid, Lock, LockKeyhole, LockOpen } from "lucide-react";
import { DragEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { DropPosition, LayerView, useLayerManagerStore } from "@/view/stores/layerManagerStore";

import { Button } from "../../shadcn/button";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";

type LayerNodeRowProps = {
	view: LayerView;
	isSelected: boolean;
};

export default function LayerNodeRow({ view, isSelected }: LayerNodeRowProps) {
	const { version, editingId, getSelectedLayers, setEditingId, setTargetLayer, refresh } = useLayerManagerStore();

	const selectedIds = useMemo(() => getSelectedLayers(), [version]);

	const layer = view.layer;
	const isGroup = layer instanceof GroupLayer;
	const isRenaming = editingId === layer.id;

    const isRenameByUI = useRef(false);
	const [dragOverPos, setDragOverPos] = useState<DropPosition | null>(null);

	const handleClick = (e: MouseEvent) => {
		e.stopPropagation();
        TilemapLayerService.selectLayer(layer.id, e.ctrlKey || e.metaKey);
	};

	const handleDoubleClick = (e: MouseEvent) => {
		e.stopPropagation();
		setEditingId(layer.id);
        isRenameByUI.current = true;
	};

	const handleToggle = (e: MouseEvent) => {
		e.stopPropagation();
		if (isGroup) {
			(layer as GroupLayer).toggleOpen();
			refresh();
		}
	};

	// Drag Handlers
	const handleDragStart = (e: DragEvent) => {
		let idsToDrag = [layer.id];

		if (!isSelected) {
			TilemapLayerService.selectLayer(layer.id, false);
			idsToDrag = [layer.id];
		} else {
			idsToDrag = Array.from(selectedIds);
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

		if (y < height * 0.25) {
			setDragOverPos("top");
		} else if (y > height * 0.75) {
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
				TilemapLayerService.moveLayers(ids, layer.id, dragOverPos);
			}
		} catch (err) {
			console.error("Drop error:", err);
		}
	};

    const onContextMenu = (e: MouseEvent) => {
        setTargetLayer(layer);
        if (!selectedIds.includes(layer.id)) {
            TilemapLayerService.selectLayer(layer.id, e.ctrlKey || e.metaKey);
        }
    };

	// Styles for Drop Feedback
	const getOuterDropStyle = () => {
		if (!dragOverPos) return { borderTop: "2px solid transparent", borderBottom: "2px solid transparent" };
		if (dragOverPos === "top") return { borderTop: "2px solid transparent", borderBottom: "2px solid transparent" };
		if (dragOverPos === "bottom") return { borderBottom: "2px solid transparent", borderTop: "2px solid transparent" };
		if (dragOverPos === "inside") return { outline: "2px dashed #3b82f6", outlineOffset: "-2px", borderTop: "2px solid transparent", borderBottom: "2px solid transparent"  };
		return {};
	};

    const getInnerDropStyle = () => {
        if (!dragOverPos) return { borderTop: "2px solid transparent", borderBottom: "2px solid transparent" };
		if (dragOverPos === "top") return { borderTop: "2px solid #3b82f6", borderBottom: "2px solid transparent" };
		if (dragOverPos === "bottom") return { borderBottom: "2px solid #3b82f6", borderTop: "2px solid transparent" };
		if (dragOverPos === "inside") return { outline: "2px dashed transparent", outlineOffset: "-2px", borderTop: "2px solid transparent", borderBottom: "2px solid transparent"  };
		return {};
    }

	const getIcon = () => {
		if (layer instanceof TileLayer) return <Grid size={16} className="text-emerald-500" />;
		if (layer instanceof RuleLayer) return <Grid size={16} className="text-yellow-300" />;
		if (layer instanceof GroupLayer) return layer.isOpen ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-500" />;
		return null
	}

	return (
		<div draggable={!isRenaming} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick} onContextMenu={onContextMenu} className={`pr-2 w-full h-full group ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`} style={{paddingLeft: view.depth * 20 + 10, ...getOuterDropStyle()}}>
			<div style={{ ...getInnerDropStyle() }} className="flex items-center gap-2">
				{isGroup ? (
                    <div className="w-4 cursor-pointer" onClick={handleToggle}>
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
                        TilemapLayerService.toggleVisibility([layer.id]);
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
                        TilemapLayerService.toggleLock([layer.id]);
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
		}, 100);
		return () => clearTimeout(timeOut);
	}, []);

	const handleRename = () => {
		if (tempName.trim()) {
			TilemapLayerService.renameLayer(layerId, tempName, isRenameByUIRef.current);
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
