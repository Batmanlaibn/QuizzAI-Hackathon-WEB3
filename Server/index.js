require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/quiz', async (req, res) => {
    try {
        const rulePath = path.join(__dirname, 'AI', 'Rule.txt');
        const systemPrompt = fs.readFileSync(rulePath, 'utf8');

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: "Generate a new quiz."
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const quizContent = completion.choices[0]?.message?.content;
        
        if (!quizContent) {
            throw new Error("No content received from AI");
        }

        const quizJson = JSON.parse(quizContent);
        res.json(quizJson);

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
