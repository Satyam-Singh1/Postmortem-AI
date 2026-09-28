import express from "express"
import cors from "cors"
import { config } from "./config/env.js";
import { createLogger } from "./utils/logger.js";
import router from "./routes/diagnose.js";
import knowledgeRouter from "./routes/knowledge.js";
import { initMongo } from "./db/mongo.js";

const log = createLogger("server");
const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: "postmortem-ai"
    })
})

app.use("/api", router);
app.use("/api", knowledgeRouter);


async function start() {
    await initMongo();
    app.listen(config.port, () => {
        log.info(`API listening on http://localhost:${config.port}`)
    })
}

start().catch((err) => {
    log.error("Failed to start server:", err.message);
    process.exit(1);
});