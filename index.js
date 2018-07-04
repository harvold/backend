const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const apiRouter = require('./app/router');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.listen(PORT, () => { console.log(`Server listening on http://localhost:${PORT}`) });
