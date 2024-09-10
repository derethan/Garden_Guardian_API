const { addPlant } = require("../../controllers/dataController");
const dbQueryPromise = require("../db/dbConnect");

// Use Jest to mock the dbQueryPromise function
jest.mock("../db/dbConnect");

describe("dataController", () => {
  test("addPlant function -  It should return a 201 status code", async () => {

    // Mock the request and response objects
    const req = {
      body: {
        plant: "tomato",
        variety: "roma",
        properties: [
          {
            title: "Description",
            value: "",
          },
          {
            title: "Harvest Time",
            value: "",
          },
          {
            title: "How to Sow",
            value: "",
          },
          {
            title: "Spacing",
            value: "",
          },
          {
            title: "Grows Well With",
            value: "",
          },
          {
            title: "Avoid Planting With",
            value: "",
          },
        ],
      },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    dbQueryPromise.mockResolvedValueOnce({
      rows: [
        {
          plant: "tomato",
          variety: "roma",
            properties: [
                {
                title: "Description",
                value: "",
                },
                {
                title: "Harvest Time",
                value: "",
                },
                {
                title: "How to Sow",
                value: "",
                },
                {
                title: "Spacing",
                value: "",
                },
                {
                title: "Grows Well With",
                value: "",
                },
                {
                title: "Avoid Planting With",
                value: "",
                },
            ],
        },
      ],
    });

    await addPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// describe('dataController', () => {

//     test ('adds 1 + 2 to equal 3', () => {
//         expect(1 + 2).toBe(3);
//     });

//     test ('adds 2 + 2 to equal 4', () => {
//         expect(2 + 2).toBe(4);
//     });

// });
