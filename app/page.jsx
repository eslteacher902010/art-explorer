import Link from "next/link";
import styles from "./page.module.css";
  

export default function Home() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.artBg}></div>
      <div className={styles.content}>
        <h1>Art Explorer</h1>

      <Link href="/search">
        <button>Discover Art</button>
      </Link>
      </div>
    </main>
  );

}

