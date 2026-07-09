import type { DiscoveredExampleProjectTemplate } from "@/application/templates/example-project.types";
import { Button } from "@/ui/components/shadcn/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/components/shadcn/dialog";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { useDialogActions } from "@/ui/stores/dialog.store";
import type { BaseDialogProps } from "@/ui/components/dialog/dialogRegistry";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";

type ExampleProjectTemplateDialogProps = BaseDialogProps & {
    templates: DiscoveredExampleProjectTemplate[];
    resolve: (templateId: string | null) => void;
};

export function ExampleProjectTemplateDialog({
    dialogId,
    templates,
    resolve,
}: ExampleProjectTemplateDialogProps) {
    const { closeDialog } = useDialogActions();

    const close = (templateId: string | null) => {
        resolve(templateId);
        closeDialog(dialogId);
    };

    return (
        <Dialog open onOpenChange={() => close(null)}>
            <DialogContent
                className="sm:max-w-[600px] max-h-[90vh] w-full overflow-y-auto p-3"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        <p className="text-md font-medium"><LocalizedText message="dialog.exampleProjectTemplate.title" /></p>
                    </DialogTitle>
                    <DialogDescription>
                        <LocalizedText message="dialog.exampleProjectTemplate.description" />
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="min-h-0">
                    <div className="flex flex-col gap-2 py-1">
                        {templates.map((template) => (
                            <button
                                key={template.manifest.id}
                                type="button"
                                onClick={() => close(template.manifest.id)}
                                className="w-full rounded-md border border-border bg-surface-sunken p-3 text-left hover:bg-surface-raised"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-medium text-foreground">
                                        {template.manifest.name}
                                    </h3>
                                    <span className="text-2xs text-muted-foreground">
                                        {template.manifest.templateVersion}
                                    </span>
                                </div>

                                {template.manifest.description && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {template.manifest.description}
                                    </p>
                                )}

                                {template.manifest.tags && template.manifest.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {template.manifest.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-sm border border-border px-1.5 py-0.5 text-2xs text-muted-foreground"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            onClick={() => close(null)}
                        >
                            <LocalizedText message="global.action.cancel" />
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
