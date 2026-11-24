import type { APIRoute } from "astro";
import { skillSearchText } from "@/data/skill-catalog";
import { skillsData } from "@/data/skills.generated";

export const GET: APIRoute = () => {
  const index = Object.fromEntries(
    skillsData.map((skill) => [skill.slug, skillSearchText(skill)]),
  );
  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
