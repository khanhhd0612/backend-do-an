const express = require('express');
const validate = require('../../middlewares/validate');
const projectController = require('../../controllers/project.controller');
const projectValidation = require('../../validations/project.validation');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/', auth('manageProjects'), validate(projectValidation.createProject), projectController.createProject);

router.get('/', auth('getProjects'), validate(projectValidation.listProjects), projectController.getAllProjects);

router.get('/active', auth('getProjects'), projectController.getActiveProjects);

router.get('/upcoming-deadlines', auth('getProjects'), projectController.getUpcomingDeadlines);

router.get('/search', auth('getProjects'), projectController.searchProjects);

router.get('/status/:status', auth('getProjects'), validate(projectValidation.getProject), projectController.getProjectsByStatus);

router.get('/:projectId/stats', auth('getProjects'), validate(projectValidation.getProject), projectController.getProjectStats);

router.get('/:projectId/team', auth('getProjects'), validate(projectValidation.getProject), projectController.getProjectTeamMembers);

router.get('/:projectId/stages', auth('getProjects'), validate(projectValidation.getProject), projectController.getProjectStages);

router.get('/:projectId', auth('getProjects'), validate(projectValidation.getProject), projectController.getProjectById);

router.put('/:projectId', auth('manageProjects'), validate(projectValidation.updateProject), projectController.updateProjectById);

router.patch('/:projectId/progress', auth('manageProjects'), validate(projectValidation.updateProgress), projectController.updateProgress);

router.patch('/:projectId/expense', auth('manageProjects'), validate(projectValidation.updateActualExpense), projectController.updateActualExpense);

router.patch('/:projectId/status', auth('manageProjects'), validate(projectValidation.updateProjectStatus), projectController.updateProjectStatus);

router.delete('/:projectId', auth('manageProjects'), validate(projectValidation.deleteProject), projectController.deleteProjectById);

router.post('/:projectId/team', auth('manageProjects'), validate(projectValidation.addTeamMember), projectController.addTeamMember);

router.delete('/:projectId/team/:employeeId', auth('manageProjects'), validate(projectValidation.removeTeamMember), projectController.removeTeamMember);

router.post('/:projectId/stages', auth('manageProjects'), validate(projectValidation.addStage), projectController.addStage);

router.put('/:projectId/stages/:stageIndex', auth('manageProjects'), validate(projectValidation.updateStage), projectController.updateStage);

router.patch('/:projectId/stages/:stageIndex/complete', auth('manageProjects'), validate(projectValidation.completeStage), projectController.completeStage);

router.delete('/:projectId/stages/:stageIndex', auth('manageProjects'), projectController.removeStage);

module.exports = router;