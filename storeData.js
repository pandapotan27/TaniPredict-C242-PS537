const { firestore } = require('./firebase.js');

async function storeData(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID provided to storeData');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided to storeData');
  }

  try {
    // Menyimpan data prediksi ke dalam koleksi 'predictions' di Firestore
    await firestore.collection('predictions').doc(id).set({
      result: data.result, // Nama penyakit yang diprediksi
      confidenceScore: data.confidenceScore, // Skor kepercayaan
      isAboveThreshold: data.isAboveThreshold, // Menyatakan apakah hasil prediksi melebihi threshold
      createdAt: new Date().toISOString(), // Timestamp saat data disimpan
    });
    console.log(`Data with ID ${id} successfully saved to Firestore`);
  } catch (error) {
    console.error(`Error saving data to Firestore (ID: ${id}):`, error.message);
    throw error;
  }
}

async function getData() {
  try {
    // Mengambil semua data prediksi dari koleksi 'predictions'
    const snapshot = await firestore.collection('predictions').get();
    if (snapshot.empty) {
      console.log('No data found in Firestore');
      return [];
    }

    // Mengembalikan data prediksi dalam format yang lebih mudah dipahami
    return snapshot.docs.map(doc => ({
      id: doc.id,
      result: doc.data().result,
      confidenceScore: doc.data().confidenceScore,
      isAboveThreshold: doc.data().isAboveThreshold,
      createdAt: doc.data().createdAt,
    }));
  } catch (error) {
    console.error('Error fetching data from Firestore:', error.message);
    throw error;
  }
}

module.exports = { storeData, getData };
