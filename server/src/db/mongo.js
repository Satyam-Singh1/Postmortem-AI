import { nanoid } from "nanoid";
import {config} from "../config/env.js"
import {MongoClient} from "mongodb"
import { createLogger } from "../utils/logger.js";

const log = createLogger("mongo");

class MongoDocStore{
  constructor(db){
    this.knowledge = db.collection("knowledge");
  }

  async init(){
    await this.knowledge.createIndex({type:1, service:1});
    log.info("Connected to MongoDB.");
  }

  async insertKnowledge(doc){
    const row = {
      id: doc.id || nanoid(12),
      ...doc
    };
    await this.knowledge.insertOne({...row});
    return row;
  }

  async getRunbooks({ service } = {}) {
    const q = { type: "runbook" };
    if (service) q.service = service;
    return this.knowledge.find(q, { projection: { _id: 0 } }).toArray();
  }

  async clearKnowledge() {
    await this.knowledge.deleteMany({});
  }
}

let store = null;
let client = null;

export async function initMongo() {
  if (store) return store;
  if (!config.mongo.uri) {
    throw new Error(
      "MONGODB_URI is not set. Create a free cluster at mongodb.com/atlas and add it to .env.",
    );
  }
  client = new MongoClient(config.mongo.uri);
  await client.connect();
  store = new MongoDocStore(client.db(config.mongo.db));
  await store.init();
  return store;
}

export function getDocStore() {
  if (!store) throw new Error('Mongo store not initialized. Call initMongo() first.');
  return store;
}