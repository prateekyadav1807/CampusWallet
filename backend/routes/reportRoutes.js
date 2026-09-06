const express = require('express');
const router  = express.Router();
const {
  getReports, generateReport,
  downloadReport, viewReport, deleteReport,
} = require('../controllers/reportController');
const { protect }          = require('../middleware/auth');
const { mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/',                          getReports);
router.post('/generate',                 generateReport);
router.get('/:id/download', mongoIdValidator, downloadReport);   // forces Save-As
router.get('/:id/view',     mongoIdValidator, viewReport);       // opens inline
router.delete('/:id',       mongoIdValidator, deleteReport);

module.exports = router;
