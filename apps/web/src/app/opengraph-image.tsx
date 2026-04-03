import { ImageResponse } from "next/og";

export const alt = "Skill Scroll";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at top, rgba(232,196,158,0.65), transparent 38%), linear-gradient(180deg, #fbf6ef 0%, #f5ecde 100%)",
          color: "#302016",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              border: "1px solid #d8c6ae",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,251,245,0.92)",
              color: "#a65e34",
            }}
          >
            <svg viewBox="0 0 64 64" width="42" height="42" fill="none">
              <path d="M18 12.5C18 9.462 20.462 7 23.5 7h17C43.538 7 46 9.462 46 12.5v35c0 3.038-2.462 5.5-5.5 5.5h-17A5.5 5.5 0 0 1 18 47.5v-35Z" stroke="currentColor" strokeWidth="3" />
              <path d="M26 20h12M24.5 28h15M26 36h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M15 18.5c0-2.485 2.015-4.5 4.5-4.5H46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#6e5848",
            }}
          >
            Skill Scroll
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 86,
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              maxWidth: 860,
            }}
          >
            A catalog for this repository&apos;s skills, tags, and source repos.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#6e5848",
              maxWidth: 760,
            }}
          >
            Bright, repository-backed, and shaped for this repository instead of a demo dataset.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
