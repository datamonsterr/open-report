#!/usr/bin/env bun
/**
 * GitBook auto-sync script.
 * Extracts documentation from skills (SKILL.md), rules, and README
 * to generate/update a GitBook project.
 *
 * Run after openspec archive: scripts/sync-gitbook.ts
 * Or: bun run scripts/sync-gitbook.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const SKILLS_DIR = join(import.meta.dir, "..", "skills");
const RULES_DIR = join(import.meta.dir, "..", "rules");
const README_PATH = join(import.meta.dir, "..", "README.md");
const OUTPUT_DIR = join(import.meta.dir, "..", "docs");

function generateSummary(skills: { name: string; title: string }[]): string {
  let content = "# Summary\n\n";
  content += "* [Introduction](README.md)\n";
  content += "* [Skills](skills/README.md)\n";
  for (const skill of skills) {
    content += `  * [${skill.title}](skills/${skill.name}.md)\n`;
  }
  content += "* [Rules](rules/README.md)\n";
  return content;
}

function extractSkillDocs(dir: string): { name: string; title: string; body: string } | null {
  const skillMd = join(dir, "SKILL.md");
  if (!existsSync(skillMd)) return null;
  const content = readFileSync(skillMd, "utf-8");
  const firstLine = content.split("\n")[0].replace(/^#\s*/, "").trim();
  return {
    name: basename(dir),
    title: firstLine || basename(dir),
    body: content,
  };
}

async function main() {
  mkdirSync(join(OUTPUT_DIR, "skills"), { recursive: true });
  mkdirSync(join(OUTPUT_DIR, "rules"), { recursive: true });

  // Extract skills
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(SKILLS_DIR, d.name));

  const skills: { name: string; title: string }[] = [];

  for (const dir of skillDirs) {
    const doc = extractSkillDocs(dir);
    if (!doc) continue;
    skills.push({ name: doc.name, title: doc.title });
    writeFileSync(join(OUTPUT_DIR, "skills", `${doc.name}.md`), doc.body);
  }

  // Skills index
  let skillsIndex = "# Skills\n\n";
  for (const s of skills) {
    skillsIndex += `- [${s.title}](${s.name}.md)\n`;
  }
  writeFileSync(join(OUTPUT_DIR, "skills", "README.md"), skillsIndex);

  // Rules index
  let rulesIndex = "# Rules\n\n";
  if (existsSync(RULES_DIR)) {
    const ruleFiles = readdirSync(RULES_DIR).filter((f) => f.endsWith(".md"));
    for (const rf of ruleFiles) {
      rulesIndex += `- [${rf.replace(".md", "")}](${rf})\n`;
      const src = readFileSync(join(RULES_DIR, rf), "utf-8");
      writeFileSync(join(OUTPUT_DIR, "rules", rf), src);
    }
  }
  writeFileSync(join(OUTPUT_DIR, "rules", "README.md"), rulesIndex);

  // Copy README
  if (existsSync(README_PATH)) {
    const readme = readFileSync(README_PATH, "utf-8");
    writeFileSync(join(OUTPUT_DIR, "README.md"), readme);
  }

  // Generate SUMMARY.md
  writeFileSync(join(OUTPUT_DIR, "SUMMARY.md"), generateSummary(skills));

  console.log(`[gitbook-sync] Generated docs for ${skills.length} skills`);
}

main().catch(console.error);
