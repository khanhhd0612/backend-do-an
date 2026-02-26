const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const payrollSchema = mongoose.Schema(
    {
        employee: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Employee',
            required: [true, 'Nhân viên là bắt buộc'],
        },

        project: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Project',
            default: null,
        },

        period: {
            month: {
                type: Number,
                required: [true, 'Tháng là bắt buộc'],
                min: 1,
                max: 12,
            },
            year: {
                type: Number,
                required: [true, 'Năm là bắt buộc'],
                min: 2000,
            },
            startDate: { type: Date, required: true },
            endDate:   { type: Date, required: true },
        },

        workDays: {
            standard:  { type: Number, default: 26 }, // số ngày công chuẩn trong tháng
            actual:    { type: Number, default: 0 },  // số ngày công thực tế
            absent:    { type: Number, default: 0 },
            leave:     { type: Number, default: 0 },
        },

        hours: {
            regular:  { type: Number, default: 0 },
            overtime: { type: Number, default: 0 },
            night:    { type: Number, default: 0 },
        },

        basicSalary: {
            type: Number,
            required: [true, 'Lương cơ bản là bắt buộc'],
            min: 0,
        },

        allowance: {
            type: Number,
            default: 0,
            min: 0,
        },

        // basicSalary / workDays.standard * workDays.actual
        earnedSalary: {
            type: Number,
            default: 0,
            min: 0,
        },

        overtimePay: {
            amount:     { type: Number, default: 0 },
            multiplier: { type: Number, default: 1.5 },
        },

        nightPay: {
            amount:     { type: Number, default: 0 },
            multiplier: { type: Number, default: 1.3 },
        },

        bonuses: [
            {
                type: {
                    type: String,
                    enum: ['kpi', 'project', 'attendance', 'other'],
                    required: true,
                },
                amount:      { type: Number, required: true, min: 0 },
                description: { type: String, trim: true },
                _id: false,
            },
        ],

        insurance: {
            bhxh: {
                rate:   { type: Number, default: 8 },   // 8% nhân viên đóng
                amount: { type: Number, default: 0 },
            },
            bhyt: {
                rate:   { type: Number, default: 1.5 }, // 1.5%
                amount: { type: Number, default: 0 },
            },
            bhtn: {
                rate:   { type: Number, default: 1 },   // 1%
                amount: { type: Number, default: 0 },
            },
        },

        personalIncomeTax: {
            taxableIncome:   { type: Number, default: 0 },
            deductions:      { type: Number, default: 11000000 }, // giảm trừ bản thân
            dependents:      { type: Number, default: 0 },        // số người phụ thuộc
            dependentAmount: { type: Number, default: 0 },        // 4.4tr × dependents
            taxAmount:       { type: Number, default: 0 },
        },

        deductions: [
            {
                type: {
                    type: String,
                    enum: ['absent', 'late', 'damage', 'advance', 'other'],
                    required: true,
                },
                amount:      { type: Number, required: true, min: 0 },
                description: { type: String, trim: true },
                _id: false,
            },
        ],

        summary: {
            grossSalary:      { type: Number, default: 0 }, // trước khấu trừ
            totalBonus:       { type: Number, default: 0 },
            totalDeduction:   { type: Number, default: 0 }, // bảo hiểm + phạt
            totalTax:         { type: Number, default: 0 },
            netSalary:        { type: Number, default: 0 }, // thực nhận
        },

        payment: {
            status: {
                type: String,
                enum: ['pending', 'processing', 'paid', 'cancelled'],
                default: 'pending',
            },
            method: {
                type: String,
                enum: ['bank_transfer', 'cash'],
                default: 'bank_transfer',
            },
            paidAt:    { type: Date, default: null },
            reference: { type: String, trim: true, default: '' }, // mã giao dịch
        },

        status: {
            type: String,
            enum: {
                values: ['draft', 'confirmed', 'paid', 'cancelled'],
                message: 'Trạng thái không hợp lệ',
            },
            default: 'draft',
        },

        note: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },

        confirmedBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
        confirmedAt: { type: Date, default: null },
        createdBy:   { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

payrollSchema.index({ employee: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });
payrollSchema.index({ 'period.month': 1, 'period.year': 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ 'payment.status': 1 });
payrollSchema.index({ createdAt: -1 });

payrollSchema.plugin(toJSON);
payrollSchema.plugin(paginate);

payrollSchema.statics.findByPeriod = function (month, year) {
    return this.find({ 'period.month': month, 'period.year': year })
        .populate('employee', 'fullName employeeCode department bankAccount')
        .sort({ 'employee.department': 1 });
};

payrollSchema.statics.findByEmployee = function (employeeId) {
    return this.find({ employee: employeeId })
        .sort({ 'period.year': -1, 'period.month': -1 });
};

payrollSchema.statics.getPeriodStats = async function (month, year) {
    const result = await this.aggregate([
        { $match: { 'period.month': month, 'period.year': year } },
        {
            $group: {
                _id: null,
                totalEmployees:  { $sum: 1 },
                totalGross:      { $sum: '$summary.grossSalary' },
                totalNet:        { $sum: '$summary.netSalary' },
                totalBonus:      { $sum: '$summary.totalBonus' },
                totalTax:        { $sum: '$summary.totalTax' },
                totalInsurance:  {
                    $sum: {
                        $add: [
                            '$insurance.bhxh.amount',
                            '$insurance.bhyt.amount',
                            '$insurance.bhtn.amount',
                        ],
                    },
                },
            },
        },
    ]);
    return result[0] || {
        totalEmployees: 0, totalGross: 0, totalNet: 0,
        totalBonus: 0, totalTax: 0, totalInsurance: 0,
    };
};

// Tính lương tự động từ dữ liệu timesheet
payrollSchema.methods.calculate = function () {
    const dailyRate = this.basicSalary / this.workDays.standard;
    const hourlyRate = dailyRate / 8;

    // Lương theo ngày công thực tế
    this.earnedSalary = Math.round(dailyRate * this.workDays.actual);

    // Lương OT
    this.overtimePay.amount = Math.round(
        hourlyRate * this.overtimePay.multiplier * this.hours.overtime
    );

    // Lương đêm
    this.nightPay.amount = Math.round(
        hourlyRate * this.nightPay.multiplier * this.hours.night
    );

    // Tổng thưởng
    this.summary.totalBonus = this.bonuses.reduce((sum, b) => sum + b.amount, 0);

    // Gross = lương thực + phụ cấp + OT + đêm + thưởng
    this.summary.grossSalary = Math.round(
        this.earnedSalary +
        this.allowance +
        this.overtimePay.amount +
        this.nightPay.amount +
        this.summary.totalBonus
    );

    // Bảo hiểm tính trên lương cơ bản
    const insuranceBase = this.basicSalary;
    this.insurance.bhxh.amount = Math.round(insuranceBase * this.insurance.bhxh.rate / 100);
    this.insurance.bhyt.amount = Math.round(insuranceBase * this.insurance.bhyt.rate / 100);
    this.insurance.bhtn.amount = Math.round(insuranceBase * this.insurance.bhtn.rate / 100);

    const totalInsurance =
        this.insurance.bhxh.amount +
        this.insurance.bhyt.amount +
        this.insurance.bhtn.amount;

    // Tổng khấu trừ (phạt, trừ lương)
    const otherDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);
    this.summary.totalDeduction = totalInsurance + otherDeductions;

    // Thuế TNCN
    this.personalIncomeTax.dependentAmount =
        this.personalIncomeTax.dependents * 4400000;

    this.personalIncomeTax.taxableIncome = Math.max(
        0,
        this.summary.grossSalary -
        totalInsurance -
        this.personalIncomeTax.deductions -
        this.personalIncomeTax.dependentAmount
    );

    this.personalIncomeTax.taxAmount = calcPIT(this.personalIncomeTax.taxableIncome);
    this.summary.totalTax = this.personalIncomeTax.taxAmount;

    // Lương thực nhận
    this.summary.netSalary = Math.max(
        0,
        this.summary.grossSalary -
        this.summary.totalDeduction -
        this.summary.totalTax
    );

    return this;
};

