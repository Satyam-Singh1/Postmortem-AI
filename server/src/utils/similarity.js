/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns a value in [-1, 1]; higher means more similar.
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Rank candidate documents (each with an `embedding` array) against a query
 * embedding, returning the top-k with an attached `score`.
 */
export function topKBySimilarity(queryEmbedding, docs, k = 5) {
  return docs
    .map((doc) => ({ ...doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}
