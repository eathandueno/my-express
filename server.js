import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = 3001;
const openai = new OpenAI({apiKey:process.env.OPENAI_API_KEY})
dotenv.config()
app.use(cors());
app.use(express.json());

app.post('/generate', async (req, res) => {
    try {
        const topic = req.body;
        const completion = await openai.chat.completions.create({
            messages: [{"role":"user","content":topic}],
            model: "gpt-3.5-turbo"
        });
        const response = completion.choices[0].message.content;
        res.json({message: response})
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Something went wrong'})
    }
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });