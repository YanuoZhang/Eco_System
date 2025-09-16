// Timeline service for climate timeline data

import { TimelinePeriod } from "../types";
import fs from "fs";
import path from "path";

// Static climate timeline data (fallback when JSON is not available)
const climateTimelineData: TimelinePeriod[] = [
  {
    period: "1880-1950",
    years: "1880-1950",
    title: "Industrial Revolution Begins",
    dramaticText:
      "The machines awakened. Steam and steel promised progress, but the atmosphere began remembering every smokestack.",
    childPerspective:
      "Children of this era watched the first smokestacks rise, unknowing that these tall towers would forever change the world.",
    visual:
      "https://readdy.ai/api/search-image?query=Industrial%20revolution%20scene%20with%20steam-powered%20factories%2C%20coal%20smokestacks%20belching%20black%20smoke%20into%20clear%20sky%2C0workers%20in%20early%20industrial%20setting%2C%20children%20watching%20from%20distance%2C%20dramatic%20contrast%20between%20human%20progress%20and%20environmental%20impact&width=600&height=300&seq=story-industrial-1&orientation=landscape",
    events: [],
  },
  {
    period: "1950-1990",
    years: "1950-1990",
    title: "The Great Acceleration",
    dramaticText:
      "We built a world of abundance, not knowing we were writing stories of scarcity for our children.",
    childPerspective:
      "Baby boomers grew up believing progress meant prosperity, while their children would inherit a warming world.",
    visual:
      "https://readdy.ai/api/search-image?query=1950s%20suburban%20boom%20with%20cars%2C%20highways%2C%20factories%2C%20families%20with%20children%20enjoying%20modern%20lifestyle%20contrasted%20with%20early%20climate%20scientists%20studying%20atmospheric%20data%2C%20showing%20the%20acceleration%20of%20human%20impact&width=600&height=300&seq=story-acceleration-2&orientation=landscape",
    events: [],
  },
  {
    period: "1990-2010",
    years: "1990-2010",
    title: "First Climate Signals",
    dramaticText:
      "The Earth began to speak. Hurricanes grew stronger, glaciers retreated, but the world was still learning to listen.",
    childPerspective:
      "Millennial children witnessed the first climate documentaries, learning their planet was in danger.",
    visual:
      "https://readdy.ai/api/search-image?query=Early%20climate%20change%20impacts%20showing%20melting%20glaciers%2C%20stronger%20hurricanes%2C%20children%20watching%20environmental%20documentaries%20in%20classrooms%2C%20climate%20scientists%20presenting%20research%2C%20growing%20environmental%20awareness%20among%20young%20people&width=600&height=300&seq=story-signals-3&orientation=landscape",
    events: [],
  },
  {
    period: "2010-2020",
    years: "2010-2020",
    title: "Climate Crisis Arrives",
    dramaticText:
      "The future knocked on our door through smoke and flames. A generation stood up, refusing to inherit a broken world.",
    childPerspective:
      "Gen Z children led school strikes, demanding adults act on climate change before it was too late.",
    visual:
      "https://readdy.ai/api/search-image?query=Climate%20crisis%20scene%20showing%20Australian%20bushfires%2C%20children%20and%20teenagers%20in%20climate%20protests%20holding%20signs%2C%20school%20climate%20strikes%2C%20youngactivists%20speakingat%20rallies%2C%20dramatic%20skywith%20smoke%20and%20flames&width=600&height=300&seq=story-crisis-4&orientation=landscape",
    events: [],
  },
  {
    period: "2020-2030",
    years: "2020-2030",
    title: "The Crossroads Moment",
    dramaticText:
      "This is our moment. The story of what happens next is still being written - through every choice we make today.",
    childPerspective:
      "Today’s children will live the consequences of our choices. Their future depends on the actions we take now.",
    visual:
      "https://readdy.ai/api/search-image?query=Hopeful%20future%20scene%20showing%20renewable%20energy%20farms%2C%20electric%20vehicles%2C%20green%20cities%2C%20children%20playing%20in%20clean%20environments%2C%20families%20taking%20climate%20action%2C%20solar%20panels%20and%20wind%20turbines%2C%20sustainable%20lifestyle%2C%20bright%20future%20possibility&width=600&height=300&seq=story-choice-5&orientation=landscape",
    events: [],
  },
];

// Attempt to load timeline data from public JSON; fallback to static mock
function loadTimelineFromFile(): TimelinePeriod[] | null {
  try {
    const filePath = path.join(process.cwd(), "public", "climate-timeline.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    // Handle both array format and wrapped format
    const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;
    return data as TimelinePeriod[] | null;
  } catch (error) {
    console.error("Error loading timeline data from file:", error);
    return null;
  }
}

function getData(): TimelinePeriod[] {
  // Always read fresh to avoid serving stale data during edits/deploys
  const fileData = loadTimelineFromFile();
  if (fileData && Array.isArray(fileData) && fileData.length > 0) return fileData;
  return climateTimelineData;
}

export function getAllTimelineData(): TimelinePeriod[] {
  return getData();
}

export function getTimelineStats() {
  const data = getData();
  return {
    totalPeriods: data.length,
    totalEvents: data.reduce((sum, period) => sum + (period.events?.length || 0), 0),
    lastUpdated: new Date().toISOString(),
    source: "api",
  };
}
