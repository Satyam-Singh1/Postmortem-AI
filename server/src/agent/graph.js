import {createReactAgent} from '@langchain/langgraph/prebuilt'
import { getChatModel } from '../ai/provider.js';
import { tools } from '../mcp/tools.js';


// System prompt: gives the agent its role + how to use the tools.
const SYSTEM_PROMPT = `You are PostmortemAI, an expert SRE incident diagnosis assistant.
When given an incident description, use your tools to gather evidence:
- Use search_similar_incidents to find past incidents that resemble the problem.
- Use fetch_runbook to get the operational runbook for the affected service.
Then produce a concise, grounded diagnosis with:
1) the most likely root cause (cite the similar incident if relevant),
2) concrete resolution steps (from the runbook if available),
3) a short next action.
Only use information from the tools; if evidence is missing, say so.`;


let agent= null;

function getAgent(){
    if(agent) return agent;
    agent = createReactAgent({
        llm: getChatModel(),
        tools:tools,
        prompt:SYSTEM_PROMPT,
    });
    return agent;
}

// Gemini can return content as a string or an array of parts; normalize to text.
function contentToText(content) {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content.map((p) => (typeof p === "string" ? p : p.text || "")).join("");
    }
    return String(content ?? "");
}

// Turn the raw LangGraph message trace into a clean, UI-friendly list of the
// tools the agent chose to call and what each returned.
function toSteps(messages) {
    const steps = [];
    for (const m of messages) {
        const type = m._getType ? m._getType() : m.role;
        if (type === "ai" && Array.isArray(m.tool_calls) && m.tool_calls.length) {
            for (const tc of m.tool_calls) {
                steps.push({ kind: "tool_call", name: tc.name, args: tc.args });
            }
        } else if (type === "tool") {
            steps.push({ kind: "tool_result", name: m.name, content: contentToText(m.content) });
        }
    }
    return steps;
}

export async function diagnoseIncident(query) {
    const app = getAgent();

    const result = await app.invoke({
        messages:[
            {
                role : "user",
                content: query
            }
        ],
    });

    const messages = result.messages;
    const answer = contentToText(messages[messages.length - 1].content);
    const steps = toSteps(messages);
    return { answer, steps };
}