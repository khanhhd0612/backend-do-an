const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const timesheetValidation = require('../../validations/timesheet.validation');
const timesheetController = require('../../controllers/timesheet.controller');

const router = express.Router();

router.get('/', auth('getTimesheets'), validate(timesheetValidation.getTimesheets), timesheetController.getTimesheets);

router.post('/', auth('manageTimesheets'), validate(timesheetValidation.createTimesheet), timesheetController.createTimesheet);

router.get('/pending', auth('approveTimesheets'), timesheetController.getPendingApproval);

router.get('/stats', auth('getTimesheets'), validate(timesheetValidation.getTimesheetStats), timesheetController.getTimesheetStats);

router.get('/employee/:employeeId', auth('getTimesheets'), validate(timesheetValidation.getTimesheetsByEmployee), timesheetController.getTimesheetsByEmployee);

router.get('/employee/:employeeId/summary', auth('getTimesheets'), validate(timesheetValidation.getEmployeeSummary), timesheetController.getEmployeeSummary);

router.get('/project/:projectId', auth('getTimesheets'), validate(timesheetValidation.getTimesheetsByProject), timesheetController.getTimesheetsByProject);

router.get('/:timesheetId', auth('getTimesheets'), validate(timesheetValidation.getTimesheet), timesheetController.getTimesheet);

router.patch('/:timesheetId', auth('manageTimesheets'), validate(timesheetValidation.updateTimesheet), timesheetController.updateTimesheet);

router.delete('/:timesheetId', auth('manageTimesheets'), validate(timesheetValidation.deleteTimesheet), timesheetController.deleteTimesheet);

router.patch('/:timesheetId/check-in', auth('manageTimesheets'), validate(timesheetValidation.checkIn), timesheetController.checkIn);

router.patch('/:timesheetId/check-out', auth('manageTimesheets'), validate(timesheetValidation.checkOut), timesheetController.checkOut);

router.patch('/:timesheetId/submit', auth('manageTimesheets'), validate(timesheetValidation.submitTimesheet), timesheetController.submitTimesheet);

router.patch('/:timesheetId/approve', auth('approveTimesheets'), validate(timesheetValidation.approveTimesheet), timesheetController.approveTimesheet);

router.patch('/:timesheetId/reject', auth('approveTimesheets'), validate(timesheetValidation.rejectTimesheet), timesheetController.rejectTimesheet);

router.post('/bulk-approve', auth('approveTimesheets'), validate(timesheetValidation.bulkApprove), timesheetController.bulkApprove);

module.exports = router;