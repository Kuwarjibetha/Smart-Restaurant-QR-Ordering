const Order = require("../models/Order");

const DEFAULT_PREP_TIME = Number(process.env.DEFAULT_PREP_TIME_MINUTES) || 12;

/**
 * Estimates wait time for a new order based on current kitchen load.
 * Logic: estimated time = (number of pending orders) * (avg prep time per order)
 * where "pending" = status in ["placed", "preparing"].
 *
 * We also factor in the average prep time of items within THIS new order,
 * so a quick dish ordered during a quiet moment doesn't get an inflated estimate.
 *
 * @param {Array} newOrderItems - [{ menuItemId, name, quantity, price, avgPrepTimeMinutes }]
 * @returns {Promise<number>} estimated wait time in minutes
 */
async function estimateWaitTime(newOrderItems) {
  const pendingCount = await Order.countDocuments({
    status: { $in: ["placed", "preparing"] },
  });

  // Average prep time for items in the new order (fallback to default if missing)
  const prepTimes = newOrderItems
    .map((i) => i.avgPrepTimeMinutes)
    .filter((t) => typeof t === "number" && t > 0);

  const thisOrderAvgPrep =
    prepTimes.length > 0
      ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length
      : DEFAULT_PREP_TIME;

  // Queue delay from orders ahead of this one, plus this order's own prep time
  const queueDelay = pendingCount * DEFAULT_PREP_TIME;
  const estimated = queueDelay + thisOrderAvgPrep;

  return Math.round(estimated);
}

module.exports = { estimateWaitTime };
