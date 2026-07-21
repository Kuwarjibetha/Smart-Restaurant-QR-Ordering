const QRCode = require("qrcode");

/**
 * Generates a QR code (as a base64 data URL) that points to a table's
 * digital menu page.
 *
 * @param {number} tableNumber
 * @returns {Promise<{ qrCodeUrl: string, tableUrl: string }>}
 */
async function generateTableQR(tableNumber) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const tableUrl = `${frontendUrl}/table/${tableNumber}`;

  const qrCodeUrl = await QRCode.toDataURL(tableUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });

  return { qrCodeUrl, tableUrl };
}

module.exports = { generateTableQR };
