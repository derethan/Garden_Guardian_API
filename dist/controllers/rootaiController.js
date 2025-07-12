"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithRootAI = void 0;
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const cache = {};
const chatWithRootAI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Chat with Root AI");
    const userMessage = req.body.message;
    let conversation = req.body.conversation || [];
    console.log("conversation:", conversation);
    if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
    }
    if (Array.isArray(conversation[0])) {
        conversation = conversation.flat();
    }
    const result = yield QueryAIWithQuestion(userMessage, conversation);
    if (result.error) {
        return res.status(500).json({ error: result.error });
    }
    return res.status(200).json({
        message: result.message,
        conversation: result.conversation,
        needsMoreInfo: result.needsMoreInfo,
    });
});
exports.chatWithRootAI = chatWithRootAI;
const QueryAIWithQuestion = (message_1, ...args_1) => __awaiter(void 0, [message_1, ...args_1], void 0, function* (message, conversation = []) {
    const url = process.env.AI_URL;
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
        const response = yield axios_1.default.post(url, data, { headers: headers });
        const responseMessage = response.data.choices[0].message.content.trim();
        console.log("Received response from OpenAI:", responseMessage);
        conversation.push({
            role: "assistant",
            content: responseMessage,
        });
        const needsMoreInfo = isAssistantAskingForMoreInfo(responseMessage);
        return {
            message: responseMessage,
            conversation: conversation,
            needsMoreInfo: needsMoreInfo,
        };
    }
    catch (error) {
        console.error("Error connecting to OpenAI API:", error);
        return {
            error: "Server Connection Error: Failed to connect to the OpenAI API",
        };
    }
});
const isMessageRelated = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const url = process.env.AI_URL;
    console.log("isMessageRelated called with message:", message);
    const messages = [
        {
            role: "system",
            content: "Determine if the user's question is related to gardening, farming, or agriculture. Respond with 'Yes' or 'No' only.",
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
        const response = yield axios_1.default.post(url, data, { headers: headers });
        const answer = response.data.choices[0].message.content.trim().toLowerCase();
        console.log("Received response from OpenAI:", answer);
        return answer === "yes";
    }
    catch (error) {
        console.error("Error connecting to OpenAI API:");
        return false;
    }
});
const isAssistantAskingForMoreInfo = (assistantMessage) => {
    const questionIndicators = [
        "i need more information",
    ];
    const lowerCaseMessage = assistantMessage.toLowerCase();
    return questionIndicators.some((phrase) => lowerCaseMessage.includes(phrase));
};
