const { getTaggedPlant, addOrUpdateTag, deleteTag, getAllTags } = require('../../controllers/dataController');
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
    // Mock table creation first, then the actual query
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation (ensureTagMappingsTableExists)
      .mockResolvedValueOnce([{ plant_id: 33 }]); // Actual query

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ plantId: 33 });
  });

  it('should return 404 if tag is not found', async () => {
    // Mock table creation first, then the actual query
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation (ensureTagMappingsTableExists)
      .mockResolvedValueOnce([]); // Actual query (empty result)

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tag not found' });
  });

  it('should return 500 for a database error', async () => {
    const errorMessage = 'Database connection error';
    // Mock table creation first, then reject the actual query
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation (ensureTagMappingsTableExists)
      .mockRejectedValueOnce(new Error(errorMessage)); // Actual query fails

    await getTaggedPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server Connection Error: Failed to fetch data from the the Database',
    });
  });
});

describe('addOrUpdateTag', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { tagId: 'tag-001', plantId: 33 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new tag mapping', async () => {
    // Mock table creation and check for existing tag (empty result)
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce([]) // Check if tag exists (empty = new tag)
      .mockResolvedValueOnce({ insertId: 1 }); // Insert new tag

    await addOrUpdateTag(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Tag mapping added successfully',
      tagId: 'tag-001',
      plantId: 33,
    });
  });

  it('should update an existing tag mapping', async () => {
    // Mock table creation and existing tag
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce([{ tag_id: 'tag-001', plant_id: 25 }]) // Existing tag
      .mockResolvedValueOnce({ affectedRows: 1 }); // Update result

    await addOrUpdateTag(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Tag mapping updated successfully',
      tagId: 'tag-001',
      plantId: 33,
    });
  });

  it('should return 400 if tagId is missing', async () => {
    req.body = { plantId: 33 }; // Missing tagId

    await addOrUpdateTag(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Both tagId and plantId are required',
    });
  });

  it('should return 400 if plantId is missing', async () => {
    req.body = { tagId: 'tag-001' }; // Missing plantId

    await addOrUpdateTag(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Both tagId and plantId are required',
    });
  });
});

describe('deleteTag', () => {
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

  it('should delete a tag mapping successfully', async () => {
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce({ affectedRows: 1 }); // Delete result

    await deleteTag(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Tag mapping deleted successfully',
      tagId: 'tag-001',
    });
  });

  it('should return 404 if tag to delete is not found', async () => {
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce({ affectedRows: 0 }); // No rows affected

    await deleteTag(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tag not found' });
  });
});

describe('getAllTags', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all tag mappings', async () => {
    const mockTags = [
      { id: 1, tag_id: 'tag-001', plant_id: 33 },
      { id: 2, tag_id: 'tag-002', plant_id: 25 },
    ];

    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce(mockTags); // Get all tags

    await getAllTags(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTags);
  });

  it('should return empty array if no tags exist', async () => {
    dbQueryPromise
      .mockResolvedValueOnce([]) // Table creation
      .mockResolvedValueOnce([]); // Empty result

    await getAllTags(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
