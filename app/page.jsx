import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Art Explorer</h1>

      <Link href="/search">
        <button>Discover Art</button>
      </Link>
    </main>
  );
}
