/***************************************
 *  This Controller is used to handle the
 *  API requests to the OpenAI API for Root AI Based Chat Queries
 * ************************************/
const axios = require("axios");

//Import the OpenAI Library
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = {};

/***************************************
 * ROUTE HANDLERS
 * ************************************/

//Function to Initiate a Chat with Root AI
const chatWithRootAI = async (req, res) => {
  console.log("Chat with Root AI");
  const userMessage = req.body.message;
  let conversation = req.body.conversation || [];
  console.log("conversation:", conversation);

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Flatten the conversation array if it's nested
  if (Array.isArray(conversation[0])) {
    conversation = conversation.flat();
  }

  // if (conversation.length === 0) {
  //   // Check if the message is related to gardening, farming, or agriculture
  //   const isRelated = await isMessageRelated(userMessage);
  //   console.log("isMessageRelated result:", isRelated);

  //   if (!isRelated) {
  //     return res.status(200).json({
  //       message:
  //         "Sorry, I can only assist with gardening, farming, or agriculture-related questions.",
  //     });
  //   }
  // }

  const result = await QueryAIWithQuestion(userMessage, conversation);

  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  // Send back the assistant's message and the updated conversation
  return res.status(200).json({
    message: result.message,
    conversation: result.conversation,
    needsMoreInfo: result.needsMoreInfo,
  });
}; // end of chatWithRootAI

/***************************************
 * HELPER FUNCTIONS
 * ************************************/

//Function to Chat with the Root AI
const QueryAIWithQuestion = async (message, conversation = []) => {
  const url = process.env.AI_URL;
  console.log("QueryAIWithQuestion called with message:", message);

  // initialize the conversation if it's empty
  if (conversation.length === 0) {
    conversation.push({
      role: "system",
      content: `You are Root AI, a helpful Agronomist, Farmer and Gardening expert. 
      You will provide helpful, concise responses to user questions. 
      When you need more information to answer a question, ask the user for specific details.`,
    });
  }

  // Add the user's message to the conversation
  conversation.push({
    role: "user",
    content: message,
  });

  const data = {
    model: "gpt-3.5-turbo",
    messages: conversation,
    temperature: 0.1,
  };

  const headers = {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  };

  try {
    console.log("Sending request to OpenAI with data:", data);
    const response = await axios.post(url, data, { headers: headers });
    const responseMessage = response.data.choices[0].message.content.trim();
    console.log("Received response from OpenAI:", responseMessage);

    // Add the AI's response to the conversation
    conversation.push({
      role: "assistant",
      content: responseMessage,
    });

    //Check if the AI is asking for more information
    const needsMoreInfo = isAssistantAskingForMoreInfo(responseMessage);

    return {
      message: responseMessage,
      conversation: conversation,
      needsMoreInfo: needsMoreInfo,
    };
  } catch (error) {
    console.error("Error connecting to OpenAI API:", error);
    return {
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    };
  }
};

// Helper function to check if the message is related to gardening, farming, or agriculture
const isMessageRelated = async (message) => {
  const url = process.env.AI_URL;

  console.log("isMessageRelated called with message:", message);

  const messages = [
    {
      role: "system",
      content:
        "Determine if the user's question is related to gardening, farming, or agriculture. Respond with 'Yes' or 'No' only.",
    },
    {
      role: "user",
      content: `Is the following question related to gardening, farming, or agriculture? "${message}"`,
    },
  ];

  const data = {
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0,
  };

  const headers = {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  };

  try {
    console.log("Sending request to OpenAI with data:", data);
    const response = await axios.post(url, data, { headers: headers });
    const answer = response.data.choices[0].message.content.trim().toLowerCase();
    console.log("Received response from OpenAI:", answer);
    return answer === "yes";
  } catch (error) {
    console.error("Error connecting to OpenAI API:");
    return false; // Default to false if there's an error
  }
};

// Helper function to determine if the assistant is asking for more information
const isAssistantAskingForMoreInfo = (assistantMessage) => {
  // Simple heuristic to check if the assistant is asking for more information
  const questionIndicators = [
    "could you",
    "please provide",
    "can you",
    "do you",
    "would you",
    "what",
    "which",
    "when",
    "where",
    "who",
    "why",
    "how",
  ];
  const lowerCaseMessage = assistantMessage.toLowerCase();
  return questionIndicators.some((phrase) => lowerCaseMessage.includes(phrase));
};

module.exports = {
  chatWithRootAI,
};
