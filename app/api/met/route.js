// app/api/met/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const offset = Number(searchParams.get("offset") || 0);
  const PAGE_SIZE = 5;

  if (!q.trim()) return Response.json([]);

  const searchRes = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/search` +
      `?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(q)}`,
    { cache: "no-store" }
  );

  if (!searchRes.ok) return Response.json([]);

  const searchData = await searchRes.json();
  if (!Array.isArray(searchData.objectIDs)) return Response.json([]);

  const ids = searchData.objectIDs.slice(offset, offset + PAGE_SIZE);
  const results = [];

  for (const id of ids) {
    try {
      const res = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;

      const art = await res.json();

      const image =
        art.primaryImageSmall ||
        art.primaryImage ||
        art.additionalImages?.[0];
      if (!image) continue;

      results.push({
        objectID: `met-${art.objectID}`,
        title: art.title,
        artistDisplayName: art.artistDisplayName || "Unknown artist",
        image,
        objectDate: art.objectDate || "",
        medium: art.classification || art.medium || "",
        source: "MET",
        url: art.objectURL,
      });
    } catch {
      continue;
    }
  }

  return Response.json(results);
}
