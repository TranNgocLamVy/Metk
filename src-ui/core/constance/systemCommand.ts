
export const CommandId = {
    ProjectSave: "project.save",
    ProjectUndo: "project.undo",
    ProjectRedo: "project.redo",
} as const;
export type CommandIdTypes = typeof CommandId[keyof typeof CommandId];