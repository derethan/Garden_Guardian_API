/***************************************
 *  This Controller is used to handle the
 *  API requests to the OpenAI API
 * ************************************/

//Import the OpenAI Library
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Import the Axios library
const axios = require("axios");

// Cache to store the responses from the AI
const cache = {};

const getPlantDescription = async (req, res) => {
  const url = process.env.AI_URL;
  const plant = req.params.plantName;

  const aiQuery = `Provide me description of ${plant} in 2 sentences or less.`;
  // const vagueness = vaguenessInput.value;

  const messages = [
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

  //Make an API call to OpenAI with Axios
  const data = {
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: 0.1,
  };

  const headers = {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  };

  try {
    const response = await axios.post(url, data, { headers: headers });

    responseMessage = response.data.choices[0].message.content;
    res.status(200).json(responseMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    });
  }
}; // end of getPlantDescription

//Function to Generate Plant infromation for user Added Plants
const generatePlantInfo = async (req, res) => {
  //Format the request to lowercase for consistency
  const plant = req.body.plantName ? req.body.plantName.toLowerCase() : null;
  const variety = req.body.variety ? req.body.variety.toLowerCase() : null;

  const properties = req.body.properties;
  // Check if the request is already in the cache
  const cacheKey = `${plant}-${variety}`;

  if (cache[cacheKey]) {
    res.status(200).json(cache[cacheKey]);
    return;
  }

  if (!plant) {
    res.status(201).json({ error: "Plant name is required" });
    return;
  }

  try {
    // Query the OpenAI API for the requested properties
    const responseInfo = await queryAIForPlantInfo(plant, variety, properties);

    // Check if the response was "no information available"  - AI could not find any information
    if (responseInfo.Description === "no information available") {
      console.log("No information available");

      cache[cacheKey] = "No information available";
      res.status(201).json("No information available");
      return;
    }

    // Cache the response
    cache[cacheKey] = responseInfo;

    // Send the response to the client
    res.status(200).json(responseInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Connection Error: Failed to connect to the OpenAI API",
    });
  }
}; // end of generatePlantInfo

// Function to Query the OpenAI API for Specific Plant Properties
// Take In: Plant Name, Variety, and Property Titles
// Return: Plant Information for the requested properties
const queryAIForPlantInfo = async (plant, variety, properties) => {
  // Make a request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a Expert Gardner,  Farmer and Instructor designed to output JSON",
      },
      {
        role: "user",
        content: `What can you tell me about the following properties for the plant ${plant}${
          variety ? ` , variety ${variety}` : ""
        }?
            
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

  // Extract the response from the completion
  const responseInfo = JSON.parse(completion.choices[0].message.content);
  return responseInfo;
};

module.exports = { getPlantDescription, generatePlantInfo, queryAIForPlantInfo };
