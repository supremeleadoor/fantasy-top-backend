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
    // Fetch 3 pages to get more heroes
    const page1 = await api.card.findAllCards({ page: 1, limit: 200 });
    const page2 = await api.card.findAllCards({ page: 2, limit: 200 });
    const page3 = await api.card.findAllCards({ page: 3, limit: 200 });
    
    const allCards = [
      ...(page1.data.data || []),
      ...(page2.data.data || []),
      ...(page3.data.data || [])
    ];
    
    const heroMap = new Map();
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: hero.name || 'Unknown',
          handle: hero.handle || null,
          stars: hero.stars || 0,
          followers: hero.followers_count || 0,
          expectedScore: parseFloat(hero.expected_score) || 0,
          profileImage: hero.profile_image_url_https || null
        });
      }
    }
    
    const heroes = Array.from(heroMap.values());
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: allCards.length,
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
