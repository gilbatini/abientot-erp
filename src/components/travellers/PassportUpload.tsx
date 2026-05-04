"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { uploadPassport, getPassportSignedUrl, deletePassport } from "@/actions/passport";
import type { Role } from "@/types/app";

interface Props {
  travellerId: string;
  role: Role;
  userId: string;
  passportFilePath: string | null;
  passportUploadedAt: string | null;
  passportUploadedBy: string | null;
}

export function PassportUpload({
  travellerId,
  role,
  userId,
  passportFilePath,
  passportUploadedAt,
  passportUploadedBy,
}: Props) {
  const [uploading, setUploading]   = useState(false);
  const [deleting,  setDeleting]    = useState(false);
  const [error,     setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (role === "viewer") return null;

  const hasFile = !!passportFilePath;

  const withinWindow =
    !!passportUploadedAt &&
    Date.now() - new Date(passportUploadedAt).getTime() < 60 * 60 * 1000;

  const canView =
    role === "admin" ||
    (role === "agent" && passportUploadedBy === userId && withinWindow);

  const canDelete = role === "admin";
  const canUpload = role === "admin" || role === "agent";

  const fileName = passportFilePath?.split("/").pop() ?? "passport";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("travellerId", travellerId);
      await uploadPassport(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleView() {
    if (!passportFilePath) return;
    setError(null);
    try {
      const url = await getPassportSignedUrl(passportFilePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get view link");
    }
  }

  async function handleDelete() {
    if (!passportFilePath) return;
    setError(null);
    setDeleting(true);
    try {
      await deletePassport(travellerId, passportFilePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 max-w-2xl mt-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Passport Scan</h2>

      {error && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
      )}

      {!hasFile && canUpload && (
        <div className="flex items-center gap-3">
          <label className={uploading ? "cursor-not-allowed" : "cursor-pointer"}>
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              {uploading ? "Uploading…" : "Choose File"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
          <span className="text-xs text-gray-400">JPEG, PNG, or PDF · max 5 MB</span>
        </div>
      )}

      {hasFile && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700 font-mono truncate max-w-xs">{fileName}</span>

            {canView && (
              <Button type="button" variant="secondary" className="text-xs py-1.5" onClick={handleView}>
                View
              </Button>
            )}

            {!canView && role === "agent" && (
              <span className="text-xs text-gray-400 italic">Access window expired</span>
            )}

            {canUpload && (
              <label className={uploading ? "cursor-not-allowed" : "cursor-pointer"}>
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {uploading ? "Uploading…" : "Replace"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleFileChange}
                />
              </label>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>

          {passportUploadedAt && (
            <p className="text-xs text-gray-400">
              Uploaded {new Date(passportUploadedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
