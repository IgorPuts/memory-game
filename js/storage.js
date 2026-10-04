import { STORAGE_KEY, TOP_LIMIT } from "./constants.js";
import { formatDate } from "./utils.js";

export function loadResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResult(moves) {
  const now = new Date();
  const record = {
    moves,
    date: formatDate(now),
    timestamp: now.getTime(),
  };

  const results = loadResults();
  results.push(record);

  results.sort((a, b) => a.moves - b.moves || a.timestamp - b.timestamp);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(results.slice(0, TOP_LIMIT)),
  );
}
