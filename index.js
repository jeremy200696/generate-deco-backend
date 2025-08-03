require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// Route GET pour test
app.get('/api/generate-deco', (req, res) => {
  res.json({ message: "Serveur OK, méthode POST attendue pour la génération d'image." });
});

// Route POST pour upload et appel IA
app.post('/api/generate-deco', upload.single('photo'), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const photoPath = req.file.path;
    const photoData = fs.readFileSync(photoPath, { encoding: 'base64' });

    // Utilise le modèle Replicate "fran6ton/room-transformation"
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "b617c04a32c2a7e45fdc307a2ae61c75fdfc34cdbe3820b6a01f1ad760f288ee", // version du modèle "fran6ton/room-transformation"
        input: {
          image: `data:image/jpeg;base64,${photoData}`,
          prompt: prompt,
        }
      },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // Attendre le résultat (boucle jusqu'à l'image générée)
    let prediction = response.data;
    let imageUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const getRes = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          }
        }
      );
      if(getRes.data.status === "succeeded" && getRes.data.output){
        imageUrl = Array.isArray(getRes.data.output) ? getRes.data.output[0] : getRes.data.output;
        break;
      }
      if(getRes.data.status === "failed") break;
    }
    await fs.unlink(photoPath); // Supprime l'image temporaire

    if(imageUrl){
      res.json({ image_url: imageUrl });
    }else{
      res.status(500).json({ error: "Erreur génération image IA." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
