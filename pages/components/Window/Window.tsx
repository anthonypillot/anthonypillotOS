import type { NextPage } from "next";
import Image from "next/image";

import styles from "./Window.module.scss";

import FormattedTime from "../FormattedTime/FormattedTime";

const Window: NextPage = () => {
  return (
    <div className={styles.mainWrapper}>
      <div className={styles.top}>
        <h1>
          Welcome to
          <span className={styles.title}> &#123; this.application &#125;</span>
        </h1>
      </div>

      <div className={styles.window}>
        <div className={styles.header}>
          <div className={styles.circleMenu} />
          <div className={styles.headerMenu}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="mailto: pillot.anthony@gmail.com"
            >
              Email
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.linkedin.com/in/anthony-pillot/"
            >
              LinkedIn
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://twitter.com/anthonypillot_"
            >
              Twitter
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/anthonypillot"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* start content of the main window */}
        <div className={styles.windowWrapper}>
          <div className={styles.leftWrapper}>
            <div className={styles.leftContent}>
              <div className={styles.leftSideTitle}>
                <a>All applications</a>
              </div>
              <div className={styles.leftSideElement}>
                <a>First element incoming</a>
              </div>
              <div className={styles.leftSideElement}>
                <a>Second element incoming</a>
              </div>
              <div className={styles.leftSideElement}>
                <a>Third element incoming</a>
              </div>
              <div className={styles.leftSideElement}>
                <a>Fourth element incoming</a>
              </div>
            </div>
            <div className={styles.bottomLeftSide}>
              <FormattedTime />
            </div>
          </div>
          <div className={styles.centerContentWrapper}>
            <Image
              src="/assets/logo_anthonypillotOS_black.svg"
              alt="logo_anthonypillotOS_black"
              height={350}
              width={350}
            ></Image>
            <h1>
              Hi. I'm Anthony Pillot.
              <br />
              Full-Stack developer.
            </h1>

            <span className={styles.subtitle}>
              Personal application intended to introduce myself and what I'm
              doing in the IT world.
            </span>

            <span className={styles.warningText}>
              Warning: This website is under development. It can be extremely
              far from the final rendering.
            </span>

            <span>
              I've worked or I'm working on:
              <ul>
                <li>Languages : JavaScript, Node.js, Java.</li>
                <li>Back-end frameworks : Express, Spring.</li>
                <li>Front-end frameworks : Vue.js, React.js.</li>
                <li>
                  Data : SQL et NoSQL (PostgreSQL, MongoDB, Azure CosmosDB).
                </li>
                <li>
                  Tools : Docker, Kubernetes, Rancher, Prometheus, Grafana,
                  Postman.
                </li>
                <li>CI/CD : GitHub Actions, GitLab CI, Circle CI.</li>
                <li>
                  Security : API Gateway (Gravitee), OAuth 2.0 OIDC (Keycloak).
                </li>
                <li>IDE : VisualStudio Code, IntelliJ IDEA Ultimate.</li>
                <li>
                  Cloud and serverless : GCP (Compute Engine, GKE, Cloud Run,
                  BigQuery), Azure (AKS), Oracle Cloud Infrastructure (Compute
                  Instance, Autonomous Database), Matomo (web analytics).
                </li>
              </ul>
            </span>
            <span>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum
              rerum voluptatibus necessitatibus saepe ad voluptatum fuga hic
              deserunt. Commodi autem dolorem fugit provident consequatur
              tenetur ducimus soluta at veniam itaque! Lorem ipsum, dolor sit
              amet consectetur adipisicing elit. Rerum sit, quisquam nihil alias
              repudiandae esse. Amet veritatis labore autem numquam. Excepturi
              blanditiis quam quasi? Aspernatur non natus quidem repellendus
              quae!
            </span>
          </div>
        </div>
      </div>
      {/* end content of the main window */}
    </div>
  );
};

export default Window;