payrollSchema.methods.confirm = async function (userId) {
    if (this.status !== 'draft')
        throw new Error('Chỉ có thể xác nhận phiếu lương ở trạng thái draft');

    this.status      = 'confirmed';
    this.confirmedBy = userId;
    this.confirmedAt = new Date();
    return this.save();
};

payrollSchema.methods.markAsPaid = async function (method, reference) {
    if (this.status !== 'confirmed')
        throw new Error('Phiếu lương phải được xác nhận trước khi thanh toán');

    this.status          = 'paid';
    this.payment.status  = 'paid';
    this.payment.method  = method || 'bank_transfer';
    this.payment.paidAt  = new Date();
    this.payment.reference = reference || '';
    return this.save();
};

// tính thuế TNCN theo biểu luỹ tiến
function calcPIT(taxableIncome) {
    if (taxableIncome <= 0) return 0;

    const brackets = [
        { limit: 5000000,  rate: 0.05 },
        { limit: 10000000, rate: 0.10 },
        { limit: 18000000, rate: 0.15 },
        { limit: 32000000, rate: 0.20 },
        { limit: 52000000, rate: 0.25 },
        { limit: 80000000, rate: 0.30 },
        { limit: Infinity, rate: 0.35 },
    ];

    let tax = 0;
    let remaining = taxableIncome;
    let prev = 0;

    for (const bracket of brackets) {
        const band = bracket.limit - prev;
        if (remaining <= 0) break;
        const taxable = Math.min(remaining, band);
        tax += taxable * bracket.rate;
        remaining -= taxable;
        prev = bracket.limit;
    }

    return Math.round(tax);
}

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;