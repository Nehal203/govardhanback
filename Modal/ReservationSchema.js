// Modal/ReservationSchema.js
import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minLength: [2, 'Name must be at least 2 characters'],
        maxLength: [50, 'Name cannot exceed 50 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    date: {
        type: String,
        required: [true, 'Reservation date is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    time: {
        type: String,
        required: [true, 'Reservation time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    partySize: {
        type: Number,
        required: [true, 'Party size is required'],
        min: [1, 'Party size must be at least 1'],
        max: [20, 'Party size cannot exceed 20']
    },
    tableNumber: {
        type: String,
        default: 'TBD',
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxLength: [500, 'Notes cannot exceed 500 characters'],
        trim: true
    },
    otp: {
        code: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationAttempts: {
        type: Number,
        default: 0,
        max: 3
    },
    lastOtpSent: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Index for better query performance
ReservationSchema.index({ phone: 1 });
ReservationSchema.index({ date: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ createdAt: -1 });
ReservationSchema.index({ isVerified: 1 });

// Pre-save middleware to validate date is not in the past
ReservationSchema.pre('save', function (next) {
    const reservationDate = new Date(this.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
        const error = new Error('Reservation date cannot be in the past');
        return next(error);
    }

    next();
});

// Instance method to check if OTP is expired
ReservationSchema.methods.isOtpExpired = function () {
    return new Date() > this.otp.expiresAt;
};

// Instance method to check if OTP is valid
ReservationSchema.methods.isOtpValid = function (inputOtp) {
    return this.otp.code === inputOtp && !this.isOtpExpired();
};

// Static method to find reservations by date range
ReservationSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1, time: 1 });
};

// Static method to find confirmed reservations for a specific date
ReservationSchema.statics.findConfirmedByDate = function (date) {
    return this.find({
        date: date,
        status: 'confirmed',
        isVerified: true
    }).sort({ time: 1 });
};

const Reservation = mongoose.model('Reservation', ReservationSchema);

export default Reservation;
