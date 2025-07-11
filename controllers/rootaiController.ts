import { Request, Response } from 'express';
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache: { [key: string]: any } = {};

interface ChatMessage {
  role: string;
  content: string;
}

const chatWithRootAI = async (req: Request, res: Response) => {
  console.log("Chat with Root AI");
  const userMessage: string = req.body.message;
  let conversation: ChatMessage[] = req.body.conversation || [];
  console.log("conversation:", conversation);

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (Array.isArray(conversation[0])) {
    conversation = conversation.flat() as ChatMessage[];
  }

  const result = await QueryAIWithQuestion(userMessage, conversation);

  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({
    message: result.message,
    conversation: result.conversation,
    needsMoreInfo: result.needsMoreInfo,
  });
};

const QueryAIWithQuestion = async (message: string, conversation: ChatMessage[] = []): Promise<{ message?: string; conversation?: ChatMessage[]; needsMoreInfo?: boolean; error?: string }> => {
  const url: string = process.env.AI_URL as string;
  console.log("QueryAIWithQuestion called with message:", message);

  if (conversation.length === 0) {
    conversation.push({
      role: "system",
      content: `You are Root AI, a helpful Agronomist, Farmer and Gardening expert. 
      You will provide helpful, concise responses to user questions. 
      When you need more information to answer a question, your response must ALWAYS include, I need more information. 
      If you need more information, then ask the user for specific details.`,
    });
  }

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
    const responseMessage: string = response.data.choices[0].message.content.trim();
    console.log("Received response from OpenAI:", responseMessage);

    conversation.push({
      role: "assistant",
      content: responseMessage,
    });

    const needsMoreInfo: boolean = isAssistantAskingForMoreInfo(responseMessage);

    return {
      message: responseMessage,
      conversation: conversation,
      needsMoreInfo: needsMoreInfo,
    };
  } catch (error: any) {
    console.error("Error connecting to OpenAI API:", error);
    return {
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    };
  }
};

const isMessageRelated = async (message: string): Promise<boolean> => {
  const url: string = process.env.AI_URL as string;

  console.log("isMessageRelated called with message:", message);

  const messages: ChatMessage[] = [
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
    const answer: string = response.data.choices[0].message.content.trim().toLowerCase();
    console.log("Received response from OpenAI:", answer);
    return answer === "yes";
  } catch (error: any) {
    console.error("Error connecting to OpenAI API:");
    return false;
  }
};

const isAssistantAskingForMoreInfo = (assistantMessage: string): boolean => {
  const questionIndicators: string[] = [
    "i need more information",
  ];
  const lowerCaseMessage: string = assistantMessage.toLowerCase();
  return questionIndicators.some((phrase) => lowerCaseMessage.includes(phrase));
};

export {
  chatWithRootAI,
};