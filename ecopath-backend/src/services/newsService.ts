// News service for climate news fetching and processing

import { parseString } from "xml2js";
import axios from "axios";
import { NewsItem } from "../types";
import { summarizeText } from "../gemini";

// Cache for news data
let newsCache: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Function to check if news is climate/environment related
export function isClimateRelated(headline: string, summary: string): boolean {
  const text = (headline + " " + summary).toLowerCase();

  // Exclude obvious non-climate related keywords
  const nonClimateKeywords = [
    "trump",
    "netanyahu",
    "israel",
    "gaza",
    "hamas",
    "uk visit",
    "castle",
    "defence treaty",
    "military",
    "immigration",
    "liberal party",
    "frontbench",
    "reshuffle",
    "nampijinpa price",
    "melissa price",
    "social media ban",
    "teen ban",
    "under-16",
    "platforms",
    "guidelines",
    "esafety",
  ];

  // If contains obvious non-climate keywords, return false directly
  if (nonClimateKeywords.some((keyword) => text.includes(keyword))) {
    return false;
  }

  const climateKeywords = [
    // Climate change terms
    "climate",
    "global warming",
    "greenhouse",
    "carbon",
    "emissions",
    "co2",
    "temperature",
    "warming",
    "cooling",
    "heatwave",
    "drought",
    "flood",
    "sea level",
    "ice",
    "glacier",
    "polar",
    "arctic",
    "antarctic",

    // Environmental terms
    "environment",
    "environmental",
    "ecosystem",
    "biodiversity",
    "wildlife",
    "deforestation",
    "pollution",
    "air quality",
    "water quality",
    "soil",
    "renewable",
    "solar",
    "wind",
    "hydro",
    "geothermal",
    "clean energy",
    "fossil fuel",
    "coal",
    "oil",
    "gas",
    "petroleum",

    // Natural disasters
    "bushfire",
    "wildfire",
    "cyclone",
    "hurricane",
    "typhoon",
    "storm",
    "flooding",
    "drought",
    "extreme weather",
    "natural disaster",

    // Policy and action
    "net zero",
    "carbon neutral",
    "sustainability",
    "green",
    "eco",
    "paris agreement",
    "cop",
    "climate summit",
    "climate action",
    "environmental policy",
    "conservation",
    "protection",

    // Scientific terms
    "ipcc",
    "climate science",
    "research",
    "study",
    "assessment",
    "mitigation",
    "adaptation",
    "resilience",

    // Specific climate events and impacts
    "climate risk",
    "climate assessment",
    "climate report",
    "climate target",
    "emissions target",
    "carbon budget",
    "climate emergency",
    "climate crisis",
    "bushfire",
    "wildfire",
    "heatwave",
    "flooding",
    "drought",
    "storm",
    "extreme weather",
    "weather event",
    "climate impact",
    "environmental impact",
  ];

  return climateKeywords.some((keyword) => text.includes(keyword));
}

// Function to determine news label based on content
export function determineNewsLabel(headline: string, summary: string): NewsItem["label"] {
  const text = (headline + " " + summary).toLowerCase();

  // Critical climate events
  if (
    text.includes("record") ||
    text.includes("unprecedented") ||
    text.includes("critical") ||
    text.includes("crisis") ||
    text.includes("emergency") ||
    text.includes("catastrophic")
  ) {
    return "Critical";
  }

  // High risk environmental events
  if (
    text.includes("flood") ||
    text.includes("fire") ||
    text.includes("cyclone") ||
    text.includes("disaster") ||
    text.includes("extreme") ||
    text.includes("severe") ||
    text.includes("bushfire") ||
    text.includes("wildfire") ||
    text.includes("drought") ||
    text.includes("heatwave") ||
    text.includes("storm") ||
    text.includes("hurricane")
  ) {
    return "High Risk";
  }

  // Warnings and alerts
  if (
    text.includes("warning") ||
    text.includes("alert") ||
    text.includes("threat") ||
    text.includes("risk") ||
    text.includes("danger") ||
    text.includes("concern") ||
    text.includes("rising") ||
    text.includes("increasing") ||
    text.includes("worsening")
  ) {
    return "Warning";
  }

  // Positive environmental actions
  if (
    text.includes("renewable") ||
    text.includes("solar") ||
    text.includes("wind") ||
    text.includes("positive") ||
    text.includes("breakthrough") ||
    text.includes("success") ||
    text.includes("clean energy") ||
    text.includes("sustainable") ||
    text.includes("green") ||
    text.includes("carbon neutral") ||
    text.includes("net zero") ||
    text.includes("conservation")
  ) {
    return "Positive";
  }

  // Updates and reports
  if (
    text.includes("update") ||
    text.includes("report") ||
    text.includes("study") ||
    text.includes("research") ||
    text.includes("assessment") ||
    text.includes("analysis") ||
    text.includes("data") ||
    text.includes("findings") ||
    text.includes("results")
  ) {
    return "Update";
  }

  return "Neutral";
}

