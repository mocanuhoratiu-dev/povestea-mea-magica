export const ALBUM_CINEMATIC_STYLE = "Ilustrație 3D de poveste";
export const CINEMATIC_STYLE_MARKER = "CINEMATIC 3D ART DIRECTION";

const cinematic = `${CINEMATIC_STYLE_MARKER}: premium stylized 3D animated feature film. Sculpted age-appropriate characters, expressive facial acting, groomed hair, tactile woven fabric, soft skin translucency, global illumination and gentle rim light. Cinematic foreground/midground/background depth, readable faces, balanced warm-cool colors. Consistent character design and materials throughout the book; adapt lighting to the actual scene, not perpetual night or golden hour. Not watercolor, gouache, flat 2D, painted-paper texture, anime, glossy plastic toys or photorealistic people`;

const directions: Record<string, string> = {
  [ALBUM_CINEMATIC_STYLE]: cinematic,
  "Acuarelă cinematografică": "premium cinematic watercolor and gouache, luminous washes, refined ink accents, layered atmospheric depth, sophisticated European picture-book illustration",
  "Guașă pictată manual": "premium hand-painted gouache, rich opaque color, visible brush texture, elegant shapes, editorial European children's-book illustration",
  "Creioane colorate premium": "premium colored-pencil and soft pastel illustration on fine paper, intricate texture, luminous color layering, elegant contemporary picture-book finish",
};

export function albumArtDirection(style: string) {
  return directions[style] || cinematic;
}

export function albumStyleQualityInstruction(prompt: string, asset: string) {
  if (asset === "album-coloring" || !prompt.includes(CINEMATIC_STYLE_MARKER)) return "";
  return "The requested medium is stylized cinematic 3D animation. Evaluate visible depth, expressive facial acting, tangible materials and coherent lighting. Describe concrete visual defects, not guesses about which rendering software or technique was used. Soft painterly shading can coexist with dimensional 3D characters; do not penalize this alone or apply an automatic score cap. A photographic identity reference is not a style reference: preserve recognizable facial structure, hair color and hairstyle, skin tone and apparent age while allowing stylized eyes and proportions. For an illustrated reference, check design continuity.";
}
