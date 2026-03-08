export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    // guard: always return JSON
    if (!q) {
      return Response.json([]);
    }

    let searchUrl = `https://data.rijksmuseum.nl/search/collection?creator=${encodeURIComponent(
      q
    )}&imageAvailable=true`;

    let res = await fetch(searchUrl, {
      headers: { Accept: "application/ld+json" },
    });

    let data = await res.json();

    if (!data.orderedItems?.length) {
      searchUrl = `https://data.rijksmuseum.nl/search/collection?aboutActor=${encodeURIComponent(
        q
      )}&imageAvailable=true`;

      res = await fetch(searchUrl, {
        headers: { Accept: "application/ld+json" },
      });

      data = await res.json();
    }

    if (!data.orderedItems?.length) {
      return Response.json([]);
    }

    const objects = await Promise.all(
  data.orderedItems.slice(0, 6).map(async (item) => {
    try {
      const r = await fetch(
        `https://data.rijksmuseum.nl/resolve/${encodeURIComponent(item.id)}`,
        { headers: { Accept: "application/ld+json" } }
      );

      if (!r.ok) return null;

      return await r.json();
    } catch {
      return null;
    }
  })
);

// remove failed resolves
const validObjects = objects.filter(Boolean);
    
    const normalized = validObjects.map((obj) => ({
      objectID: `rijks-${obj.id}`,
      title: obj._label || "Untitled",
      artistDisplayName:
        obj.produced_by?.carried_out_by?.[0]?._label || "Unknown artist",
      primaryImageSmall:
        obj.representation?.[0]?.digitally_shown_by?.access_point?.[0]?.id ||
        obj.representation?.[0]?.has_representation?.[0]?.id ||
        "",
      objectDate:
        obj.produced_by?.timespan?.begin_of_the_begin || "",
      source: "Rijksmuseum",
      url: obj.id
    }));

    return Response.json(normalized);
  } catch (err) {
    console.error("Rijks route failed:", err);
    // ✅ ALWAYS return JSON even on failure
    return Response.json([], { status: 500 });
  }
}
