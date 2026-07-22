const QRCode = require("qrcode");


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
