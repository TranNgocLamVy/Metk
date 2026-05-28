import { BatchCommand } from "@/application/commands/batch.command";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

export class HistoryManager {
    private undoStack: IUndoableCommand[] = [];
    private redoStack: IUndoableCommand[] = [];
    private readonly limit: number;

    private isTransactionActive: boolean = false;
    private currentBatch: IUndoableCommand[] = [];

    public onStateChange?: () => void;

    constructor(limit: number = 50) {
        this.limit = limit;
    }

    public execute(command: IUndoableCommand, editorFacade: EditorFacade): Result {
        const result = command.execute(editorFacade);
        if (result.status !== Result.Status.Success) return result;

        if (this.isTransactionActive) {
            this.currentBatch.push(command);
        } else {
            this.pushToUndoStack(command);
        }

        this.notifyUI();
        return result;
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

        const hasCommands = this.currentBatch.length > 0;

        if (hasCommands) {
            const batchCmd = new BatchCommand([...this.currentBatch]);
            this.pushToUndoStack(batchCmd);
        }

        this.isTransactionActive = false;
        this.currentBatch = [];
        if (hasCommands) this.notifyUI();
    }

    public cancelTransaction(editorFacade: EditorFacade) {
        if (!this.isTransactionActive) return;

        const hasCommands = this.currentBatch.length > 0;

        [...this.currentBatch].reverse().forEach(cmd => cmd.undo(editorFacade));

        this.isTransactionActive = false;
        this.currentBatch = [];
        if (hasCommands) this.notifyUI();
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
            const result = cmd.redo ? cmd.redo(editorFacade) : cmd.execute(editorFacade);
    
            if (result.status !== Result.Status.Success) {
                this.redoStack.push(cmd);
                this.notifyUI();
                return;
            }
    
            this.undoStack.push(cmd);
            this.notifyUI();
        }
    }

    public pushToUndoStack(cmd: IUndoableCommand) {
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
