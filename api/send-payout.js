export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { transferId, upiId, amount, remarks } = req.body;
  const response = await fetch(
    "https://payout-gamma.cashfree.com/payout/v1/requestTransfer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.VITE_CF_APP_ID,
        "x-client-secret": process.env.VITE_CF_SECRET,
      },
      body: JSON.stringify({
        batchTransferId: transferId,
        transfers: [{
          transferId, amount: amount.toString(), remarks,
          bankAccount: "", ifsc: "", vpa: upiId,
          name: "ChessBet Winner", phone: "9999999999",
        }],
      }),
    }
  );
  const data = await response.json();
  res.status(200).json(data);
}