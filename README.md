# Meal Prep Planner — AI-Powered Nutrition & Meal Planning

Enter your stats, goals, and the ingredients you have on hand, and the app generates a personalized multi-day meal plan — portioned to your calorie target, broken down by macros, and tailored to your preferred cuisine.

**Live demo:** https://mealprep-1-fzv7.onrender.com/


## What it does

- **AI-generated meal plans** — turns your ingredients and goals into a structured multi-day plan using the Gemini API
- **Formula-based calorie targets** — calculates your daily target with the Mifflin-St Jeor equation (server-side), rather than letting the AI guess, so the number is consistent and accurate
- **Macro breakdown** — protein, carbs, and fats per meal plus a daily total, with honest target-vs-actual calorie tracking
- **Cuisine personalization** — tailors dishes to your food culture (e.g. Nigerian, Italian, Indian) so the plan is something you'd actually eat
- **Goal-aware** — adjusts targets for cutting, maintaining, or bulking, factoring in age, sex, height, weight, and activity level
- **Day-by-day view** — clean tabbed interface to move between days

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| AI | Google Gemini API |
| Hosting | Render (web service + static site) |

## How it works

The React client collects the user's stats and ingredients and sends them to an Express server. The server calculates a calorie target from a nutrition formula, builds a carefully structured prompt, and calls the Gemini API — instructing the model to return **only** valid JSON in a fixed shape. The server parses that response, overrides the AI's calorie figure with its own calculated target, verifies each day's macro totals in code, and returns the clean plan to the client to render.

```
React client  ──▶  Express server  ──▶  Gemini API
                   (calorie math +        (structured
                    JSON validation)       meal plan)
```

The Gemini API key lives only in a server-side environment variable — it is never exposed to the browser, since all AI calls are proxied through the backend.

## Running locally

You'll need Node.js and a free [Gemini API key](https://aistudio.google.com).

**Backend:**
```bash
cd server
npm install
# create a .env file with:
#   GEMINI_API_KEY=your_key_here
#   PORT=3001
node index.js
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173

## What I learned

This was a focused project to go deep on integrating an LLM into a real application:

- **Reliable structured output from an LLM** — prompting Gemini to return strictly-shaped JSON, then parsing and validating it defensively (stripping markdown fences, handling malformed responses).
- **Not trusting AI arithmetic** — language models are unreliable at math, so I calculate the calorie target with a real nutrition formula server-side and verify the meal totals in code, rather than relying on the AI's numbers. The UI shows target vs. actual transparently instead of hiding the gap.
- **Keeping secrets safe** — all AI calls are proxied through the backend so the API key is never exposed in the browser or committed to source control.
- **Designing for real use** — added cuisine personalization after realizing the real failure point of meal plans isn't the math, it's whether someone will actually eat the food.

## Responsible use

This app provides general estimates and meal suggestions for informational purposes only. It is not medical or nutritional advice. Calorie and macro figures are approximations — consult a qualified professional for personalized dietary guidance.

## What's next

- Save plans and track weight progression over time
- Paired daily gym routines
- Dietary filters (vegetarian, halal, allergies)
- Shopping list export

---

Built by Kingsley Randle.
