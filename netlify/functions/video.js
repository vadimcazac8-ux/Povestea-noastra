const API = "https://agents.lumalabs.ai/v1/generations";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  const reply = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod === "OPTIONS") {
    return reply(200, {});
  }

  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Use POST" });
  }

  const key = process.env.LUMA_API_KEY;

  if (!key) {
    return reply(500, {
      error: "LUMA_API_KEY lipseste din Netlify"
    });
  }

  try {
    const input = JSON.parse(event.body || "{}");

    if (input.action === "status") {
      const id = input.id;

      if (!/^[0-9a-f-]{36}$/i.test(id || "")) {
        return reply(400, { error: "ID invalid" });
      }

      const response = await fetch(
        `${API}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${k