import express from 'express';
import processRouter from './api/process';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/process', processRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 