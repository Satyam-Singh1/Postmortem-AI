import { Router } from "express";
import { diagnoseIncident } from "../agent/graph.js";
const router = Router();

router.post("/diagnose", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Body must include a 'query' string." });
    }

    const result = await diagnoseIncident(query);
    res.json(result);

    }catch (err){
    console.error("diagnose failed:", err);
    res.status(500).json({ error: "Diagnosis failed." });
    }
});

export default router;