const express = require('express');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

// Route POST pour recevoir le prompt et générer l'image IA
app.post('/api/generate-inspiration', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Aucun prompt fourni.' });
    }

    // 1. Appel HuggingFace API (Stable Diffusion)
    const hfRes = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!hfRes.ok) {
      return res.status(500).json({ error: 'Erreur génération IA.' });
    }
    const arrayBuffer = await hfRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 2. Upload vers ImgBB
    const form = new FormData();
    form.append('image', imageBuffer.toString('base64'));

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: form
    });

    const imgbbJson = await imgbbRes.json();
    if (!imgbbJson.success) {
      return res.status(500).json({ error: 'Erreur upload ImgBB.' });
    }

    // 3. Retourner l'URL directe à Wix
    const imageUrl = imgbbJson.data.url;
    return res.json({ imageUrl });

  } catch (err) {
    console.error('Erreur serveur :', err);
    return res.status(500).json({ error: 'Erreur serveur générale.' });
  }
});

// Route GET test
app.get('/', (req, res) => {
  res.json({ message: "Serveur backend IA prêt !" });
});

// Démarrage serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Serveur IA écoute sur le port', PORT);
});
