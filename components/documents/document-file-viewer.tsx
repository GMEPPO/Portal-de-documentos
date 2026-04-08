import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
import { interpolate } from "@/lib/i18n-shared";
import type { DocumentFileType, Locale } from "@/lib/types";

function isPdfFile(filename: string) {
  return filename.trim().toLowerCase().endsWith(".pdf");
}

export function DocumentFileViewer({
  fileUrl,
  filename,
  fileType,
  locale,
}: {
  fileUrl: string;
  filename: string;
  fileType: DocumentFileType;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);
  const canEmbedPdf = fileType === "document" && isPdfFile(filename);
  const canEmbedVideo = fileType === "video";
  const canEmbedAudio = fileType === "audio";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">{dictionary.documents.viewer.title}</p>
          <p className="text-xs text-slate-400">
            {canEmbedPdf
              ? dictionary.documents.viewer.pdf
              : canEmbedVideo
                ? dictionary.documents.viewer.video
                : canEmbedAudio
                  ? dictionary.documents.viewer.audio
                  : dictionary.documents.viewer.unavailable}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={fileUrl} target="_blank" rel="noreferrer">
              {dictionary.documents.viewer.open}
            </a>
          </Button>
          <Button asChild>
            <a href={fileUrl} target="_blank" rel="noreferrer" download>
              {dictionary.documents.viewer.download}
            </a>
          </Button>
        </div>
      </div>

      {canEmbedPdf ? (
        <iframe
          title={interpolate(dictionary.documents.viewer.iframeTitle, { filename })}
          src={fileUrl}
          className="h-[720px] w-full rounded-lg border border-slate-700 bg-white"
        />
      ) : canEmbedVideo ? (
        <video
          controls
          preload="metadata"
          className="w-full rounded-lg border border-slate-700 bg-black"
        >
          <source src={fileUrl} />
          {dictionary.documents.viewer.videoUnsupported}
        </video>
      ) : canEmbedAudio ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-6">
          <audio controls preload="metadata" className="w-full">
            <source src={fileUrl} />
            {dictionary.documents.viewer.audioUnsupported}
          </audio>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
          {dictionary.documents.viewer.noPreview}
        </div>
      )}
    </div>
  );
}
