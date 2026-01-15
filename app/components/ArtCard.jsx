export default function ArtCard({ art }) {
  if (!art.primaryImageSmall) return null;

  return (
    <div>
      <img src={art.primaryImageSmall} alt={art.title} width="200" />
      <h3>{art.title}</h3>
      <p>{art.artistDisplayName}</p>
      <p>{art.objectDate}</p>
        {art.source}
    </div>
  );
}
