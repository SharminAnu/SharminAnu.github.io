import fs from "node:fs/promises";

const scholarPath = new URL("../scholar.json", import.meta.url);

const stripHtml = (value = "") =>
  value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const parseRow = (row) => {
  const titleMatch = row.match(/class="gsc_a_at"[^>]*>(.*?)<\/a>/);
  const grayMatches = [...row.matchAll(/class="gs_gray"[^>]*>(.*?)<\/div>/g)];
  const authors = grayMatches[0]?.[1];
  const venue = grayMatches[1]?.[1];
  const yearMatch = row.match(/\b(19|20)\d{2}\b/g);

  return {
    title: stripHtml(titleMatch?.[1]),
    authors: stripHtml(authors),
    venue: stripHtml(venue),
    year: yearMatch ? Number(yearMatch[yearMatch.length - 1]) : null,
    status: "Published"
  };
};

const main = async () => {
  const scholarData = JSON.parse(await fs.readFile(scholarPath, "utf-8"));
  const scholarId =
    process.env.GOOGLE_SCHOLAR_ID || scholarData.scholarProfile?.googleScholarId;

  if (!scholarId || scholarId.includes("YOUR_GOOGLE_SCHOLAR_ID")) {
    throw new Error(
      "Missing GOOGLE_SCHOLAR_ID. Add it to scholar.json or set env var."
    );
  }

  const profileUrl = `https://scholar.google.com/citations?user=${scholarId}&hl=en`;
  const response = await fetch(`${profileUrl}&cstart=0&pagesize=100`);

  if (!response.ok) {
    throw new Error(`Scholar fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const rows = [...html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)];
  const publications = rows
    .map((row) => parseRow(row[1]))
    .filter((item) => item.title);

  const deduped = new Map();
  publications.forEach((item) => {
    if (!deduped.has(item.title)) deduped.set(item.title, item);
  });

  scholarData.scholarProfile = {
    ...(scholarData.scholarProfile || {}),
    googleScholarId: scholarId,
    profileUrl
  };
  scholarData.publications = Array.from(deduped.values()).sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    if (yearA !== yearB) return yearB - yearA;
    return a.title.localeCompare(b.title);
  });
  scholarData.lastSynced = new Date().toISOString().slice(0, 10);

  await fs.writeFile(scholarPath, JSON.stringify(scholarData, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
