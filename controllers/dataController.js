const axios = require("axios");

//Handle API request to Fruit viceAPI - REQUEST ALL FRUITS
const getAllFruit = async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.fruityvice.com/api/fruit/all"
    );
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch data from the Fruityvice API");
  }
};

//Handle API request to Fruit viceAPI - REQUEST ALL FRUITS
const getFruitByName = async (req, res) => {
  const fruitName = req.params.name;
  try {
    const response = await axios.get(
      `https://www.fruityvice.com/api/fruit/${fruitName}`
    );
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch data from the Fruityvice API");
  }
};

module.exports = {
  getAllFruit,
  getFruitByName,
};
