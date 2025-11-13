import crypto from "crypto";
import qs from "qs";

export default async function handler(req, res) {
  const vnp_Params = { ...req.query };

  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // Sort
  const sorted = Object.keys(vnp_Params)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: vnp_Params[key] }), {});

  const signData = qs.stringify(sorted, { encode: false });

  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(signData).digest("hex");

  if (secureHash !== signed) {
    return res.json({ RspCode: "97", Message: "Sai chữ ký" });
  }

  const orderId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const amount = Number(vnp_Params["vnp_Amount"]) / 100;

  // 🔥 Ở đây anh có thể cập nhật Supabase nếu muốn:
  //
  // import { createClient } from "@supabase/supabase-js";
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  //
  // if (responseCode === "00") {
  //    await supabase.from("orders").update({ order_status: "confirmed" }).eq("order_id", orderId);
  //    await supabase.from("payments").upsert({
  //        order_id: orderId,
  //        amount,
  //        status: "success",
  //        method: "vnpay"
  //    });
  // }

  if (responseCode === "00") {
    return res.json({ RspCode: "00", Message: "Thanh toán thành công" });
  }

  return res.json({ RspCode: "00", Message: "Thanh toán thất bại" });
}
