import { tool } from '@langchain/core/tools';
import * as z from "zod"
import { getDocStore } from '../db/mongo.js';
import { ragSearch } from '../ai/rag.js';

export const fetchRunbookTool = tool(
    async ({ service }) => {
        const store = getDocStore();
        const runbooks =  await store.getRunbooks({ service });
        return JSON.stringify({
            service: service,
            count: runbooks.length,
            runbooks: runbooks.map((r) => ({ id: r.id, title: r.title, content: r.content })),
        });
    },

    {
        name: 'fetch_runbook',
        description: "Fetch the runbook(s) for a given service to guide incident resolution.",
        schema: z.object({
            service: z.string().describe("The service to fetch the runbook for, e.g. 'checkout'")
        }),
    },
);


export const searchSimilarIncidenst = tool(
    async({query , k})=>{
        const hits = await ragSearch(query,{k:k??5 , sourceType:"incident"});
        return JSON.stringify({
             query : query,
             count : hits.length,
             incident: hits.map((h)=>({
                title:h.title,
                text:h.text,
                service:h.service,
                score:h.score
             })),
        });
    },
    {
        name : "search_similar_incidents",
        description :  "Find past incidents similar to a problem description, including how they were resolved.",
        schema:z.object({
            query:z.string().describe("A description of the current problem or symptoms"),
            k:z.number().optional().describe("How many similar incidents to return (default 5)"),
        }),
    }
);


// collected for LangGraph (M3) + MCP server adaptation
export const tools = [fetchRunbookTool , searchSimilarIncidenst];

