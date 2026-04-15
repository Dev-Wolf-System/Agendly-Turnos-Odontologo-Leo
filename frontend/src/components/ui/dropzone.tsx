"use client";

import * as React from "react";
import { UploadCloud, FileUp, AlertCircle, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFileSelected: (file: File) => void | Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
  title?: string;
  hint?: string;
  id?: string;
};

function formatAcceptHint(accept?: string): string {
  if (!accept) return "Cualquier formato";
  return accept
    .split(",")
    .map((t) => t.trim().replace("image/*", "Imágenes").replace(".pdf", "PDF").replace(".dicom", "DICOM"))
    .filter(Boolean)
    .join(" · ");
}

function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1));
    return mime === token;
  });
}

export function Dropzone({
  onFileSelected,
  accept,
  maxSizeMB = 20,
  disabled = false,
  isUploading = false,
  className,
  title = "Arrastrá un archivo o hacé clic para seleccionar",
  hint,
  id,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const reactId = React.useId();
  const inputId = id ?? `dropzone-${reactId}`;
  const errorId = `${inputId}-error`;

  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dragCounter = React.useRef(0);

  const interactive = !disabled && !isUploading;

  const openPicker = React.useCallback(() => {
    if (!interactive) return;
    inputRef.current?.click();
  }, [interactive]);

  const handleFile = React.useCallback(
    async (file: File) => {
      setError(null);
      if (!fileMatchesAccept(file, accept)) {
        setError(`Formato no permitido. Aceptados: ${formatAcceptHint(accept)}`);
        return;
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`El archivo supera el límite de ${maxSizeMB} MB (${sizeMB.toFixed(1)} MB).`);
        return;
      }
      try {
        await onFileSelected(file);
      } catch {
        // el caller se encarga de mostrar feedback (toast); no sobrescribimos su estado
      }
    },
    [accept, maxSizeMB, onFileSelected]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!interactive) return;
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (!interactive) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const acceptHint = hint ?? `${formatAcceptHint(accept)} · hasta ${maxSizeMB} MB`;

  return (
    <div className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-disabled={!interactive}
        aria-busy={isUploading}
        aria-describedby={error ? errorId : undefined}
        aria-label={title}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-state={isDragging ? "dragging" : error ? "error" : isUploading ? "uploading" : "idle"}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 outline-none",
          "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-slate-50",
          "focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-[var(--border-focus)]",
          interactive ? "cursor-pointer" : "cursor-not-allowed opacity-60",
          isDragging &&
            "border-[var(--border-focus)] bg-primary/5 ring-4 ring-primary/10 scale-[1.01] shadow-[var(--shadow-primary)]",
          error && "border-[var(--danger-border)] bg-[var(--danger-bg)]",
          isUploading && "border-[var(--border-focus)] bg-primary/5"
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={!interactive}
          onChange={onInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200",
            "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-[var(--shadow-primary)]",
            isDragging && "scale-110",
            error && "from-[var(--danger)] to-[var(--danger)] shadow-none",
            isUploading && "animate-glow-pulse"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : error ? (
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          ) : isDragging ? (
            <FileUp className="h-6 w-6" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isUploading
              ? "Subiendo archivo..."
              : isDragging
              ? "Soltá para subir"
              : title}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{acceptHint}</p>
        </div>

        {interactive && !isUploading && !isDragging && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              "bg-white border border-[var(--border)] text-[var(--text-secondary)]",
              "hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
            )}
          >
            <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
            Seleccionar archivo
          </button>
        )}

        {/* Decoración sutil — círculo difuso esquina superior derecha */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-[0.05] transition-opacity duration-200",
            "bg-[var(--primary)]",
            isDragging && "opacity-[0.12]",
            error && "bg-[var(--danger)] opacity-[0.08]"
          )}
        />
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="flex-1 text-left">{error}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="shrink-0 rounded p-0.5 hover:bg-[var(--danger)]/10 transition-colors"
            aria-label="Descartar error"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
