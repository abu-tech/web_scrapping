const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const url = 'https://www.nobroker.in/flats-for-sale-in-koramangala_bangalore';

const fetchPropertyDetails = async (propertyUrl) => {
  try {
    const propertyResponse = await axios.get(propertyUrl);
    if (propertyResponse.status === 200) {
      const propertyHtml = propertyResponse.data;
      const property$ = cheerio.load(propertyHtml);
      const propertyAge = property$('.nb__33JWL').find('div:first-child').next().find('div:first-child').find('div:last-child').find('h5').text();

      return propertyAge;
    }
  } catch (error) {
    console.log(`Error fetching property details: ${error}`);
  }
};

const scrapeWebsite = async () => {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);
      const propertiesDetails = [];

      const propertyPromises = $('.infinite-scroll-component article').map(async (index, element) => {
        const url = $(element).find('section:first-child').find('div:first-child').find('h2').find('a').attr('href');
        const area = $(element).find('section:first-child').find('div:first-child').find('span:first-child').next().find('div:first-child').text();
        const propertyUrl = `https://www.nobroker.in${url}`;

        const propertyAge = await fetchPropertyDetails(propertyUrl);

        const detail = {
          area: area,
          url: url,
          propertyAge: propertyAge
        };
        propertiesDetails.push(detail);
      }).get();

      await Promise.all(propertyPromises);
      console.log(propertiesDetails);

      // Writing data to CSV
      const csvWriter = createCsvWriter({
        path: 'property_details.csv',
        header: [
          { id: 'area', title: 'Area' },
          { id: 'url', title: 'URL' },
          { id: 'propertyAge', title: 'Property Age' }
        ]
      });

      await csvWriter.writeRecords(propertiesDetails);
      console.log('CSV file created successfully.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

scrapeWebsite();

