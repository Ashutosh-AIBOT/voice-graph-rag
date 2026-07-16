import { FileText, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { DocumentItem } from '@/store/documents';
import { StatusBadge } from './StatusBadge';
import { ProcessingSteps } from './ProcessingSteps';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function DocumentRow({
  doc,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onRetry,
}: {
  doc: DocumentItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onViewDetails?: (doc: DocumentItem) => void;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[11px] border border-border bg-panel2 px-[12px] py-[11px] transition-colors',
        doc.status === 'COMPLETED' && 'hover:border-accent/40 cursor-pointer'
      )}
      onClick={() => doc.status === 'COMPLETED' && onViewDetails?.(doc)}
    >
      <div className="flex items-center justify-between gap-[12px]">
        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
          {doc.status === 'COMPLETED' ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(doc.id);
              }}
              className="h-[14px] w-[14px] shrink-0 rounded-[4px] border-border bg-panel text-accent focus:ring-accent cursor-pointer"
            />
          ) : (
            <div className="h-[14px] w-[14px] shrink-0" />
          )}
          <FileText className="h-[14px] w-[14px] shrink-0 text-text3" />
          <span className="truncate text-[11.5px] font-mono font-semibold text-text">{doc.name}</span>
        </div>
        
        <div className="flex items-center gap-[8px]" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={doc.status} />
          <button
            type="button"
            onClick={() => onDelete?.(doc.id)}
            className="rounded-[6px] p-[4px] text-text3 hover:bg-panel hover:text-error transition-colors"
            title="Delete document"
          >
            <Trash2 className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>

      {doc.status === 'PROCESSING' ? (
        <div className="mt-[8px] pl-[26px]">
          <ProcessingSteps currentStep={doc.processingStep} status={doc.status} />
        </div>
      ) : (
        <div className="mt-[8px] pl-[30px] flex flex-col gap-[6px] text-[10px] text-text3">
          <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[4px]">
            {doc.entities !== undefined && <span>{doc.entities} entities</span>}
            {doc.relationships !== undefined && <span>{doc.relationships} relations</span>}
            <span>{formatDate(doc.uploadedAt)}</span>
          </div>
          {doc.summary && (
            <div className="mt-[4px] bg-panel border-l-[2px] border-l-accent rounded-r-[8px] px-[11px] py-[9px] text-[10.5px] text-text2 leading-[1.6]">
              {doc.summary}
            </div>
          )}
        </div>
      )}

      {doc.status === 'FAILED' && (
        <div className="mt-[8px] ml-[30px] flex items-center justify-between gap-[8px] rounded-[8px] bg-error/10 px-[10px] py-[8px] text-[11px] text-error">
          <span className="flex items-center gap-[6px]">
            <AlertCircle className="h-[14px] w-[14px]" /> {doc.error || 'Processing failed'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.(doc.id);
            }}
            className="inline-flex items-center gap-[4px] font-semibold hover:underline text-error"
          >
            <RotateCcw className="h-[12px] w-[12px]" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
