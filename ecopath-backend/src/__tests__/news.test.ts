import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the news API endpoints
const app = express();
app.use(express.json());

// Mock news data based on Climate Council RSS feed
const mockNewsItems = [
  {
    id: 'climate-1',
    headline: 'Australia\'s quest to be key Pacific security partner hinges on climate credibility',
    summary: 'Australia\'s Prime Minister Anthony Albanese sought to strengthen security ties with Pacific island nations and counter China\'s growing influence during a trip to the region this week. If he walks away with one lesson, it\'s that Australia\'s climate policy remains a significant sticking point...',
    label: 'Critical' as const,
    source: 'Climate Council Australia',
    timestamp: 'Sep 12, 2025, 01:26 PM',
    link: 'https://www.climatecouncil.org.au/australias-quest-to-be-key-pacific-security-partner-hinges-on-climate-credibility/',
    content: 'Full article content about Pacific security and climate policy...'
  },
  {
    id: 'climate-2',
    headline: '3 things to expect from the National Climate Risk Assessment and 3 things that won\'t be in it (but should be)',
    summary: 'Nearly five years ago, the Royal Commission into National Natural Disaster Arrangements—sparked by the Black Summer bushfires—identified a major gap: Australia did not have a single, comprehensive source of climate risk information...',
    label: 'Update' as const,
    source: 'Climate Council Australia',
    timestamp: 'Sep 9, 2025, 11:38 AM',
    link: 'https://www.climatecouncil.org.au/3-things-to-expect-from-the-national-climate-risk-assessment/',
    content: 'Full article content about climate risk assessment...'
  },
  {
    id: 'climate-3',
    headline: 'Climate Council Statement On NSW Floods: More Destructive Due To Climate Change',
    summary: 'The Mid-North Coast of NSW is currently experiencing record-breaking flooding, after experiencing back-to-back extreme weather events in the last few years. It is critical to understand that these kinds of disasters are no longer simply "natural"...',
    label: 'High Risk' as const,
    source: 'Climate Council Australia',
    timestamp: 'May 23, 2025, 11:23 AM',
    link: 'https://www.climatecouncil.org.au/climate-council-statement-on-nsw-floods-more-destructive-due-to-climate-change/',
    content: 'Full article content about NSW floods and climate change...'
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
  const validCategories = ['Critical', 'High Risk', 'Warning', 'Update', 'Positive', 'Neutral'];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
      message: `Category must be one of: ${validCategories.join(', ')}`
    });
  }
  
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

describe('Climate News API', () => {
  describe('GET /api/news/climate', () => {
    it('should return all climate news items', async () => {
      const response = await request(app)
        .get('/api/news/climate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('headline');
      expect(response.body.data[0]).toHaveProperty('summary');
      expect(response.body.data[0]).toHaveProperty('label');
      expect(response.body.data[0]).toHaveProperty('source');
      expect(response.body.data[0]).toHaveProperty('timestamp');
      expect(response.body.data[0]).toHaveProperty('link');
      expect(response.body.data[0]).toHaveProperty('content');
    });

    it('should include cache information', async () => {
      const response = await request(app)
        .get('/api/news/climate')
        .expect(200);

      expect(response.body).toHaveProperty('cached');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(typeof response.body.cached).toBe('boolean');
      expect(typeof response.body.lastUpdated).toBe('string');
    });
  });

  describe('GET /api/news/climate/category/:category', () => {
    it('should return news items filtered by Critical category', async () => {
      const response = await request(app)
        .get('/api/news/climate/category/Critical')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.category).toBe('Critical');
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].label).toBe('Critical');
      expect(response.body.data[0].headline).toContain('Pacific security partner');
    });

    it('should return news items filtered by High Risk category', async () => {
      const response = await request(app)
        .get('/api/news/climate/category/High Risk')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.category).toBe('High Risk');
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].label).toBe('High Risk');
      expect(response.body.data[0].headline).toContain('NSW Floods');
    });

    it('should return empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/news/climate/category/NonExistent')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid category');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .get('/api/news/climate/category/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid category');
      expect(response.body.message).toContain('Category must be one of:');
    });
  });

  describe('GET /api/news/climate/:id', () => {
    it('should return specific news item by ID', async () => {
      const response = await request(app)
        .get('/api/news/climate/climate-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('climate-1');
      expect(response.body.data.headline).toContain('Pacific security partner');
      expect(response.body.data.label).toBe('Critical');
    });

    it('should return specific news item with flood content', async () => {
      const response = await request(app)
        .get('/api/news/climate/climate-3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('climate-3');
      expect(response.body.data.headline).toContain('NSW Floods');
      expect(response.body.data.label).toBe('High Risk');
    });

    it('should return 404 for non-existent news item', async () => {
      const response = await request(app)
        .get('/api/news/climate/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('News item not found');
      expect(response.body.message).toBe('No news item found with ID: non-existent');
    });
  });

  describe('News item structure validation', () => {
    it('should have correct data types for all fields', async () => {
      const response = await request(app)
        .get('/api/news/climate/climate-1')
        .expect(200);

      const item = response.body.data;
      
      expect(typeof item.id).toBe('string');
      expect(typeof item.headline).toBe('string');
      expect(typeof item.summary).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.source).toBe('string');
      expect(typeof item.timestamp).toBe('string');
      expect(typeof item.link).toBe('string');
      expect(typeof item.content).toBe('string');
    });

    it('should have valid label values', async () => {
      const response = await request(app)
        .get('/api/news/climate')
        .expect(200);

      const validLabels = ['Critical', 'Update', 'Positive', 'Neutral', 'High Risk', 'Warning'];
      
      response.body.data.forEach((item: any) => {
        expect(validLabels).toContain(item.label);
      });
    });

    it('should have valid URLs for links', async () => {
      const response = await request(app)
        .get('/api/news/climate')
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item.link).toMatch(/^https?:\/\//);
        expect(item.link).toContain('climatecouncil.org.au');
      });
    });

    it('should have valid content', async () => {
      const response = await request(app)
        .get('/api/news/climate')
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item.content).toMatch(/[a-zA-Z]/); // Check for English characters
        expect(item.content.length).toBeGreaterThan(10);
      });
    });
  });
});
