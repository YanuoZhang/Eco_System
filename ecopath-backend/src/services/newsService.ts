// News service for climate news fetching and processing

import { parseString } from "xml2js";
import axios from "axios";
import { NewsItem } from "../types";
import { summarizeText } from "../gemini";

// Cache for news data
let newsCache: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Function to create intelligent fallback summary when Gemini is unavailable
function createIntelligentFallbackSummary(headline: string, description: string): string {
  // Clean the description and extract meaningful content
  const cleanDesc = description.replace(/<[^>]*>/g, "").trim();

  // If description is too short, use headline with context
  if (cleanDesc.length < 50) {
    return `Breaking news: ${headline}. This climate-related story highlights important environmental developments.`;
  }

  // Find the first complete sentence or paragraph
  const sentences = cleanDesc.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    // Ensure it ends properly
    if (!/[.!?]$/.test(firstSentence)) {
      return firstSentence + "...";
    }
    return firstSentence;
  }

  // Fallback to first 150 characters with proper ending
  const truncated = cleanDesc.substring(0, 150);
  const lastSpace = truncated.lastIndexOf(" ");
  const summary = lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated;
  return summary + (cleanDesc.length > 150 ? "..." : "");
}

// Function to check if news is climate/environment related
export function isClimateRelated(headline: string, summary: string): boolean {
  const text = (headline + " " + summary).toLowerCase();

  // Exclude obvious non-climate related keywords (expanded list)
  const nonClimateKeywords = [
    // Political/Government
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
    "election",
    "vote",
    "parliament",
    "senate",
    "congress",
    "government",
    "minister",
    "prime minister",
    "president",
    "mayor",
    "council",
    "budget",
    "economy",
    "tax",
    "policy",
    "independence",
    "colony",
    "colonial",
    "papua new guinea",
    "png",
    "chiefs of staff",
    "mp",
    "laura gerber",
    "lnp",
    "labor",
    "mudslinging",
    "gold coast",

    // Technology/Social Media
    "social media ban",
    "teen ban",
    "under-16",
    "platforms",
    "guidelines",
    "esafety",
    "facebook",
    "instagram",
    "tiktok",
    "twitter",
    "x.com",
    "meta",
    "apple",
    "google",
    "microsoft",
    "tech",
    "software",
    "app",
    "digital",

    // Sports/Entertainment
    "football",
    "soccer",
    "cricket",
    "tennis",
    "olympics",
    "world cup",
    "movie",
    "film",
    "music",
    "concert",
    "festival",
    "celebrity",
    "actor",
    "singer",
    "band",
    "tv show",
    "series",
    "netflix",
    "streaming",

    // Crime/Legal
    "murder",
    "theft",
    "robbery",
    "fraud",
    "court",
    "trial",
    "jail",
    "prison",
    "police",
    "arrest",
    "investigation",
    "lawsuit",
    "legal",
    "lawyer",

    // Health (non-environmental)
    "covid",
    "pandemic",
    "vaccine",
    "hospital",
    "medical",
    "doctor",
    "nurse",
    "surgery",
    "treatment",
    "medicine",
    "drug",
    "pharmaceutical",

    // Business/Finance (non-environmental)
    "stock market",
    "shares",
    "investment",
    "bank",
    "finance",
    "money",
    "profit",
    "loss",
    "revenue",
    "company",
    "business",
    "corporate",

    // Education
    "school",
    "university",
    "student",
    "teacher",
    "education",
    "exam",
    "grade",

    // Transportation (non-environmental)
    "traffic",
    "road",
    "highway",
    "airport",
    "flight",
    "train station",

    // Miscellaneous
    "wedding",
    "marriage",
    "divorce",
    "birth",
    "death",
    "funeral",
    "restaurant",
    "food",
    "recipe",
    "cooking",
    "fashion",
    "clothes",
    "shopping",
    "store",
    "market",
    "price",
    "sale",
    "discount",
  ];

  // If contains obvious non-climate keywords, return false directly
  if (nonClimateKeywords.some((keyword) => text.includes(keyword))) {
    return false;
  }

  // Enhanced climate keywords with better coverage
  const climateKeywords = [
    // Core climate terms
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
    "methane",

    // Natural disasters and weather
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
    "heatwave",
    "cold snap",
    "blizzard",
    "tornado",
    "earthquake",
    "tsunami",

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
    "carbon tax",
    "carbon credit",
    "emissions trading",
    "carbon footprint",

    // Scientific terms
    "ipcc",
    "climate science",
    "research",
    "study",
    "assessment",
    "mitigation",
    "adaptation",
    "resilience",
    "climate model",
    "atmospheric",
    "meteorological",
    "climatologist",
    "scientist",

    // Specific impacts and risks
    "climate risk",
    "climate assessment",
    "climate report",
    "climate target",
    "emissions target",
    "carbon budget",
    "climate emergency",
    "climate crisis",
    "climate impact",
    "environmental impact",
    "ecological",
    "habitat",

    // Energy and technology
    "electric vehicle",
    "ev",
    "battery",
    "storage",
    "grid",
    "power",
    "energy transition",
    "decarbonization",
    "electrification",

    // Water and agriculture
    "water scarcity",
    "irrigation",
    "agriculture",
    "farming",
    "crop",
    "food security",
    "drought resistant",
    "water conservation",

    // Ocean and marine
    "ocean",
    "marine",
    "coral",
    "bleaching",
    "acidification",
    "sea ice",
    "permafrost",
    "melting",
    "thawing",
  ];

  // Check for climate keywords with word boundary matching for better accuracy
  const hasClimateKeyword = climateKeywords.some((keyword) => {
    // Use word boundary regex for more precise matching
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(text);
  });

  // Additional check: if headline contains non-climate terms but no clear climate terms, exclude
  const headlineText = headline.toLowerCase();
  const hasNonClimateInHeadline = nonClimateKeywords.some((keyword) =>
    headlineText.includes(keyword),
  );
  const hasClimateInHeadline = climateKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(headlineText);
  });

  // If headline has non-climate terms but no climate terms, exclude even if summary has climate terms
  if (hasNonClimateInHeadline && !hasClimateInHeadline) {
    return false;
  }

  // More specific political check - only exclude if clearly non-climate political content
  const specificPoliticalTerms = [
    "independence",
    "colony",
    "colonial",
    "staff",
    "chiefs of staff",
    "minister.*staff",
  ];
  const hasSpecificPoliticalTerms = specificPoliticalTerms.some((term) => {
    if (term.includes(".*")) {
      const regex = new RegExp(term, "i");
      return regex.test(headlineText);
    }
    return headlineText.includes(term);
  });
  if (hasSpecificPoliticalTerms && !hasClimateInHeadline) {
    return false;
  }

  // Final strict check: specific patterns that should always be excluded
  const strictExcludePatterns = [
    /questions raised after.*minister/i,
    /goes through.*chiefs of staff/i,
    /before.*gained independence/i,
    /was a colony of/i,
    /papua new guinea.*independence/i,
    /qld minister.*staff/i,
    /gold coast.*mp/i,
    /labor.*mudslinging/i,
    /lnp.*elected/i,
  ];

  const matchesStrictExclude = strictExcludePatterns.some((pattern) => {
    const matches = pattern.test(headlineText);
    if (matches) {
      console.log(`🚫 Excluding news due to strict pattern match: "${headline}"`);
    }
    return matches;
  });

  if (matchesStrictExclude && !hasClimateInHeadline) {
    return false;
  }

  // Additional debugging and manual exclusion for specific problematic headlines
  const problematicHeadlines = [
    "before png gained independence, it was a colony of australia",
    "questions raised after qld minister goes through three chiefs of staff in a year",
  ];

  const isProblematic = problematicHeadlines.some((problematic) =>
    headlineText.includes(problematic.replace(/[^a-z\s]/g, "")),
  );

  if (isProblematic && !hasClimateInHeadline) {
    console.log(`🚫 Excluding problematic headline: "${headline}"`);
    return false;
  }

  return hasClimateKeyword;
}

