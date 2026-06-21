import { useState } from "react";
import "./App.css";
import MealPlan from "./MealPlan";



export default function App() {
  // User stats
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("maintain");
  const [activity, setActivity] = useState("moderate");
  const [sex, setSex] = useState("male");

  // Ingredients
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");

  // AI request state
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  // Country
  const [country, setCountry] = useState("");

  function addIngredient() {
    const item = ingredientInput.trim();
    if (item && !ingredients.includes(item)) {
      setIngredients((prev) => [...prev, item]);
    }
    setIngredientInput("");
  }

  function removeIngredient(item) {
    setIngredients((prev) => prev.filter((i) => i !== item));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
// ...then in handleSubmit:
const res = await fetch(`${API_URL}/api/mealplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, height, age, sex, goal, activity, country, ingredients }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = weight && height && age && ingredients.length > 0;

  return (
    <div className="app">
      <header className="header">
        <h1>🍽️ Meal Prep Planner</h1>
        <p>Turn what you have into a week of meals, built around your goals.</p>
      </header>

      <section className="card">
        <h2>Your stats</h2>
        <div className="stats-grid">
          <label>
            Weight (kg)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
            />
          </label>

          <label>
            Height (cm)
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 178"
            />
          </label>

          <label>
            Age
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
            />
          </label>

          <label>
            Sex
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label>
            Goal
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="cut">Lose weight (cut)</option>
              <option value="maintain">Maintain</option>
              <option value="bulk">Gain muscle (bulk)</option>
            </select>
          </label>

          <label>
            Activity level
            <select value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="very">Very active</option>
            </select>
          </label>
        </div>
      </section>

          <label>
                Cuisine / Country
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigerian, Italian, Indian"
                />
              </label>

      <section className="card">
        <h2>Ingredients you have</h2>
        <div className="ingredient-input">
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an ingredient and press Enter"
          />
          <button onClick={addIngredient}>Add</button>
        </div>

        <div className="chips">
          {ingredients.length === 0 && (
            <span className="empty">No ingredients yet.</span>
          )}
          {ingredients.map((item) => (
            <span key={item} className="chip">
              {item}
              <button onClick={() => removeIngredient(item)}>×</button>
            </span>
          ))}
        </div>
      </section>

      <button className="generate" onClick={handleSubmit} disabled={!canSubmit || loading}>
        {loading ? "Cooking up your plan..." : "Generate my meal plan"}
      </button>

      <p className="disclaimer">
        Estimates only — general guidance, not medical or nutritional advice.
        Consult a professional for personalized plans.
      </p>

      {error && <p className="error">{error}</p>}

      {plan && <MealPlan plan={plan} />}
    </div>
  );
}