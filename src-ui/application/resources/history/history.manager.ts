import { BatchCommand } from "@/application/commands/batch.command";
import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class HistoryManager {
    private undoStack: IBaseCommand[] = [];
    private redoStack: IBaseCommand[] = [];
    private readonly limit: number;
    
    private isTransactionActive: boolean = false;
    private currentBatch: IBaseCommand[] = [];

    public onStateChange?: () => void;

    constructor(limit: number = 50) {
        this.limit = limit;
    }

    public execute(command: IBaseCommand, editorFacade: EditorFacade) {
        command.execute(editorFacade);
        if (this.isTransactionActive) {
            this.currentBatch.push(command);
        } else {
            this.pushToUndoStack(command);
        }
        
        this.notifyUI();
    }

    public startTransaction() {
        if (this.isTransactionActive) {
            console.warn("Transaction already active! Nested transactions not supported yet.");
            return;
        }
        this.isTransactionActive = true;
        this.currentBatch = [];
    }

    public commitTransaction() {
        if (!this.isTransactionActive) return;

        if (this.currentBatch.length > 0) {
            const batchCmd = new BatchCommand([...this.currentBatch]);
            this.pushToUndoStack(batchCmd);
        }

        this.isTransactionActive = false;
        this.currentBatch = [];
        this.notifyUI();
    }

    public cancelTransaction(editorFacade: EditorFacade) {
        if (!this.isTransactionActive) return;

        [...this.currentBatch].reverse().forEach(cmd => cmd.undo(editorFacade));

        this.isTransactionActive = false;
        this.currentBatch = [];
        this.notifyUI();
    }

    public undo(editorFacade: EditorFacade) {
        if (this.undoStack.length === 0) return;

        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo(editorFacade);
            this.redoStack.push(cmd);
            this.notifyUI();
        }
    }

    public redo(editorFacade: EditorFacade) {
        if (this.redoStack.length === 0) return;

        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.execute(editorFacade);
            this.undoStack.push(cmd);
            this.notifyUI();
        }
    }

    public pushToUndoStack(cmd: IBaseCommand) {
        this.undoStack.push(cmd);
        this.redoStack = [];
        
        if (this.undoStack.length > this.limit) {
            const cmd = this.undoStack.shift();
            if (cmd) cmd.delete();
        }
    }

    private notifyUI() {
        if (this.onStateChange) this.onStateChange();
    }

    // Getters cho UI
    public get canUndo() { return this.undoStack.length > 0; }
    public get canRedo() { return this.redoStack.length > 0; }
}