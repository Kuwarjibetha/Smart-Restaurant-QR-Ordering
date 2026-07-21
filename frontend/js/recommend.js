// recommend.js — handles the "what should I eat?" text box on the menu page.

async function handleRecommendSubmit(inputEl, resultsEl) {
  const text = inputEl.value.trim();
  if (!text) return;

  resultsEl.innerHTML = `<p class="text-sm" style="color: var(--charcoal-soft)">Thinking about your craving…</p>`;

  try {
    const { suggestions } = await api.recommend(text);

    if (!suggestions || suggestions.length === 0) {
      resultsEl.innerHTML = `<p class="text-sm" style="color: var(--charcoal-soft)">No close matches on the menu right now — try describing it differently.</p>`;
      return;
    }

    resultsEl.innerHTML = "";
    suggestions.forEach((item) => {
      const chip = document.createElement("button");
      chip.className = "btn-secondary";
      chip.style.cssText = "padding:6px 14px; font-size:0.85rem; margin:4px 6px 4px 0;";
      chip.textContent = `${item.name} · ₹${item.price}`;
      chip.onclick = () => {
        const card = document.querySelector(`[data-item-id="${item._id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("pulse");
          setTimeout(() => card.classList.remove("pulse"), 2000);
        }
      };
      resultsEl.appendChild(chip);
    });
  } catch (err) {
    resultsEl.innerHTML = `<p class="text-sm" style="color: var(--chili)">Recommendations are taking a break right now — browse the menu below instead.</p>`;
  }
}
