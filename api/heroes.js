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
    const allCards = [];
    
    for (let page = 1; page <= 8; page++) {
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
    const filteredHeroes = {
      byScore: [],
      byStatus: [],
      byPackable: []
    };
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
      if (!heroMap.has(heroId)) {
        // Track filtered heroes with details
        if (expectedScore <= 0) {
          filteredHeroes.byScore.push({
            name: hero.name,
            handle: hero.handle,
            score: expectedScore,
            status: hero.status,
            can_be_packed: hero.can_be_packed
          });
          continue;
        }
        
        if (hero.status !== 'HERO') {
          filteredHeroes.byStatus.push({
            name: hero.name,
            handle: hero.handle,
            score: expectedScore,
            status: hero.status,
            can_be_packed: hero.can_be_packed,
            stars: hero.stars
          });
          continue;
        }
        
        if (hero.can_be_packed === false) {
          filteredHeroes.byPackable.push({
            name: hero.name,
            handle: hero.handle,
            score: expectedScore,
            status: hero.status,
            can_be_packed: hero.can_be_packed,
            stars: hero.stars
          });
          continue;
        }
        
        // Active hero
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
      filteredOut: {
        byScore: filteredHeroes.byScore.length,
        byStatus: filteredHeroes.byStatus.length,
        byPackable: filteredHeroes.byPackable.length,
        heroesFilteredByScore: filteredHeroes.byScore,
        heroesFilteredByStatus: filteredHeroes.byStatus,
        heroesFilteredByPackable: filteredHeroes.byPackable
      },
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
