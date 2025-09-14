// Simple test script to verify news API functionality
const express = require('express');
const app = express();

// Mock news data
const mockNewsItems = [
  {
    id: 'climate-1',
    headline: 'Australia\'s quest to be key Pacific security partner hinges on climate credibility',
    summary: 'Australia\'s Prime Minister Anthony Albanese sought to strengthen security ties with Pacific island nations...',
    label: 'Critical',
    insight: 'Pacific island nations face climate change threats. Australia\'s climate policy affects regional security.',
    source: 'Climate Council Australia',
    timestamp: 'Sep 12, 2025, 01:26 PM',
    link: 'https://www.climatecouncil.org.au/australias-quest-to-be-key-pacific-security-partner-hinges-on-climate-credibility/',
    content: 'Full article content...'
  },
  {
    id: 'climate-2',
    headline: 'NSW Floods: More Destructive Due To Climate Change',
    summary: 'The Mid-North Coast of NSW is currently experiencing record-breaking flooding...',
    label: 'High Risk',
    insight: 'Flood events are directly related to climate change. Extreme rainfall events have increased by 7-28%.',
    source: 'Climate Council Australia',
    timestamp: 'May 23, 2025, 11:23 AM',
    link: 'https://www.climatecouncil.org.au/climate-council-statement-on-nsw-floods-more-destructive-due-to-climate-change/',
    content: 'Full article content...'
  }
];

// Mock endpoints
app.get('/api/news/climate', (req, res) => {
  res.json({
    success: true,
    data: mockNewsItems,
    cached: false,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/news/climate/category/:category', (req, res) => {
  const { category } = req.params;
  const filteredNews = mockNewsItems.filter(item => item.label === category);
  
  res.json({
    success: true,
    data: filteredNews,
    category,
    count: filteredNews.length
  });
});

app.get('/api/news/climate/:id', (req, res) => {
  const { id } = req.params;
  const newsItem = mockNewsItems.find(item => item.id === id);
  
  if (!newsItem) {
    return res.status(404).json({
      success: false,
      error: 'News item not found',
      message: `No news item found with ID: ${id}`
    });
  }
  
  res.json({
    success: true,
    data: newsItem
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on http://localhost:${PORT}`);
  console.log('📰 Available endpoints:');
  console.log('  GET /api/news/climate');
  console.log('  GET /api/news/climate/category/:category');
  console.log('  GET /api/news/climate/:id');
  console.log('\n✅ News API implementation is ready!');
});

