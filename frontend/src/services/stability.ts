import { Generation } from 'stability-client';

const BASE_URL = 'https://api.stability.ai/v1';

export const PFP_CATEGORIES = {
  characterBase: {
    random: "random character base",
    human: "realistic human portrait",
    anime: "anime character portrait",
    pixel: "detailed pixel art character",
    abstract: "abstract geometric avatar",
    cyberpunk: "cyberpunk character portrait",
    fantasy: "mystical fantasy being",
    animal: "anthropomorphic animal portrait"
  },
  artStyle: {
    random: "random art style",
    neoTokyo: "neo-tokyo futuristic",
    vaporwave: "vaporwave aesthetic",
    retroPixel: "retro pixel art",
    painterly: "digital painterly",
    minimalist: "clean minimalist",
    cyberpunk: "high-tech cyberpunk",
    matrix: "matrix digital rain inspired",
    glitch: "artistic glitch art"
  },
  personality: {
    random: "random personality",
    mysterious: "enigmatic expression, subtle smile",
    confident: "confident pose, strong gaze",
    playful: "playful expression, light-hearted",
    serious: "serious demeanor, focused gaze",
    ethereal: "ethereal presence, dreamy expression",
    powerful: "powerful stance, commanding presence",
    eccentric: "eccentric character, unique expression",
    zen: "peaceful expression, calm demeanor"
  },
  visualElements: {
    random: "random visual elements",
    aura: "glowing energy aura",
    pattern: "intricate background patterns",
    lighting: "dramatic lighting effects",
    particles: "floating particle effects",
    geometric: "geometric design elements",
    energyField: "surrounding energy field",
    tech: "technological interface elements",
    nature: "organic natural elements"
  },
  colorScheme: {
    random: "random color scheme",
    neon: "vibrant neon colors, dark background",
    pastel: "soft pastel color palette",
    mono: "striking monochromatic scheme",
    cyber: "cyberpunk color palette",
    earth: "rich earth tone colors",
    ethereal: "ethereal glowing colors",
    matrix: "matrix green and black",
    crystal: "crystal clear iridescent"
  },
  accessories: {
    random: "random accessories",
    cyber: "cybernetic implants and augmentations",
    mystical: "mystical artifacts and symbols",
    tech: "advanced technological gadgets",
    crown: "elaborate digital crown",
    visor: "high-tech visor or glasses",
    mask: "ethereal glowing mask",
    digital: "digital holographic elements",
    weapon: "energy weapon or staff"
  }
};

function generatePrompt(): string {
  const base = getRandomFromCategory(PFP_CATEGORIES.characterBase);
  return `Create a high quality profile picture featuring ${base}. 
  Ensure the focus is on the character with strong portraiture composition.`;
}

function getRandomFromCategory(category: Record<string, string>): string {
  const options = Object.values(category).filter(item => item !== "random");
  return options[Math.floor(Math.random() * options.length)];
}

export class StabilityService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_STABILITY_API_KEY as string;
  }

  async generateImage(isRemix = false, referenceImage?: string): Promise<string> {
    try {
      const endpoint = isRemix ? '/generation/image-to-image' : '/generation/text-to-image';
      
      const body: any = {
        height: 1024,
        width: 1024,
        cfg_scale: 7,
        steps: 50,
        samples: 1,
        prompt: isRemix ? "Create a unique artistic remix while maintaining core style" : generatePrompt(),
      };

      if (isRemix && referenceImage) {
        body.init_image = referenceImage;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Stability API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.artifacts[0].base64;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
}
