require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("🔍 Checking available Gemini models...");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Error fetching models: ${response.status}`);
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    if (data.models) {
      console.log("✅ Available Models:");
      data.models.forEach((m) => {
        // Filter only generateContent supported models
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("⚠️ No models found in response.");
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

listModels();
