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
    const statusCounts = {};
    const heroStatuses = [];
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      const status = hero.status || 'UNKNOWN';
      
      // Count status types
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Track unique heroes by status
      if (!heroMap.has(heroId)) {
        heroStatuses.push({
          name: hero.name,
          handle: hero.handle,
          status: status,
          score: expectedScore,
          can_be_packed: hero.can_be_packed
        });
      }
      
      // Include only HERO status for now
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
    
    // Group heroes by status for debugging
    const byStatus = {
      HERO: [],
      DELETED: [],
      CLOUT: [],
      OTHER: []
    };
    
    heroStatuses.forEach(h => {
      if (h.status === 'HERO') byStatus.HERO.push(h);
      else if (h.status === 'DELETED') byStatus.DELETED.push(h);
      else if (h.status === 'CLOUT') byStatus.CLOUT.push(h);
      else byStatus.OTHER.push(h);
    });
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: allCards.length,
      debug: {
        statusCounts: statusCounts,
        uniqueHeroesByStatus: {
          HERO: byStatus.HERO.length,
          DELETED: byStatus.DELETED.length,
          CLOUT: byStatus.CLOUT.length,
          OTHER: byStatus.OTHER.length
        },
        sampleCLOUT: byStatus.CLOUT.slice(0, 20),
        sampleOTHER: byStatus.OTHER
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
