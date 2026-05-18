const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const app = require('./app');
const { startKpiBonusProcessor } = require('./controllers/kpi.controller');

dotenv.config();

const startServer = async () => {
  await connectDB();
  startKpiBonusProcessor();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = app;