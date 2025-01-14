import { Generation } from 'stability-client';

const BASE_URL = 'https://api.stability.ai/v1';

export const PFP_CATEGORIES = {
  characterBase: {
    random: "random character base",
    human: "head and shoulders portrait of a realistic human",
    anime: "head and shoulders portrait of an anime character",
    pixel: "head and shoulders portrait in detailed pixel art",
    abstract: "head and shoulders abstract geometric avatar",
    cyberpunk: "head and shoulders portrait of a cyberpunk character",
    fantasy: "head and shoulders portrait of a mystical fantasy being",
    animal: "head and shoulders portrait of an anthropomorphic animal"
  },
  artStyle: {
    random: "random art style",
    neoTokyo: "neo-tokyo futuristic style, clean sharp details",
    vaporwave: "vaporwave aesthetic with bold contrasts",
    retroPixel: "retro pixel art with crisp edges",
    painterly: "detailed digital painting style",
    minimalist: "clean minimalist design with bold features",
    cyberpunk: "high-tech cyberpunk with neon accents",
    matrix: "matrix digital style with code elements",
    glitch: "artistic glitch effects around edges"
  },
  personality: {
    random: "random personality",
    mysterious: "mysterious expression with raised eyebrow",
    confident: "confident three-quarter view pose",
    playful: "playful smirk and tilted head",
    serious: "serious side profile view",
    ethereal: "ethereal front-facing pose",
    powerful: "powerful slight upward angle",
    eccentric: "eccentric expression with unique features",
    zen: "peaceful forward-facing composition"
  },
  visualElements: {
    random: "random visual elements",
    aura: "vibrant energy aura behind head",
    pattern: "patterned background with character centered",
    lighting: "dramatic rim lighting on face",
    particles: "floating particles around head area",
    geometric: "geometric shapes framing portrait",
    hologram: "holographic overlay effects",
    tech: "tech interface elements in background",
    nature: "organic elements framing portrait"
  },
  colorScheme: {
    random: "random color scheme",
    neon: "vibrant neon accents on dark background",
    pastel: "soft pastel tones with subtle gradients",
    monochrome: "high contrast monochromatic palette",
    cyberpunk: "cyberpunk neons with deep shadows",
    ethereal: "iridescent colors with light bloom",
    nature: "rich natural tones with warm highlights",
    royal: "luxurious royal colors with metallic accents",
    retro: "retro color palette with muted tones"
  }
};

export function generatePrompt(): string {
  const character = getRandomFromCategory(PFP_CATEGORIES.characterBase);
  const style = getRandomFromCategory(PFP_CATEGORIES.artStyle);
  const personality = getRandomFromCategory(PFP_CATEGORIES.personality);
  const elements = getRandomFromCategory(PFP_CATEGORIES.visualElements);
  const colors = getRandomFromCategory(PFP_CATEGORIES.colorScheme);

  return `Create a profile picture in NFT style: ${character}, ${style}, ${personality}, ${elements}, ${colors}. Centered composition, high detail, perfect for PFP. Subject fills 70% of frame, clean background, professional lighting.`;
}

function getRandomFromCategory(category: Record<string, string>): string {
  const values = Object.values(category);
  return values[Math.floor(Math.random() * values.length)];
}

export class StabilityService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_STABILITY_API_KEY as string;
    if (!this.apiKey) {
      console.error('Missing STABILITY_API_KEY environment variable');
    }
  }

  async generateImage(prompt: string, negativePrompt: string = ''): Promise<string> {
    try {
      const response = await fetch(`${BASE_URL}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            },
            {
              text: negativePrompt,
              weight: -1
            }
          ],
          cfg_scale: 8.5,
          clip_guidance_preset: 'FAST_BLUE',
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
          style_preset: "pixel-art"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Stability API error:', error);
        throw new Error(error.message || `Failed to generate image: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.artifacts?.[0]?.base64) {
        console.error('No image data in response:', result);
        throw new Error('No image data in response');
      }

      return `data:image/png;base64,${result.artifacts[0].base64}`;
    } catch (error) {
      console.error('Failed to generate image:', error);
      throw error;
    }
  }
}
