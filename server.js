const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors()); // Allows all origins

app.use(express.json());

app.post('/api/prompts', async (req, res) => {
  try {
    const response = await fetch('https://extensions.aitopia.ai/ai/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If the real API requires any auth headers, add them here
      },
      body: JSON.stringify(req.body),
    });

    // Forward the response from the API
    const data = await response.json();

    // Add CORS headers to your response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.json(data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
