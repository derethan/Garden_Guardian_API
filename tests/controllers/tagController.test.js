const { getTaggedPlant } = require('../../controllers/dataController');
const dbQueryPromise = require('../../db/dbConnect');

jest.mock('../../db/dbConnect');

describe('getTaggedPlant', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tagId: 'tag-001' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return plantId for a valid tagId', async () => {
    dbQueryPromise.mockResolvedValueOnce([{ plant_id: 33 }]);

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ plantId: 33 });
    expect(dbQueryPromise).toHaveBeenCalledWith(
      'SELECT plant_id FROM tag_mappings WHERE tag_id = ?',
      ['tag-001']
    );
  });

  it('should return 404 if tag is not found', async () => {
    dbQueryPromise.mockResolvedValueOnce([]);

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tag not found' });
    expect(dbQueryPromise).toHaveBeenCalledWith(
      'SELECT plant_id FROM tag_mappings WHERE tag_id = ?',
      ['tag-001']
    );
  });

  it('should return 500 for a database error', async () => {
    const errorMessage = 'Database connection error';
    dbQueryPromise.mockRejectedValueOnce(new Error(errorMessage));

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server Connection Error: Failed to fetch data from the the Database',
    });
    expect(dbQueryPromise).toHaveBeenCalledWith(
      'SELECT plant_id FROM tag_mappings WHERE tag_id = ?',
      ['tag-001']
    );
  });
});
