import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});
const api = Client.getInstance(config);

export default async function handler(req, res) {
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
    console.log('Starting API call...');
    const allCards = [];
    
    // Try just the first page to test
    for (let page = 1; page <= 15; page++) {
      try {
        console.log(`Fetching page ${page}...`);
        const result = await api.card.findAllCards({ page, limit: 200 });
        
        console.log(`Result structure:`, JSON.stringify(result, null, 2).substring(0, 500));
        
        const cards = result.data.data || [];
        console.log(`Page ${page}: ${cards.length} cards`);
        
        if (cards.length === 0) break;
        allCards.push(...cards);
        
        if (cards.length < 200) break;
      } catch (pageError) {
        console.error(`Page ${page} error:`, pageError);
        console.error(`Error details:`, JSON.stringify(pageError, null, 2));
        break;
      }
    }
    
    console.log(`Total cards fetched: ${allCards.length}`);
    
    const heroMap = new Map();
    const statusCounts = {};
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) {
        console.log('Skipping card - missing hero data');
        continue;
      }
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
      statusCounts[hero.status] = (statusCounts[hero.status] || 0) + 1;
      
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
      statusCounts: statusCounts,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Top level error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
