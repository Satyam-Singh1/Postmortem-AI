import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getDocStore } from "../db/mongo.js";
import { getVectorStore } from "./provider.js";

async function chunkText(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });
  // splitText takes a string and returns string[]
  return await textSplitter.splitText(text);
}

async function ragIndexDocument(doc) {
  // 1. keep the full original document in Mongo (returns a row with an id)
  const store = getDocStore();
  const saved = await store.insertKnowledge(doc);

  // 2. split the content into overlapping chunks
  const chunks = await chunkText(doc.content);
  if (chunks.length === 0) {
    return { docId: saved.id, chunks: 0 };
  }

  // 3. wrap each chunk as a LangChain Document: text in pageContent, the rest in
  //    metadata. The vector store embeds pageContent and upserts to Pinecone.
  const documents = chunks.map((text) => ({
    pageContent: text,
    metadata: {
      sourceId: saved.id,
      sourceType: doc.type,
      title: doc.title,
      service: doc.service,
    },
  }));

  // 4. hand the documents to Pinecone via LangChain (embeds + upserts for us)
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(documents);

  return { docId: saved.id, chunks: chunks.length };
}

async function ragSearch(query, opts = {}) {
  const { k = 5  , sourceType} = opts;
  
  const filter = sourceType ?{sourceType} : undefined;

  // similaritySearchWithScore embeds the query, runs cosine ANN in Pinecone,
  // and returns an array of [Document, score] pairs (most similar first).
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearchWithScore(query, k, filter);

  // reshape into clean hits, pulling text from pageContent and the rest from
  // the metadata we stored at index time.
  return results.map(([document, score]) => ({
    text: document.pageContent,
    title: document.metadata.title,
    service: document.metadata.service,
    sourceType: document.metadata.sourceType,
    score,
  }));
}


export { chunkText, ragIndexDocument, ragSearch };