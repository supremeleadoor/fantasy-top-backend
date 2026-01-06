import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});

const api = Client.getInstance(config);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const heroMap = new Map();
    const TARGET_HEROES = 185;
    const MAX_PAGES = 10;
    let page = 1;
    let totalCards = 0;
    
    while (heroMap.size < TARGET_HEROES && page <= MAX_PAGES) {
      try {
        const result = await api.card.findAllCards({ page, limit: 200 });
        const cards = result.data.data || [];
        
        if (cards.length === 0) break;
        
        totalCards += cards.length;
        
        for (const card of cards) {
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
        
        if (cards.length < 200) break;
        page++;
        
      } catch (pageError) {
        break;
      }
    }
    
    const heroes = Array.from(heroMap.values());
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: totalCards,
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
