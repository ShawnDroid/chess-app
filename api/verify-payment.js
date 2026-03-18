export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { orderId } = req.query;
  const response = await fetch(
    `https://sandbox.cashfree.com/pg/orders/${orderId}`,
    {
      headers: {
        "x-client-id": process.env.VITE_CF_APP_ID,
        "x-client-secret": process.env.VITE_CF_SECRET,
        "x-api-version": "2023-08-01",
      },
    }
  );
  const data = await response.json();
  res.status(200).json({ paid: data.order_status === "PAID" });
}