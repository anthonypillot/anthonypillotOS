import type { NextPage } from "next";
import Head from "next/head";

import TopBar from "./components/TopBar/TopBar";
import CenterBox from "./components/CenterBox/CenterBox";

import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>anthonypillotOS</title>
        <meta name="description" content="anthonypillotOS application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TopBar />
      <CenterBox />

      <div className={styles.background}></div>
      <div className={`${styles.background} ${styles.backgroundSecond}`}></div>
      <div className={`${styles.background} ${styles.backgroundThird}`}></div>
    </div>
  );
};

export default Home;
