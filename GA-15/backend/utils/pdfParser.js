const pdfParse = require('pdf-parse');

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('Error parsing PDF', err);
    return '';
  }
};

module.exports = { extractTextFromPDF };
