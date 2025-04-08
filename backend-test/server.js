const express = require('express');
const app = express();

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('✅ Test Node server is running on Cloud Run!');
});

app.listen(PORT, () => {
  console.log(`🚀 Test server is listening on port ${PORT}`);
});
