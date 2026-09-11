import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { albumArtStyleOptions } from '../src/lib/album/types.ts';
import { ALBUM_CINEMATIC_STYLE, CINEMATIC_STYLE_MARKER, albumArtDirection, albumStyleQualityInstruction } from '../src/lib/album/artDirection.ts';
import { buildAlbumPreviewPrompt } from '../src/lib/album/previewPrompt.ts';

test('new album, bundle and Lumi selections default to cinematic 3D', () => {
  assert.equal(albumArtStyleOptions[0], ALBUM_CINEMATIC_STYLE);
  for (const component of ['AlbumCreator', 'BundleConfigurator', 'LumiGuide']) {
    assert.match(readFileSync(new URL(`../src/components/${component}.tsx`, import.meta.url), 'utf8'), /albumArtStyleOptions\[0\]/);
  }
  assert.equal(albumArtDirection('unknown'), albumArtDirection(ALBUM_CINEMATIC_STYLE));
});

test('cinematic art direction specifies materials, acting and depth without forcing the same lighting everywhere', () => {
  const direction = albumArtDirection(ALBUM_CINEMATIC_STYLE);
  for (const word of [CINEMATIC_STYLE_MARKER, 'facial acting', 'groomed hair', 'global illumination', 'actual scene', 'Not watercolor']) assert.ok(direction.includes(word));
  assert.match(albumArtDirection('Guașă pictată manual'), /hand-painted gouache/);
});

test('cover, character reference, interiors and differences share the same style; coloring stays line art', () => {
  const generation = readFileSync(new URL('../src/lib/album/generation.ts', import.meta.url), 'utf8');
  assert.match(generation, /const visualStyle = albumArtDirection\(input.artStyle\)/);
  for (const key of ['characterPrompt', 'coverPrompt', 'imagePrompt', 'differencesPrompt']) {
    assert.ok(generation.split('\n').find(line=>line.includes(`${key}:` ) && line.includes('${visualStyle}')), key);
  }
  assert.ok(generation.split('\n').find(line=>line.includes('coloringPrompt: `${') && line.includes('black-and-white') && !line.includes('${visualStyle}')));
});

test('preview keeps cinematic style early enough to survive provider prompt limits', () => {
  const prompt = buildAlbumPreviewPrompt({name:'Eva',age:'4',artStyle:ALBUM_CINEMATIC_STYLE,hairStyle:'ondulat',hairColor:'șaten',eyeColor:'căprui',skinTone:'deschisă',outfit:'salopetă',favoriteColor:'verde',companion:'O steluță',referenceMode:'description'} as Parameters<typeof buildAlbumPreviewPrompt>[0], 'Pădurea luminilor');
  assert.ok(prompt.indexOf(CINEMATIC_STYLE_MARKER) < 300);
  assert.match(prompt, /authoritative visual reference/);
});

test('quality checks style for CGI illustrations but not coloring or explicitly painted art', () => {
  const prompt=albumArtDirection(ALBUM_CINEMATIC_STYLE);
  assert.match(albumStyleQualityInstruction(prompt,'album-scene-1'), /do not penalize this alone or apply an automatic score cap/);
  assert.equal(albumStyleQualityInstruction(prompt,'album-coloring'),'');
  assert.equal(albumStyleQualityInstruction(albumArtDirection('Guașă pictată manual'),'album-cover'),'');
});
