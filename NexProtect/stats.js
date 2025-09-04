let totalRequests = 0;

export default function handler(req, res) {
  totalRequests++; // her API çağrısı +1
  res.status(200).json({ totalRequests });
}
