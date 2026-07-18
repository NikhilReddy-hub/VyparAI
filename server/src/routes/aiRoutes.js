const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists inside the server directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.use(protect);

router.post('/brain', aiController.askBrain);
router.get('/health', aiController.getDailyHealthScore);
router.get('/insights', aiController.getGrowthInsights);
router.post('/purchase-plan', aiController.getPurchasePlan);
router.get('/voice-summary', aiController.getVoiceCallSummary);
router.post('/chat', aiController.chat);

router.post('/shelf-scan', upload.single('image'), aiController.shelfScan);
router.post('/ocr-invoice', upload.single('image'), aiController.importSupplierInvoice);

module.exports = router;
