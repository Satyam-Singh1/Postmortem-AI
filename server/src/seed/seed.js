import { initMongo, getDocStore } from "../db/mongo.js";
import { ragIndexDocument } from "../ai/rag.js";
import { clearVectorStore } from "../ai/provider.js";
import { createLogger } from "../utils/logger.js";
import { seedDocs } from "./data.js";

const log = createLogger("seed");

// Wipe existing knowledge + vectors, then index the demo dataset into both
// MongoDB (originals) and Pinecone (embeddings). Idempotent — safe to re-run.
export async function runSeed() {
  await initMongo();

  log.info("Clearing existing knowledge + vectors…");
  await getDocStore().clearKnowledge();
  await clearVectorStore();

  let totalChunks = 0;
  for (const doc of seedDocs) {
    const { chunks } = await ragIndexDocument(doc);
    totalChunks += chunks;
    log.info(`indexed [${doc.type}] ${doc.title} — ${chunks} chunk(s)`);
  }

  log.info(`Seed complete: ${seedDocs.length} docs, ${totalChunks} chunks.`);
  return { docs: seedDocs.length, chunks: totalChunks };
}

// Allow running directly via `npm run seed`.
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      log.error("Seed failed:", err.message);
      process.exit(1);
    });
}