// Function to check if news is Australia-related
export function isAustraliaRelated(headline: string, summary: string): boolean {
  const text = (headline + " " + summary).toLowerCase();

  // Australian keywords
  const australiaKeywords = [
    // Country names
    "australia",
    "australian",
    "australians",
    // States and territories
    "new south wales",
    "nsw",
    "victoria",
    "vic",
    "queensland",
    "qld",
    "qld",
    "western australia",
    "wa",
    "south australia",
    "sa",
    "tasmania",
    "tas",
    "northern territory",
    "nt",
    "australian capital territory",
    "act",
    // Major cities
    "sydney",
    "melbourne",
    "brisbane",
    "perth",
    "adelaide",
    "hobart",
    "darwin",
    "canberra",
    "gold coast",
    "newcastle",
    "wollongong",
    "geelong",
    "townsville",
    "cairns",
    "toowoomba",
    "ballarat",
    "bendigo",
    "albury",
    "launceston",
    "mackay",
    // Australian institutions and organizations
    "csiro",
    "bureau of meteorology",
    "bom",
    "australian bureau of statistics",
    "abs",
    "australian government",
    "federal government",
    "state government",
    "local council",
    "australian defence force",
    "adf",
    "australian federal police",
    "afp",
    "australian broadcasting corporation",
    "abc",
    "sbs",
    "special broadcasting service",
    "reserve bank of australia",
    "rba",
    "australian securities exchange",
    "asx",
    // Climate and environment specific
    "great barrier reef",
    "murray darling",
    "kakadu",
    "uluru",
    "kata tjuta",
    "australian alps",
    "blue mountains",
    "daintree",
    "fraser island",
    "kangaroo island",
    "tasmanian wilderness",
    "simpson desert",
    "nullarbor",
    "kimberley",
    "australian outback",
    "red centre",
    "top end",
    "tropical north queensland",
    // Australian climate events and phenomena
    "el niño",
    "la niña",
    "indian ocean dipole",
    "southern annular mode",
    "sam",
    "east coast low",
    "black summer",
    "bushfire",
    "cyclone",
    "tropical cyclone",
    "flood",
    "drought",
    "heatwave",
    "frost",
    "hail",
    "thunderstorm",
    // Australian flora and fauna
    "eucalyptus",
    "gum tree",
    "wattle",
    "banksia",
    "waratah",
    "kangaroo",
    "koala",
    "wombat",
    "echidna",
    "platypus",
    "kookaburra",
    "cockatoo",
    "emu",
    "dingo",
    // Australian energy and resources
    "coal",
    "iron ore",
    "natural gas",
    "lng",
    "renewable energy",
    "solar farm",
    "wind farm",
    "hydroelectric",
    "battery storage",
    "grid",
    "aemo",
    // Australian politics and policy
    "prime minister",
    "premier",
    "minister",
    "parliament",
    "senate",
    "house of representatives",
    "liberal party",
    "labor party",
    "greens",
    "national party",
    "independent",
    "coalition",
    "opposition",
    "budget",
    "policy",
    "legislation",
    "bill",
    // Australian economy and business
    "australian dollar",
    "aud",
    "gdp",
    "inflation",
    "interest rate",
    "unemployment",
    "retail",
    "manufacturing",
    "mining",
    "agriculture",
    "tourism",
    "education",
    "healthcare",
    "infrastructure",
    "transport",
    "rail",
    "road",
    "airport",
    // Time references
    "today",
    "yesterday",
    "this week",
    "this month",
    "this year",
    "recently",
    "australian time",
    "aest",
    "aedt",
    "acst",
    "awst",
  ];

  // Check for Australian keywords with word boundary matching
  const hasAustraliaKeyword = australiaKeywords.some((keyword) => {
    // Use word boundary regex for more precise matching
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(text);
  });

  return hasAustraliaKeyword;
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

// Function to fetch and parse RSS feed with climate filtering
export async function fetchClimateNews(): Promise<NewsItem[]> {
  // Try multiple RSS sources - only Australian sources
  const rssSources = [
    "https://www.abc.net.au/news/feed/1534/rss.xml", // ABC News Climate (Australian climate news)
    "https://www.abc.net.au/news/feed/1535/rss.xml", // ABC News Environment (additional environment feed)
    "https://www.abc.net.au/news/feed/1536/rss.xml", // ABC News Science (science and climate)
    "https://feeds.abc.net.au/news/science", // ABC News Science RSS
    "https://www.theguardian.com/au/environment/rss", // Guardian Australia Environment
    "https://www.theguardian.com/au/environment/climate-change/rss", // Guardian Australia Climate Change
    // "https://www.climatecouncil.org.au/feed", // Climate Council (blocked by Cloudflare)
  ];

  let allCollectedNews: NewsItem[] = [];

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

          // Provide default image for news without images
          if (!imageUrl) {
            imageUrl =
              "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop&crop=center"; // Default climate image
          }

          // Immediate strict exclusion check before any other processing - only for clearly non-climate content
          const headlineLower = headline.toLowerCase();
          const immediateExcludePatterns = [
            "before png gained independence",
            "was a colony of australia",
            "questions raised after qld minister",
            "goes through three chiefs of staff",
            "laura gerber",
            "gold coast mp",
            "lnp elected",
          ];

          const shouldImmediatelyExclude = immediateExcludePatterns.some((pattern) =>
            headlineLower.includes(pattern),
          );

          if (shouldImmediatelyExclude) {
            console.log(`🚫 Immediately excluding non-climate news: "${headline}"`);
            return null;
          }

          // Check if climate-related first, before calling Gemini
          const textToCheck = content || cleanDescription || headline;
          if (!isClimateRelated(headline, textToCheck)) {
            return null;
          }

          // Additional check: ensure it's Australia-related
          if (!isAustraliaRelated(headline, textToCheck)) {
            return null;
          }

          // Use Gemini for summarization (with improved fallback)
          let summary: string;
          try {
            summary = await summarizeText(content || cleanDescription);
          } catch (error) {
            // Check if it's a quota exceeded error
            const isQuotaError =
              error instanceof Error &&
              (error.message.includes("429") ||
                error.message.includes("quota") ||
                error.message.includes("Too Many Requests"));

            if (isQuotaError) {
              console.log(
                `⚠️ Gemini API quota exceeded, using intelligent fallback for: ${headline}`,
              );
            } else {
              console.log(`⚠️ Gemini API error, using fallback for: ${headline}`);
            }

            // Create a more intelligent fallback summary
            summary = createIntelligentFallbackSummary(headline, cleanDescription);
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
      allCollectedNews.push(...newsItems);

      // If we have enough news, return early
      if (allCollectedNews.length >= 5) {
        return allCollectedNews.slice(0, 10);
      }
    } catch (error) {
      console.error(`Error fetching from ${rssUrl}:`, error);
      continue; // Try next source
    }
  }

  // Return whatever real news we collected, no mock data
  if (allCollectedNews.length > 0) {
    console.log(`Collected ${allCollectedNews.length} real news articles from RSS sources`);
    return allCollectedNews.slice(0, 10);
  }

  // If all sources fail, return empty array instead of mock data
  console.log("All RSS sources failed, returning empty news array");
  return [];
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
