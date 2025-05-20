import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // "default" | "destructive"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border-0">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              variant === "destructive" 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 