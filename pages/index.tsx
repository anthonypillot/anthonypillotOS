import type { NextPage } from "next";
import Head from "next/head";

import Window from "./components/Window/Window";

import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>anthonypillotOS - Personal application</title>
        <meta
          name="description"
          content="Personal application intended to introduce myself and what I'm doing in the IT world."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.centeredContent}>
        <Window />
      </div>

      <div className={styles.background}></div>
      <div className={`${styles.background} ${styles.backgroundSecond}`}></div>
      <div className={`${styles.background} ${styles.backgroundThird}`}></div>
    </div>
  );
};

export default Home;
