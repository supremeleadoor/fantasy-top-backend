// api/heroes.js - Vercel Serverless Function using Fantasy.top SDK
// Save this file as: api/heroes.js

// Import the Fantasy.top SDK
import { Client, Configuration } from '@fantasy-top/sdk-pro';

const FANTASY_API_KEY = 'f341037c-8d9a-476a-9a10-9c484e4cb01f';
const FANTASY_API_BASE = 'https://api-v2.fantasy.top';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Initializing Fantasy.top SDK...');
    
    // Initialize the SDK
    const config = new Configuration({
      basePath: FANTASY_API_BASE,
      apiKey: FANTASY_API_KEY
    });
    
    const api = Client.getInstance(config);
    
    console.log('Fetching cards from Fantasy.top...');
    
    // Use the SDK method to get all cards
    const cardsData = await api.card.findAllCards(1, 200); // page 1, limit 200
    
    console.log('Successfully fetched data');

    // Process the data
    const heroMap = new Map();
    const cards = cardsData.data || cardsData.cards || [];

    cards.forEach(card => {
      const heroId = card.playerId || card.player_id || card.id;
      const heroName = card.playerName || card.player_name || card.name;
      
      if (!heroId || !heroName) return;
      
      if (!heroMap.has(heroId)) {
        heroMap.set(heroId, {
          id: heroId,
          name: heroName,
          handle: card.playerHandle || card.twitter_handle || card.handle,
          stars: card.stars || card.rating,
          rank: card.rank || card.position,
          followers: card.followers || card.follower_count,
          score7d: card.score7d || card.weekly_score || card.score,
          prices: {}
        });
      }
      
      const hero = heroMap.get(heroId);
      const rarity = (card.rarity || card.tier || '').toLowerCase();
      const price = parseFloat(card.price || card.floor_price || 0);
      
      if (rarity && price > 0) {
        hero.prices[rarity] = price;
      }
    });

    const heroes = Array.from(heroMap.values())
      .filter(hero => Object.keys(hero.prices).length > 0)
      .map(hero => ({
        ...hero,
        commonPrice: hero.prices.common || Math.min(...Object.values(hero.prices))
      }));

    res.status(200).json({
      success: true,
      count: heroes.length,
      heroes: heroes
    });

  } catch (error) {
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch data. SDK error.'
    });
  }
}
