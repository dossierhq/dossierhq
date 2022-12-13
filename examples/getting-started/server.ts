import express from 'express';

const app = express();
const port = 3000;

app.get('/api/hello-world', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.listen(port, () => {
  console.log(`Listening on  http://localhost:${port}`);
});
