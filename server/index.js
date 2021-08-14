require('dotenv').config()
const express = require('express');
const path = require('path');
const axios = require('axios');
const compression = require('compression');
const app = express();
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('./s3-connect.js');
require('newrelic');

const port = 5500;
console.log(process.env.TITLE_SERVER_URL);
const priceServer = process.env.PRICE_SERVER_URL;
const titleServer = process.env.TITLE_SERVER_URL;
const reviewsServer = process.env.REVIEWS_SERVER_URL;
// const summaryServer = 'http://ec2-18-188-135-5.us-east-2.compute.amazonaws.com:1220';
// const aggServer = 'http://ec2-18-220-21-137.us-east-2.compute.amazonaws.com:2880';
// const alsoEnjoyedServer = 'http://ec2-35-162-103-218.us-west-2.compute.amazonaws.com:4000';

app.use(compression());
const oneDay = 60*60*24;
app.use(express.static(path.join(__dirname, '..', '/public'), {
  maxage: oneDay
}));

const setCache = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-control', `public, max-age=${oneDay}`);
  } else {
    res.set('Cache-control', 'no-store');
  }
  next();
};

app.use(setCache);

app.get('/files/:fileName', async (req, res) => {
  const fileName = req.params.fileName;
  let key;
  if (!fileName) {
    res.end();
  }
  if (fileName.split('.')[1] === 'js') {
    key = 'scripts/' + fileName;
  } else if (fileName === 'style.css') {
    key = 'styles/summary-styles/style.css';
  } else if (fileName === 'styles.css') {
    key = 'styles/price-styles/styles.css';
  } else {
    res.end();
  }

  const readFile = async (key) => {
    const convertToStr = (stream) => {
      return new Promise((resolve, reject) => {
        let data = [];
        stream.on('data', (chunk) => data.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(data).toString('utf8')));
      });
    }

    try {
      // data returned as readable string
      const data = await s3.send(new GetObjectCommand({Bucket: 'rpt27-fec-audible', Key: key}));

      const readData = await convertToStr(data.Body);
      return readData;
    } catch (err) {
      console.log("Error! with getting file ", key, err);
    }
  };

  const file = await readFile(key);
  res.send(file);

});


app.all('/api/price/*', (req, res) => {
  const url = (priceServer + req.path).trim();
  console.log('proxying request to price server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});
app.all('/api/book/*', (req, res) => {
  const url = (titleServer + req.path).trim();
  console.log('proxying request to title server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});
app.all('/api/books', (req, res) => {
  const url = (titleServer + req.path).trim();
  console.log('proxying request to title server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});
app.all('/reviews/*', (req, res) => {
  const bookId = req.path.split('/')[2];
  const url = (reviewsServer + bookId + '/reviews/').trim();
  console.log('proxying request to reviews server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    })
    .catch(err => {
      console.error('fetch for reviews failed!', err.statusCode);
    });
});
app.all('/api/summary/*', (req, res) => {
  const url = (summaryServer + req.path).trim();
  console.log('proxying request to summary server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});
app.all('/api/aggReview/*', (req, res) => {
  const url = (aggServer + req.path).trim();
  console.log('proxying request to aggregate review server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});
app.all('/api/relatedIds/*', (req, res) => {
  const url = (alsoEnjoyedServer + req.path).trim();
  console.log('proxying request to also enjoyed server with method', req.method, 'directed to', url);
  axios({
    method: req.method,
    url: url
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    });
});


app.listen(port, () => {
  console.log(`Proxy listening on http://localhost:${port}`)
})