// Function to fetch all news without climate filtering
export async function fetchAllNews(): Promise<NewsItem[]> {
  // Try multiple RSS sources
  const rssSources = [
    "https://www.abc.net.au/news/feed/1534/rss.xml", // ABC News Climate
    "https://www.theguardian.com/environment/climate-change/rss.xml", // Guardian Climate
    "https://www.climatecouncil.org.au/feed", // Climate Council (fallback)
  ];

  for (const rssUrl of rssSources) {
    try {
      console.log(`Trying RSS source: ${rssUrl}`);
      const response = await axios.get(rssUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        timeout: 15000,
      });
      const xmlData = response.data;

      // Wrap parseString with Promise
      const result: any = await new Promise((resolve, reject) => {
        parseString(xmlData, (err: any, parsed: any) => {
          if (err) reject(err);
          else resolve(parsed);
        });
      });

      // Handle different RSS formats
      let items: any[] = [];
      if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
        items = result.rss.channel[0].item;
      } else if (result.feed && result.feed.entry) {
        // Atom feed format
        items = result.feed.entry;
      }

      if (items.length === 0) {
        console.log(`No items found in RSS feed: ${rssUrl}`);
        continue;
      }

      console.log(`Successfully fetched ${items.length} items from ${rssUrl}`);

      // Take first 10 news items without climate filtering
      const newsItems: NewsItem[] = await Promise.all(
        items.slice(0, 10).map(async (item: any, index: number) => {
          // Handle different RSS formats
          const headline = item.title?.[0] || item.title?.["#text"] || "No title";
          const link = item.link?.[0] || item.link?.["@"]?.href || item.link?.["#text"] || "#";
          const description =
            item.description?.[0] ||
            item.summary?.[0] ||
            item.content?.[0]?.["#text"] ||
            item.content?.[0] ||
            "";
          const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();

          // Extract image URL
          let imageUrl = "";

          // Try different image fields
          if (
            item.enclosure &&
            item.enclosure[0] &&
            item.enclosure[0].$ &&
            item.enclosure[0].$.type?.startsWith("image/")
          ) {
            imageUrl = item.enclosure[0].$.url;
          } else if (
            item["media:content"] &&
            item["media:content"][0] &&
            item["media:content"][0].$
          ) {
            imageUrl = item["media:content"][0].$.url;
          } else if (
            item["media:thumbnail"] &&
            item["media:thumbnail"][0] &&
            item["media:thumbnail"][0].$
          ) {
            imageUrl = item["media:thumbnail"][0].$.url;
          } else if (
            item["media:group"] &&
            item["media:group"][0] &&
            item["media:group"][0]["media:content"]
          ) {
            const mediaContent = item["media:group"][0]["media:content"];
            if (Array.isArray(mediaContent)) {
              const imageContent = mediaContent.find(
                (content: any) =>
                  content.$ && content.$.type && content.$.type.startsWith("image/"),
              );
              if (imageContent && imageContent.$) {
                imageUrl = imageContent.$.url;
              }
            }
          }

          // If no image found, try to extract from description
          if (!imageUrl && description) {
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }

          // Clean HTML tags
          const cleanDescription = description.replace(/<[^>]*>/g, "").substring(0, 500);
          const content = item["content:encoded"]
            ? item["content:encoded"][0].replace(/<[^>]*>/g, "")
            : cleanDescription;

          // Use Gemini for summarization
          const summary = await summarizeText(content || cleanDescription);

          // Determine label based on content
          const label = determineNewsLabel(headline, summary);

          // Determine source
          const source = rssUrl.includes("abc.net.au")
            ? "ABC News"
            : rssUrl.includes("theguardian.com")
              ? "The Guardian"
              : "Climate Council Australia";

          return {
            id: `news-${Date.now()}-${index + 1}`,
            headline,
            summary,
            label,
            image: imageUrl || undefined,
            source,
            timestamp: new Date(pubDate).toLocaleString("en-AU", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            link,
            content,
          };
        }),
      );

      return newsItems;
    } catch (error) {
      console.error(`Error fetching from ${rssUrl}:`, error);
      continue; // Try next source
    }
  }

  // If all sources fail, return mock data
  console.log("All RSS sources failed, falling back to mock news data...");
  return getMockNewsData();
}

