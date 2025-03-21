const express = require("express");
const app = express();
const cors = require("cors")
const env = require("dotenv")
const openai = require("openai")

// env Config
env.config();

//  Port
const PORT = process.env.PORT || 3000;

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemma-3-27b-it",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Novita Setup
const OpenAi = new openai({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: process.env.NOVITA_API_KEY,
})
const stream = false; // set it true if you want streaming

async function generateOutput(question, Model) {
  if (Model == "Gemma") {
    const chatSession = model.startChat({
      generationConfig,
      history: History
    });

    const result = await chatSession.sendMessage(question);
    console.log("Gemma responded with an output!");
    return result.response.text()
  }

  if (Model === "Deepseek_r1") {
    const completion = await OpenAi.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Be a helpful assistant",
        },
        {
          role: "user",
          content: question,
        },
      ],
      model: "deepseek/deepseek-r1-turbo",
      stream,
      response_format: { type: "text" },
      max_tokens: 2048,
      temperature: 1,
      top_p: 1,
      min_p: 0,
      top_k: 50,
      presence_penalty: 0,
      frequency_penalty: 0,
      repetition_penalty: 1
    });

    return completion;
  }

  console.log("Invalid Model");
  return false;
}

// routers
app.get('/',(req,res)=>{
    res.send("An api for personal Chatbot made by Haseeb iqbal")
})

app.get("/queuebotapi/gemma", async (req, res) => {
    try {
        const question = req.query.question
        result = await generateOutput(question, "Gemma")
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

app.get('/queuebotapi/deepseek/r1', async(req, res, next)=>{
  const question = req.query.question
  console.log("Question received: ", question);
  
  try{
    const deepseek_response = await generateOutput(question, "Deepseek_r1")
    const response_txt = deepseek_response.choices[0].message.content;
    const parsed_response = response_txt.match(/<think>(.*?)<\/think>/)
    if (stream) {
      for await (const chunk of deepseek_response) {
        if (chunk.choices[0].finish_reason) {
          console.log(chunk.choices[0].finish_reason);
        } else {
          console.log(chunk.choices[0].delta.content);
        }
      }
    } else {
      console.log(JSON.stringify(deepseek_response));
    }
    console.log(response_txt);
    
    res.send(response_txt)
  }
  catch(err){
    console.log("Error Occurred with Novita!")
  }
})

app.listen(PORT, () => {
  console.log("Running at http://" + PORT);
});
