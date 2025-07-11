import { Request, Response } from 'express';
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache: { [key: string]: any } = {};

const generatePlantDescription = async (req: Request, res: Response) => {
  const url: string = process.env.AI_URL as string;
  const plant: string = req.params.plant as string;

  if (!plant) {
    res.status(400).json({ error: "Plant name is required" });
    return;
  }

  const aiQuery: string = `Provide me description of ${plant} in 2 sentences or less.`;

  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content:
        "Hello, I am a Gardening Expert. I can help you with any gardening problems you may have. Please describe your problem below.",
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

  let responseMessage: string;

  try {
    const response = await axios.post(url, data, { headers: headers });
    responseMessage = response.data.choices[0].message.content;
    res.status(200).json(responseMessage);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    });
  }

  const { queryPlantDetails, updatePlantDescription } = require("./dataController");

  const plantDetails = await queryPlantDetails(plant);

  const plantDesc: string | null = plantDetails[0] ? plantDetails[0].description : null;

  if (!plantDesc) {
    updatePlantDescription(plant, responseMessage).then((response: any) => {
      if (response) {
        console.log("Plant Description Added Successfully");
      } else {
        console.log("Failed to add Plant Description");
      }
    });
  }
};

const generatePlantInfo = async (req: Request, res: Response) => {
  const plantName: string | null = req.body.plantName ? req.body.plantName.toLowerCase() : null;
  const varietyName: string | null = req.body.varietyName ? req.body.varietyName.toLowerCase() : null;
  const PlantProperties: any = req.body.plantProperties;

  const cacheKey: string = `${plantName}-${varietyName}`;

  if (cache[cacheKey]) {
    return res.status(200).json(cache[cacheKey]);
  }

  if (!plantName) {
    res.status(400).json({ error: "Plant name is required" });
    return;
  }

  try {
    const responseInfo: any = await queryAIForPlantInfo(plantName, varietyName, PlantProperties);

    if (responseInfo.Description === "no information available") {
      cache[cacheKey] = "No information available";
      return res.status(201).json("No information available");
    }

    cache[cacheKey] = responseInfo;

    res.status(200).json(responseInfo);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    });
  }
};

const queryAIForPlantInfo = async (plant: string | null, variety: string | null, properties: any) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a Expert Agronomist, Farmer and Gardner designed to output JSON",
      },
      {
        role: "user",
        content: `What can you tell me about the following properties for the plant ${plant}
        ${variety ? ` , variety ${variety}` : ""}?

            ${properties.map((property: any) => {
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

  const responseInfo = JSON.parse(completion.choices[0].message.content);
  return responseInfo;
};

export {
  generatePlantDescription,
  generatePlantInfo,
  queryAIForPlantInfo,
};