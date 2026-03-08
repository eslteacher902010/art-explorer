"use client";

import { useState, useEffect } from "react";
import ArtCard from "../components/ArtCard.jsx";
import styles from "./search.module.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medium, setMedium] = useState("any");
  const [period, setPeriod] = useState("any");
  const [activeSource, setActiveSource] = useState(null);

  const PAGE_SIZE = 50;

  const [offsets, setOffsets] = useState({
    met: 0,
    harvard: 1,
    artic: 1,
    rijksmuseum: 1,
    europeana: 0,
  });

  /* ===================== FILTERS ===================== */

  function applyFilters(items) {
    return items.filter(
      (art) => mediumMatches(art) && periodMatches(art)
    );
  }

  function mediumMatches(art) {
    if (medium === "any") return true;
    return (art.medium || "").toLowerCase().includes(medium);
  }

  function periodMatches(art) {
    if (period === "any") return true;
    const d = (art.objectDate || "").toLowerCase();
    if (period === "renaissance") return /14|15|16/.test(d);
    if (period === "baroque") return /17/.test(d);
    if (period === "romantic") return /18/.test(d);
    if (period === "modern") return /19|20/.test(d);
    return true;
  }

/* ===================== MET ===================== */
async function fetchMET(query, offset = 0) {
  const res = await fetch(
    `/api/met?q=${encodeURIComponent(query)}&offset=${offset}`
  );

  if (!res.ok) return [];
  return res.json();
}

