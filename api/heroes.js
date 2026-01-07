import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});
const api = Client.getInstance(config);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const allCards = [];
    const fetchTimestamp = new Date().toISOString();
    
    // Fetch 20 pages to avoid timeout
    for (let page = 1; page <= 20; page++) {
      try {
        const result = await api.card.findAllCards({ page, limit: 200 });
        const cards = result.data.data || [];
        
        if (cards.length === 0) break;
        allCards.push(...cards);
        
        if (cards.length < 200) break;
      } catch (pageError) {
        console.error(`Page ${page} error:`, pageError.message);
        break;
      }
    }
    
    const heroMap = new Map();
    const statusCounts = {};
    const allStatuses = new Set();
    const sampleCloutCards = []; // Track CLOUT status heroes
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
      // Track all statuses
      allStatuses.add(hero.status);
      statusCounts[hero.status] = (statusCounts[hero.status] || 0) + 1;
      
      // Save sample CLOUT heroes for debugging
      if (hero.status === 'CLOUT' && sampleCloutCards.length < 20) {
        sampleCloutCards.push({
          name: hero.name,
          handle: hero.handle,
          status: hero.status,
          stars: hero.stars,
          followers: hero.followers_count
        });
      }
      
      // Only include heroes with status "HERO"
      if (hero.status !== 'HERO') continue;
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: hero.name || 'Unknown',
          handle: hero.handle || null,
          stars: hero.stars || 0,
          followers: hero.followers_count || 0,
          expectedScore: expectedScore,
          profileImage: hero.profile_image_url_https || null
        });
      }
    }
    
    const heroes = Array.from(heroMap.values());
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: allCards.length,
      allStatusesFound: Array.from(allStatuses),
      statusCounts: statusCounts,
      sampleCloutCards: sampleCloutCards,
      fetchedAt: fetchTimestamp,
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
