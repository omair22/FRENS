const SCENE_MAPPING = [
  { 
    scene: 'gaming', 
    keywords: ['game', 'gaming', 'play', 'xbox', 'ps5', 'pc', 'switch', 'nintendo', 'valorant', 'cod', 'minecraft', 'league', 'warzone', 'csgo', 'board game', 'cards', 'streamer']
  },
  {
    scene: 'cafe',
    keywords: ['coffee', 'cafe', 'tea', 'latte', 'starbucks', 'espresso', 'matcha', 'brew', 'caffeine', 'morning']
  },
]

export const detectScene = (title = '') => {
  const lower = title.toLowerCase()
  for (const mapping of SCENE_MAPPING) {
    if (mapping.keywords.some(kw => lower.includes(kw))) {
      return mapping.scene
    }
  }
  return 'default'
}
