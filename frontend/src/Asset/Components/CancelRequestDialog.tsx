import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Spinner,
  Text,
  Textarea,
} from "@fluentui/react-components";
import { useThemedMountNode } from "../../Common/useThemedMountNode";

interface CancelRequestDialogProps {
  open: boolean;
  requestLabel?: string | null;
  onOpenChange: (open: boolean) => void;
  // Resolves when the cancellation succeeds; a rejection keeps the dialog open
  // so the caller can surface the error and the user can retry.
  onConfirm: (reason: string) => Promise<void>;
}

// Shared confirmation used by every request type (asset, upgrade, repair,
// lost, handover) so a requestor can withdraw a request that hasn't been
// closed yet. The reason is optional and recorded on the request.
const CancelRequestDialog: React.FC<CancelRequestDialogProps> = ({ open, requestLabel, onOpenChange, onConfirm }) => {
  const { mountNode, portal } = useThemedMountNode();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch {
      // Caller reports the error.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {portal}
      <Dialog open={open} onOpenChange={(_, d) => !submitting && onOpenChange(d.open)}>
        <DialogSurface mountNode={mountNode} style={{ borderRadius: "20px", width: "480px", maxWidth: "calc(100vw - 32px)" }}>
          <DialogBody>
            <DialogTitle>Cancel Request{requestLabel ? ` · ${requestLabel}` : ""}</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Text size={300} style={{ color: "#64748B" }}>
                Are you sure you want to cancel this request? This cannot be undone.
              </Text>
              <Field label="Reason (optional)">
                <Textarea
                  placeholder="Let us know why you're cancelling this request..."
                  value={reason}
                  onChange={(_, d) => setReason(d.value)}
                  rows={3}
                  resize="vertical"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                style={{ whiteSpace: "nowrap" }}
              >
                Keep Request
              </Button>
              <Button
                appearance="primary"
                onClick={handleConfirm}
                disabled={submitting}
                icon={submitting ? <Spinner size="tiny" /> : undefined}
                style={{ background: "#DC2626", borderColor: "#DC2626", whiteSpace: "nowrap" }}
              >
                Cancel Request
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default CancelRequestDialog;
