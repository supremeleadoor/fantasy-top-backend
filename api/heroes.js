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
    // Fetch 5 pages in parallel
    const promises = [];
    for (let page = 1; page <= 5; page++) {
      promises.push(api.card.findAllCards({ page, limit: 200 }));
    }
    
    const results = await Promise.all(promises);
    
    const allCards = [];
    results.forEach(result => {
      const cards = result.data.data || [];
      allCards.push(...cards);
    });
    
    const heroMap = new Map();
    const stats = {
      totalCards: allCards.length,
      uniqueHeroesTotal: 0,
      filteredByScore: 0,
      filteredByStatus: 0,
      filteredByPackable: 0,
      activeHeroes: 0
    };
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
      // Track unique heroes before filtering
      if (!heroMap.has(heroId) && expectedScore > 0) {
        stats.uniqueHeroesTotal++;
      }
      
      // Apply filters and track what gets filtered
      if (expectedScore === 0) {
        stats.filteredByScore++;
        continue;
      }
      
      if (hero.status !== 'HERO') {
        if (!heroMap.has(heroId)) stats.filteredByStatus++;
        continue;
      }
      
      if (hero.can_be_packed === false) {
        if (!heroMap.has(heroId)) stats.filteredByPackable++;
        continue;
      }
      
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
        stats.activeHeroes++;
      }
    }
    
    const heroes = Array.from(heroMap.values());
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      stats: stats,
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
