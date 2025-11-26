console.log('Starting debug phase 2...');
try {
    require('dotenv').config();
    const express = require('express');
    const cors = require('cors');
    const Groq = require('groq-sdk');
    
    console.log('API Key present:', !!process.env.GROQ_API_KEY);
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('Groq initialized');

    const app = express();
    app.use(cors());
    app.use(express.json());
    console.log('Express app created');

    const port = 3001;
    const server = app.listen(port, () => {
        console.log(`Debug server running on port ${port}`);
        server.close();
        console.log('Debug server closed');
    });

} catch (e) {
    console.error('Error in phase 2:', e);
}
