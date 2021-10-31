import type { NextPage } from "next";
import Link from "next/link";

import moment from "moment";

import styles from "./TopBar.module.css";

// format used by moment: "October 31, 2021 8:24:33 PM"
const currentTime = `${moment().format("LL")} ${moment().format("LTS")}`;

const TopBar: NextPage = () => {
  return (
    <div className={styles.topBar}>
      <span className="contrasted">anthonypillotOS</span>

      <Link href="/">Launch</Link>
      <Link href="/">Projects</Link>
      <Link href="/">Blog</Link>
      <Link href="/">Contact</Link>
      <Link href="/">About</Link>

      <div className={styles.outright}>
        <Link href="https://github.com/anthonypillot/anthonypillotos">
          GitHub
        </Link>

        <span className={styles.contrasted}>{currentTime}</span>
      </div>
    </div>
  );
};

export default TopBar;
