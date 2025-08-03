require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// --- Route GET pour vérifier que le serveur tourne ---
app.get('/api/generate-deco', (req, res) => {
  res.json({ message: "Serveur OK, méthode POST attendue pour la génération d'image." });
});

// --- Route POST pour l'upload (sera utilisée par ton formulaire plus tard) ---
app.post('/api/generate-deco', upload.single('photo'), async (req, res) => {
  res.json({ image_url: "https://www.monpetitcarreau.fr/images/placeholder.png" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
