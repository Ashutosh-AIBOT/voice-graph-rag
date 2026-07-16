'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileUp, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { useDocumentsStore } from '@/store/documents';
import { useAuthStore } from '@/store/auth';

export function DocumentUpload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const documents = useDocumentsStore((s) => s.documents);
  const upsertDocument = useDocumentsStore((s) => s.upsertDocument);
  const isAuthed = useAuthStore((s) => s.isAuthenticated);

  const liveDoc = uploadedDocId ? documents.find((d) => d.id === uploadedDocId) : null;
  const liveProgress = liveDoc?.processingProgress ?? 0;
  const liveStep = liveDoc?.processingStep || null;

  useEffect(() => {
    if (liveDoc && (liveDoc.status === 'COMPLETED' || liveDoc.status === 'FAILED')) {
      const timer = setTimeout(() => {
        setUploading(false);
        setUploadedDocId(null);
        setUploadError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [liveDoc?.status]);

  const ALLOWED_EXTS = new Set(['.pdf', '.txt', '.md', '.docx', '.doc', '.csv', '.json', '.html', '.xml']);
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;

  async function uploadFile(file: File) {
    if (!isAuthed) {
      alert('Please log in to upload documents.');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      setUploadError(`File type "${ext}" is not supported. Allowed: ${Array.from(ALLOWED_EXTS).join(', ')}`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    if (file.size === 0) {
      setUploadError('Empty files are not allowed.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedDocId(null);

    const form = new FormData();
    form.append('file', file);
    if (source.trim()) {
      form.append('source', source.trim());
    }
    try {
      const { data } = await api.post('/documents/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const doc = data.document;
      upsertDocument({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        uploadedAt: doc.uploaded_at ?? new Date().toISOString(),
        processingStep: doc.processing_step ?? null,
        processingProgress: doc.processing_progress ?? 0,
      });
      setUploadedDocId(doc.id);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed.';
      setUploadError(msg);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Source input */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Document Source (optional)</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. research-paper, company-docs"
          className="w-full rounded-xl border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) uploadFile(f);
        }}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          dragging
            ? 'border-accent-cyan bg-accent-cyan/5 scale-[1.02] shadow-lg shadow-accent-cyan/10'
            : 'border-border bg-bg-surface/50 hover:border-accent-primary/30 hover:bg-bg-surface'
        }`}
      >
        <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
          dragging ? 'bg-accent-cyan/15 scale-110' : 'bg-accent-cyan/10'
        }`}>
          <UploadCloud className={`h-7 w-7 transition-colors ${dragging ? 'text-accent-cyan' : 'text-accent-cyan/70'}`} />
        </div>
        <p className="text-sm font-bold text-text-primary">
          {dragging ? 'Drop your file here' : 'Drop files here or browse'}
        </p>
        <p className="mt-1.5 text-xs text-text-muted">
          Supports: PDF, TXT, DOCX, Markdown, CSV, JSON, HTML, XML · Max 10MB
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-cyan px-4 py-2 text-xs font-bold text-white shadow-md shadow-accent-primary/20 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <FileUp className="h-3.5 w-3.5" /> Browse Files
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.docx,.doc,.csv,.json,.html,.xml"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </label>
      </div>

      {/* Error */}
      {uploadError && (
        <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs font-medium text-error">
          {uploadError}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-border bg-bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2">
            {liveDoc?.status === 'COMPLETED' ? (
              <span className="flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Processing complete
              </span>
            ) : liveStep ? (
              <span className="text-sm font-semibold text-text-primary">{liveStep}...</span>
            ) : (
              <span className="text-sm font-semibold text-text-primary">Uploading...</span>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-cyan transition-all duration-500 ease-out"
              style={{
                width: `${liveProgress}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-text-muted">{Math.round(liveProgress)}% complete</p>
        </div>
      )}
    </div>
  );
}
