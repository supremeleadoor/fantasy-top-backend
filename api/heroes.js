// api/heroes.js - Final working version
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
    const cards = result.data.data || [];
    
    console.log(`Found ${cards.length} cards`);
    
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        heroes: []
      });
    }
    
    // Process cards - group by hero
    const heroMap = new Map();
    
    cards.forEach(card => {
      try {
        const hero = card.heroes;
        if (!hero || !hero.id) return;
        
        const heroId = hero.id;
        
        if (!heroMap.has(heroId)) {
          heroMap.set(heroId, {
            id: heroId,
            name: hero.name || 'Unknown',
            handle: hero.handle || null,
            stars: hero.stars || 0,
            followers: hero.followers_count || 0,
            verified: hero.verified || hero.is_blue_verified || false,
            description: hero.description || null,
            profileImage: hero.profile_image_url_https || null,
            expectedScore: parseFloat(hero.expected_score) || 0,
            status: hero.status || null,
            prices: {}
          });
        }
        
        const heroData = heroMap.get(heroId);
        
        // Map rarity numbers to names
        const rarityMap = {
          1: 'legendary',
          2: 'epic', 
          3: 'rare',
          4: 'uncommon',
          5: 'common'
        };
        
        const rarity = rarityMap[card.rarity]
