const { Firestore } = require('@google-cloud/firestore');

// Pastikan kredensial Anda valid dan berada di lokasi yang benar
const firestore = new Firestore({
  projectId: 'submissionmlgc-panda-444213', // ID proyek Anda
  keyFilename: './tomato-key.json', // Pastikan path ke file kredensial benar
});

module.exports = { firestore };
