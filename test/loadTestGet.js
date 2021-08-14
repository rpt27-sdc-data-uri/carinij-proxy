import http from 'k6/http';

export let options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 500,
      maxVUs: 5000,
    },
  },
};

const getRandom = (max) => {
  return (Math.floor(Math.random() * max));
}

export default function () {
  const id = getRandom(10000000);
  http.get(`http://localhost:5500/?bookId=${id}`)
}