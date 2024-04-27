/***************************************
 *  This Controller is used to handle the API requests
 *  To the Different API Endpoints for Plant Information.
 *
 * The API requests are made to the following APIs:
 * 1. Fruityvice API - Used to get information about fruits
 * 2. Trefle API - Used to get information about plants
 * 3.  GG Database - Used to store information about plants
 * ************************************/

/***************************************
 *  Import Required Libraries
 * ************************************/
const axios = require("axios");
const apiKey = process.env.TREFLE_API_KEY;

/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js


/************************************************************
 *  Functions to Add/Remove/Update Plants in the GG Database
 * ***********************************************************/
const getAllPlants = async (req, res) => {
  const SQL = `SELECT * FROM plants`;

  try {
    const response = await dbQueryPromise(SQL);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Server Connection Error: Failed to fetch data from the the Database",
    });
  }
};

// TODO: Add Function to Add new plant to the Database
const addPlant = async (req, res) => {
  const plant = req.body;

  const SQL = `INSERT INTO plants (label, common_name, scientific_name, description, howtoSow, spacing, harvestTime, growsWith, avoid, cooking, preserving, img) VALUES ?`;
  const values = [
    plant.label,
    plant.common_name,
    plant.scientific_name,
    plant.variety,
    plant.description,
    plant.howtoSow,
    plant.spacing,
    plant.harvestTime,
    plant.growsWith,
    plant.avoid,
    plant.cooking,
    plant.preserving,
    plant.img,
  ];

  try {
    console.log("data added to database");
  } catch (error) {
    console.error(error);
  }
};

/***************************************
 *  Functions to Handle API Requests to Trefle API
 * ************************************/

const getAllTrufflePlants = async (req, res) => {
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

const getPlantsByName = async (req, res) => {
  const plantName = req.params.name;

  const enpoint =
    `https://trefle.io/api/v1/plants/${plantName}?token=` + apiKey;

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

/***************************************
 * Functions to Handle API Requests to Fruiyvice API
 *
 * TODO - Incoroprate into local DB if needed
 * ************************************/
//Handle API request to Fruit viceAPI - REQUEST ALL FRUITS
// const getAllFruit = async (req, res) => {
//   try {
//     const response = await axios.get(
//       "https://www.fruityvice.com/api/fruit/all"
//     );

//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error:
//         "Server Connection Error: Failed to fetch data from the Fruityvice API",
//     });
//   }
// };

module.exports = {
  getAllPlants,
  getAllTrufflePlants,
  getEdiblePlants,
  getPlantsByName,
};
