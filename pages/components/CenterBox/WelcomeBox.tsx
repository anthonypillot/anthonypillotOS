import type { NextPage } from "next";
import Image from "next/image";

import LoadingBar from "../LoadingBar/LoadingBar";

import styles from "./WelcomeBox.module.css";

const logoSize: number = 300;

const WelcomeBox: NextPage = () => {
  return (
    <div className={styles.centerBox}>
      <Image
        src="/img/logo_anthonypillotOS_black.svg"
        alt="logo_anthonypillotOS_black"
        height={logoSize}
        width={logoSize}
      ></Image>

      <h1>
        Welcome to <br />
        <span className={styles.subtitleCenterBox}>
          &#123; this.application &#125;
        </span>
      </h1>

      <LoadingBar />
    </div>
  );
};

export default WelcomeBox;
