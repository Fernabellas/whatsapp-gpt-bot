const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Tu número de prueba o real de WhatsApp
const WHATSAPP_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Endpoint para recibir mensajes de WhatsApp
app.post('/webhook', (req, res) => {
  try {
    console.log('Mensaje entrante:', req.body);

    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return res.sendStatus(200); // nada que procesar
    }

    const from = message.from;
    const text = message.text?.body || '';

    console.log(Mensaje de ${from}: ${text});

    // Llamada a OpenAI para generar respuesta
    axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: text }]
      },
      {
        headers: {
          'Authorization': Bearer ${OPENAI_API_KEY},
          'Content-Type': 'application/json'
        }
      }
    )
    .then(openaiRes => {
      const reply = openaiRes.data.choices[0].message.content;
      console.log('Respuesta generada:', reply);

      // Enviar respuesta a WhatsApp
      axios.post(
        https://graph.facebook.com/v22.0/${WHATSAPP_NUMBER_ID}/messages,
        {
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: reply }
        },
        {
          headers: {
            'Authorization': Bearer ${WHATSAPP_TOKEN},
            'Content-Type': 'application/json'
          }
        }
      ).catch(err => console.error('Error enviando mensaje:', err));

    }).catch(err => console.error('Error OpenAI:', err));

    res.sendStatus(200);

  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Endpoint para verificación de webhook (GET)
app.get('/webhook', (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(Servidor corriendo en el puerto ${PORT});
});
