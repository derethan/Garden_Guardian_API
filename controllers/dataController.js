const axios = require("axios");

const apiKey = process.env.TREFLE_API_KEY;

//Handle API request to Fruit viceAPI - REQUEST ALL FRUITS
const getAllFruit = async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.fruityvice.com/api/fruit/all"
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Server Connection Error: Failed to fetch data from the Fruityvice API",
    });
  }
};

//Handle API request to Fruit viceAPI - REQUEST FRUIT BY NAME
const getFruitByName = async (req, res) => {
  const fruitName = req.params.name;
  try {
    const response = await axios.get(
      `https://www.fruityvice.com/api/fruit/${fruitName}`
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({
        error: `Fruit not found: ${fruitName}, Please enter a valid fruit name in the URL. Example: /fruit/apple"`,
      });
    } else {
      res.status(500).json({
        error:
          "Server Connection Error: Failed to fetch data from the Fruityvice API",
      });
    }
  }
};

const getAllPlants = async (req, res) => {
  const enpoint = "https://trefle.io/api/v1/plants?token=" + apiKey;

  try {
    const response = await axios.get(enpoint);

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Server Connection Error: Failed to fetch data from the Trefle API",
    });
  }
};

const getEdiblePlants = async (req, res) => {
    const { page = 1 } = req.query;

  const enpoint =
    `https://trefle.io/api/v1/plants?filter_not%5Bedible_part%5D=null&page=${page}&token=` +
    apiKey;

  try {
    const response = await axios.get(enpoint);

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Server Connection Error: Failed to fetch data from the Trefle API",
    });
  }
};

module.exports = {
  getAllFruit,
  getFruitByName,
  getAllPlants,
  getEdiblePlants,
};
