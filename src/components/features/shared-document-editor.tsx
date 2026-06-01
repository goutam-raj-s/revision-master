"use client";

import * as React from "react";
import { RichTextEditorDynamic } from "@/components/features/editor/RichTextEditorDynamic";
import { updateDocumentContentViaShare } from "@/actions/shares";
import { toast } from "@/components/ui/toast";

interface SharedDocumentEditorProps {
  token: string;
  docId: string;
  initialContent: string;
  readOnly: boolean;
}

export function SharedDocumentEditor({
  token,
  docId,
  initialContent,
  readOnly,
}: SharedDocumentEditorProps) {
  const handleSave = React.useCallback(
    async (content: string) => {
      const result = await updateDocumentContentViaShare(token, docId, content);
      if (!result.success) {
        toast(result.error ?? "Failed to save", { variant: "error" });
        throw new Error(result.error);
      }
    },
    [token, docId]
  );

  return (
    <RichTextEditorDynamic
      initialContent={initialContent}
      readOnly={readOnly}
      onSave={readOnly ? undefined : handleSave}
    />
  );
}
