export const storyColors = [
  { label: "Roz", value: "roz", swatch: "#ee88ae", palette: "rose pink, warm white, raspberry accents" },
  { label: "Mov", value: "mov", swatch: "#9560b3", palette: "violet, lilac highlights, golden light" },
  { label: "Albastru", value: "albastru", swatch: "#408ac3", palette: "sky blue, azure, soft coral accents" },
  { label: "Verde", value: "verde", swatch: "#509b69", palette: "leaf green, mint light, warm yellow accents" },
  { label: "Galben", value: "galben", swatch: "#e7bd32", palette: "sunshine yellow, warm white, turquoise accents" },
  { label: "Roșu", value: "roșu", swatch: "#d84657", palette: "poppy red, warm white, forest green accents" },
  { label: "Portocaliu", value: "portocaliu", swatch: "#e58b38", palette: "tangerine, peach, sky blue accents" },
  { label: "Turcoaz", value: "turcoaz", swatch: "#41a9ac", palette: "turquoise, seafoam, warm coral accents" },
  { label: "Lila", value: "lila", swatch: "#b396d0", palette: "lilac, soft violet, butter-yellow accents" },
  { label: "Corai", value: "corai", swatch: "#eb8072", palette: "coral, peach, teal accents" },
  { label: "Auriu", value: "auriu", swatch: "#b69343", palette: "luminous gold, ivory, jewel-green accents" },
  { label: "Argintiu", value: "argintiu", swatch: "#b8c4ce", palette: "silver, cool white, blue and rose accents" },
  { label: "Alb", value: "alb", swatch: "#f4f5f3", palette: "warm white, sky-blue shadows, playful colored accents" },
  { label: "Curcubeu", value: "curcubeu", swatch: "#df7595", palette: "balanced joyful rainbow hues, cohesive warm light" },
];
export function simpleStoryColor(value: string) {
  const normalized = value.toLocaleLowerCase("ro-RO").trim();
  return storyColors.find(c => normalized === c.value || normalized.startsWith(c.value + " "))?.value || normalized.slice(0, 36);
}
export function illustrationPalette(value: string) {
  return storyColors.find(c => c.value === simpleStoryColor(value))?.palette || simpleStoryColor(value);
}
