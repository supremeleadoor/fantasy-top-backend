import fs from 'fs';
import path from 'path';

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
    // Read all batch files from data/batches directory
    const batchesDir = path.join(process.cwd(), 'data', 'batches');
    
    if (!fs.existsSync(batchesDir)) {
      return res.status(404).json({ 
        error: 'Batches directory not found',
        path: batchesDir 
      });
    }
    
    const batchFiles = fs.readdirSync(batchesDir)
      .filter(file => file.startsWith('batch') && file.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    if (batchFiles.length === 0) {
      return res.status(404).json({ error: 'No batch files found' });
    }

    // Merge all heroes
    const allHeroesMap = new Map();
    let totalCards = 0;
    const allStatusCounts = {};
    const batchSummary = [];

    batchFiles.forEach(file => {
      const batchPath = path.join(batchesDir, file);
      const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
      
      batchSummary.push({
        file: file,
        heroes: batchData.count,
        cards: batchData.totalCards
      });
      
      // Add heroes to map (deduplicates automatically)
      batchData.heroes.forEach(hero => {
        if (!allHeroesMap.has(hero.id)) {
          allHeroesMap.set(hero.id, hero);
        }
      });
      
      // Aggregate status counts
      Object.entries(batchData.statusCounts || {}).forEach(([status, count]) => {
        allStatusCounts[status] = (allStatusCounts[status] || 0) + count;
      });
      
      totalCards += batchData.totalCards;
    });

    const mergedHeroes = Array.from(allHeroesMap.values());

    // Save merged data
    const outputData = {
      lastUpdated: new Date().toISOString(),
      count: mergedHeroes.length,
      totalCards: totalCards,
      statusCounts: allStatusCounts,
      heroes: mergedHeroes
    };

    const outputPath = path.join(process.cwd(), 'data', 'heroes.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Batches merged successfully!',
      batchesProcessed: batchFiles.length,
      batchSummary: batchSummary,
      result: {
        totalUniqueHeroes: mergedHeroes.length,
        totalCards: totalCards,
        statusCounts: allStatusCounts,
        outputFile: 'data/heroes.json'
      },
      allHeroesFound: mergedHeroes.length === 183
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
