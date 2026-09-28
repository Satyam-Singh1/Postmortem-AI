import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { config, hasGeminiKey, hasPinecone } from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ai');

let embeddings = null;
let vectorStore = null;
let pineconeClient = null;
let chatModel = null;

/**
 * Return a cached LangChain `Embeddings` instance backed by Google Gemini
 * (`text-embedding-004`, 768-dim). Plugs directly into PineconeStore, which
 * calls `embedDocuments` on index and `embedQuery` on search.
 */
export function getEmbeddings() {
  if (embeddings) return embeddings;
  if (!hasGeminiKey) {
    throw new Error(
      'GOOGLE_API_KEY is not set. Get a free key at '
      + 'https://aistudio.google.com/app/apikey and add it to .env.',
    );
  }
  embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.ai.googleApiKey,
    model: config.ai.embedModel,
  });
  return embeddings;
}

/**
 * Build (once) and return a LangChain PineconeStore bound to our embeddings.
 * Uses the single default index named by PINECONE_INDEX. The store handles
 * embedding + upsert on write and ANN similarity on read.
 */
export async function getVectorStore() {
  if (vectorStore) return vectorStore;
  if (!hasPinecone) {
    throw new Error(
      'Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX in '
      + '.env, and create an index with dimension 768 and metric "cosine".',
    );
  }
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: config.pinecone.apiKey });
  }
  const pineconeIndex = pineconeClient.Index(config.pinecone.index);
  vectorStore = await PineconeStore.fromExistingIndex(getEmbeddings(), {
    pineconeIndex,
    maxConcurrency: 5,
  });
  log.info(`Pinecone vector store ready (index: ${config.pinecone.index}).`);
  return vectorStore;
}

/**
 * Delete every vector in the Pinecone index (default namespace). Used by the
 * seed script so re-seeding stays idempotent. Safe to call on an empty index.
 */
export async function clearVectorStore() {
  if (!hasPinecone) return;
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: config.pinecone.apiKey });
  }
  const index = pineconeClient.Index(config.pinecone.index);
  try {
    await index.deleteAll();
    log.info("Cleared Pinecone index.");
  } catch (err) {
    // A fresh/empty index can 404 on deleteAll — safe to ignore.
    log.warn(`Pinecone clear skipped: ${err.message}`);
  }
}

export function getChatModel() {
  if(chatModel) return chatModel;
  chatModel = new ChatGoogleGenerativeAI({
    apiKey: config.ai.googleApiKey,
    model : config.ai.chatModel,
    temperature:0.1
  });
  return chatModel;
}


log.info(`AI embeddings: Gemini (${config.ai.embedModel})`);



