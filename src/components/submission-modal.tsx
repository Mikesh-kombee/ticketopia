
"use client";

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
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onGoToDashboard: () => void; // No longer needed as we directly navigate
  // onCreateAnother: () => void; // No longer needed as we directly navigate
}

export function SubmissionModal({
  isOpen,
  onClose,
}: SubmissionModalProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    onClose(); // Close the modal first
    router.push("/"); // Navigate to dashboard home
  };

  const handleCreateAnother = () => {
    onClose(); // Close the modal first
    // Assuming the form reset logic is handled by the parent component or this action implies a page reload/navigation
    router.push("/tickets/create"); // Navigate to create ticket page
     // If the form needs to be reset specifically, the parent component should handle it on modal close or navigation.
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">Ticket Created Successfully!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your new ticket has been logged in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleCreateAnother}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Another Ticket
          </Button>
          <Button onClick={handleGoToDashboard}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
