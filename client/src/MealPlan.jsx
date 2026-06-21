import { useState } from "react";

export default function MealPlan({ plan }) {
  const [activeDay, setActiveDay] = useState(0);
  const day = plan.days[activeDay];

  // Sum the macros across the active day's meals.
  const totals = day.meals.reduce(
    (t, meal) => {
      const m = meal.macros || {};
      return {
        protein: t.protein + (m.protein || 0),
        carbs: t.carbs + (m.carbs || 0),
        fats: t.fats + (m.fats || 0),
        calories: t.calories + (m.calories || 0),
      };
    },
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  );

  const diff = totals.calories - plan.dailyCalories;
  const onTarget = Math.abs(diff) <= 150;

  return (
    <section className="plan">
      {/* Daily summary cards */}
      <div className="plan-summary">
        <div className="summary-item">
          <span className="summary-value">{plan.dailyCalories}</span>
          <span className="summary-label">target kcal/day</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{plan.dailyWaterLiters} L</span>
          <span className="summary-label">water/day</span>
        </div>
      </div>

      {/* Extras to buy */}
      {plan.extraToBuy && plan.extraToBuy.length > 0 && (
        <div className="extras">
          <strong>Worth buying:</strong> {plan.extraToBuy.join(", ")}
        </div>
      )}

      {/* Day tabs */}
      <div className="tabs">
        {plan.days.map((d, i) => (
          <button
            key={i}
            className={`tab ${i === activeDay ? "tab--active" : ""}`}
            onClick={() => setActiveDay(i)}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Daily total — honest target vs. actual */}
      <div className="day-totals">
        <div className="cals-compare">
          <span className="total-cals">{totals.calories} kcal</span>
          <span className="cals-target">target {plan.dailyCalories}</span>
          {onTarget ? (
            <span className="cals-ok">on target ✓</span>
          ) : (
            <span className="cals-off">
              {diff > 0 ? "+" : ""}{diff} kcal
            </span>
          )}
        </div>
        <div className="macro-pills">
          <span className="pill pill--p">P {totals.protein}g</span>
          <span className="pill pill--c">C {totals.carbs}g</span>
          <span className="pill pill--f">F {totals.fats}g</span>
        </div>
      </div>

      {/* Meals */}
      <div className="meals">
        {day.meals.map((meal, i) => (
          <div key={i} className="meal">
            <div className="meal-head">
              <span className="meal-name">{meal.name}</span>
              <span className="meal-time">{meal.time}</span>
            </div>
            <p className="meal-desc">{meal.description}</p>
            {meal.macros && (
              <div className="meal-macros">
                <span className="pill pill--p">P {meal.macros.protein}g</span>
                <span className="pill pill--c">C {meal.macros.carbs}g</span>
                <span className="pill pill--f">F {meal.macros.fats}g</span>
                <span className="pill pill--cal">{meal.macros.calories} kcal</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}