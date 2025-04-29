import express from 'express';
import { LogProcessor } from '../../src/lib/processors/LogProcessor';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const processor = new LogProcessor();
    const entries = await processor.processFile(req.body);
    res.json(entries);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'An error occurred while processing the file'
    });
  }
});

export default router; 