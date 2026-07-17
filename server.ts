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

// 1. News Monitoring
app.get("/api/news", async (req, res) => {
  const { countries } = req.query;
  const countryList = (countries as string)?.split(",") || ["Poland", "Saudi Arabia", "Romania"];
  
  try {
    const db = await getDB();
    const allNews: NewsItem[] = [];

    for (const country of countryList) {
      const prompt = `Find the 3 most important recent defense and military procurement news for ${country}, specifically focusing on PGM (Precision Guided Munitions), MLRS (like K239 Chunmoo), and defense budget changes. 
      Return a JSON array of objects with fields: title, summary (max 3 lines), url, source, publishedAt (ISO date).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING },
                publishedAt: { type: Type.STRING },
              },
              required: ["title", "summary", "url", "source", "publishedAt"]
            }
          }
        }
      });

      const newsItems = JSON.parse(response.text).map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        country
      }));
      allNews.push(...newsItems);
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
      model: "gemini-3.5-flash",
      contents: `Summarize the following defense market document focusing on key strategic insights, procurement plans, and budget implications. Keep it under 10 bullet points.\n\nDocument Content:\n${content.substring(0, 10000)}`,
    });

    const metadata: FileMetadata = {
      id: Math.random().toString(36).substr(2, 9),
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      summary: summaryResponse.text
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            }
          },
          required: ["title", "sections"]
        }
      }
    });

    const reportData = JSON.parse(response.text);
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
