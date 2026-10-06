export function getHealthHandler(req, res) {
  return res.json({
    success: true,
    data: {
      service: "smartpakcoy-backend",
      status: "UP",
      timestamp: new Date().toISOString()
    }
  });
}