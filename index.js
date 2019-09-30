const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const client = redis.createClient({
    host: 'redis',
    port: '6379',
});

client.on('error', (err) => {
    console.log("Error " + err)
});

const PORT = 3000;

const app = express();

app.get('/no-cache', (req, res) => {
    fetch('https://elections-stage-s3-euw1.s3.eu-west-1.amazonaws.com/query/elections/55/summary/summaryAllParties.json')
        .then(res => res.json())
        .then(json => res.send(json));
});

app.get('/with-cache', (req, res) => {
    // "elections:55:summary" is the key I save election 55 summary under
    return client.get('elections:55:summary', (err, summary) => {

        // If the key exists and we got data back, just return it
        if (summary) {
            return res.send(JSON.parse(summary));
        }

        // else we need to go and fetch the summary from S3 and save it for future requests
        fetch('https://elections-stage-s3-euw1.s3.eu-west-1.amazonaws.com/query/elections/55/summary/summaryAllParties.json')
            .then(res => res.json())
            .then(json => {
                // Saving it under the key, 
                client.setex('elections:55:summary', 10, JSON.stringify(json));

                res.send(json);
            });
    });
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
