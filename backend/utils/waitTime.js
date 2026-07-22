const Order = require("../models/Order");

const DEFAULT_PREP_TIME = Number(process.env.DEFAULT_PREP_TIME_MINUTES) || 12;


async function estimateWaitTime(newOrderItems) {
  const pendingCount = await Order.countDocuments({
    status: { $in: ["placed", "preparing"] },
  });

  
  const prepTimes = newOrderItems // Average prep time for items in the new order 
    .map((i) => i.avgPrepTimeMinutes)
    .filter((t) => typeof t === "number" && t > 0);

  const thisOrderAvgPrep =
    prepTimes.length > 0
      ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length
      : DEFAULT_PREP_TIME;


  const queueDelay = pendingCount * DEFAULT_PREP_TIME;  // Queue delay from orders ahead of this one, plus this order's own prep time
  const estimated = queueDelay + thisOrderAvgPrep;

  return Math.round(estimated);
}

module.exports = { estimateWaitTime };
