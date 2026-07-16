'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useDocumentPolling } from '@/hooks/useDocumentPolling';
import { useDocumentsStore, DocumentItem } from '@/store/documents';
import { useGraphStore } from '@/store/graph';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentRow } from '@/components/documents/DocumentRow';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Layers, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphData } from '@/hooks/useGraphData';

export default function DocumentsPage() {
  useGraphData(); // Keep graph data updated
  
  const documents = useDocumentsStore((s) => s.documents);
  const selectedIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const toggleSelectDocument = useDocumentsStore((s) => s.toggleSelectDocument);
  const graphData = useGraphStore((s) => s.data);
  const [notice, setNotice] = useState('');
  const [selectedDetailDoc, setSelectedDetailDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const completed = documents.filter((d) => d.status === 'COMPLETED').length;

  async function deleteDocument(id: string) {
    try {
      await api.delete(`/documents/${id}/`);
      
      // Update documents list
      useDocumentsStore.getState().setDocuments(
        useDocumentsStore.getState().documents.filter((d) => d.id !== id)
      );

      // Deselect if currently selected
      const store = useDocumentsStore.getState();
      if (store.selectedDocumentIds.includes(id)) {
        store.toggleSelectDocument(id);
      }

      // Close details panel if this document was open
      if (selectedDetailDoc?.id === id) {
        setSelectedDetailDoc(null);
      }

      setNotice('Document successfully deleted.');
    } catch {
      setNotice('Could not delete the document. Please try again.');
    }
    setTimeout(() => setNotice(''), 4000);
  }

  async function retryDocument(id: string) {
    try {
      await api.delete(`/documents/${id}/`);
      useDocumentsStore.getState().setDocuments(
        useDocumentsStore.getState().documents.filter((d) => d.id !== id)
      );
      setNotice('Failed document removed — please re-upload to retry.');
    } catch {
      setNotice('Could not remove the document. Please try again.');
    }
    setTimeout(() => setNotice(''), 4000);
  }

  // Filter local entities and relations for the selected detail document
  const docEntities = selectedDetailDoc
    ? graphData.nodes.filter((n) => n.sourceDoc === selectedDetailDoc.name)
    : [];
  const docLinks = selectedDetailDoc
    ? graphData.links.filter((l) => l.sourceDoc === selectedDetailDoc.name)
    : [];

  const [entityQuery, setEntityQuery] = useState('');
  const [relationQuery, setRelationQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'entities' | 'relations'>('entities');

  const filteredEntities = docEntities.filter(
    (e) =>
      e.name.toLowerCase().includes(entityQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(entityQuery.toLowerCase())
  );

  const filteredLinks = docLinks.filter(
    (l) =>
      l.source.toLowerCase().includes(relationQuery.toLowerCase()) ||
      l.target.toLowerCase().includes(relationQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(relationQuery.toLowerCase())
  );

  // Sync selectedDetailDoc when document properties change
  useEffect(() => {
    if (selectedDetailDoc) {
      const match = documents.find((d) => d.id === selectedDetailDoc.id);
      if (match) setSelectedDetailDoc(match);
      else setSelectedDetailDoc(null);
    }
  }, [documents]);

  return (
    <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-[12px] p-[12px] bg-bg2 overflow-hidden">
      {/* ── LEFT COLUMN ── */}
      <div className="flex flex-col gap-[12px] min-h-0 overflow-hidden">
        {/* Upload Card */}
        <div className="shrink-0 bg-panel border border-border rounded-[14px] p-[16px] shadow-sm">
          <DocumentUpload />
        </div>

        {/* Document List */}
        <div className="flex-1 flex flex-col min-h-0 bg-panel border border-border rounded-[14px] p-[14px] shadow-sm">
          <div className="flex items-center justify-between pb-[12px] mb-[8px] border-b border-border shrink-0">
            <h2 className="text-[12.5px] font-semibold text-text">Document list</h2>
            <div className="flex items-center gap-[12px]">
              <button
                type="button"
                onClick={() => useDocumentsStore.getState().selectAllDocuments()}
                className="text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => useDocumentsStore.getState().deselectAllDocuments()}
                className="text-[11px] font-semibold text-text3 hover:text-text transition-colors"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-[8px] pr-1 scrollbar-thin min-h-0">
            {documents.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[12px] text-text3">No documents uploaded yet.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedIds.includes(doc.id)}
                  onToggleSelect={toggleSelectDocument}
                  onViewDetails={setSelectedDetailDoc}
                  onDelete={setDeleteConfirmId}
                  onRetry={retryDocument}
                />
              ))
            )}
            
            {notice && (
              <div className="mt-[8px] p-[10px] rounded-[8px] border border-accent/20 bg-accent-soft text-[11px] text-accent font-medium">
                {notice}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="hidden lg:flex flex-col gap-[12px] min-h-0 overflow-hidden">
        
        {/* Stats Row */}
        <div className="shrink-0 grid grid-cols-3 gap-[8px]">
          <div className="bg-panel border border-border rounded-[14px] p-[12px] text-center shadow-sm">
            <p className="font-mono text-[20px] font-bold text-accent">{documents.length}</p>
            <p className="mt-[2px] text-[9.5px] font-semibold tracking-[0.03em] text-text3 uppercase">Total</p>
          </div>
          <div className="bg-panel border border-border rounded-[14px] p-[12px] text-center shadow-sm" style={{ color: 'hsl(var(--e-org))' }}>
            <p className="font-mono text-[20px] font-bold currentColor">{completed}</p>
            <p className="mt-[2px] text-[9.5px] font-semibold tracking-[0.03em] text-text3 uppercase">Completed</p>
          </div>
          <div className="bg-panel border border-border rounded-[14px] p-[12px] text-center shadow-sm" style={{ color: 'hsl(var(--e-location))' }}>
            <p className="font-mono text-[20px] font-bold currentColor">
              {documents.filter((d) => d.status === 'PROCESSING' || d.status === 'PENDING').length}
            </p>
            <p className="mt-[2px] text-[9.5px] font-semibold tracking-[0.03em] text-text3 uppercase">Active</p>
          </div>
        </div>

        {/* Details / Empty Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-panel border border-border rounded-[14px] p-[16px] shadow-sm">
          {selectedDetailDoc ? (
            <div className="flex flex-col h-full overflow-hidden min-h-0">
              <div className="flex items-center justify-between pb-[12px] border-b border-border shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-semibold truncate text-text pr-[8px]" title={selectedDetailDoc.name}>
                    {selectedDetailDoc.name}
                  </h3>
                  <p className="text-[10px] text-text3 font-medium mt-[2px]">Extracted graph metadata</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailDoc(null)}
                  className="p-[6px] hover:bg-panel2 rounded-[6px] transition-colors text-text3 hover:text-text"
                >
                  <X className="h-[14px] w-[14px]" />
                </button>
              </div>

              <div className="flex border-b border-border text-[11px] mt-[12px] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('entities')}
                  className={cn(
                    'flex-1 pb-[8px] font-semibold border-b-[2px] transition-colors text-center',
                    activeTab === 'entities'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text2 hover:text-text'
                  )}
                >
                  Entities ({docEntities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('relations')}
                  className={cn(
                    'flex-1 pb-[8px] font-semibold border-b-[2px] transition-colors text-center',
                    activeTab === 'relations'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text2 hover:text-text'
                  )}
                >
                  Relationships ({docLinks.length})
                </button>
              </div>

              <div className="flex-1 mt-[12px] overflow-hidden flex flex-col min-h-0">
                {activeTab === 'entities' ? (
                  <div className="flex flex-col h-full min-h-0">
                    <div className="relative mb-[8px] shrink-0">
                      <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 h-[12px] w-[12px] text-text3" />
                      <input
                        type="text"
                        placeholder="Search entities..."
                        value={entityQuery}
                        onChange={(e) => setEntityQuery(e.target.value)}
                        className="w-full pl-[28px] pr-[12px] py-[6px] text-[11.5px] rounded-[8px] border border-border bg-panel2 focus:outline-none focus:border-accent text-text placeholder:text-text3 transition-colors"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-[6px] pr-1 scrollbar-thin min-h-0">
                      {filteredEntities.length === 0 ? (
                        <p className="text-[11px] text-text3 text-center py-6">No matching entities found.</p>
                      ) : (
                        filteredEntities.map((ent, i) => (
                          <div key={i} className="p-[10px] rounded-[8px] bg-panel2 border border-border/50 text-[11.5px]">
                            <div className="flex items-center justify-between gap-2 mb-[4px]">
                              <span className="font-semibold text-text truncate">{ent.name}</span>
                              <span className="px-[6px] py-[2px] rounded-full bg-accent-soft text-accent text-[9px] uppercase font-bold shrink-0">
                                {ent.type}
                              </span>
                            </div>
                            {ent.description && (
                              <p className="text-text2 text-[10.5px] leading-[1.5] mt-[2px]">{ent.description}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full min-h-0">
                    <div className="relative mb-[8px] shrink-0">
                      <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 h-[12px] w-[12px] text-text3" />
                      <input
                        type="text"
                        placeholder="Search relationships..."
                        value={relationQuery}
                        onChange={(e) => setRelationQuery(e.target.value)}
                        className="w-full pl-[28px] pr-[12px] py-[6px] text-[11.5px] rounded-[8px] border border-border bg-panel2 focus:outline-none focus:border-accent text-text placeholder:text-text3 transition-colors"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-[6px] pr-1 scrollbar-thin min-h-0">
                      {filteredLinks.length === 0 ? (
                        <p className="text-[11px] text-text3 text-center py-6">No matching relationships found.</p>
                      ) : (
                        filteredLinks.map((link, i) => (
                          <div key={i} className="p-[10px] rounded-[8px] bg-panel2 border border-border/50 text-[11px] space-y-[4px]">
                            <div className="flex flex-wrap items-center gap-[6px] leading-[1.5]">
                              <span className="font-semibold text-text">{link.source}</span>
                              <span className="px-[6px] py-[2px] rounded-[4px] bg-[hsl(var(--e-tech)/0.15)] text-[hsl(var(--e-tech))] text-[9px] font-bold shrink-0">
                                {link.type}
                              </span>
                              <span className="font-semibold text-text">{link.target}</span>
                            </div>
                            {link.description && (
                              <p className="text-text2 text-[10.5px] leading-[1.5] mt-[2px]">{link.description}</p>
                            )}
                            {link.confidence !== undefined && (
                              <p className="text-[9.5px] text-text3 font-medium mt-[2px]">Confidence: {link.confidence.toFixed(2)}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-[46px] w-[46px] rounded-full bg-accent-soft flex items-center justify-center mb-[16px] shrink-0">
                <Layers className="h-[20px] w-[20px] text-accent" />
              </div>
              <h4 className="text-[12.5px] font-semibold text-text mb-[4px]">No Document Selected</h4>
              <p className="text-[11px] text-text3 max-w-[180px] leading-[1.5]">
                Click a completed document card on the left to explore its extracted entities and relationships.
              </p>
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-error mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-text-primary">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Are you sure you want to delete this document? This will remove all its nodes and relationships from the database. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-md bg-error px-4 py-2 text-xs font-semibold text-white hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
