// Import dependencies
const express = require('express');
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const uuidv4 = require('uuid').v4;
const { storeData, getData } = require('./storeData');

const app = express();
const port = 8080;

// Setup multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Maximum file size 1MB
}).single('image');

// Load TensorFlow Lite model
let model;
async function loadModel() {
  model = await tf.loadLayersModel('https://storage.googleapis.com/tomato-models-tani/TaniPredict_tomat.tflite');
  console.log('Model loaded successfully');
}
loadModel();

// POST /predict endpoint
app.post('/predict', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'fail',
        message: 'Payload content length greater than maximum allowed: 1000000',
      });
    }

    if (err) {
      return res.status(400).json({
        status: 'fail',
        message: 'Error uploading image',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No image found in the request',
      });
    }

    try {
      // Decode and preprocess image
      const imageBuffer = req.file.buffer;
      const imageTensor = tf.node.decodeImage(imageBuffer)
        .resizeBilinear([150, 150]) // Resize to 150x150 as per model requirements
        .expandDims(0)
        .toFloat()
        .div(255.0); // Normalize pixel values to [0, 1]

      console.log('Image Tensor Shape:', imageTensor.shape);

      // Perform prediction
      const predictionTensor = model.predict(imageTensor);
      const predictionArray = await predictionTensor.data();

      // Extract prediction results
      const confidenceScore = predictionArray[0];
      const threshold = 0.5; // Classification threshold
      const isAboveThreshold = confidenceScore > threshold;

      // Create prediction result data
      const predictionData = {
        id: uuidv4(),
        result: isAboveThreshold ? 'Cancer' : 'Non-cancer',
        confidenceScore: confidenceScore.toFixed(4),
        isAboveThreshold,
        createdAt: new Date().toISOString(),
      };

      console.log('Prediction Data:', predictionData);

      // Save to Firestore
      await storeData(predictionData.id, predictionData);

      // Respond with success
      return res.status(201).json({
        status: 'success',
        message: 'Prediction successful',
        data: predictionData,
      });
    } catch (error) {
      console.error('Prediction Error:', error);
      return res.status(400).json({
        status: 'fail',
        message: 'Error performing prediction',
      });
    }
  });
});

// GET / endpoint
app.get('/', (req, res) => {
  res.send('Server is running successfully!');
});

// GET /predict/histories endpoint
app.get('/predict/histories', async (req, res) => {
  try {
    const histories = await getData();
    const formattedHistories = histories.map((history) => ({
      id: history.id,
      result: history.result,
      confidenceScore: history.confidenceScore,
      isAboveThreshold: history.isAboveThreshold,
      createdAt: history.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedHistories,
    });
  } catch (error) {
    console.error('Error fetching prediction histories:', error);
    return res.status(400).json({
      status: 'fail',
      message: 'Error fetching prediction histories',
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
