'use client';

import { useDocumentsStore } from '@/store/documents';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MultiDocSelector() {
  const documents = useDocumentsStore((s) => s.documents).filter((d) => d.status === 'COMPLETED');
  const selectedIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const toggleSelectDocument = useDocumentsStore((s) => s.toggleSelectDocument);

  if (documents.length === 0) {
    return <div className="text-[11px] text-text-muted italic px-2">No documents available. Upload in Documents tab.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        data-testid="select-all-docs-button"
        onClick={() => {
          if (selectedIds.length === 0) {
            useDocumentsStore.getState().selectAllDocuments();
          } else {
            useDocumentsStore.getState().deselectAllDocuments();
          }
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors",
          selectedIds.length === 0
            ? "bg-bg-elevated border-border/60 text-text-muted hover:border-border hover:text-text-primary"
            : "bg-accent-violet/10 border-accent-violet text-accent-violet"
        )}
      >
        {selectedIds.length === 0 ? "Select All" : "Clear All"}
      </button>
      {documents.map((doc) => {
        const isSelected = selectedIds.includes(doc.id);
        return (
          <button
            key={doc.id}
            data-testid={`doc-chip-${doc.id}`}
            onClick={() => toggleSelectDocument(doc.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors",
              isSelected 
                ? "bg-accent-violet/10 border-accent-violet text-accent-violet" 
                : "bg-bg-elevated border-border/60 text-text-muted hover:border-border hover:text-text-primary"
            )}
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[150px]">{doc.name}</span>
          </button>
        );
      })}
    </div>
  );
}