// Function to fetch and parse RSS feed with climate filtering
export async function fetchClimateNews(): Promise<NewsItem[]> {
  // Try multiple RSS sources
  const rssSources = [
    "https://www.abc.net.au/news/feed/1534/rss.xml", // ABC News Climate
    "https://www.theguardian.com/environment/climate-change/rss.xml", // Guardian Climate
    "https://www.climatecouncil.org.au/feed", // Climate Council (fallback)
  ];

  for (const rssUrl of rssSources) {
    try {
      console.log(`Trying RSS source: ${rssUrl}`);
      const response = await axios.get(rssUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        timeout: 15000,
      });
      const xmlData = response.data;

      // Wrap parseString with Promise
      const result: any = await new Promise((resolve, reject) => {
        parseString(xmlData, (err: any, parsed: any) => {
          if (err) reject(err);
          else resolve(parsed);
        });
      });

      // Handle different RSS formats
      let items: any[] = [];
      if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
        items = result.rss.channel[0].item;
      } else if (result.feed && result.feed.entry) {
        // Atom feed format
        items = result.feed.entry;
      }

      if (items.length === 0) {
        console.log(`No items found in RSS feed: ${rssUrl}`);
        continue;
      }

      console.log(`Successfully fetched ${items.length} items from ${rssUrl}`);

      // Take first 20 news items for filtering, return max 10 climate-related items
      const allNewsItems = await Promise.all(
        items.slice(0, 20).map(async (item: any, index: number) => {
          // Handle different RSS formats
          const headline = item.title?.[0] || item.title?.["#text"] || "No title";
          const link = item.link?.[0] || item.link?.["@"]?.href || item.link?.["#text"] || "#";
          const description =
            item.description?.[0] ||
            item.summary?.[0] ||
            item.content?.[0]?.["#text"] ||
            item.content?.[0] ||
            "";
          const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();

          // Extract image URL
          let imageUrl = "";

          // Try different image fields
          if (
            item.enclosure &&
            item.enclosure[0] &&
            item.enclosure[0].$ &&
            item.enclosure[0].$.type?.startsWith("image/")
          ) {
            imageUrl = item.enclosure[0].$.url;
          } else if (
            item["media:content"] &&
            item["media:content"][0] &&
            item["media:content"][0].$
          ) {
            imageUrl = item["media:content"][0].$.url;
          } else if (
            item["media:thumbnail"] &&
            item["media:thumbnail"][0] &&
            item["media:thumbnail"][0].$
          ) {
            imageUrl = item["media:thumbnail"][0].$.url;
          } else if (
            item["media:group"] &&
            item["media:group"][0] &&
            item["media:group"][0]["media:content"]
          ) {
            const mediaContent = item["media:group"][0]["media:content"];
            if (Array.isArray(mediaContent)) {
              const imageContent = mediaContent.find(
                (content: any) =>
                  content.$ && content.$.type && content.$.type.startsWith("image/"),
              );
              if (imageContent && imageContent.$) {
                imageUrl = imageContent.$.url;
              }
            }
          }

          // If no image found, try to extract from description
          if (!imageUrl && description) {
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }

          // Clean HTML tags
          const cleanDescription = description.replace(/<[^>]*>/g, "").substring(0, 500);
          const content = item["content:encoded"]
            ? item["content:encoded"][0].replace(/<[^>]*>/g, "")
            : cleanDescription;

          // Use Gemini for summarization
          const summary = await summarizeText(content || cleanDescription);

          // Check if climate-related, skip if not
          if (!isClimateRelated(headline, summary)) {
            return null;
          }

          // Determine label based on content
          const label = determineNewsLabel(headline, summary);

          // Determine source
          const source = rssUrl.includes("abc.net.au")
            ? "ABC News"
            : rssUrl.includes("theguardian.com")
              ? "The Guardian"
              : "Climate Council Australia";

          return {
            id: `climate-${Date.now()}-${index + 1}`,
            headline,
            summary,
            label,
            image: imageUrl || undefined,
            source,
            timestamp: new Date(pubDate).toLocaleString("en-AU", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            link,
            content,
          };
        }),
      );

      // Filter out null values (non-climate news) and limit count
      const newsItems = allNewsItems.filter((item) => item !== null).slice(0, 10) as NewsItem[];

      console.log(`Filtered to ${newsItems.length} climate-related news items from ${rssUrl}`);
      return newsItems;
    } catch (error) {
      console.error(`Error fetching from ${rssUrl}:`, error);
      continue; // Try next source
    }
  }

  // If all sources fail, return mock data
  console.log("All RSS sources failed, falling back to mock news data...");
  return getMockNewsData();
}

