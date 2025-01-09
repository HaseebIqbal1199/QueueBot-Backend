const express = require("express");
const app = express();
const cors = require("cors")

//  Port
const PORT = 3200;

// Cors
app.use(cors())

// History
let History = [
    {
        role: "user",
        parts: [{ text: "hi" }],
    },
    {
        role: "model",
        parts: [{ text: "Hi there! How can I help you today?\n" }],
    },
]

// Gemini Configuration
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyCIguS-YbBV11IFJljEw6al3npiO0sBUT0";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function generateOutput(question) {
  const chatSession = model.startChat({
    generationConfig,
    history: History
  });

  const result = await chatSession.sendMessage(question);
  console.log(result.response.text());
  return result.response.text()
}

// routers

app.get('/',(req,res)=>{
    res.send("An api for personal Chatbot made by Haseeb iqbal")
})

app.get("/queuebot", async (req, res) => {
    try {
        const question = req.query.question
        console.log(question);
        result = await generateOutput(question)
        History.push(
            {
                role: "user",
                parts: [{ text: question }],
            },
            {
                role: "model",
                parts: [{ text: result }],
            }
        )
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send("An error occured!")  
    }
    
});

app.listen(PORT, () => {
  console.log("Running at http://" + PORT);
});
