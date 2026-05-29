"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DocumentFilePicker } from "@/components/documents/document-file-picker";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import { getDocumentFileType } from "@/lib/document-file";
import { interpolate } from "@/lib/i18n-shared";
import type { DocumentFileType, Locale } from "@/lib/types";

type VersionFile = {
  id: string;
  fileType: DocumentFileType;
  filePath: string;
  originalName: string;
  sortOrder: number;
  fileUrl: string | null;
};

type VersionItem = {
  id: string;
  versionNumber: number;
  changelog: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  files: VersionFile[];
};

function EditVersionDialog({
  item,
  documentId,
  currentVersion,
  locale,
}: {
  item: VersionItem;
  documentId: string;
  currentVersion: number;
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);
  const v = dictionary.documents.versions;
  const [open, setOpen] = useState(false);
  const [changelog, setChangelog] = useState(item.changelog);
  const [replaceFiles, setReplaceFiles] = useState<File[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setChangelog(item.changelog);
      setReplaceFiles([]);
      setPendingDeleteIds(new Set());
      setPickerKey((k) => k + 1);
    }
  }

  function toggleDelete(fileId: string) {
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }

  return (
    <>
      <Button size="sm" type="button" onClick={() => handleOpenChange(true)}>
        {v.edit}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-slate-100">{v.editTitle}</h2>
          <p className="text-sm text-slate-400">{v.editDescription}</p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300" htmlFor={`changelog-${item.id}`}>
              {v.changelogLabel}
            </label>
            <Textarea
              id={`changelog-${item.id}`}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          {item.files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-300">{v.currentFiles}</p>
              <ul className="space-y-1">
                {item.files.map((file) => {
                  const markedForDelete = pendingDeleteIds.has(file.id);
                  return (
                    <li
                      key={file.id}
                      className={`flex items-center justify-between gap-2 rounded border px-3 py-2 text-xs transition-colors ${
                        markedForDelete
                          ? "border-red-700/60 bg-red-950/30 opacity-60"
                          : "border-slate-700/60 bg-slate-800/30"
                      }`}
                    >
                      <span className={`truncate ${markedForDelete ? "line-through text-slate-400" : "text-slate-300"}`}>
                        {file.originalName || file.filePath.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDelete(file.id)}
                        className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          markedForDelete
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-red-900/50 text-red-300 hover:bg-red-800/60"
                        }`}
                      >
                        {markedForDelete ? v.cancelDeleteFile : v.deleteFile}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {pendingDeleteIds.size > 0 && replaceFiles.length === 0 && pendingDeleteIds.size === item.files.length && (
                <p className="text-xs text-amber-400">{v.deleteAllFilesWarning}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">{v.optionalFilesHint}</p>
            <DocumentFilePicker
              key={pickerKey}
              onFilesChange={setReplaceFiles}
              labels={{
                attach: dictionary.documents.filePicker.attach,
                helper: interpolate(dictionary.documents.filePicker.helper, {
                  types: dictionary.documents.filePicker.defaultTypes,
                }),
                browse: dictionary.documents.filePicker.browse,
                remove: dictionary.documents.filePicker.remove,
              }}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => handleOpenChange(false)}>
              {v.cancelEdit}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={async () => {
                const trimmed = changelog.trim();
                const deleteIds = Array.from(pendingDeleteIds);
                const deletingAll = deleteIds.length === item.files.length && replaceFiles.length === 0;

                if (deletingAll) {
                  pushToast({
                    id: crypto.randomUUID(),
                    title: v.editErrorTitle,
                    description: v.deleteAllFilesWarning,
                  });
                  return;
                }

                if (replaceFiles.length === 0 && deleteIds.length === 0 && trimmed.length < 3) {
                  pushToast({
                    id: crypto.randomUUID(),
                    title: v.editErrorTitle,
                    description: dictionary.documents.versionForm.invalidDescription,
                  });
                  return;
                }

                for (const file of replaceFiles) {
                  if (!getDocumentFileType(file.name)) {
                    pushToast({
                      id: crypto.randomUUID(),
                      title: dictionary.documents.versionForm.unsupportedTitle,
                      description: dictionary.documents.versionForm.unsupportedDescription,
                    });
                    return;
                  }
                }

                setSaving(true);
                try {
                  let response: Response;
                  if (replaceFiles.length > 0 || deleteIds.length > 0) {
                    const formData = new FormData();
                    for (const file of replaceFiles) {
                      formData.append("files[]", file, file.name);
                    }
                    for (const id of deleteIds) {
                      formData.append("deleteFileIds[]", id);
                    }
                    if (trimmed.length >= 3) {
                      formData.append("changelog", trimmed);
                    }
                    response = await fetch(`/api/documents/${documentId}/versions/${item.id}`, {
                      method: "PATCH",
                      body: formData,
                    });
                  } else {
                    response = await fetch(`/api/documents/${documentId}/versions/${item.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ changelog: trimmed }),
                    });
                  }

                  if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    pushToast({
                      id: crypto.randomUUID(),
                      title: v.editErrorTitle,
                      description: (data?.error as string | undefined) ?? v.editErrorDescription,
                    });
                    return;
                  }

                  const data = await response.json().catch(() => null);
                  const queued = Boolean(data?.processingQueued) && item.versionNumber === currentVersion;

                  pushToast({
                    id: crypto.randomUUID(),
                    title: v.editedTitle,
                    description: interpolate(v.editedDescription, { version: item.versionNumber }),
                  });

                  handleOpenChange(false);
                  router.refresh();

                  if (queued) {
                    void fetch(`/api/documents/${documentId}/process`, {
                      method: "POST",
                      keepalive: true,
                    });
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? dictionary.documents.comments.saving : v.saveEdit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DocumentVersionsPanel({
  documentId,
  versions,
  canDelete,
  canEdit,
  currentVersion,
  locale,
}: {
  documentId: string;
  versions: VersionItem[];
  canDelete: boolean;
  canEdit: boolean;
  currentVersion: number;
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);

  if (versions.length === 0) {
    return <p className="text-slate-400">{dictionary.documents.versions.empty}</p>;
  }

  return (
    <div className="space-y-3">
      {versions.map((item) => (
        <div
          key={item.id}
          className="rounded border border-slate-700 p-3 space-y-3"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-slate-100">
                {`v${item.versionNumber} — ${item.changelog}`}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
                {item.createdByName && (
                  <> · <span className="text-slate-300">{item.createdByName}</span></>
                )}
                {" · "}{item.files.length} ficheiro{item.files.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && item.versionNumber === currentVersion && (
                <EditVersionDialog
                  item={item}
                  documentId={documentId}
                  currentVersion={currentVersion}
                  locale={locale}
                />
              )}
              {canDelete && item.versionNumber !== currentVersion && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      interpolate(dictionary.documents.versions.deleteConfirm, { version: item.versionNumber }),
                    );
                    if (!confirmed) return;

                    const response = await fetch(
                      `/api/documents/${documentId}/versions/${item.id}`,
                      { method: "DELETE" },
                    );

                    if (!response.ok) {
                      const data = await response.json().catch(() => null);
                      pushToast({
                        id: crypto.randomUUID(),
                        title: dictionary.documents.versions.deleteErrorTitle,
                        description: (data?.error as string | undefined) ?? dictionary.documents.versions.deleteErrorDescription,
                      });
                      return;
                    }

                    pushToast({
                      id: crypto.randomUUID(),
                      title: dictionary.documents.versions.deletedTitle,
                      description: interpolate(dictionary.documents.versions.deletedDescription, { version: item.versionNumber }),
                    });
                    router.refresh();
                  }}
                >
                  {dictionary.documents.versions.delete}
                </Button>
              )}
            </div>
          </div>

          {item.files.length > 0 && (
            <ul className="space-y-1 pl-1">
              {item.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-xs"
                >
                  <span className="truncate text-slate-300">{file.originalName || file.filePath.split("/").pop()}</span>
                  {file.fileUrl && (
                    <div className="flex shrink-0 gap-1">
                      <Button asChild size="sm" variant="outline" className="h-6 px-2 text-xs">
                        <a href={file.fileUrl} target="_blank" rel="noreferrer">
                          {dictionary.documents.versions.view}
                        </a>
                      </Button>
                      <Button asChild size="sm" className="h-6 px-2 text-xs">
                        <a href={file.fileUrl} target="_blank" rel="noreferrer" download>
                          {dictionary.documents.versions.download}
                        </a>
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
