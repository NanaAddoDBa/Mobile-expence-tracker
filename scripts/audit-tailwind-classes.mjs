import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const srcDir = path.resolve("src");
const validSteps = new Set(["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]);
const classArtifacts = ["px-3Rounded"];
const colorFamilies = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "rose",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
];

const colorPattern = new RegExp(
  `(?:${colorFamilies.join("|")})-([0-9]{2,3})(?:\\b|/)`,
  "g"
);

const files = [];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(entryPath);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
}

await collectFiles(srcDir);

const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const colorMatches = [...line.matchAll(colorPattern)]
      .filter((match) => !validSteps.has(match[1]))
      .map((match) => match[0]);
    const artifactMatches = classArtifacts.filter((artifact) => line.includes(artifact));
    const matches = [...colorMatches, ...artifactMatches];
    if (matches.length > 0) {
      findings.push({
        file: path.relative(process.cwd(), file),
        line: index + 1,
        matches: [...new Set(matches)].join(", "),
      });
    }
  });
}

if (findings.length > 0) {
  console.error("Suspicious Tailwind class fragments found:");
  findings.forEach((finding) => {
    console.error(`${finding.file}:${finding.line} ${finding.matches}`);
  });
  process.exit(1);
}

console.log("No suspicious Tailwind class fragments found.");
