import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // lets the server read JSON sent from the client

const PORT = process.env.PORT || 3001;

// Set up the Gemini client with our secret key (loaded from .env).
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check — confirms the server is up.
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Meal Prep server is running" });
});

// Test route — confirms Gemini is reachable. We'll remove this later.
app.post("/api/mealplan", async (req, res) => {
  const { weight, height, age, goal, activity, ingredients } = req.body;

  // Basic validation
  if (!weight || !height || !ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // The prompt: we describe the person, the ingredients, and—critically—
  // the EXACT JSON shape we want back. Being strict here is what makes
  // the response parseable.
  const prompt = `
You are a helpful meal-prep assistant. Based on the person's stats and the
ingredients they have, create a realistic 3-day meal plan. Prioritize using
the ingredients they listed; you may assume basic staples (oil, salt, spices)
are available, and you may suggest a few extra ingredients to buy.

Person:
- Weight: ${weight} kg
- Height: ${height} cm
- Age: ${age}
- Goal: ${goal} (cut = lose fat, maintain, bulk = gain muscle)
- Activity level: ${activity}

Ingredients on hand: ${ingredients.join(", ")}

Respond with ONLY valid JSON in exactly this shape, no markdown, no extra text:
{
  "dailyCalories": number,
  "dailyWaterLiters": number,
  "extraToBuy": ["string"],
  "days": [
    {
      "day": "string",
      "meals": [
        {
          "name": "string",
          "time": "string",
          "description": "string",
          "macros": { "protein": number, "carbs": number, "fats": number, "calories": number }
        }
      ]
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Models sometimes wrap JSON in ```json fences — strip them.
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const plan = JSON.parse(text);
    res.json(plan);
  } catch (err) {
    console.error("Meal plan generation failed:", err);
    res.status(500).json({ error: "Could not generate a meal plan. Try again." });
  }
});

app.listen(PORT, () => {
  console.log(`🍽️  Meal Prep server running on http://localhost:${PORT}`);
});