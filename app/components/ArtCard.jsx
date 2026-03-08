"use client";
import { useState } from "react";
import styles from "./ArtCard.module.css";

export default function ArtCard({ art }) {
  const [expanded, setExpanded] = useState(false);

  // Guard: no image, no card
  if (!art.image) return null;

  return (
    <div>
      <button
        className={styles.imageButton}
        onClick={() => setExpanded(v => !v)}
        aria-label={`Toggle view for ${art.title}`}
      >
        <div
          className={`${styles.imageFrame} ${
            expanded ? styles.expanded : ""
          }`}
        >
          <img
            className={styles.image}
            src={art.image}
            alt={art.title}
          />
        </div>
      </button>

      <h3>{art.title}</h3>
      <p>{art.artistDisplayName}</p>
      <p>{art.objectDate}</p>

      {expanded && art.url && (
        <a
          className={styles.museumLink}
          href={art.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on museum website →
        </a>
      )}
    </div>
  );
}
