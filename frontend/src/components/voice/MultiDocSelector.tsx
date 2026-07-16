'use client';

import { useDocumentsStore } from '@/store/documents';
import { Search, Square, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MultiDocSelector() {
  const [searchQuery, setSearchQuery] = useState('');
  const documents = useDocumentsStore((s) => s.documents).filter((d) => d.status === 'COMPLETED');
  const selectedIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const toggleSelectDocument = useDocumentsStore((s) => s.toggleSelectDocument);
  const selectAll = useDocumentsStore((s) => s.selectAllDocuments);
  const deselectAll = useDocumentsStore((s) => s.deselectAllDocuments);

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (documents.length === 0) {
    return <div className="text-[11px] text-text-muted italic px-2">No documents available. Upload in Documents tab.</div>;
  }

  return (
    <div className="flex flex-col border border-border/60 bg-bg-base/50 rounded-lg overflow-hidden">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 bg-bg-elevated/40">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          {selectedIds.length} Selected
        </span>
        <div className="flex items-center gap-2">
          <button
            data-testid="select-all-docs-button"
            type="button"
            onClick={() => {
              if (selectedIds.length === 0) {
                selectAll();
              } else {
                deselectAll();
              }
            }}
            className="text-[10px] font-semibold text-accent-primary hover:underline"
          >
            {selectedIds.length === 0 ? "Select All" : "Clear All"}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative p-2 border-b border-border/60">
        <Search className="absolute left-4 top-3.5 h-3 w-3 text-text-muted" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-[11px] rounded border border-border/60 bg-bg-elevated focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-primary placeholder:text-text-muted/60"
        />
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin max-h-40 min-h-[100px]">
        {filteredDocs.length === 0 ? (
          <p className="text-center text-xs text-text-muted py-4">No matching documents.</p>
        ) : (
          filteredDocs.map((doc) => {
            const checked = selectedIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                data-testid={`doc-chip-${doc.id}`}
                onClick={() => toggleSelectDocument(doc.id)}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-elevated cursor-pointer transition-colors"
              >
                {checked ? (
                  <CheckSquare className="h-4 w-4 shrink-0 text-accent-primary" />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-text-muted" />
                )}
                <span className="truncate text-xs font-medium text-text-primary" title={doc.name}>
                  {doc.name}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
