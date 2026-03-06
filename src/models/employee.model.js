const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const employeeSchema = mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: [true, 'Mã nhân viên là bắt buộc'],
            unique: [true, 'Mã nhân viên đã tồn tại'],
            trim: true,
            uppercase: true
        },

        fullName: {
            type: String,
            required: [true, 'Tên đầy đủ là bắt buộc'],
            trim: true,
            minlength: [3, 'Tên phải ít nhất 3 ký tự'],
            maxlength: [100, 'Tên không quá 100 ký tự']
        },

        email: {
            type: String,
            required: [true, 'Email là bắt buộc'],
            unique: [true, 'Email đã tồn tại'],
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Email không hợp lệ'
            }
        },

        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            trim: true,
            validate: {
                validator: function (v) {
                    return /^(0[3|5|7|8|9])[0-9]{8}$/.test(v.replace(/\s/g, ''));
                },
                message: 'Số điện thoại Việt Nam không hợp lệ'
            }
        },

        dateOfBirth: {
            type: Date,
            required: [true, 'Ngày sinh là bắt buộc']
        },

        gender: {
            type: String,
            enum: {
                values: ['Nam', 'Nữ', 'Khác'],
                message: 'Giới tính không hợp lệ'
            },
            required: true
        },

        // Giấy tờ tuỳ thân
        idNumber: {
            type: String,
            required: [true, 'Số CMND/CCCD là bắt buộc'],
            unique: [true, 'Số CMND/CCCD đã tồn tại'],
            trim: true
        },

        idIssuedDate: {
            type: Date,
            required: [true, 'Ngày cấp CMND/CCCD là bắt buộc']
        },

        idIssuedPlace: {
            type: String,
            trim: true
        },

        // Công việc
        position: {
            type: String,
            required: [true, 'Chức vụ là bắt buộc'],
            trim: true,
            maxlength: [50, 'Chức vụ không quá 50 ký tự']
        },

        department: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Department',
            required: [true, 'Phòng ban là bắt buộc']
        },

        employmentType: {
            type: String,
            enum: {
                values: ['full-time', 'part-time', 'contract', 'temporary'],
                message: 'Loại hợp đồng không hợp lệ'
            },
            default: 'full-time'
        },

        hireDate: {
            type: Date,
            required: [true, 'Ngày vào làm là bắt buộc']
        },

        leaveDate: {
            type: Date,
            default: null,
            validate: {
                validator: function (v) {
                    return !v || v > this.hireDate;
                },
                message: 'Ngày rời phải sau ngày vào làm'
            }
        },

        // Lương
        salary: {
            basicSalary: {
                type: Number,
                required: [true, 'Lương cơ bản là bắt buộc'],
                min: [0, 'Lương không thể âm']
            },
            allowance: {
                type: Number,
                default: 0,
                min: 0
            },
            currency: {
                type: String,
                enum: ['VND', 'USD', 'EUR'],
                default: 'VND'
            },
            paymentFrequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly'],
                default: 'monthly'
            },
            lastSalaryReview: {
                type: Date,
                default: null
            }
        },

        // Kỹ năng
        skills: [
            {
                skillName: {
                    type: String,
                    required: true,
                    trim: true
                },
                level: {
                    type: String,
                    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                    default: 'intermediate'
                },
                yearsOfExperience: {
                    type: Number,
                    default: 0,
                    min: 0
                },
                certification: {
                    type: String,
                    trim: true
                },
                _id: false
            }
        ],

        // Chứng chỉ
        certifications: [
            {
                certName: {
                    type: String,
                    required: true,
                    trim: true
                },
                issuedBy: {
                    type: String,
                    required: true,
                    trim: true
                },
                issueDate: {
                    type: Date,
                    required: true
                },
                expiryDate: {
                    type: Date,
                    default: null
                },
                documentUrl: {
                    type: String,
                    trim: true
                },
                _id: false
            }
        ],

        // Tài khoản ngân hàng
        bankAccount: {
            accountName: {
                type: String,
                trim: true
            },
            accountNumber: {
                type: String,
                trim: true
            },
            bankName: {
                type: String,
                trim: true
            },
            bankCode: {
                type: String,
                trim: true
            },
            _id: false
        },

        // Liên hệ khẩn cấp
        emergencyContact: {
            name: {
                type: String,
                trim: true
            },
            relationship: {
                type: String,
                trim: true
            },
            phone: {
                type: String,
                trim: true
            },
            _id: false
        },

        // Dự án được gán
        projectAssignments: [
            {
                projectId: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'Project'
                },
                role: String,
                assignedDate: {
                    type: Date,
                    default: Date.now
                },
                unassignedDate: {
                    type: Date,
                    default: null
                },
                status: {
                    type: String,
                    enum: ['active', 'inactive'],
                    default: 'active'
                },
                _id: false
            }
        ],

        // Lịch sử công việc
        workHistory: [
            {
                companyName: {
                    type: String,
                    trim: true
                },
                position: {
                    type: String,
                    trim: true
                },
                startDate: Date,
                endDate: Date,
                experience: {
                    type: String,
                    trim: true
                },
                _id: false
            }
        ],

        // Trạng thái
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive', 'on_leave', 'terminated'],
                message: 'Trạng thái không hợp lệ'
            },
            default: 'active'
        },

        // Ảnh đại diện
        profileImage: {
            type: String,
            default: '',
            trim: true
        },

        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

