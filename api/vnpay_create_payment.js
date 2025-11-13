import crypto from "crypto";
import qs from "qs";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    VNP_TMNCODE,
    VNP_HASH_SECRET,
    VNP_URL,
    VNP_RETURN_URL
  } = process.env;

  const { amount, orderId, bankCode } = req.body;

  const ipAddr = req.headers["x-forwarded-for"] || "127.0.0.1";

  const createDate = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMNCODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `${orderId}`,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: Number(amount) * 100,
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  if (bankCode) vnp_Params.vnp_BankCode = bankCode;

  const sorted = Object.keys(vnp_Params)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: vnp_Params[key] }), {});

  const signData = qs.stringify(sorted, { encode: false });

  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signature = hmac.update(signData).digest("hex");

  sorted["vnp_SecureHash"] = signature;

  const query = qs.stringify(sorted, { encode: false });
  const paymentUrl = `${VNP_URL}?${query}`;

  return res.status(200).json({ paymentUrl });
}
