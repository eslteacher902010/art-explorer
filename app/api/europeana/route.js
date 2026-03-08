// app/api/europeana/route.js

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const offset = Number(searchParams.get("offset") || 0);
    const PAGE_SIZE = 50;

    if (!q.trim()) return Response.json([]);

    const EUROPEANA_KEY = process.env.EUROPEANA_API_KEY;

    if (!EUROPEANA_KEY) {
      console.error("EUROPEANA API KEY MISSING");
      return Response.json([]);
    }

   // app/api/europeana/route.js

const url =
  `https://api.europeana.eu/record/v2/search.json` +
  `?query=${encodeURIComponent(q)}` + 
  `&qf=TYPE:IMAGE` +       // Keep this to ensure we get pictures
  `&rows=${PAGE_SIZE}` +
  `&start=${offset + 1}` + 
  `&wskey=${EUROPEANA_KEY}`;

    const res = await fetch(url, { cache: "no-store" });
    
    // 1. Get the data as JSON immediately
    const data = await res.json();

    // 2. Log to Render dashboard to see what's actually happening
    console.log("FULL API URL:", url.replace(EUROPEANA_KEY, "HIDDEN")); 
    console.log("STATUS:", res.status);
    console.log("ITEMS COUNT:", data.itemsCount);

    // 3. Validate items exist
    if (!data.items || !Array.isArray(data.items)) {
      console.log("No items array found in response");
      return Response.json([]);
    }

    // 4. Map the results
    const results = data.items.map((item) => ({
      objectID: `europeana-${item.id}`,
      title: item.title?.[0] || "Untitled",
      artistDisplayName:
        item.dcCreator?.[0] ||
        item.dcContributor?.[0] ||
        "Unknown artist",
      image: item.edmPreview?.[0] || null,
      objectDate: item.year?.[0]?.toString() || item.dcDate?.[0]?.toString() || "",
      medium: item.dcFormat?.[0] || item.medium?.[0] || item.type || "",
      source: "Europeana",
      url: item.guid,
    }));

    return Response.json(results);
  } catch (err) {
    console.error("EUROPEANA ROUTE CRASH:", err);
    return Response.json([]);
  }
}