export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { orderId, amount, phone, name } = req.body;
  const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.VITE_CF_APP_ID,
      "x-client-secret": process.env.VITE_CF_SECRET,
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: orderId,
        customer_phone: phone || "9999999999",
        customer_name: name || "Player",
        customer_email: "player@chessbet.app",
      },
    }),
  });
  const data = await response.json();
  res.status(200).json(data);
}