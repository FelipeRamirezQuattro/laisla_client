import { useEffect, useMemo, useState } from "react";
import { publicApi } from "../../api/public";
import { publicMenuApi } from "../../api/publicMenu";
import type { Event, Recipe } from "../../types";
import "./home/home.css";
import { HomeHero } from "./home/HomeHero";
import { HomeReasons } from "./home/HomeReasons";
import { HomeMenuPreview } from "./home/HomeMenuPreview";
import { HomeEvents } from "./home/HomeEvents";
import { HomeIslena } from "./home/HomeIslena";
import { HomeDinner } from "./home/HomeDinner";
import { HomeBooking } from "./home/HomeBooking";
import { HomeLocation } from "./home/HomeLocation";
import { recipePriceLabel } from "./home/helpers";

export function HomePage() {
  const [menuRecipes, setMenuRecipes] = useState<Recipe[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [menuStatus, setMenuStatus] = useState<"loading" | "ready" | "error">("loading");
  const [eventsStatus, setEventsStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    Promise.allSettled([publicMenuApi.get(), publicApi.getEvents()]).then(
      ([menuResult, eventsResult]) => {
        if (!active) return;

        if (menuResult.status === "fulfilled") {
          setMenuRecipes(menuResult.value.data.recipes);
          setMenuStatus("ready");
        } else {
          setMenuRecipes([]);
          setMenuStatus("error");
        }

        if (eventsResult.status === "fulfilled") {
          setPublicEvents(eventsResult.value.data);
          setEventsStatus("ready");
        } else {
          setPublicEvents([]);
          setEventsStatus("error");
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const menuItems = useMemo(
    () =>
      menuRecipes.slice(0, 4).map((recipe) => ({
        id: recipe._id,
        name: recipe.name,
        desc:
          recipe.description ||
          `${recipe.variants.length} presentación(es) disponibles en barra`,
        price: recipePriceLabel(recipe),
      })),
    [menuRecipes],
  );

  const calendarEvents = publicEvents
    .filter((event) => event.type !== "dinner-with-strangers")
    .slice(0, 3);
  const dinnerEvent =
    publicEvents.find((event) => event.type === "dinner-with-strangers") ?? null;

  return (
    <div className="li-home">
      <div>
        <HomeHero />
        <HomeReasons />
        <HomeMenuPreview menuItems={menuItems} status={menuStatus} />
        <HomeEvents events={calendarEvents} status={eventsStatus} />
        <HomeIslena />
        <HomeDinner dinnerEvent={dinnerEvent} />
        <HomeBooking />
        <HomeLocation />
      </div>
    </div>
  );
}
