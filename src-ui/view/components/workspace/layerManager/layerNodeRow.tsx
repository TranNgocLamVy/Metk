import { ChevronDown, ChevronRight, Eye, EyeOff, File, Folder, FolderOpen, Grid, Lock, LockKeyhole, LockOpen } from "lucide-react";
import { DragEvent, MouseEvent, useEffect, useRef, useState } from "react";

import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { DropPosition, LayerView, useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { Button } from "../../shadcn/button";

type LayerNodeRowProps = {
	view: LayerView;
	isSelected: boolean;
};

export default function LayerNodeRow({ view, isSelected }: LayerNodeRowProps) {
	const store = useLayerManagerStore();
	const editingId = useLayerManagerStore((s) => s.editingId);
	const selectedIds = useLayerManagerStore((s) => s.selectedIds);
	const layer = view.layer;
	const isGroup = layer instanceof GroupLayer;
	const isRenaming = editingId === layer.id;

	const [tempName, setTempName] = useState(layer.name);
	const [dragOverPos, setDragOverPos] = useState<DropPosition | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isRenaming) setTempName(layer.name);
	}, [isRenaming, layer.name]);

	const handleClick = (e: MouseEvent) => {
		e.stopPropagation();
        store.selectLayer(layer.id, e.ctrlKey || e.metaKey);
	};

	const handleDoubleClick = (e: MouseEvent) => {
		e.stopPropagation();
		store.setEditingId(layer.id);
	};

	const handleToggle = (e: MouseEvent) => {
		e.stopPropagation();
		if (isGroup) {
			(layer as GroupLayer).toggleOpen();
			store.refresh();
		}
	};

	const handleRename = () => {
		if (tempName.trim()) {
			layer.rename(tempName);
			store.refresh();
		}
		store.setEditingId(null);
	};

	// Drag Handlers
	const handleDragStart = (e: DragEvent) => {
		let idsToDrag = [layer.id];

		if (!isSelected) {
			// If dragging an unselected layer, select it exclusively
			store.selectLayer(layer.id, false);
			idsToDrag = [layer.id];
		} else {
			// If dragging a selected layer, drag all selected layers
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

		// Determine position: Top 25%, Bottom 25%, Middle 50%
		if (y < height * 0.25) {
			setDragOverPos("top");
		} else if (y > height * 0.75) {
			setDragOverPos("bottom");
		} else {
			if (isGroup) {
				setDragOverPos("inside");
			} else {
				setDragOverPos("bottom"); // Default to bottom for leaves
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
				store.moveLayers(ids, layer.id, dragOverPos);
			}
		} catch (err) {
			console.error("Drop error:", err);
		}
	};

    const onContextMenu = (e: MouseEvent) => {
        store.setTargetLayer(layer);
        if (!selectedIds.has(layer.id)) {
            store.selectLayer(layer.id, e.ctrlKey || e.metaKey);
        }
    };

	// Styles for Drop Feedback
	const getDropStyle = () => {
		if (!dragOverPos) return { borderTop: "2px solid transparent", borderBottom: "2px solid transparent" };
		if (dragOverPos === "top") return { borderTop: "2px solid #3b82f6", borderBottom: "2px solid transparent" };
		if (dragOverPos === "bottom") return { borderBottom: "2px solid #3b82f6", borderTop: "2px solid transparent" };
		if (dragOverPos === "inside") return { outline: "2px dashed #3b82f6", outlineOffset: "-2px", borderTop: "2px solid transparent", borderBottom: "2px solid transparent"  };
		return {};
	};

	return (
		<div draggable={!isRenaming} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick} onContextMenu={onContextMenu} className="flex items-center">
			<div style={{ paddingLeft: view.depth * 20 + 10, ...getDropStyle() }} className={`flex pr-1 items-center gap-2 w-full h-full py-1 ${isSelected ? "bg-select-color/50" : ""}`}>
				{isGroup ? (
                    <div className="w-4 cursor-pointer" onClick={handleToggle}>
                        {(layer as GroupLayer).isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
				) : (
					<div className="w-4" />
				)}
				{/* Icon */}
				<div className={`shrink-0 ${isGroup ? "text-blue-500" : "text-emerald-500"}`}>{isGroup ? (layer as GroupLayer).isOpen ? <FolderOpen size={16} /> : <Folder size={16} /> : <Grid size={16} />}</div>
				{isRenaming ? (
					<input
						ref={inputRef}
						value={tempName}
						onChange={(e) => setTempName(e.target.value)}
						onBlur={handleRename}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleRename();
							if (e.key === "Escape") store.setEditingId(null);
						}}
						autoFocus
						onClick={(e) => e.stopPropagation()}
						className="truncate min-w-0 flex-1 text-sm border rounded"
					/>
				) : (
					<span onDoubleClick={handleDoubleClick} className="truncate text-sm font-medium border border-transparent flex-1">{layer.name}</span>
				)}
				<Button
					variant={"ghost"}
					size={"icon-xs"}
                    className="hover:bg-white/20"
					onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
						store.toggleVisibility([layer.id]);
					}}>
					{layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
				</Button>
				<Button
					variant={"ghost"}
					size={"icon-xs"}
                    className="hover:bg-white/20"
					onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
						store.toggleLock([layer.id]);
					}}>
					{layer.locked ? <LockKeyhole size={14} /> : <LockOpen size={14} />}
				</Button>
			</div>
		</div>
	);
}
