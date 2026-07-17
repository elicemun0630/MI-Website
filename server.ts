import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import * as XLSX from "exceljs";
import fs from "fs/promises";
import { NewsItem, MIReport, FileMetadata, AppState } from "./src/types";

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// Mock Database (Simple JSON file persistence)
const DB_FILE = path.join(process.cwd(), "db.json");

async function getDB(): Promise<AppState> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { news: [], reports: [], files: [] };
  }
}

async function saveDB(data: AppState) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.use(express.json());

function extractJSON(text: string) {
  try {
    // Attempt to parse directly first
    return JSON.parse(text);
  } catch {
    // Find the first { or [ and last } or ]
    const start = text.search(/[{\[]/);
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (start !== -1 && end !== -1 && end > start) {
      const slice = text.substring(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // Try simple markdown cleanup if slice fails
        const cleaned = slice.replace(/```json|```/g, "").trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

// 1. News Monitoring
app.get("/api/news", async (req, res) => {
  const { countries } = req.query;
  const countryList = (countries as string)?.split(",") || ["Poland", "Saudi Arabia", "Romania"];
  
  try {
    const db = await getDB();
    const allNews: NewsItem[] = [];

    // Seed data if empty to ensure UI is never blank
    if (db.news.length === 0) {
      const seedNews: NewsItem[] = [
        {
          id: 'seed-1',
          title: "Hanwha Aerospace Expands Polish Presence with New Maintenance Hub",
          summary: "Hanwha is establishing a major support center for K9 howitzers and Chunmoo MLRS in Poland, ensuring long-term fleet readiness.",
          url: "https://www.hanwhaaerospace.co.kr",
          source: "Hanwha MI Unit",
          publishedAt: new Date().toISOString(),
          country: "Poland"
        },
        {
          id: 'seed-2',
          title: "Saudi Arabia Defense Budget to Prioritize Domestic Production of PGM",
          summary: "Vision 2030 targets local manufacturing of precision munitions, creating opportunities for international partnerships.",
          url: "https://www.hanwhaaerospace.co.kr",
          source: "Strategic Analysis",
          publishedAt: new Date().toISOString(),
          country: "Saudi Arabia"
        }
      ];
      db.news = seedNews;
      await saveDB(db);
    }

    console.log(`[NEWS] Consolidating fetch for: ${countryList.join(', ')}`);
    
    const prompt = `Find the 3 most important recent defense and military procurement news for EACH of these countries: ${countryList.join(', ')}.
    Focus specifically on PGM (Precision Guided Munitions), MLRS (like K239 Chunmoo), and defense budget changes. 
    
    Return ONLY a JSON array of objects with fields: 
    - title
    - summary (max 3 lines)
    - url
    - source
    - publishedAt (ISO date)
    - country (the name of the country this news belongs to)
    
    No other text outside the JSON array.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      console.log(`[NEWS] Raw response:`, responseText);
      const parsed = extractJSON(responseText);
      
      if (parsed && Array.isArray(parsed)) {
        const newsItems = parsed.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          // Ensure country field exists or fallback
          country: item.country || countryList[0] 
        }));
        allNews.push(...newsItems);
        console.log(`[NEWS] Successfully parsed ${newsItems.length} items total`);
      } else {
        console.error(`[NEWS] Failed to parse JSON. Text:`, responseText);
      }
    } catch (err) {
      console.error(`[NEWS] API Error:`, err);
      // Return existing news if refresh fails to keep UI functional
      return res.json(db.news);
    }

    // Update DB with unique news
    const existingUrls = new Set(db.news.map(n => n.url));
    const newItems = allNews.filter(n => !existingUrls.has(n.url));
    db.news = [...newItems, ...db.news].slice(0, 50); // Keep last 50
    await saveDB(db);

    res.json(db.news);
  } catch (error) {
    console.error("News fetch error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// 2. File Upload & Processing
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    let content = "";
    if (req.file.mimetype === "application/pdf") {
      const data = await pdf(req.file.buffer);
      content = data.text;
    } else if (req.file.mimetype.includes("spreadsheetml") || req.file.mimetype.includes("excel")) {
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);
      worksheet?.eachRow((row) => {
        content += row.values.toString() + "\n";
      });
    }

    // Summarize content
    const summaryResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Summarize the following defense market document focusing on key strategic insights, procurement plans, and budget implications. Keep it under 10 bullet points.\n\nDocument Content:\n${content.substring(0, 10000)}`,
    });
    const summaryText = summaryResponse.text;

    const metadata: FileMetadata = {
      id: Math.random().toString(36).substr(2, 9),
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      summary: summaryText
    };

    const db = await getDB();
    db.files.push(metadata);
    await saveDB(db);

    res.json(metadata);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// 3. Report Generation
app.post("/api/report", async (req, res) => {
  const { country, topic } = req.body;
  
  try {
    const db = await getDB();
    const relevantNews = db.news.filter(n => n.country === country).map(n => n.summary).join("\n");
    const relevantFiles = db.files.map(f => f.summary).join("\n");

    const prompt = `Generate a structured Defense Market Intelligence Report for ${country} regarding "${topic}". 
    Use the following context if available:
    News: ${relevantNews}
    Market Reports: ${relevantFiles}
    
    Structure the report with these sections:
    1. Current Situation (현황)
    2. Key Issues (주요 이슈)
    3. Strategic Impact (당사 영향)
    4. Recommendations (건의사항)
    
    Return as a JSON object with title and sections (array of {title, content}).`;

    console.log(`[REPORT] Generating for ${country} / ${topic}...`);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const responseText = response.text;

    console.log(`[REPORT] Raw response:`, responseText);
    const reportData = extractJSON(responseText);
    if (!reportData) {
      console.error("[REPORT] Failed to parse JSON. Raw:", responseText);
      throw new Error("Failed to parse report JSON");
    }

    const report: MIReport = {
      ...reportData,
      id: Math.random().toString(36).substr(2, 9),
      country,
      createdAt: new Date().toISOString()
    };

    db.reports.push(report);
    await saveDB(db);

    res.json(report);
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.get("/api/data", async (req, res) => {
  res.json(await getDB());
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
