import type { PatienceDifficulty } from "@/lib/patienceKit";

const TOP = 1;
const RIGHT = 2;
const BOTTOM = 4;
const LEFT = 8;

const settings: Record<PatienceDifficulty, { size: number; seed: number }> = {
  easy: { size: 7, seed: 1471 },
  medium: { size: 9, seed: 2729 },
  advanced: { size: 11, seed: 4441 },
};

export type PatienceMaze = {
  size: number;
  cells: number[];
  solution: number[];
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function neighbours(index: number, size: number) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [
    row > 0 ? { index: index - size, from: TOP, to: BOTTOM } : null,
    column < size - 1 ? { index: index + 1, from: RIGHT, to: LEFT } : null,
    row < size - 1 ? { index: index + size, from: BOTTOM, to: TOP } : null,
    column > 0 ? { index: index - 1, from: LEFT, to: RIGHT } : null,
  ].filter((item): item is { index: number; from: number; to: number } => Boolean(item));
}

export function solvePatienceMaze(size: number, cells: number[]) {
  const destination = size * size - 1;
  const queue = [0];
  const previous = new Map<number, number>([[0, -1]]);

  while (queue.length) {
    const current = queue.shift() as number;
    if (current === destination) break;
    for (const neighbour of neighbours(current, size)) {
      if (!(cells[current] & neighbour.from) || previous.has(neighbour.index)) continue;
      previous.set(neighbour.index, current);
      queue.push(neighbour.index);
    }
  }

  if (!previous.has(destination)) return [];
  const path: number[] = [];
  for (let cursor = destination; cursor >= 0; cursor = previous.get(cursor) ?? -1) path.push(cursor);
  return path.reverse();
}

export function createPatienceMaze(difficulty: PatienceDifficulty): PatienceMaze {
  const { size, seed } = settings[difficulty];
  const random = seededRandom(seed);
  const cells = Array.from({ length: size * size }, () => 0);
  const visited = new Set([0]);
  const stack = [0];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const available = neighbours(current, size).filter((item) => !visited.has(item.index));
    if (!available.length) {
      stack.pop();
      continue;
    }
    const next = available[Math.floor(random() * available.length)];
    cells[current] |= next.from;
    cells[next.index] |= next.to;
    visited.add(next.index);
    stack.push(next.index);
  }

  const solution = solvePatienceMaze(size, cells);
  if (visited.size !== size * size || solution.length < 2) throw new Error("Labirintul nu a putut fi validat.");
  return { size, cells, solution };
}
