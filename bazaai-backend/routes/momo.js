const express = require("express");
const router = express.Router();
const axios = require("axios");

// Demo MoMo token endpoint
router.post("/token", async (req, res) => {
  try {
    const { clientId, clientSecret } = process.env; // set in .env
    const resp = await axios.post(
      "https://sandbox.momodeveloper.mtn.com/collection/token/",
      {},
      {
        auth: { username: clientId, password: clientSecret },
        headers: { "Ocp-Apim-Subscription-Key": process.env.MOMO_KEY },
      }
    );
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example: request payment
router.post("/pay", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    // Implement payment request to MTN MoMo API
    res.json({ status: "success", phone, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
