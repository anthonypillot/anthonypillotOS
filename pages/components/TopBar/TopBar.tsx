import type { NextPage } from "next";
import Link from "next/link";

import FormattedTime from "../FormattedTime/FormattedTime";

import styles from "./TopBar.module.css";

const TopBar: NextPage = () => {
  return (
    <div className={styles.topBar}>
      <span className={styles.contrasted}>anthonypillotOS</span>

      <Link href="/">Launch</Link>
      <Link href="/">Projects</Link>
      <Link href="/">Blog</Link>
      <Link href="/">Contact</Link>
      <Link href="/">About</Link>

      <div className={styles.outright}>
        <Link href="https://github.com/anthonypillot/anthonypillotos">
          GitHub
        </Link>

        <span className={styles.contrasted}>
          <FormattedTime />
        </span>
      </div>
    </div>
  );
};

export default TopBar;
