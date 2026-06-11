import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/vision/meal-scanner", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
         return res.status(500).json({ error: "API key is missing server-side" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é uma IA de nutrição tática militar do Choque Fit.
Analise esta imagem de refeição e forneça os macronutrientes estimados e avalie se ela é digna de um soldado em dieta rigorosa.
Retorne SOMENTE um JSON estruturado com as propriedades:
- name: string (nome criativo militar para o prato)
- calories: number (calorias estimadas totais)
- protein: number (proteínas em gramas) 
- carbs: number (carboidratos em gramas)
- fats: number (gorduras em gramas)
- isApproved: boolean (true se for refeição limpa, false se for lixo/junk food)
- feedback: string (Feedback curto e agressivo estilo sargento sobre o prato)`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          prompt,
          { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text?.trim() || "{}");
      res.json(result);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Erro ao processar imagem.' });
    }
  });

  app.post("/api/logistics/gemini-shopping-list", async (req, res) => {
    try {
      const { budget, inventory, activeTab, menu } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
         return res.status(500).json({ error: "API key is missing server-side" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Você é uma IA militar logística responsável por calcular a provisão de alimentos para as tropas de choque.
Baseado no orçamento (${budget}), considere o seguinte cardápio exato correspondente a cada um dos 7 dias da semana:
${JSON.stringify(menu, null, 2)}

Gere uma lista unificada de supermercado de TUDO o que precisa ser comprado para cobrir EXATAMENTE estes próximos 7 dias de dieta. 
Agrupe itens iguais (ex: some a quantidade de frango gasta todos os dias).
Como referência base, diminua destas necessidades brutas o que já possuímos no momento (Estoque atual: ${JSON.stringify(inventory)}).
Retorne SOMENTE um JSON Array com os itens a comprar no formato a seguir, contendo as propriedades 'name', 'quantity' (number) e 'unit' (string ex: 'kg', 'un.').`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nome do item (ex: 'Peito de Frango')" },
                quantity: { type: Type.NUMBER, description: "Quantidade necessária (ex: 2.5, 30)" },
                unit: { type: Type.STRING, description: "Unidade (ex: 'kg', 'un.', 'g')" }
              },
              required: ["name", "quantity", "unit"]
            }
          }
        }
      });

      const parsedItems = JSON.parse(response.text?.trim() || "[]");
      const items = parsedItems.map((item: any, i: number) => ({
         id: Date.now() + i,
         name: `${item.quantity}${item.unit} ${item.name}`,
         quantity: item.quantity,
         unit: item.unit,
         purchased: false
      }));

      res.json(items);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Erro ao comunicar com a Engine.' });
    }
  });

  // Vite middleware for development
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
