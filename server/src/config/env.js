import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from several locations so it works regardless of where you keep it:
//   1. server/src/config/.env  (co-located with this file — your current setup)
//   2. server/.env
//   3. monorepo root .env
// Values already set in the environment are never overwritten by later files.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-flash-latest',
    embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  },

  postgres: {
    url: process.env.DATABASE_URL || '',
  },

  mongo: {
    uri: process.env.MONGODB_URI || '',
    db: process.env.MONGODB_DB || 'postmortem_ai',
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    index: process.env.PINECONE_INDEX || 'postmortem-ai',
  },
};

// Feature flags: when a credential/URL is missing we transparently fall back to
// the mock AI provider and in-memory data stores, so the app always boots.
export const hasGeminiKey = Boolean(config.ai.googleApiKey);
export const usePostgres = Boolean(config.postgres.url);
export const useMongo = Boolean(config.mongo.uri);
// Pinecone has NO offline fallback — the vector store requires these.
export const hasPinecone = Boolean(config.pinecone.apiKey && config.pinecone.index);
