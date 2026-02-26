const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const timesheetSchema = mongoose.Schema(
    {
        employee: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Employee',
            required: [true, 'Nhân viên là bắt buộc'],
        },

        project: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Project',
            required: [true, 'Dự án là bắt buộc'],
        },

        date: {
            type: Date,
            required: [true, 'Ngày chấm công là bắt buộc'],
        },

        checkIn: {
            time: {
                type: Date,
                default: null,
            },
            note: {
                type: String,
                trim: true,
                default: '',
            },
            location: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
            },
        },

        checkOut: {
            time: {
                type: Date,
                default: null,
            },
            note: {
                type: String,
                trim: true,
                default: '',
            },
            location: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
            },
        },

        hours: {
            regular: {
                type: Number,
                default: 0,
                min: [0, 'Giờ làm thường không thể âm'],
                max: [24, 'Giờ làm thường không quá 24h'],
            },
            overtime: {
                type: Number,
                default: 0,
                min: [0, 'Giờ OT không thể âm'],
                max: [12, 'Giờ OT không quá 12h'],
            },
            night: {
                type: Number,
                default: 0,
                min: [0, 'Giờ làm đêm không thể âm'],
                max: [12, 'Giờ làm đêm không quá 12h'],
            },
        },

        dayType: {
            type: String,
            enum: {
                values: ['normal', 'weekend', 'holiday', 'absent', 'leave'],
                message: 'Loại ngày không hợp lệ',
            },
            default: 'normal',
        },

        absence: {
            type: {
                type: String,
                enum: ['annual_leave', 'sick_leave', 'unpaid_leave', 'other'],
                default: null,
            },
            reason: {
                type: String,
                trim: true,
                default: '',
            },
            approved: {
                type: Boolean,
                default: false,
            },
        },

        workDescription: {
            type: String,
            trim: true,
            maxlength: [500, 'Mô tả công việc không quá 500 ký tự'],
            default: '',
        },

        status: {
            type: String,
            enum: {
                values: ['draft', 'submitted', 'approved', 'rejected'],
                message: 'Trạng thái không hợp lệ',
            },
            default: 'draft',
        },

        submittedAt: {
            type: Date,
            default: null,
        },

        approvedBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },

        approvedAt: {
            type: Date,
            default: null,
        },

        rejectedReason: {
            type: String,
            trim: true,
            default: '',
        },

        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

timesheetSchema.index({ employee: 1, date: 1, project: 1 }, { unique: true });
timesheetSchema.index({ project: 1 });
timesheetSchema.index({ status: 1 });
timesheetSchema.index({ date: -1 });
timesheetSchema.index({ createdAt: -1 });

timesheetSchema.plugin(toJSON);
timesheetSchema.plugin(paginate);

timesheetSchema.virtual('totalHours').get(function () {
    return this.hours.regular + this.hours.overtime + this.hours.night;
});

timesheetSchema.virtual('actualDuration').get(function () {
    if (!this.checkIn?.time || !this.checkOut?.time) return 0;
    return Math.round((this.checkOut.time - this.checkIn.time) / (1000 * 60));
});

timesheetSchema.statics.findByEmployee = function (employeeId, startDate, endDate) {
    const query = { employee: employeeId };
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }
    return this.find(query).sort({ date: -1 });
};

timesheetSchema.statics.findByProject = function (projectId, startDate, endDate) {
    const query = { project: projectId };
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }
    return this.find(query).populate('employee', 'fullName employeeCode').sort({ date: -1 });
};

timesheetSchema.statics.findPendingApproval = function (projectId) {
    const query = { status: 'submitted' };
    if (projectId) query.project = projectId;
    return this.find(query)
        .populate('employee', 'fullName employeeCode department')
        .sort({ submittedAt: 1 });
};

timesheetSchema.statics.getSummaryByEmployee = async function (employeeId, startDate, endDate) {
    const match = { employee: new mongoose.Types.ObjectId(employeeId) };
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    const result = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalDays: { $sum: 1 },
                totalRegularHours: { $sum: '$hours.regular' },
                totalOvertimeHours: { $sum: '$hours.overtime' },
                totalNightHours: { $sum: '$hours.night' },
                absentDays: {
                    $sum: { $cond: [{ $eq: ['$dayType', 'absent'] }, 1, 0] },
                },
                leaveDays: {
                    $sum: { $cond: [{ $eq: ['$dayType', 'leave'] }, 1, 0] },
                },
            },
        },
    ]);

    return result[0] || {
        totalDays: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalNightHours: 0,
        absentDays: 0,
        leaveDays: 0,
    };
};

timesheetSchema.methods.submit = async function () {
    if (this.status !== 'draft')
        throw new Error('Chỉ có thể submit timesheet ở trạng thái draft');

    this.status = 'submitted';
    this.submittedAt = new Date();
    return this.save();
};

timesheetSchema.methods.approve = async function (approverId) {
    if (this.status !== 'submitted')
        throw new Error('Chỉ có thể duyệt timesheet ở trạng thái submitted');

    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.rejectedReason = '';
    return this.save();
};

timesheetSchema.methods.reject = async function (approverId, reason) {
    if (this.status !== 'submitted')
        throw new Error('Chỉ có thể từ chối timesheet ở trạng thái submitted');

    this.status = 'rejected';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.rejectedReason = reason || '';
    return this.save();
};

timesheetSchema.methods.checkInNow = async function (location) {
    if (this.checkIn?.time)
        throw new Error('Đã check-in rồi');

    this.checkIn = { time: new Date(), location: location || {} };
    return this.save();
};

timesheetSchema.methods.checkOutNow = async function (location) {
    if (!this.checkIn?.time)
        throw new Error('Chưa check-in');
    if (this.checkOut?.time)
        throw new Error('Đã check-out rồi');

    this.checkOut = { time: new Date(), location: location || {} };

    // Tự tính giờ regular từ check-in/check-out
    const diffHours = (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60);
    this.hours.regular = Math.min(Math.round(diffHours * 10) / 10, 8); // tối đa 8h regular

    return this.save();
};

const Timesheet = mongoose.model('Timesheet', timesheetSchema);

module.exports = Timesheet;