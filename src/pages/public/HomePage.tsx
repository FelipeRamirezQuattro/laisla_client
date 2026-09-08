import { useEffect, useMemo, useState } from "react";
import { publicApi } from "../../api/public";
import { publicMenuApi } from "../../api/publicMenu";
import type { Event, Recipe } from "../../types";
import "./home/home.css";
import { HomeHeader } from "./home/HomeHeader";
import { HomeHero } from "./home/HomeHero";
import { HomeReasons } from "./home/HomeReasons";
import { HomeMenuPreview } from "./home/HomeMenuPreview";
import { HomeEvents } from "./home/HomeEvents";
import { HomeIslena } from "./home/HomeIslena";
import { HomeDinner } from "./home/HomeDinner";
import { HomeBooking } from "./home/HomeBooking";
import { HomeLocation } from "./home/HomeLocation";
import { HomeFooter } from "./home/HomeFooter";
import { recipePriceLabel } from "./home/helpers";

export function HomePage() {
  const [menuRecipes, setMenuRecipes] = useState<Recipe[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);

  useEffect(() => {
    publicMenuApi
      .get()
      .then((res) => setMenuRecipes(res.data.recipes))
      .catch(() => setMenuRecipes([]));
  }, []);

  useEffect(() => {
    publicApi
      .getEvents()
      .then((res) => setPublicEvents(res.data))
      .catch(() => setPublicEvents([]));
  }, []);

  const menuItems = useMemo(
    () =>
      menuRecipes.slice(0, 6).map((recipe) => ({
        id: recipe._id,
        name: recipe.name,
        desc:
          recipe.description ||
          `${recipe.variants.length} variante(s) disponibles en barra`,
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
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeReasons />
        <HomeMenuPreview menuItems={menuItems} />
        <HomeEvents events={calendarEvents} />
        <HomeIslena />
        <HomeDinner dinnerEvent={dinnerEvent} />
        <HomeBooking />
        <HomeLocation />
      </main>
      <HomeFooter />
    </div>
  );
}
