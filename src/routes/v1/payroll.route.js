const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const payrollValidation = require('../../validations/payroll.validation');
const payrollController = require('../../controllers/payroll.controller');

const router = express.Router();

router.get('/', auth('managePayroll'), validate(payrollValidation.getPayrolls), payrollController.getPayrolls);
router.post('/', auth('managePayroll'), validate(payrollValidation.createPayroll), payrollController.createPayroll);
router.post('/bulk', auth('managePayroll'), validate(payrollValidation.bulkCreatePayroll), payrollController.bulkCreatePayroll);
router.post('/bulk-confirm', auth('managePayroll'), validate(payrollValidation.bulkConfirmPayroll), payrollController.bulkConfirmPayroll);

router.get('/period', auth('managePayroll'), validate(payrollValidation.getPayrollsByPeriod), payrollController.getPayrollsByPeriod);
router.get('/stats', auth('managePayroll'), validate(payrollValidation.getPeriodStats), payrollController.getPeriodStats);
router.get('/employee/:employeeId', auth('managePayroll'), validate(payrollValidation.getPayrollsByEmployee), payrollController.getPayrollsByEmployee);

router.get('/:payrollId', auth('managePayroll'), validate(payrollValidation.getPayroll), payrollController.getPayroll);
router.patch('/:payrollId', auth('managePayroll'), validate(payrollValidation.updatePayroll), payrollController.updatePayroll);
router.patch('/:payrollId/recalculate', auth('managePayroll'), validate(payrollValidation.getPayroll), payrollController.recalculatePayroll);
router.patch('/:payrollId/confirm', auth('managePayroll'), validate(payrollValidation.confirmPayroll), payrollController.confirmPayroll);
router.patch('/:payrollId/pay', auth('managePayroll'), validate(payrollValidation.markAsPaid), payrollController.markAsPaid);
router.patch('/:payrollId/cancel', auth('managePayroll'), validate(payrollValidation.cancelPayroll), payrollController.cancelPayroll);

module.exports = router;