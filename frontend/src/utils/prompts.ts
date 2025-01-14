// Core NFT style attributes
const baseAttributes = [
  'nft pfp collection style',
  '2d cartoon art',
  'vector graphic',
  'minimalist illustration',
  'simple clean linework',
  'solid flat colors',
  'bold graphic design',
  'pop art style'
];

// View options for consistent collection style
const viewTypes = [
  'front view portrait',
  'three-quarter view portrait',
  'profile view portrait'
];

// Core character types that mimic successful NFT collections
const characterTypes = {
  animals: [
    'bored ape',
    'cool penguin',
    'punk lion',
    'doodle cat',
    'crypto bear',
    'pixel monkey'
  ],
  creatures: [
    'kawaii monster',
    'space alien',
    'chibi dragon',
    'pixel ghost',
    'cute goblin',
    'mini kaiju'
  ],
  avatars: [
    'pixel punk',
    'crypto samurai',
    'doodle wizard',
    'pop art hero',
    '8bit warrior',
    'retro ninja'
  ],
  robots: [
    'doodle bot',
    'pixel droid',
    'crypto mecha',
    'retro robot',
    'chibi android',
    'mini transformer'
  ]
};

// Track last used category to avoid repetition
let lastUsedCategory: keyof typeof characterTypes | null = null;

// Distinctive NFT style traits
const styleModifiers = {
  expression: [
    'bored expression',
    'cool smirk',
    'laser eyes',
    'pixel shades',
    'zombie eyes',
    'rainbow visor'
  ],
  clothing: [
    'streetwear hoodie',
    'cyber punk jacket',
    'pixel suit',
    'space helmet',
    'golden crown',
    'rainbow cape'
  ],
  accessories: [
    'gold chain',
    'pixel hat',
    'vr headset',
    'crypto punk mohawk',
    'neon headphones',
    'halo effect'
  ],
  special: [
    'holographic background',
    'pixel glitch effect',
    'neon glow',
    'rainbow aura',
    'sparkle effects',
    'vapor wave aesthetic'
  ],
  background: [
    'solid color backdrop',
    'gradient background',
    'pixel pattern',
    'pop art dots',
    'minimal shapes',
    'retro grid'
  ]
};

let lastUsedStyle: keyof typeof styleModifiers | null = null;

// Color schemes inspired by successful NFT collections
const colorSchemes = [
  'bored ape palette',
  'crypto punk colors',
  'doodle palette',
  'vapor wave colors',
  'retro pixel palette',
  'pop art colors',
  'minimal pastel scheme',
  'neon synthwave palette'
];

// Stronger negative prompt focused on NFT quality
export const negativePrompt = 'realistic, 3d render, photograph, photorealistic, high detail, complex background, noise, grain, text, watermark, signature, blurry, deformed, mutated, extra limbs, bad anatomy, ugly, low quality, multiple views';

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomCategory<T>(categories: Record<string, T[]>): [string, T] {
  // Filter out the last used category if it exists
  const availableCategories = Object.keys(categories).filter(cat => cat !== lastUsedCategory);
  const category = getRandomElement(availableCategories);
  const item = getRandomElement(categories[category]);
  return [category, item];
}

export function generatePFPPrompt(isLegendary: boolean): string {
  // Get character from a different category than last time
  const [characterCategory, character] = getRandomCategory(characterTypes);
  lastUsedCategory = characterCategory as keyof typeof characterTypes;
  
  // Get style elements for more distinctiveness
  const [styleCategory1, style1] = getRandomCategory(styleModifiers);
  const [styleCategory2, style2] = getRandomCategory({
    ...styleModifiers,
    [styleCategory1]: [] // Exclude the first category
  });
  
  // Get color scheme and view type
  const colorScheme = getRandomElement(colorSchemes);
  const view = getRandomElement(viewTypes);

  // Base NFT style elements that should be emphasized
  const nftStyleElements = [
    'nft pfp collection style',
    '2d cartoon art',
    'vector graphic style',
    'minimalist illustration',
    'solid flat colors',
    'bold graphic design'
  ];

  // Construct prompt with specific ordering for best results
  const promptElements = [
    // Core character with heavy emphasis
    `(((${character})))`,
    
    // Essential NFT style attributes with emphasis
    ...nftStyleElements.map(attr => `((${attr}))`),
    
    // Composition elements
    view,
    'simple centered composition',
    'perfect for pfp',
    
    // Style modifiers with emphasis
    `((${style1}))`,
    `((${style2}))`,
    
    // Color and finish
    `((${colorScheme}))`,
    'simple clean background',
    'pop art style'
  ];

  // Add legendary attributes if applicable
  if (isLegendary) {
    promptElements.unshift('((legendary))');
    promptElements.push(
      'rare trait',
      'special variant',
      'unique edition',
      'premium nft'
    );
  }

  // Add trending/collection tags at the end
  return promptElements.join(', ') + ', nft collection style, trending pfp art, popular crypto art';
}

// Example generation settings
export const generationSettings = {
  steps: 30,
  cfgScale: 8.5,
  width: 512,
  height: 512,
  sampler: "DPM++ 2M Karras"
};
