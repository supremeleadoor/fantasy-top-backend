import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});
const api = Client.getInstance(config);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
    let page = 1;
    const maxPages = 200; // Safety limit to prevent infinite loop

    while (page <= maxPages) {
      try {
        const result = await api.card.findAllCards({ page, limit: 200 });
        const cards = result.data.data || [];
        
        console.log(`Page ${page}: ${cards.length} cards`);
        
        if (cards.length === 0) {
          console.log(`Stopped at page ${page} - no more data`);
          break;
        }
        
        allCards.push(...cards);
        page++;
        
        if (cards.length < 200) {
          console.log(`Stopped at page ${page} - partial page`);
          break;
        }
      } catch (pageError) {
        console.error(`Page ${page} error:`, pageError.message);
        break;
      }
    }

    console.log(`Total pages fetched: ${page - 1}`);
    console.log(`Total cards: ${allCards.length}`);
    
    const heroMap = new Map();
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
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
    
    console.log(`Unique heroes with HERO status: ${heroes.length}`);
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: allCards.length,
      pagesFetched: page - 1,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Top level error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}import { Client, Configuration } from '@fantasy-top/sdk-pro';
const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});
const api = Client.getInstance(config);

export default async function handler(req, res) {
  // Disable caching completely
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
    
    // Fetch MORE pages to get newer heroes
    for (let page = 1; page <= 50; page++) {
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
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
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
      heroes: heroes
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


