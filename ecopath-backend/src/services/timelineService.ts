// Timeline service for climate timeline data

import { TimelinePeriod } from "../types";

// Static climate timeline data
const climateTimelineData: TimelinePeriod[] = [
  {
    period: "Early Industrial Era",
    years: "1880–1950",
    events: [
      {
        year: 1896,
        title: "Arrhenius Discovers Greenhouse Effect",
        description:
          "Swedish scientist Svante Arrhenius first calculates how changes in atmospheric CO2 could affect Earth's temperature, laying the foundation for modern climate science.",
        icon: "🔬",
        category: "scientific",
      },
      {
        year: 1938,
        title: "Callendar Links CO2 to Warming",
        description:
          "British engineer Guy Callendar publishes evidence showing that CO2 levels had increased and global temperatures were rising, connecting human activities to climate change.",
        icon: "📊",
        category: "scientific",
      },
      {
        year: 1950,
        title: "Keeling Curve Begins",
        description:
          "Charles David Keeling starts measuring atmospheric CO2 at Mauna Loa Observatory, establishing the longest continuous record of atmospheric CO2 concentrations.",
        icon: "📈",
        category: "scientific",
      },
    ],
  },
  {
    period: "Environmental Awakening",
    years: "1951–1980",
    events: [
      {
        year: 1962,
        title: "Silent Spring Published",
        description:
          "Rachel Carson's groundbreaking book exposes the environmental damage caused by pesticides, sparking the modern environmental movement.",
        icon: "📚",
        category: "environmental",
      },
      {
        year: 1970,
        title: "First Earth Day",
        description:
          "20 million Americans participate in the first Earth Day, marking the birth of the modern environmental movement and raising awareness about environmental issues.",
        icon: "🌍",
        category: "social",
      },
      {
        year: 1972,
        title: "UN Stockholm Conference",
        description:
          "The first major international environmental conference establishes the United Nations Environment Programme (UNEP) and marks the beginning of global environmental governance.",
        icon: "🏛️",
        category: "political",
      },
      {
        year: 1979,
        title: "First World Climate Conference",
        description:
          "Scientists and policymakers meet in Geneva to discuss climate change, leading to the establishment of the World Climate Programme and increased international cooperation.",
        icon: "🌐",
        category: "political",
      },
    ],
  },
  {
    period: "Climate Science Maturation",
    years: "1981–2000",
    events: [
      {
        year: 1985,
        title: "Antarctic Ozone Hole Discovered",
        description:
          "British scientists discover a massive hole in the ozone layer over Antarctica, leading to the Montreal Protocol and demonstrating the power of international environmental cooperation.",
        icon: "🕳️",
        category: "environmental",
      },
      {
        year: 1988,
        title: "IPCC Established",
        description:
          "The Intergovernmental Panel on Climate Change is founded by the UN to provide scientific assessments of climate change, becoming the world's leading authority on climate science.",
        icon: "🏛️",
        category: "political",
      },
      {
        year: 1992,
        title: "Rio Earth Summit",
        description:
          "The United Nations Framework Convention on Climate Change (UNFCCC) is adopted at the Rio Earth Summit, establishing the foundation for international climate negotiations.",
        icon: "🤝",
        category: "political",
      },
      {
        year: 1997,
        title: "Kyoto Protocol Signed",
        description:
          "The first international treaty to set binding targets for reducing greenhouse gas emissions is adopted, marking a major step in global climate action.",
        icon: "📜",
        category: "political",
      },
      {
        year: 1998,
        title: "Hottest Year on Record",
        description:
          "1998 becomes the hottest year globally since records began, highlighting the accelerating pace of global warming and climate change impacts.",
        icon: "🌡️",
        category: "environmental",
      },
    ],
  },
  {
    period: "Climate Crisis Recognition",
    years: "2001–2020",
    events: [
      {
        year: 2006,
        title: "An Inconvenient Truth Released",
        description:
          "Al Gore's documentary brings climate change to mainstream audiences, winning an Academy Award and significantly raising public awareness about global warming.",
        icon: "🎬",
        category: "social",
      },
      {
        year: 2007,
        title: "IPCC Nobel Peace Prize",
        description:
          "The IPCC shares the Nobel Peace Prize with Al Gore for their efforts to build up and disseminate greater knowledge about climate change.",
        icon: "🏆",
        category: "scientific",
      },
      {
        year: 2015,
        title: "Paris Agreement Signed",
        description:
          "195 countries adopt the Paris Agreement, committing to limit global temperature rise to well below 2°C and pursue efforts to limit it to 1.5°C above pre-industrial levels.",
        icon: "🌍",
        category: "political",
      },
      {
        year: 2018,
        title: "IPCC 1.5°C Report",
        description:
          "The IPCC releases a special report warning that limiting global warming to 1.5°C requires rapid, far-reaching changes in all aspects of society.",
        icon: "⚠️",
        category: "scientific",
      },
      {
        year: 2019,
        title: "Global Climate Strikes",
        description:
          "Millions of people worldwide, led by youth activists like Greta Thunberg, participate in climate strikes demanding urgent action on climate change.",
        icon: "✊",
        category: "social",
      },
    ],
  },
  {
    period: "Climate Emergency Era",
    years: "2021–Present",
    events: [
      {
        year: 2021,
        title: "COP26 Glasgow Summit",
        description:
          "World leaders meet in Glasgow to accelerate action on climate change, with commitments to phase out coal and achieve net-zero emissions.",
        icon: "🏴",
        category: "political",
      },
      {
        year: 2022,
        title: "Inflation Reduction Act",
        description:
          "The US passes its largest climate investment in history, providing $370 billion for clean energy and climate action, accelerating the transition to renewable energy.",
        icon: "💰",
        category: "political",
      },
      {
        year: 2023,
        title: "Hottest Year on Record",
        description:
          "2023 becomes the hottest year globally since records began, with extreme weather events worldwide highlighting the urgent need for climate action.",
        icon: "🔥",
        category: "environmental",
      },
      {
        year: 2024,
        title: "Renewable Energy Milestone",
        description:
          "Global renewable energy capacity reaches record levels, with solar and wind power becoming the cheapest sources of electricity in many regions.",
        icon: "⚡",
        category: "technological",
      },
      {
        year: 2024,
        title: "Climate Finance Breakthrough",
        description:
          "International climate finance reaches new heights, with developed countries providing over $100 billion annually to help developing nations address climate change.",
        icon: "💚",
        category: "political",
      },
    ],
  },
];

export function getAllTimelineData(): TimelinePeriod[] {
  return climateTimelineData;
}

export function getTimelineByPeriod(periodIndex: number): TimelinePeriod | null {
  if (periodIndex < 0 || periodIndex >= climateTimelineData.length) {
    return null;
  }
  return climateTimelineData[periodIndex];
}

export function getTimelineStats() {
  return {
    totalPeriods: climateTimelineData.length,
    totalEvents: climateTimelineData.reduce((sum, period) => sum + period.events.length, 0),
    lastUpdated: new Date().toISOString(),
    source: "api",
  };
}

export function getAvailablePeriods() {
  return climateTimelineData.map((p, index) => ({
    index,
    period: p.period,
    years: p.years,
  }));
}
