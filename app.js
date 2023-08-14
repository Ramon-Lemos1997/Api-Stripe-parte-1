require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const apiRouter = require('./routes/apiRouter');


app.use(cors('*'));
app.use(express.json());
app.use('/api', apiRouter);


app.listen(process.env.PORT, () => {
  console.log('Server running');
});
PORT=3002
