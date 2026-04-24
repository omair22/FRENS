const SCENE_MAPPING = [
  { 
    scene: 'gaming', 
    keywords: ['game', 'gaming', 'play', 'xbox', 'ps5', 'pc', 'switch', 'nintendo', 'valorant', 'cod', 'minecraft', 'league', 'warzone', 'csgo', 'board game', 'cards', 'streamer']
  },
  {
    scene: 'cafe',
    keywords: ['coffee', 'cafe', 'tea', 'cake', 'starbucks', 'latte', 'espresso', 'matcha', 'brew', 'breakfast', 'brunch', 'bakery', 'croissant', 'donut', 'tim horton']
  },
  {
    scene: 'gym',
    keywords: ['gym', 'workout', 'fitness', 'lift', 'run', 'yoga', 'exercise', 'planet fitness', 'tc gym']
  },
  {
    scene: 'shopping',
    keywords: ['shopping', 'mall', 'store', 'market', 'groceries', 'buy', 'shop', 'walmart', 'target', 'costco']
  }
]

export const detectScene = (title = '', location = '') => {
  let locData = { name: '', category: '', address: '' };
  
  if (location && location.startsWith('{')) {
    try {
      locData = JSON.parse(location);
    } catch (e) {
      locData = { address: location };
    }
  } else {
    locData = { address: location || '' };
  }

  const lowerTitle = title.toLowerCase();
  const lowerName = (locData.name || '').toLowerCase();
  const lowerCategory = (locData.category || '').toLowerCase();
  const searchStr = `${lowerTitle} ${lowerName} ${lowerCategory}`;

  for (const mapping of SCENE_MAPPING) {
    if (mapping.keywords.some(kw => searchStr.includes(kw))) {
      return mapping.scene;
    }
  }

  // If we have a photo URL but no scene match, use the photo scene
  if (locData.photoUrl) return 'photo';

  return 'default';
};
