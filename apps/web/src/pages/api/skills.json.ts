import type { APIRoute } from "astro";
import { skillsData } from "@/data/skills.generated";

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(skillsData, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