employeeSchema.index({ employeeCode: 1 }, { unique: true });
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ idNumber: 1 }, { unique: true });
employeeSchema.index({ phone: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ createdAt: -1 });

employeeSchema.plugin(toJSON);
employeeSchema.plugin(paginate);

employeeSchema.virtual('isActive').get(function () {
    return this.status === 'active' && !this.leaveDate;
});

employeeSchema.virtual('totalSalary').get(function () {
    return this.salary.basicSalary + this.salary.allowance;
});

employeeSchema.statics.isEmployeeCodeTaken = async function (employeeCode, excludeEmployeeId) {
    const employee = await this.findOne({
        employeeCode,
        _id: { $ne: excludeEmployeeId }
    });
    return !!employee;
};

employeeSchema.statics.isEmailTaken = async function (email, excludeEmployeeId) {
    const employee = await this.findOne({
        email,
        _id: { $ne: excludeEmployeeId }
    });
    return !!employee;
};

employeeSchema.statics.isIdNumberTaken = async function (idNumber, excludeEmployeeId) {
    const employee = await this.findOne({
        idNumber,
        _id: { $ne: excludeEmployeeId }
    });
    return !!employee;
};

employeeSchema.statics.findByDepartment = async function (department) {
    return await this.find({ department }).populate('projectAssignments.projectId', 'projectName');
};

employeeSchema.statics.findActiveEmployees = async function () {
    return await this.find({ status: 'active' });
};

employeeSchema.statics.findByStatus = async function (status) {
    return await this.find({ status });
};

employeeSchema.methods.addSkill = async function (skillData) {
    this.skills.push(skillData);
    return await this.save();
};

employeeSchema.methods.removeSkill = async function (skillName) {
    this.skills = this.skills.filter(s => s.skillName !== skillName);
    return await this.save();
};

employeeSchema.methods.addCertification = async function (certData) {
    this.certifications.push(certData);
    return await this.save();
};

employeeSchema.methods.removeCertification = async function (certName) {
    this.certifications = this.certifications.filter(c => c.certName !== certName);
    return await this.save();
};

employeeSchema.methods.assignToProject = async function (projectId, role) {
    const existingAssignment = this.projectAssignments.find(
        a => a.projectId.toString() === projectId.toString() && a.status === 'active'
    );

    if (existingAssignment) {
        throw new Error('Nhân viên đã được gán cho dự án này');
    }

    this.projectAssignments.push({
        projectId,
        role,
        assignedDate: new Date(),
        status: 'active'
    });

    return await this.save();
};

employeeSchema.methods.unassignFromProject = async function (projectId) {
    const assignment = this.projectAssignments.find(
        a => a.projectId.toString() === projectId.toString()
    );

    if (!assignment) {
        throw new Error('Nhân viên không được gán cho dự án này');
    }

    assignment.status = 'inactive';
    assignment.unassignedDate = new Date();

    return await this.save();
};

employeeSchema.methods.getActiveProjects = function () {
    return this.projectAssignments.filter(a => a.status === 'active');
};

employeeSchema.methods.updateStatus = async function (newStatus) {
    const validStatus = ['active', 'inactive', 'on_leave', 'terminated'];
    if (!validStatus.includes(newStatus)) {
        throw new Error('Trạng thái không hợp lệ');
    }

    this.status = newStatus;

    if (newStatus === 'terminated' && !this.leaveDate) {
        this.leaveDate = new Date();
    }

    return await this.save();
};

employeeSchema.methods.updateSalary = async function (basicSalary, allowance) {
    if (basicSalary < 0 || allowance < 0) {
        throw new Error('Lương không thể âm');
    }

    this.salary.basicSalary = basicSalary;
    this.salary.allowance = allowance;
    this.salary.lastSalaryReview = new Date();

    return await this.save();
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;