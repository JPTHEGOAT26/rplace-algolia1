import type { NextPage } from "next";

import Head from "next/head";
import Canvas from "../components/canvas";
import Palette from "../components/palette";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import Header from "../components/header";
import { index, snapshotIndex } from "../scripts/algolia";
import Button from "../components/button/button";
import { snaptshotType } from "../types/snaptshot";

const COOLDOWN_SECONDS = null;

const Home: NextPage = () => {
  const [pickedColor, setPickedColor] = useState("#FFFFFF");
  const [showGrid, setShowGrid] = useState(false);

  const css = `
  html,body,button { 
     cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='32' height='32' style='transform: translate(10px, 10px); enable-background:new 0 0 19.9 30.8' xml:space='preserve'%3E%3Cpath d='M11.8 29.7c-.1 0-.2 0-.4-.1s-.4-.3-.6-.5l-3.7-8.6-4.5 4.2c-.1.2-.3.3-.6.3-.1 0-.3 0-.4-.1-.3-.1-.6-.5-.6-.9V2c0-.4.2-.8.6-.9.1-.1.3-.1.4-.1.2 0 .5.1.7.3l16 15c.3.3.4.7.3 1.1-.1.4-.5.6-.9.7l-6.3.6 3.9 8.5c.1.2.1.5 0 .8-.1.2-.3.5-.5.6l-2.9 1.3c-.2-.2-.4-.2-.5-.2z' fill='${pickedColor.replace(
       "#",
       "%23"
     )}'/%3E%3Cpath d='m2 2 16 15-7.7.7 4.5 9.8-2.9 1.3-4.3-9.9L2 24V2m0-2c-.3 0-.5.1-.8.2C.5.5 0 1.2 0 2v22c0 .8.5 1.5 1.2 1.8.3.2.6.2.8.2.5 0 1-.2 1.4-.5l3.4-3.2 3.1 7.3c.2.5.6.9 1.1 1.1.2.1.5.1.7.1.3 0 .5-.1.8-.2l2.9-1.3c.5-.2.9-.6 1.1-1.1s.2-1.1 0-1.5l-3.3-7.2 4.9-.4c.8-.1 1.5-.6 1.7-1.3.3-.7.1-1.6-.5-2.1L3.3.7C3 .2 2.5 0 2 0z' style='fill:%23212121'/%3E%3C/svg%3E")10 10, auto} 
     `;

  /**
   * Let's create a cooldown function.
   * This function will be called when the user clicks on the canvas.
   * It will prevent the user to click for the next 3 seconds.
   */
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(
    COOLDOWN_SECONDS ? COOLDOWN_SECONDS : 0
  );
  const [hasCooldown, setHasCooldown] = useState(
    COOLDOWN_SECONDS === null ? false : true
  );
  const [currentHit, setCurrentHit] = useState<{
    id: number;
    bg_color: string;
    coordinates: { x: string; y: string };
  } | null>(null);
  let snapshotsHits: snaptshotType[] = [];
  const [isExplorer, setIsExplorer] = useState(false);
  const [allSnapshots, setAllSnapshots] = useState<snaptshotType[] | null>(
    null
  );
  const [maxSnapshot, setMaxSnapshot] = useState<number>(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<number>(0);
  const [hasDisclaimer, setHasDisclaimer] = useState(true);

  useEffect(() => {
    if (cooldown && cooldownTime) {
      let currentTime = cooldownTime - 1;
      const interval = setInterval(() => {
        if (currentTime === -1) {
          setCooldown(false);
          setCooldownTime(COOLDOWN_SECONDS ? COOLDOWN_SECONDS : 0);
        } else {
          setCooldownTime(currentTime--);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cooldown]);

  /**
   * The following code works fine on dev but not on prod.
   * The following code is a workaround to get the socket.io client on prod.
   * The code is not optimal but it works.
   */
  const [userCount, setUserCount] = useState(0);
  useEffect(() => {
    const socket = io(
      process.env.NODE_ENV === "production"
        ? "https://rplace-algolia-heroku-server.herokuapp.com/"
        : "http://localhost:3001",
      { transports: ["websocket"] }
    );
    let currentCount = userCount;

    socket.on("clients", (e) => {
      setUserCount(e);
    });

    socket.on("disconnect", () => {
      setUserCount(currentCount--);
    });
  }, []);

  useEffect(() => {
    if (isExplorer) {
      snapshotIndex
        .browseObjects({
          query: "",
          batch: (batch: any) => {
            snapshotsHits = snapshotsHits.concat(batch);
          },
        })
        .then(() => {
          setMaxSnapshot(snapshotsHits.length - 1);
          setAllSnapshots(snapshotsHits.reverse());
        });
    }
  }, [isExplorer]);

  return (
    <div>
      <Head>
        <title>r/algoliaPixelWar</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.png" />
        <link
          crossOrigin="anonymous"
          href={`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net`}
          rel="preconnect"
        />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      <Header
        userCount={userCount}
        currentHit={currentHit}
        COOLDOWN_SECONDS={COOLDOWN_SECONDS !== null ? COOLDOWN_SECONDS : 0}
        cooldownTime={COOLDOWN_SECONDS ? COOLDOWN_SECONDS : undefined}
      />

      {hasDisclaimer && (
        <>
          <div
            style={{
              background: "rgb(0 0 0 / 80%)",
              zIndex: 1,
              width: "100vw",
              height: "100vh",
              position: "fixed",
              top: 0,
              left: 0,
            }}
          />
          <div
            style={{
              background: "var(--nebula-500)",
              color: "white",
              fontWeight: "bold",
              padding: "2.15em",
              width: 500,
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 50px rgba(0,0,0,1)",
              zIndex: 2,
            }}
          >
            <h2 className="mt-0">DISCLAIMER</h2>
            <p>Keep this link private within the company ( for now ).</p>
            <p>Thank you :)</p>

            <div className="ta-center">
              <Button
                onClick={() => setHasDisclaimer(false)}
                style={{
                  color: "white",
                  backgroundColor: "#ff4500 !important",
                  fontWeight: "bold",
                }}
                className="mt-16 d-inline-block td-underline"
              >
                Close this disclaimer
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="d-grid g-2 ggap-16 w-800 m-auto">
        <nav className="w-100">
          {process.env.NEXT_PUBLIC_NODE_ENV === "development" && (
            <>
              {" "}
              <Button
                className="mb-24 w-100p"
                onClick={() => setIsExplorer(false)}
              >
                Canvas
              </Button>
              <Button
                className="mb-24 w-100p"
                onClick={() => setIsExplorer(true)}
              >
                Explorer
              </Button>
            </>
          )}

          {isExplorer && allSnapshots ? (
            <>
              {" "}
              <input
                type="range"
                name="explorer_range"
                id="explorer_range"
                className="w-100p"
                min={0}
                max={maxSnapshot}
                onInput={(e) => {
                  setSelectedSnapshot((e.target as any).value);
                }}
              />
              <p>State of the canvas on:</p>
              <time>
                {/* <b>{allSnapshots[selectedSnapshot].dateAdded}</b> */}
              </time>
            </>
          ) : (
            <Palette
              setPickedColor={setPickedColor}
              setShowGrid={setShowGrid}
              showGrid={showGrid}
              cooldown={cooldown}
              hasCooldown={hasCooldown}
              pickedColor={pickedColor}
            />
          )}
        </nav>
        {isExplorer ? (
          <div className="d-flex fxd-column">
            {allSnapshots && (
              <Canvas isSnapshot snapshot={allSnapshots[selectedSnapshot]} />
            )}
          </div>
        ) : (
          <div>
            <Canvas
              pickedColor={pickedColor}
              index={index}
              showGrid={showGrid}
              setCooldown={setCooldown}
              cooldown={cooldown}
              hasCooldown={hasCooldown}
              setCurrentHit={setCurrentHit}
              useApiRoute
            />
          </div>
        )}
      </div>
      <footer
        style={{ textAlign: "center", padding: "1em 0", lineHeight: "2" }}
      >
        A silly experiment by <a href="https://twitter.com/lukyvj">@lukyvj</a> -{" "}
        Fully powered by <a href="https://algolia.com">Algolia</a>
        <br />
        Check the code on{" "}
        <a href="https://github.com/LukyVj/rplace-algolia">
          <s style={{ color: "red" }}>GitHub</s>
        </a>{" "}
        - Read about it{" "}
        <a href="#">
          <s style={{ color: "red" }}>here</s>
        </a>
      </footer>
    </div>
  );
};

export default Home;
