const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const employeeValidation = require('../../validations/employee.validation');
const employeeController = require('../../controllers/employee.controller');

const router = express.Router();

router.get('/', auth('getEmployees'), validate(employeeValidation.getEmployees), employeeController.getEmployees);

router.get('/stats', auth('manageEmployees'), employeeController.getEmployeeStats);

router.post('/', auth('manageEmployees'), validate(employeeValidation.createEmployee), employeeController.createEmployee);

router.get('/certifications/expiring', auth('getEmployees'), validate(employeeValidation.getExpiringCertifications), employeeController.getExpiringCertifications);

router.get('/department/:department', auth('getEmployees'), employeeController.getEmployeesByDepartment);

router.get('/:employeeId', auth('getEmployees'), validate(employeeValidation.getEmployee), employeeController.getEmployee);

router.patch('/:employeeId', auth('manageEmployees'), validate(employeeValidation.updateEmployee), employeeController.updateEmployee);

router.delete('/:employeeId', auth('manageEmployees'), validate(employeeValidation.deleteEmployee), employeeController.deleteEmployee);

router.delete('/:employeeId/hard', auth('manageEmployees'), validate(employeeValidation.deleteEmployee), employeeController.hardDeleteEmployee);

router.patch('/:employeeId/status', auth('manageEmployees'), validate(employeeValidation.updateEmployeeStatus), employeeController.updateEmployeeStatus);

router.get('/department/:department', auth('getEmployees'), employeeController.getEmployeesByDepartment);

router.get('/:employeeId/salary', auth('managePayroll'), validate(employeeValidation.getEmployee), employeeController.getSalaryInfo);

router.patch('/:employeeId/salary', auth('managePayroll'), validate(employeeValidation.updateSalary), employeeController.updateSalary);

router.post('/:employeeId/skills', auth('manageEmployees'), validate(employeeValidation.addSkill), employeeController.addSkill);

router.patch('/:employeeId/skills/:skillName', auth('manageEmployees'), validate(employeeValidation.updateSkill), employeeController.updateSkill);

router.delete('/:employeeId/skills/:skillName', auth('manageEmployees'), validate(employeeValidation.removeSkill), employeeController.removeSkill);

router.post('/:employeeId/certifications', auth('manageEmployees'), validate(employeeValidation.addCertification), employeeController.addCertification);

router.delete('/:employeeId/certifications/:certName', auth('manageEmployees'), validate(employeeValidation.removeCertification), employeeController.removeCertification);

router.get('/:employeeId/projects', auth('getEmployees'), validate(employeeValidation.getEmployee), employeeController.getActiveProjects);

router.post('/:employeeId/projects', auth('manageEmployees'), validate(employeeValidation.assignToProject), employeeController.assignToProject);

router.delete('/:employeeId/projects/:projectId', auth('manageEmployees'), validate(employeeValidation.unassignFromProject), employeeController.unassignFromProject);

module.exports = router;