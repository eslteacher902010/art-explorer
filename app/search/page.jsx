"use client";

import { useState } from "react";
import ArtCard from "../components/ArtCard.jsx";
import styles from "./search.module.css";



export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medium, setMedium] = useState("any");
  const [period, setPeriod] = useState("any");

function applyFilters(artworks) {
  return artworks.filter(
    art => mediumMatches(art) && periodMatches(art)
  );
}


function mediumMatches(art) {

    if (medium === "any") return true;
    
    const text = (
    art.classification ||
    art.objectName ||
    art.medium ||
    ""
  ).toLowerCase();

  return text.includes(medium.toLowerCase());
}

function periodMatches(art) {
  if (period === "any") return true;

  const dateTest= (art.objectDate || "").toLowerCase();

  switch (period) {
    case "renaissance":
      return /14|15|16/.test(dateTest); // 14th, 15th, 16th centuries
    case "baroque":
      return /17/.test(dateTest); // 17th century
    case "romantic":
      return /18/.test(dateTest); // 18th century
    case "modern":
      return /19|20/.test(dateTest); // 19th and 20th centuries
    default:
      return true;
  }
}

  async function handleSearch(source) {
    if(!query.trim()) return;

    try{
        if (source === "met") return await fetchMET(query);
        if (source === "harvard") return await fetchHarvard(query);
        if (source === "cleveland") return await fetchCleveland(query);
        if (source === "artic") return await fetchArtic(query);
        if (source === "rijksmuseum") return await fetchRijksmuseum(query);

      }catch (err){
        console.error(err);
        return [];
      }
    }

  

 async function handleSearchAll() {
  if (!query.trim()) return;

  setLoading(true);
  setArtworks([]);

  try {
    const results = await Promise.all([
      handleSearch("met"),
      handleSearch("harvard"),
      handleSearch("cleveland"),
      handleSearch("artic"),
      handleSearch("rijksmuseum"),
    ]);

    const combined = results.flat().filter(Boolean);

    const filtered = combined.filter(
      art => mediumMatches(art) && periodMatches(art)
    );

    setArtworks(filtered);
  } finally {
    setLoading(false);
  }
}


async function fetchMET(query) {
  const searchRes = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(query)}`
  );

  const searchData = await searchRes.json();

  if (!Array.isArray(searchData.objectIDs)) return [];

  const ids = searchData.objectIDs.slice(0, 30);

  const artData = (await Promise.all(
    ids.map(id =>
      fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
      ).then(res => res.json())
    )
  )).filter(
    art => art.primaryImageSmall || art.primaryImage
  );

  return artData.map(art => ({
    objectID: `met-${art.objectID}`,
    title: art.title,
    artistDisplayName: art.artistDisplayName || "Unknown artist",
    primaryImageSmall: art.primaryImageSmall || art.primaryImage,
    objectDate: art.objectDate || "",
    medium: art.classification || art.medium || "",
    source: "MET",
  }));
}


async function fetchHarvard(query) {
  const API_KEY = process.env.NEXT_PUBLIC_HARVARD_API_KEY;

  const res = await fetch(
    `https://api.harvardartmuseums.org/object?apikey=${API_KEY}&q=${encodeURIComponent(
      query
    )}&size=6&hasimage=1`
  );

  const data = await res.json();

  const normalized = (data.records || []).map((art) => ({
    objectID: `har-${art.id}`,
    title: art.title,
    artistDisplayName:
      art.people?.find((p) => p.role === "Artist")?.name ||
      art.people?.[0]?.name ||
      "Unknown artist",
    primaryImageSmall: art.primaryimageurl || "",
    objectDate: art.dated || "",
    medium: art.classification || art.medium || "",
  }));
  return normalized;
}


async function fetchCleveland(query) {
  const res = await fetch(
    `https://openaccess-api.clevelandart.org/api/artworks?q=${encodeURIComponent(
      query
    )}&has_image=1&limit=6`
  );

  const data = await res.json();

  const normalized = data.data.map((art) => ({
  objectID: `cle-${art.id}`,
  title: art.title,
  artistDisplayName:
    art.creators?.find((c) => c.role === "artist")?.description ||
    "Unknown artist",
  primaryImage: art.images?.web?.url || "",
  primaryImageSmall: art.images?.web?.url || "",
  objectDate: art.creation_date || "",
  medium: art.classification || art.medium || "",
  source: "Cleveland",
}));
return normalized;

}

async function fetchArtic(query) {
  const res = await fetch(`/api/artic?q=${encodeURIComponent(query)}`);
  const data = await res.json();

  return data;
}


async function fetchRijksmuseum(query) {
  const res = await fetch(`/api/rijks?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data;
}



  return (
    <main>
      <div className={styles.searchSection}>
        <label className={styles.searchLabel}>
        Search Artworks
      <input
        placeholder="Search  for a work of art, works by an artist, or a theme or keyword"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      </label>

      <details className={styles.advanced}>
      <summary>Advanced Filters (optional)</summary>

      <div className={styles.filters}>
        <label>
        <select value={medium} onChange={(e) => setMedium(e.target.value)}>
          <option value="any">Any Medium</option>
          <option value="painting">Painting</option>
          <option value="sculpture">Sculpture</option>
          <option value="photography">Photography</option>
        </select>
        </label>

        <label>
          Period
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="any">Any Period</option>
          <option value="renaissance">Renaissance</option>
          <option value="baroque">Baroque</option>
          <option value="romantic">Romantic</option>
          <option value="modern">Modern</option>
        </select>
        </label>
        </div>
      </details>

    <div className={styles.actions}>
      <button
          onClick={async () => {
            setLoading(true);
            const results = await handleSearch("met");
            setArtworks(applyFilters(results));
            setLoading(false);
          }}
        >
          Search MET
        </button>
      <button
          onClick={async () => {
            setLoading(true);
            const results = await handleSearch("harvard");
            setArtworks(applyFilters(results));
            setLoading(false);
          }}
        >
          Search Harvard
        </button>
      <button
          onClick={async () => {
            setLoading(true);
            const results = await handleSearch("cleveland");
            setArtworks(applyFilters(results));
            setLoading(false);
          }}
        >
          Search Cleveland Art Museum
        </button>
      <button
          onClick={async () => {
            setLoading(true);
            const results = await handleSearch("artic");
            setArtworks(applyFilters(results));
            setLoading(false);
          }}
        >
          Search the Art Institute of Chicago
        </button>
      <button
          onClick={async () => {
            setLoading(true);
            const results = await handleSearch("rijksmuseum");
            setArtworks(applyFilters(results));
            setLoading(false);
          }}
        >
          Search the Rijksmuseum
        </button>
      <button onClick={handleSearchAll}>Search All Museums</button>

      </div>
      </div>

      {loading && <p>Loading...</p>}

      <div className={styles.resultsGrid}>
        {artworks.map((art, index) => (
          <ArtCard key={art.objectID || art.id || index} art={art} />
        ))}

      </div>
         {!loading && artworks.length === 0 && (
  <p>No results found.</p>
)}
    </main>
  );

}
