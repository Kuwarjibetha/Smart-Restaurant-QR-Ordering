async function handleAskMenuSubmit(inputEl, resultEl) {
  const question = inputEl.value.trim();
  if (!question) return;

  resultEl.innerHTML = `<p class="text-sm" style="color: var(--charcoal-soft)">Checking the menu…</p>`;

  try {
    const { answer } = await api.askMenu(question);
    resultEl.innerHTML = `
      <p class="text-sm mb-2">${escapeHtml(answer)}</p>
      <p class="text-xs" style="color: var(--saffron-deep)">
         Always double-check with staff before ordering if you have a serious allergy.
      </p>
    `;
  } catch (err) {
    resultEl.innerHTML = `<p class="text-sm" style="color: var(--chili)">Couldn't check that right now — please ask staff directly.</p>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
