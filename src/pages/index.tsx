import type { NextPage } from "next";
import algoliasearch from "algoliasearch";
import { createNullCache } from "@algolia/cache-common";

import Head from "next/head";
import Image from "next/image";
import Canvas from "../components/canvas";
import Palette from "../components/palette";
import styles from "../styles/Home.module.css";
import { InstantSearch, connectSearchBox } from "react-instantsearch-dom";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const COOLDOWN_SECONDS = 0;
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!,
  {
    responsesCache: createNullCache(),
    requestsCache: createNullCache(),
  }
);

const index = searchClient.initIndex("algolia_canvas_place");

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
  const [cooldownTime, setCooldownTime] = useState(COOLDOWN_SECONDS);
  const [hasCooldown, setHasCooldown] = useState(
    COOLDOWN_SECONDS === 0 ? false : true
  );

  useEffect(() => {
    if (cooldown) {
      let currentTime = cooldownTime - 1;
      const interval = setInterval(() => {
        if (currentTime === -1) {
          setCooldown(false);
          setCooldownTime(COOLDOWN_SECONDS);
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
    fetch("/api/socket").finally(() => {
      const socket = io(
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://rplace-with-algolia.vercel.app/"
      );
      let currentCount = userCount;

      socket.on("connect", () => {
        console.log("connect");
      });

      socket.on("a user connected", () => {
        console.log("a user connected");
        setUserCount(currentCount + 1);
        console.log(userCount);
      });

      socket.on("disconnect", () => {
        console.log("disconnect");
        setUserCount(currentCount - 1);
      });
    });
  }, []);
  return (
    <div className={styles.container}>
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

      <header
        style={{
          textAlign: "center",
          width: "calc(var(--canvas-size)/1.25)",
          margin: "auto",
        }}
      >
        <h1>
          r/<s>place</s>
          <span style={{ color: "var(--algolia-brand)" }}>algolia</span>
        </h1>

        <div style={{ textAlign: "left", margin: ".5em auto" }}>
          <div>
            <b>Connected users:</b>{" "}
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "100px",
                background: "linear-gradient(to top, #02BE01, #94E044)",
                marginRight: 5,
              }}
            />
            {userCount}
          </div>
          <div>
            <b>Cooldown:</b>{" "}
            {COOLDOWN_SECONDS === 0 ? (
              <>
                <s>0s</s> No cooldown for cool kids
              </>
            ) : (
              <span>{cooldownTime}s</span>
            )}
          </div>
        </div>
      </header>

      <div>
        <InstantSearch
          indexName="algolia_canvas_place"
          searchClient={searchClient}
        >
          <Canvas
            pickedColor={pickedColor}
            index={index}
            showGrid={showGrid}
            setCooldown={setCooldown}
            cooldown={cooldown}
          />
          <Palette
            setPickedColor={setPickedColor}
            setShowGrid={setShowGrid}
            showGrid={showGrid}
            cooldown={cooldown}
          />
        </InstantSearch>
      </div>
      <footer
        style={{ textAlign: "center", padding: "1em 0", lineHeight: "2" }}
      >
        A silly experiment by <a href="https://twitter.com/lukyvj">@lukyvj</a> -{" "}
        Fully powered by <a href="https://algolia.com">Algolia</a>
        <br />
        Check the code on{" "}
        <a href="https://github.com/LukyVj/rplace-algolia">GitHub</a> - Read
        about it{" "}
        <a href="#">
          <s>here</s>
        </a>
      </footer>
    </div>
  );
};

export default Home;
