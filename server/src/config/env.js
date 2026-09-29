import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: 'https://postmortemaii.netlify.app/' || 'http://localhost:5173',

  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    chatModel: process.env.GEMINI_CHAT_MODEL || '',
    embedModel: process.env.GEMINI_EMBED_MODEL || '',
  },

  postgres: {
    url: process.env.DATABASE_URL || '',
  },

  mongo: {
    uri: process.env.MONGODB_URI || '',
    db: process.env.MONGODB_DB || '',
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    index: process.env.PINECONE_INDEX || '',
  },
};

export const hasGeminiKey = Boolean(config.ai.googleApiKey);
export const usePostgres = Boolean(config.postgres.url);
export const useMongo = Boolean(config.mongo.uri);
export const hasPinecone = Boolean(
  config.pinecone.apiKey && config.pinecone.index
);