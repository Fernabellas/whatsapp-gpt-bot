const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "norvant_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Verificación del webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body;

      // Enviar texto a OpenAI
      const gptResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente profesional para Norvant Valle, especializado en hospedaje en Valle de Guadalupe.",
            },
            { role: "user", content: text },
          ],
        },
        {
          headers: {
            Authorization: Bearer ${OPENAI_API_KEY},
            "Content-Type": "application/json",
          },
        }
      );

      const reply =
        gptResponse.data.choices[0].message.content;

      // Enviar respuesta a WhatsApp
      await axios.post(
        https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: reply },
        },
        {
          headers: {
            Authorization: Bearer ${WHATSAPP_TOKEN},
            "Content-Type": "application/json",
          },
        }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});
