// api/heroes.js - Working version with correct path
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
    console.log('Fetching from Fantasy.top API using SDK...');
    
    const result = await api.card.findAllCards({ page: 1, limit: 200 });
    
    // Cards are at result.data.data
    const cards = result.data.data || [];
    
    console.log(`Found ${cards.length} cards`);
    
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'No cards found',
        heroes: []
      });
    }
    
    // Process the cards into hero data
    const heroMap = new Map();
    
    cards.forEach(card => {
      try {
        const heroId = card.playerId || card.player_id || card.id;
        const heroName = card.playerName || card.player_name || card.name;
        
        if (!heroId || !heroName) return;
        
        if (!heroMap.has(heroId)) {
          heroMap.set(heroId, {
            id: heroId,
            name: heroName,
            handle: card.playerHandle || card.twitter_handle || card.handle || null,
            stars: card.stars || card.rating || null,
            rank: card.rank || card.position || null,
            followers: card.followers || card.follower_count || null,
            score7d: card.score7d || card.weekly_score || card.score || null,
            prices: {}
          });
        }
        
        const hero = heroMap.get(heroId);
        const rarity = (card.rarity || card.tier || '').toLowerCase();
        const price = parseFloat(card.price || card.floor_price || 0);
        
        if (rarity && price > 0) {
          hero.prices[rarity] = price;
        }
      } catch (err) {
        console.error('Error processing card:', err.message);
      }
    });
    
    const heroes = Array.from(heroMap.values())
      .filter(hero => Object.keys(hero.prices).length > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common || Math.min(...Object.values(hero.prices))
      }));
    
    console.log(`Processed ${heroes.length} heroes`);
    
    res.status(200).json({
      success: true,
      count: heroes.length,
      totalCards: cards.length,
      heroes: heroes
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data from Fantasy.top API'
    });
  }
}
