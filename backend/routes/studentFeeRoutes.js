const express = require('express');
const router = express.Router();
const {
  getStudentFees, getStudentFee, createStudentFee,
  updateStudentFee, deleteStudentFee
} = require('../controllers/studentFeeController');
const { protect } = require('../middleware/auth');
const { studentFeeValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/', getStudentFees);
router.get('/:id', mongoIdValidator, getStudentFee);
router.post('/', studentFeeValidator, createStudentFee);
router.put('/:id', mongoIdValidator, updateStudentFee);
router.delete('/:id', mongoIdValidator, deleteStudentFee);

module.exports = router;