// Mock news data as fallback
function getMockNewsData(): NewsItem[] {
  return [
    {
      id: "climate-1",
      headline: "Australia's Climate Action Progress",
      summary:
        "Australia continues to make significant progress in renewable energy adoption, with solar and wind power reaching new milestones in 2024.",
      label: "Positive",
      source: "Climate Council Australia",
      timestamp: new Date().toLocaleString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      link: "https://www.climatecouncil.org.au/",
      content:
        "Australia continues to make significant progress in renewable energy adoption, with solar and wind power reaching new milestones in 2024.",
    },
    {
      id: "climate-2",
      headline: "Climate Change Impact on Australian Communities",
      summary:
        "Recent studies show increasing climate impacts on Australian communities, highlighting the urgent need for adaptation measures.",
      label: "High Risk",
      source: "Climate Council Australia",
      timestamp: new Date(Date.now() - 86400000).toLocaleString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      link: "https://www.climatecouncil.org.au/",
      content:
        "Recent studies show increasing climate impacts on Australian communities, highlighting the urgent need for adaptation measures.",
    },
    {
      id: "climate-3",
      headline: "Renewable Energy Investment Reaches Record High",
      summary:
        "Investment in renewable energy projects across Australia has reached unprecedented levels, signaling strong market confidence in clean energy.",
      label: "Positive",
      source: "Climate Council Australia",
      timestamp: new Date(Date.now() - 172800000).toLocaleString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      link: "https://www.climatecouncil.org.au/",
      content:
        "Investment in renewable energy projects across Australia has reached unprecedented levels, signaling strong market confidence in clean energy.",
    },
  ];
}

// Weekly update function
export async function performWeeklyNewsUpdate(): Promise<void> {
  try {
    console.log("Starting weekly news update...");
    const newsItems = await fetchClimateNews();
    newsCache = newsItems;
    lastFetchTime = Date.now();
    console.log(`Weekly news update completed. Fetched ${newsItems.length} articles.`);
  } catch (error) {
    console.error("Error during weekly news update:", error);
  }
}

// Get cached news or fetch fresh
export async function getNewsData(): Promise<NewsItem[]> {
  const now = Date.now();

  // Check if cache is still valid
  if (newsCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return newsCache;
  }

  // Fetch fresh news
  const newsItems = await fetchClimateNews();
  newsCache = newsItems;
  lastFetchTime = now;
  return newsItems;
}

// Get news by category
export async function getNewsByCategory(category: string): Promise<NewsItem[]> {
  const newsItems = await getNewsData();
  return newsItems.filter((item) => item.label === category);
}

// Get individual news item
export async function getNewsById(id: string): Promise<NewsItem | null> {
  const newsItems = await getNewsData();
  return newsItems.find((item) => item.id === id) || null;
}

// Get cache info
export function getCacheInfo() {
  return {
    lastFetchTime,
    cacheDuration: CACHE_DURATION,
    articleCount: newsCache.length,
    isCacheValid: Date.now() - lastFetchTime < CACHE_DURATION,
  };
}
