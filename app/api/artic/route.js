export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return Response.json([]);
  }

  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
      q
    )}&limit=6&fields=id,title,artist_title,artist_display,image_id,date_display`
  );

  const json = await res.json();

  const normalized = (json.data || []).map((art) => ({
    objectID: `artic-${art.id}`,
    title: art.title,
    artistDisplayName:
      art.artist_display || art.artist_title || "Unknown",
    primaryImageSmall: art.image_id
      ? `https://www.artic.edu/iiif/2/${art.image_id}/full/200,/0/default.jpg`
      : "",
    objectDate: art.date_display || "",
    source: "Artic",
  }));

  return Response.json(normalized);
}
