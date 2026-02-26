const allRoles = {
    admin: [
        'getUsers',
        'manageUsers',

        'getEmployees',
        'manageEmployees',
        'managePayroll',

        'getProjects',
        'manageProjects',

        'getTimesheets',
        'manageTimesheets',
        'approveTimesheets',

        'getMaterials',
        'manageMaterials',
        'approveMaterials',

        'getExpenses',
        'manageExpenses',
        'approveExpenses',

        'getIncidents',
        'manageIncidents',

        'getDocuments',
        'manageDocuments',

        'getSuppliers',
        'manageSuppliers',

        'getReports',
        'manageReports',

        'getActivityLogs',

        'getNotifications',
        'manageNotifications',
    ],

    manager: [
        'getEmployees',
        'manageEmployees',
        'managePayroll',

        'getProjects',
        'manageProjects',

        'getTimesheets',
        'manageTimesheets',
        'approveTimesheets',

        'getMaterials',
        'manageMaterials',
        'approveMaterials',

        'getExpenses',
        'manageExpenses',
        'approveExpenses',

        'getIncidents',
        'manageIncidents',

        'getDocuments',
        'manageDocuments',

        'getSuppliers',
        'manageSuppliers',

        'getReports',

        'getNotifications',
    ],

    supervisor: [
        'getEmployees',

        'getProjects',

        'getTimesheets',
        'manageTimesheets',
        'approveTimesheets',

        'getMaterials',
        'manageMaterials',

        'getExpenses',
        'manageExpenses',

        'getIncidents',
        'manageIncidents',

        'getDocuments',
        'manageDocuments',

        'getSuppliers',

        'getReports',

        'getNotifications',
    ],

    employee: [
        'getProjects',

        'getTimesheets',
        'manageTimesheets',

        'getMaterials',

        'getIncidents',
        'manageIncidents',

        'getDocuments',

        'getNotifications',
    ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
    roles,
    roleRights,
};