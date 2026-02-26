const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const projectSchema = mongoose.Schema(
    {
        projectCode: {
            type: String,
            required: [true, 'Mã dự án là bắt buộc'],
            unique: [true, 'Mã dự án đã tồn tại'],
            trim: true,
            uppercase: true,
            validate: {
                validator: function (v) {
                    return /^PRJ-\d{4}-\d{3}$/.test(v);
                },
                message: 'Mã dự án phải theo format: PRJ-YYYY-XXX'
            }
        },

        projectName: {
            type: String,
            required: [true, 'Tên dự án là bắt buộc'],
            trim: true,
            minlength: [5, 'Tên dự án phải ít nhất 5 ký tự'],
            maxlength: [200, 'Tên dự án không quá 200 ký tự']
        },

        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Mô tả không quá 1000 ký tự']
        },

        location: {
            address: {
                type: String,
                required: [true, 'Địa chỉ là bắt buộc'],
                trim: true
            },
            district: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            coordinates: {
                lat: {
                    type: Number,
                    min: [-90, 'Latitude không hợp lệ'],
                    max: [90, 'Latitude không hợp lệ']
                },
                lng: {
                    type: Number,
                    min: [-180, 'Longitude không hợp lệ'],
                    max: [180, 'Longitude không hợp lệ']
                }
            }
        },

        client: {
            name: {
                type: String,
                required: [true, 'Tên khách hàng là bắt buộc'],
                trim: true
            },
            contactPerson: String,
            phone: String,
            email: String
        },

        projectManager: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true
        },

        supervisors: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User'
            }
        ],

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (v) {
                    return v > this.startDate;
                },
                message: 'Ngày kết thúc phải sau ngày bắt đầu'
            }
        },

        estimatedDuration: {
            type: Number,
            required: true
        },

        budget: {
            estimatedBudget: {
                type: Number,
                required: true,
                min: 0
            },
            approvedBudget: {
                type: Number,
                required: true,
                min: 0
            },
            actualExpense: {
                type: Number,
                default: 0,
                min: 0
            },
            currency: {
                type: String,
                enum: ['VND', 'USD', 'EUR'],
                default: 'VND'
            }
        },

        status: {
            type: String,
            enum: ['planning', 'in_progress', 'completed', 'paused', 'cancelled'],
            default: 'planning'
        },

        progress: {
            percentage: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            lastUpdated: {
                type: Date,
                default: Date.now
            }
        },

        stages: [
            {
                stageName: {
                    type: String,
                    required: true,
                    trim: true
                },
                startDate: Date,
                endDate: Date,
                status: {
                    type: String,
                    enum: ['pending', 'in_progress', 'completed', 'delayed'],
                    default: 'pending'
                },
                progress: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100
                }
            }
        ],

        team: [
            {
                employee: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'Employee'
                },
                role: String,
                joinDate: {
                    type: Date,
                    default: Date.now
                },
                leaveDate: Date
            }
        ],

        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

projectSchema.index({ projectCode: 1 }, { unique: true });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

projectSchema.plugin(toJSON);
projectSchema.plugin(paginate);


projectSchema.virtual('budgetRemaining').get(function () {
    return this.budget.approvedBudget - this.budget.actualExpense;
});

projectSchema.virtual('daysRemaining').get(function () {
    const today = new Date();
    const daysLeft = Math.ceil((this.endDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
});

projectSchema.statics.isProjectCodeTaken = async function (projectCode, excludeProjectId) {
    const project = await this.findOne({
        projectCode,
        _id: { $ne: excludeProjectId }
    });
    return !!project;
};

projectSchema.statics.findByStatus = async function (status) {
    return await this.find({ status }).populate('projectManager', 'name email');
};

projectSchema.statics.findByProjectManager = async function (managerId) {
    return await this.find({ projectManager: managerId });
};

projectSchema.statics.findActiveProjects = async function () {
    return await this.find({ status: 'in_progress' });
};

projectSchema.methods.addTeamMember = async function (employeeId, role) {
    this.team.push({ employee: employeeId, role });
    return await this.save();
};

projectSchema.methods.removeTeamMember = async function (employeeId) {
    this.team = this.team.filter(m => m.employee.toString() !== employeeId.toString());
    return await this.save();
};

projectSchema.methods.updateProgress = async function (percentage) {
    this.progress.percentage = percentage;
    this.progress.lastUpdated = new Date();
    return await this.save();
};

projectSchema.methods.updateActualExpense = async function (amount) {
    this.budget.actualExpense = amount;
    return await this.save();
};

projectSchema.methods.addStage = async function (stageData) {
    this.stages.push(stageData);
    return await this.save();
};

projectSchema.methods.updateStage = async function (stageIndex, updateData) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
        throw new Error('Giai đoạn không tồn tại');
    }
    Object.assign(this.stages[stageIndex], updateData);
    return await this.save();
};

projectSchema.methods.completeStage = async function (stageIndex) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
        throw new Error('Giai đoạn không tồn tại');
    }
    this.stages[stageIndex].status = 'completed';
    this.stages[stageIndex].progress = 100;
    return await this.save();
};

projectSchema.methods.getActiveTeamMembers = function () {
    return this.team.filter(m => !m.leaveDate);
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;