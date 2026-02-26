const express = require('express');
const authRoute = require('./auth.route');
const projectRoute = require('./project.route');
const employeeRoute = require('./employee.route');
const timesheetRoute = require('./timesheet.route');
const payrollRoute = require('./payroll.route');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/projects',
        route: projectRoute,
    },
    {
        path: '/employees',
        route: employeeRoute,
    },
    {
        path: '/timesheets',
        route: timesheetRoute,
    },
    {
        path: '/payrolls',
        route: payrollRoute,
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
