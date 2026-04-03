import { skillsData, skillTags } from "@/data/skills.generated";
import type { SkillRecord } from "@/data/skill-record";

export function getSkills(): SkillRecord[] {
  return skillsData;
}

export function getSkill(slug: string): SkillRecord | undefined {
  return skillsData.find((skill) => skill.slug === slug);
}

export function getSkillTags(): string[] {
  return skillTags;
}
