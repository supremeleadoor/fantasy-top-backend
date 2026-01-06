import { Client, Configuration } from '@fantasy-top/sdk-pro';

const config = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});

const api = Client.getInstance(config);

export default async function handler(req, res) {
  // Enhanced CORS headers
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
    console.log('Fetching from Fantasy.top API using SDK...');
    
    const heroMap = new Map();
    const TARGET_HEROES = 185; // Fetch until we have at least 185 unique heroes
    const MAX_PAGES = 10; // Safety limit to prevent infinite loops
    let page = 1;
    let totalCards = 0;
    
    while (heroMap.size < TARGET_HEROES && page <= MAX_PAGES) {
      try {
        console.log(`Fetching page ${page}... (current heroes: ${heroMap.size})`);
        
        const result = await api.card.findAllCards({ page, limit: 200 });
        const cards = result.data.data || [];
        
        if (cards.length === 0) {
          console.log(`No more cards at page ${page}, stopping...`);
          break;
        }
        
        totalCards += cards.length;
        
        // Process cards immediately to update hero count
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
        
        console.log(`Page ${page} processed: ${cards.length} cards, ${heroMap.size} unique heroes so far`);
        
        // If we got less than 200 cards, we've reached the end
        if (cards.length < 200) {
          console.log('Reached end of available cards');
          break;
        }
        
        page++;
        
      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError.message);
        break;
      }
    }
    
    const heroes = Array.from(heroMap.values());
    
    console.log(`✓ Finished: ${heroes.length} unique heroes from ${totalCards} cards across ${page} pages`);
    
    return res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: totalCards,
      pagesChecked: page,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
