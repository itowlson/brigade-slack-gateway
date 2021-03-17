import * as express from 'express';

const app = express();
const port = 13033;

app.get('/', (_req, res) => {
    res.send('Hello world!!!');
});

app.listen(port, () => {
    console.log('listening');
});
