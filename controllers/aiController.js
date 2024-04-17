/***************************************
 *  This Controller is used to handle the
 *  API requests to the OpenAI API
 * ************************************/
const axios = require("axios");

const getPlantDescription = async (req, res) => {
  const url = process.env.AI_URL;
  const plant = req.params.plantName;

  console.log(plant);

  const aiQuery = `Provide me description of ${plant} in 2 sentences or less.`;
  // const vagueness = vaguenessInput.value;

  const messages = [
    {
      role: "system",
      content:
        "Hello, I am a chatbot assistant. I can help you with any gardening problems you may have. Please describe your problem below.",
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

module.exports = { getPlantDescription };
