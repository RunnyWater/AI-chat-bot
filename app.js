const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();

app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './views/index.html'));
    });


app.post('/', (req, res) => {
    const query = req.body.aiInput;
    console.log(query);

    // redirect to AI

    res.send("TODO: link to AI");
});
