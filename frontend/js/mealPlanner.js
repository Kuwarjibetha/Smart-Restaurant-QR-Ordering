// mealPlanner.js — "how much should we order?" for a group, given a budget.

async function handleMealPlanSubmit(formEls, resultEl) {
  const { peopleCount, budget, mealType, dietPreference } = formEls;
  const errorEl = document.getElementById("meal-plan-error");
  errorEl.classList.add("hidden");
  resultEl.innerHTML = `<p class="text-sm" style="color: var(--charcoal-soft)">Planning your order…</p>`;

  try {
    const plan = await api.planMeal(peopleCount.value, budget.value, mealType.value, dietPreference.value);

    if (!plan.items || plan.items.length === 0) {
      resultEl.innerHTML = `<p class="text-sm" style="color: var(--charcoal-soft)">Couldn't find a good combination for that budget — try raising it a little.</p>`;
      return;
    }

    const rows = plan.items
      .map(
        (i) => `
        <div class="flex items-center justify-between text-sm py-1">
          <span>${i.quantity} × ${escapeHtmlMealPlan(i.name)}</span>
          <span>₹${i.lineTotal}</span>
        </div>
      `
      )
      .join("");

    resultEl.innerHTML = `
      <div class="mb-2">${rows}</div>
      <p class="text-sm font-semibold mb-1">
        Estimated total: ₹${plan.estimatedTotal}
        ${plan.withinBudget ? "" : `<span style="color: var(--chili)"> (over your ₹${plan.budget} budget)</span>`}
      </p>
      <p class="text-xs mb-3" style="color: var(--charcoal-soft)">For ${plan.peopleCount} people, ${dietPreference.value} · ${mealType.value}</p>
      <button id="add-plan-to-cart-btn" class="btn-primary px-4 py-2 text-sm">Add all to cart</button>
    `;

    document.getElementById("add-plan-to-cart-btn").onclick = async () => {
      const btn = document.getElementById("add-plan-to-cart-btn");
      btn.disabled = true;
      btn.textContent = "Adding…";
      try {
        for (const planned of plan.items) {
          const menuItem = { _id: planned.menuItemId, name: planned.name, price: planned.price };
          const handledByGroup = await groupOrderAddItem(menuItem);
          if (!handledByGroup) {
            addToCart(getTableNumberFromUrl() || 1, menuItem, planned.quantity);
          } else if (planned.quantity > 1) {
            // Group cart adds one at a time - repeat the call for the remaining quantity
            for (let n = 1; n < planned.quantity; n++) {
              await groupOrderAddItem(menuItem);
            }
          }
        }
        if (typeof refreshCartBadge === "function") refreshCartBadge();
        btn.textContent = "Added to cart ✓";
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Add all to cart";
        alert(err.message);
      }
    };
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
    resultEl.innerHTML = "";
  }
}

function escapeHtmlMealPlan(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}