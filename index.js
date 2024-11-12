require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Define Mongoose Schema and Model
const historySchema = new mongoose.Schema({
  prompt: String,
  response: String,
  date: { type: Date, default: Date.now },
});
const History = mongoose.model('History', historySchema);

// Google Generative AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Route to generate content and save to history
app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  try {
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save prompt and response to MongoDB
    const newHistory = new History({ prompt, response: responseText });
    await newHistory.save();

    res.json(responseText);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('Failed to generate content');
  }
});

// Route to get history
app.get('/history', async (req, res) => {
  try {
    const history = await History.find().sort({ date: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send('Failed to fetch history');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
