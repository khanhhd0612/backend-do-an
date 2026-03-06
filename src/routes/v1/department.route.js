const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const departmentValidation = require('../../validations/department.validation');
const departmentController = require('../../controllers/department.controller');

const router = express.Router();

router.post('/', auth('manageDepartments'), validate(departmentValidation.createDepartment), departmentController.createDepartment);

router.get('/:departmentId', auth(), validate(departmentValidation.getDepartments), departmentController.getDepartments);

router.get('/:departmentId', auth(), validate(departmentValidation.getDepartment), departmentController.getDepartment);

router.patch('/:departmentId', auth('manageDepartments'), validate(departmentValidation.updateDepartment), departmentController.updateDepartment);

router.delete('/:departmentId', auth('manageDepartments'), validate(departmentValidation.deleteDepartment), departmentController.deleteDepartment);

router.patch('/:departmentId/manager', auth('manageDepartments'), validate(departmentValidation.assignManager), departmentController.assignManager);

router.get('/:departmentId/employees', auth(), validate(departmentValidation.getDepartment), departmentController.getEmployeesByDepartment);

module.exports = router;