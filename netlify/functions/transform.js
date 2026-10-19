const STYLES = {
  cartoon: "Transform the uploaded photo into a beautiful 2D animated cartoon illustration.",
  "3d": "Transform the uploaded photo into a polished 3D animated film illustration.",
  fairytale: "Transform the uploaded photo into a magical storybook illustration."
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { image, style = "cartoon" } = JSON.parse(event.body || "{}");
    if (!image || typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Fotografie invalidă." }) };
    }
    if (image.length > 7_000_000) {
      return { statusCode: 413, body: JSON.stringify({ error: "Fotografia este prea mare." }) };
    }
    if (!STYLES[style]) {
      return { statusCode: 400, body: JSON.stringify({ error: "Stil invalid." }) };
    }
    if (!process.env.OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Cheia AI nu este configurată." }) };
    }

    const bytes = Buffer.from(image.split(",")[1], "base64");
    const mime = image.slice(5, image.indexOf(";"));
    const form = new FormData();
    form.append("model", "gpt-image-1-mini");
    form.append("prompt", STYLES[style] + " Preserve the people's identities, facial features, eye colors, hairstyles, and composition. Do not add or remove people. Keep the result family-friendly.");
    form.append("size", "1024x1024");
    form.append("image", new Blob([bytes], { type: mime }), "photo.png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: form
    });
    
const raw = await response.text();
let result;

try {
  result = JSON.parse(raw);
} catch (error) {
  console.error(
    "Raspuns invalid de la API:",
    response.status,
    raw.slice(0, 300)
  );

  return {
    statusCode: 502,
    body: JSON.stringify({
      error: "Serviciul AI a trimis un raspuns invalid."
    })
  };
}
  
    if (!response.ok) {
      console.error("OpenAI image error:", response.status, result.error?.code);
      return { statusCode: 502, body: JSON.stringify({ error: "Nu am putut genera imaginea. Încearcă din nou." }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "data:image/png;base64," + result.data[0].b64_json })
    };
  } catch (error) {
    console.error("Transform error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "A apărut o eroare." }) };
  }
};
