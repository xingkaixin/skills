import { ImageResponse } from "next/og";
import { getSkill, getSkills } from "@/data/skills";

export async function generateStaticParams() {
  const skills = getSkills();
  return skills.map((skill) => ({ name: skill.slug }));
}

export const alt = "Skill Scroll Detail";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const skill = getSkill(name);

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
            "radial-gradient(circle at top right, rgba(232,196,158,0.65), transparent 36%), linear-gradient(180deg, #fbf6ef 0%, #f5ecde 100%)",
          color: "#302016",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#6e5848",
          }}
        >
          Skill Scroll / Detail
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 82,
              lineHeight: 0.94,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              maxWidth: 920,
            }}
          >
            {skill?.slug ?? name}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#6e5848",
              lineHeight: 1.35,
              maxWidth: 880,
            }}
          >
            {skill?.description ?? "Repository skill summary."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {(skill?.tags ?? []).slice(0, 4).map((tag) => (
            <div
              key={tag}
              style={{
                border: "1px solid #d8c6ae",
                borderRadius: 999,
                padding: "10px 16px",
                fontSize: 18,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6e5848",
                background: "rgba(255,251,245,0.9)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
