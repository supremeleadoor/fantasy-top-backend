import { Client, Configuration } from '@fantasy-top/sdk-pro';

export const config = {
  runtime: 'edge',
};

const sdkConfig = new Configuration({
  basePath: 'https://api-v2.fantasy.top',
  apiKey: 'f341037c-8d9a-476a-9a10-9c484e4cb01f'
});
const api = Client.getInstance(sdkConfig);

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }
  
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers }
    );
  }
  
  try {
    const url = new URL(req.url);
    const startPage = parseInt(url.searchParams.get('startPage')) || 1;
    const maxPages = parseInt(url.searchParams.get('maxPages')) || 40;
    
    const allCards = [];
    
    for (let page = startPage; page <= startPage + maxPages - 1; page++) {
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
    
    for (const card of allCards) {
      if (!card || !card.heroes || !card.heroes.id) continue;
      
      const hero = card.heroes;
      const heroId = String(hero.id);
      const expectedScore = parseFloat(hero.expected_score) || 0;
      
      statusCounts[hero.status] = (statusCounts[hero.status] || 0) + 1;
      
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
    
    return new Response(
      JSON.stringify({
        success: true,
        count: heroes.length,
        totalCards: allCards.length,
        pageRange: `${startPage}-${startPage + maxPages - 1}`,
        statusCounts: statusCounts,
        heroes: heroes
      }),
      { status: 200, headers }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers }
    );
  }
}
