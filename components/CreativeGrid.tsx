import type { Kreativa } from "@/types";
import { driveThumbnailUrl, extractDriveFileId, isDriveUrl } from "@/lib/drive";

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function PlayOverlay() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          background: "rgba(0, 0, 0, 0.55)",
          color: "white",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="currentColor"
          style={{ marginLeft: 2 }}
        >
          <path d="M2 1.5v11l10-5.5z" />
        </svg>
      </div>
    </div>
  );
}

function CreativeThumb({ creative }: { creative: Kreativa }) {
  const driveId = extractDriveFileId(creative.url);
  const isVideo = creative.typ === "Video";

  let thumbSrc: string | null = null;
  if (driveId) {
    thumbSrc = driveThumbnailUrl(driveId, 800);
  } else if (creative.url && isImageUrl(creative.url) && !isDriveUrl(creative.url)) {
    thumbSrc = creative.url;
  }

  if (thumbSrc) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={creative.nazev}
          className="w-full h-32 object-cover rounded-md"
          style={{ background: "var(--background-muted)" }}
        />
        {isVideo ? <PlayOverlay /> : null}
      </div>
    );
  }

  return (
    <div
      className="w-full h-32 rounded-md flex items-center justify-center text-[12px]"
      style={{
        background: "var(--background-muted)",
        color: "var(--foreground-muted)",
      }}
    >
      {creative.typ || "Kreativa"}
    </div>
  );
}

export function CreativeGrid({ creatives }: { creatives: Kreativa[] }) {
  if (creatives.length === 0) {
    return (
      <div
        className="rounded-xl border bg-white p-6 text-[14px]"
        style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
      >
        K této kampani zatím nejsou přiřazené kreativy.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="text-[18px] font-medium mb-4">Kreativy</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.map((c) => (
          <div
            key={c.nazev}
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <CreativeThumb creative={c} />
            <div className="mt-3">
              <div className="text-[14px] font-medium truncate">{c.nazev}</div>
              <div
                className="text-[12px] mt-1"
                style={{ color: "var(--foreground-muted)" }}
              >
                {c.typ}
                {c.status ? ` · ${c.status}` : ""}
              </div>
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] underline mt-2 inline-block"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Otevřít v Disku
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
