// app/api/europeana/route.js

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const offset = Number(searchParams.get("offset") || 0);
    const PAGE_SIZE = 5;

    if (!q.trim()) {
      return Response.json([]);
    }

    const EUROPEANA_KEY = process.env.EUROPEANA_API_KEY;

    if (!EUROPEANA_KEY) {
      console.error("EUROPEANA API KEY MISSING");
      return Response.json([]);
    }

    const url =
      `https://api.europeana.eu/record/v2/search.json` +
      `?query=${encodeURIComponent(q)}` +
      `&qf=TYPE:IMAGE` +
      `&rows=${PAGE_SIZE}` +
      `&start=${offset}` +
      `&wskey=${EUROPEANA_KEY}`;

    const res = await fetch(url, { cache: "no-store" });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("EUROPEANA NON-JSON RESPONSE:", text);
      return Response.json([]);
    }

    console.log("EUROPEANA STATUS:", res.status);
    console.log("EUROPEANA itemsCount:", data.itemsCount);
    console.log("EUROPEANA RAW items:", data.items?.length);

    if (!Array.isArray(data.items)) {
      return Response.json([]);
    }

    const results = data.items.map((item) => ({
      objectID: `europeana-${item.id}`,
      title: item.title?.[0] || "Untitled",
      artistDisplayName:
        item.dcCreator?.[0] ||
        item.dcContributor?.[0] ||
        "Unknown artist",
      image: item.edmPreview?.[0] || null,
      objectDate: item.year?.[0] || "",
      medium: item.type || "",
      source: "Europeana",
      url: item.guid,
    }));

    return Response.json(results);
  } catch (err) {
    console.error("EUROPEANA ROUTE CRASH:", err);
    return Response.json([]);
  }
}