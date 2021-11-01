import type { NextPage } from "next";
import Head from "next/head";

import TopBar from "./components/TopBar/TopBar";
import WelcomeBox from "./components/CenterBox/WelcomeBox";

import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>anthonypillotOS</title>
        <meta
          name="description"
          content="Personal application intended to introduce myself, a blog, and what I'm doing in the IT world."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TopBar />

      <div className={styles.centeredContent}>
        <WelcomeBox />
      </div>

      <div className={styles.background}></div>
      <div className={`${styles.background} ${styles.backgroundSecond}`}></div>
      <div className={`${styles.background} ${styles.backgroundThird}`}></div>
    </div>
  );
};

export default Home;
