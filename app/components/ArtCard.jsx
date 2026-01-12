export default function ArtCard({ art }) {
  if (!art.primaryImageSmall) return null;

  return (
    <div>
      <img src={art.primaryImageSmall} alt={art.title} width="200" />
      <h3>{art.title}</h3>
      <p>{art.artistDisplayName}</p>
      <p>{art.objectDate}</p>
      <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>
        {art.source}
      </p>
    </div>
  );
}
