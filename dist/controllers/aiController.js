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
exports.queryAIForPlantInfo = exports.generatePlantInfo = exports.generatePlantDescription = void 0;
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const cache = {};
const generatePlantDescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = process.env.AI_URL;
    const plant = req.params.plant;
    if (!plant) {
        res.status(400).json({ error: "Plant name is required" });
        return;
    }
    const aiQuery = `Provide me description of ${plant} in 2 sentences or less.`;
    const messages = [
        {
            role: "system",
            content: "Hello, I am a Gardening Expert. I can help you with any gardening problems you may have. Please describe your problem below.",
        },
        {
            role: "user",
            content: aiQuery,
        },
    ];
    const data = {
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.1,
    };
    const headers = {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    };
    let responseMessage = "";
    try {
        const response = yield axios_1.default.post(url, data, { headers: headers });
        responseMessage = response.data.choices[0].message.content;
        res.status(200).json(responseMessage);
        // Only process plant description if we got a valid response
        const { queryPlantDetails, updatePlantDescription } = require("./dataController");
        const plantDetails = yield queryPlantDetails(plant);
        const plantDesc = plantDetails[0] ? plantDetails[0].description : null;
        if (!plantDesc && responseMessage) {
            updatePlantDescription(plant, responseMessage).then((response) => {
                if (response) {
                    console.log("Plant Description Added Successfully");
                }
                else {
                    console.log("Failed to add Plant Description");
                }
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server Connection Error: Failed to connect to the OpenAI API",
        });
    }
});
exports.generatePlantDescription = generatePlantDescription;
const generatePlantInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plantName = req.body.plantName ? req.body.plantName.toLowerCase() : null;
    const varietyName = req.body.varietyName ? req.body.varietyName.toLowerCase() : null;
    const PlantProperties = req.body.plantProperties;
    const cacheKey = `${plantName}-${varietyName}`;
    if (cache[cacheKey]) {
        return res.status(200).json(cache[cacheKey]);
    }
    if (!plantName) {
        res.status(400).json({ error: "Plant name is required" });
        return;
    }
    try {
        const responseInfo = yield queryAIForPlantInfo(plantName, varietyName, PlantProperties);
        if (responseInfo.Description === "no information available") {
            cache[cacheKey] = "No information available";
            return res.status(201).json("No information available");
        }
        cache[cacheKey] = responseInfo;
        res.status(200).json(responseInfo);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server Connection Error: Failed to connect to the OpenAI API",
        });
    }
});
exports.generatePlantInfo = generatePlantInfo;
const queryAIForPlantInfo = (plant, variety, properties) => __awaiter(void 0, void 0, void 0, function* () {
    const completion = yield openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a Expert Agronomist, Farmer and Gardner designed to output JSON",
            },
            {
                role: "user",
                content: `What can you tell me about the following properties for the plant ${plant}
        ${variety ? ` , variety ${variety}` : ""}?

            ${properties.map((property) => {
                    return property.title + " ";
                })}

            maintain the property names and values in the same order as the input.

            If you don't have information about the plant or variety, please respond with "no information available"
            `,
            },
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" },
    });
    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error("No content received from OpenAI API");
    }
    const responseInfo = JSON.parse(content);
    return responseInfo;
});
exports.queryAIForPlantInfo = queryAIForPlantInfo;
