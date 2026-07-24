const QRCode = require("qrcode");
const crypto = require("crypto");

function generateTableCode(tableNumber) {
  const randomStr = crypto.randomBytes(5).toString("hex");
  return `tbl_${tableNumber}_${randomStr}`;
}

async function generateTableQR(tableNumber, tableCode) {
  const code = tableCode || generateTableCode(tableNumber);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const tableUrl = `${frontendUrl}/customer/menu.html?table=${code}`;

  const qrCodeUrl = await QRCode.toDataURL(tableUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });

  return { tableCode: code, qrCodeUrl, tableUrl };
}

module.exports = { generateTableCode, generateTableQR };
