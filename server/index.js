import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Mifflin-St Jeor equation: estimates daily calorie needs.
// This gives a consistent, formula-based target instead of letting the AI guess.
function calculateTargetCalories({ weight, height, age, sex, activity, goal }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);

  // Base metabolic rate (BMR)
  let bmr = 10 * w + 6.25 * h - 5 * a;
  bmr += sex === "female" ? -161 : 5;

  // Activity multiplier → total daily energy expenditure (TDEE)
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
  };
  const tdee = bmr * (activityFactors[activity] || 1.2);

  // Adjust for goal
  let target = tdee;
  if (goal === "cut") target = tdee - 500;   // ~0.5kg/week loss
  if (goal === "bulk") target = tdee + 300;  // lean gain surplus

  return Math.round(target);
}

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
  const { weight, height, age, sex, goal, activity, country, ingredients } = req.body;

  if (!weight || !height || !ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Calculate the target ourselves — don't let the AI guess it.
  const targetCalories = calculateTargetCalories({ weight, height, age, sex, activity, goal });

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  // The prompt: we describe the person, the ingredients, and—critically—
  // the EXACT JSON shape we want back. Being strict here is what makes
  // the response parseable.
  const prompt = `
You are a helpful meal-prep assistant. Based on the person's stats and the
ingredients they have, create a realistic 3-day meal plan. Prioritize using
the ingredients they listed; you may assume basic staples (oil, salt, spices)
are available, and you may suggest a few extra ingredients to buy.
If a preferred cuisine or country is given, make the meals reflect that
food culture and flavors (typical dishes, spices, and cooking styles),
while keeping them healthy and aligned with the person's goal.
IMPORTANT: The sum of all meal calories in each day MUST add up to
approximately the dailyCalories target (within ~100 kcal). Adjust portion
sizes so the daily total matches the goal — do not leave the person under
or over their target. Double-check the totals before responding.

Person:
- Weight: ${weight} kg
- Height: ${height} cm
- Age: ${age}
- Sex: ${sex}
- Goal: ${goal} (cut = lose fat, maintain, bulk = gain muscle)
- Activity level: ${activity}
- Preferred cuisine / country: ${country || "no preference"}
- Daily calorie target: ${targetCalories} kcal (USE THIS EXACT NUMBER as dailyCalories)

Build the meals so the day's total calories add up to approximately
${targetCalories} kcal (within ~100). Adjust portion sizes to hit this target.

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
    plan.dailyCalories = targetCalories; // our number always wins
    
    // Verify the AI's math: compute the real meal-calorie sum per day.
    if (Array.isArray(plan.days)) {
      plan.days.forEach((day) => {
        const total = (day.meals || []).reduce(
          (sum, m) => sum + (m.macros?.calories || 0),
          0
        );
        day.actualCalories = total; // the true sum, computed by us
      });
    }

    res.json(plan);
  } catch (err) {
    console.error("Meal plan generation failed:", err);
    res.status(500).json({ error: "Could not generate a meal plan. Try again." });
  }
});

app.listen(PORT, () => {
  console.log(`🍽️  Meal Prep server running on http://localhost:${PORT}`);
});