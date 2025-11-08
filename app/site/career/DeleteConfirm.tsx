import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
    open: boolean;
    onCancelAction: () => void;
    onConfirmAction: () => void;
    loading?: boolean;
};

export default function DeleteConfirm({ open, onCancelAction, onConfirmAction, loading = false }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onCancelAction}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this career opportunity
                        from the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer" disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirmAction}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white cursor-pointer"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
