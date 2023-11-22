const chai = require('chai');
const supertest = require('supertest');
const app = require('../src/app');
const { expect } = chai;

describe('URL Shortener API', () => {
  it('should shorten a URL', async () => {
    const res = await supertest(app)
      .post('/api/shorten')
      .send({ url: 'https://www.example.com/long/url/path' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('shortenedUrl');
  });

  it('should redirect to the original URL', async () => {
    const shortenRes = await supertest(app)
      .post('/api/shorten')
      .send({ url: 'https://www.example.com/long/url/path' });

    const shortCode = shortenRes.body.shortenedUrl.split('/').pop();
    const redirectRes = await supertest(app).get(`/${shortCode}`);

    expect(redirectRes.status).to.equal(302); // 302 is the status code for redirection
  });

  // Add more test cases as needed
});
