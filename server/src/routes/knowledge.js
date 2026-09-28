import { Router } from "express";
import { ragIndexDocument, ragSearch } from "../ai/rag.js";
import { runSeed } from "../seed/seed.js";

const router = Router();

// POST /api/knowledge  { type, title, service?, content }
router.post("/knowledge", async (req, res) => {
  try {
    const { type, title, service, content } = req.body || {};
    if (!type || !title || !content) {
      return res.status(400).json({ error: "type, title, and content are required." });
    }
    const result = await ragIndexDocument({ type, title, service, content });
    res.json(result);
  } catch (err) {
    console.error("knowledge index failed:", err);
    res.status(500).json({ error: "Failed to index knowledge." });
  }
});

// POST /api/search  { query, k?, sourceType? }
router.post("/search", async (req, res) => {
  try {
    const { query, k, sourceType } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Body must include a 'query' string." });
    }
    const hits = await ragSearch(query, { k: k ?? 5, sourceType });
    res.json({ query, count: hits.length, hits });
  } catch (err) {
    console.error("search failed:", err);
    res.status(500).json({ error: "Search failed." });
  }
});

// POST /api/seed  — load the demo dataset (clears + re-indexes)
router.post("/seed", async (req, res) => {
  try {
    const result = await runSeed();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("seed failed:", err);
    res.status(500).json({ error: "Seeding failed." });
  }
});

export default router;