/* ===================== EUROPEANA ===================== */
async function fetchEuropeana(query, offset = 0) {
  const res = await fetch(
    `/api/europeana?q=${encodeURIComponent(query)}&offset=${offset}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  console.log("Europeana results (client):", data.length);

  return data;
}

  /* ===================== HARVARD ===================== */

  async function fetchHarvard(query, page = 1) {
    const API_KEY = process.env.NEXT_PUBLIC_HARVARD_API_KEY;

    const res = await fetch(
      `https://api.harvardartmuseums.org/object?apikey=${API_KEY}&q=${encodeURIComponent(
        query
      )}&hasimage=1&size=${PAGE_SIZE}&page=${page}`
    );

    const data = await res.json();

    return (data.records || []).map((art) => ({
      objectID: `har-${art.id}`,
      title: art.title,
      artistDisplayName:
        art.people?.find((p) => p.role === "Artist")?.name ||
        art.people?.[0]?.name ||
        "Unknown artist",
      image: art.primaryimageurl || "",
      objectDate: art.dated || "",
      medium: art.classification || art.medium || "",
      source: "Harvard",
      url: art.url,
    }));
  }

  /* ===================== CLEVELAND ===================== */

  async function fetchCleveland(query) {
    const res = await fetch(
      `https://openaccess-api.clevelandart.org/api/artworks?q=${encodeURIComponent(
        query
      )}&has_image=1&limit=${PAGE_SIZE}`
    );

    const data = await res.json();

    return data.data.map((art) => ({
      objectID: `cle-${art.id}`,
      title: art.title,
      artistDisplayName:
        art.creators?.find((c) => c.role === "artist")?.description ||
        "Unknown artist",
      image: art.images?.web?.url || "",
      objectDate: art.creation_date || "",
      medium: art.classification || art.medium || "",
      source: "Cleveland",
      url: art.url,
    }));
  }

  /* ===================== ArtIC / Rijks ===================== */

  const fetchArtic = (q, p = 1) =>
    fetch(`/api/artic?q=${encodeURIComponent(q)}&page=${p}`).then((r) =>
      r.json()
    );

  const fetchRijksmuseum = (q, p = 1) =>
    fetch(`/api/rijks?q=${encodeURIComponent(q)}&page=${p}`).then((r) =>
      r.json()
    );

  /* ===================== LOAD MORE ===================== */

  async function handleLoadMore() {
    if (!activeSource) return;
    setLoading(true);

    let results = [];

    if (activeSource === "met") {
      const next = offsets.met + PAGE_SIZE;
      setOffsets((o) => ({ ...o, met: next }));
      results = await fetchMET(query, next);
    }

    if (activeSource === "europeana") {
  const next = offsets.europeana + PAGE_SIZE;
  setOffsets((o) => ({ ...o, europeana: next }));
  results = await fetchEuropeana(query, next);
}

    if (activeSource === "harvard") {
      const next = offsets.harvard + 1;
      setOffsets((o) => ({ ...o, harvard: next }));
      results = await fetchHarvard(query, next);
    }

    if (activeSource === "artic") {
      const next = offsets.artic + 1;
      setOffsets((o) => ({ ...o, artic: next }));
      results = await fetchArtic(query, next);
    }

    if (activeSource === "rijksmuseum") {
      const next = offsets.rijksmuseum + 1;
      setOffsets((o) => ({ ...o, rijksmuseum: next }));
      results = await fetchRijksmuseum(query, next);
    }

    setArtworks((prev) => [...prev, ...applyFilters(results)]);
    setLoading(false);
  }

  

  /* ===================== RESET ===================== */

  useEffect(() => {
    setOffsets({ met: 0, harvard: 1, artic: 1, rijksmuseum: 1, europeana: 0 });
    setActiveSource(null);
    setArtworks([]);
  }, [query]);

  /* ===================== UI and buttons===================== */

  return (
    <main>
      <div className={styles.searchSection}>
        <label className={styles.searchLabel}>
          Search Artworks
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artist, artwork, or keyword"
          />
        </label>

        <div className={styles.filters}>
          <label>
            Medium:
            <select value={medium} onChange={(e) => setMedium(e.target.value)}>
              <option value="any">Any</option>
              <option value="painting">Painting</option>
              <option value="sculpture">Sculpture</option>
              <option value="drawing">Drawing</option>
              <option value="print">Print</option>
              <option value="photograph">Photograph</option>
            </select>
          </label>

          <label>
            Period:
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="any">Any</option>
              <option value="renaissance">Renaissance (14-16th c.)</option>
              <option value="baroque">Baroque (17th c.)</option>
              <option value="romantic">Romantic (18th c.)</option>
              <option value="modern">Modern (19-20th c.)</option>
            </select>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            onClick={async () => {
              setActiveSource("met");
              setLoading(true);
              setOffsets((o) => ({ ...o, met: 0 }));
              setArtworks(applyFilters(await fetchMET(query, 0)));
              setLoading(false);
            }}
          >
            MET
          </button>

         <button
            onClick={async () => {
              setActiveSource("europeana");
              setLoading(true);
              setOffsets((o) => ({ ...o, europeana: 0 }));
              setArtworks(applyFilters(await fetchEuropeana(query, 0)));
              setLoading(false);
            }}
          >
            Europeana
          </button>     

          <button
            onClick={async () => {
              setActiveSource("harvard");
              setLoading(true);
              setOffsets((o) => ({ ...o, harvard: 1 }));
              setArtworks(applyFilters(await fetchHarvard(query, 1)));
              setLoading(false);
            }}
          >
            Harvard
          </button>

          <button
            onClick={async () => {
              setActiveSource("cleveland");
              setLoading(true);
              setArtworks(applyFilters(await fetchCleveland(query)));
              setLoading(false);
            }}
          >
            Cleveland
          </button>

          <button
            onClick={async () => {
              setActiveSource("artic");
              setLoading(true);
              setOffsets((o) => ({ ...o, artic: 1 }));
              setArtworks(applyFilters(await fetchArtic(query, 1)));
              setLoading(false);
            }}
          >
            ArtIC
          </button>

          <button
            onClick={async () => {
              setActiveSource("rijksmuseum");
              setLoading(true);
              setOffsets((o) => ({ ...o, rijksmuseum: 1 }));
              setArtworks(applyFilters(await fetchRijksmuseum(query, 1)));
              setLoading(false);
            }}
          >
            Rijks
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}

      <div className={styles.resultsList}>
        {artworks.map((art) => (
          <div key={art.objectID} className={styles.resultItem}>
            <ArtCard art={art} />
          </div>
        ))}
      </div>

      {activeSource && activeSource !== "cleveland" && artworks.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button
            disabled={loading}
            onClick={handleLoadMore}
            className={styles.loadMoreButton}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {!loading && activeSource && artworks.length === 0 && (
        <p>No results found.</p>
      )}
    </main>
  );
}
