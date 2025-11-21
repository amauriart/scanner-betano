const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "URL ausente" });

    const resposta = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const texto = await resposta.text();
    res.set("Content-Type", "application/json");
    res.send(texto);

  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;
