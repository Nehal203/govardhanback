// Controller/ReservationController.js
import Reservation from '../Modal/ReservationSchema.js';

// Generate random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create new reservation and send OTP
export const createReservation = async (req, res) => {
    try {
        console.log('📝 Reservation request received:', req.body);

        const { name, phone, email, date, time, partySize, notes } = req.body;

        // Validation
        if (!name || !phone || !date || !time || !partySize) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, date, time, and party size are required'
            });
        }

        // Validate phone number format
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number'
            });
        }

        // Validate date format and not in past
        const reservationDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (reservationDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Reservation date cannot be in the past'
            });
        }

        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid time in HH:MM format'
            });
        }

        // Validate party size
        if (partySize < 1 || partySize > 20) {
            return res.status(400).json({
                success: false,
                message: 'Party size must be between 1 and 20'
            });
        }

        // Check for existing unverified reservation for same phone and date
        const existingReservation = await Reservation.findOne({
            phone,
            date,
            isVerified: false,
            'otp.expiresAt': { $gt: new Date() }
        });

        if (existingReservation) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending reservation for this date. Please verify your OTP or wait for it to expire.'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        console.log(`🔐 Generated OTP for reservation ${phone}: ${otp}`);

        // Create reservation
        const reservation = new Reservation({
            name,
            phone,
            email: email || undefined,
            date,
            time,
            partySize: parseInt(partySize),
            notes: notes || '',
            otp: {
                code: otp,
                expiresAt: otpExpiry,
                verified: false
            },
            isVerified: false,
            status: 'pending'
        });

        await reservation.save();

        console.log('✅ Reservation created successfully:', reservation._id);

        // In production, send SMS here
        // For now, we'll just log it
        console.log(`📱 SMS would be sent to ${phone} with OTP: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'Reservation created! OTP sent to your mobile number',
            data: {
                reservationId: reservation._id,
                phone,
                testOtp: otp, // Remove this in production!
                otpExpiry: otpExpiry
            }
        });

    } catch (error) {
        console.error('❌ Reservation creation error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during reservation creation'
        });
    }
};

// Verify OTP and confirm reservation
export const verifyReservationOTP = async (req, res) => {
    try {
        console.log('🔍 OTP verification request:', req.body);

        const { reservationId, otp } = req.body;

        if (!reservationId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Reservation ID and OTP are required'
            });
        }

        // Find reservation with pending verification
        const reservation = await Reservation.findOne({
            _id: reservationId,
            isVerified: false,
            'otp.code': otp,
            'otp.expiresAt': { $gt: new Date() }
        });

        if (!reservation) {
            // Check if reservation exists but OTP is wrong/expired
            const existingReservation = await Reservation.findById(reservationId);
            if (!existingReservation) {
                return res.status(404).json({
                    success: false,
                    message: 'Reservation not found'
                });
            }

            if (existingReservation.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Reservation already verified'
                });
            }

            if (existingReservation.isOtpExpired()) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP has expired. Please create a new reservation.'
                });
            }

            // Increment verification attempts
            existingReservation.verificationAttempts += 1;
            await existingReservation.save();

            if (existingReservation.verificationAttempts >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many failed attempts. Please create a new reservation.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.'
            });
        }

        // Mark reservation as verified
        await Reservation.findByIdAndUpdate(reservationId, {
            isVerified: true,
            status: 'confirmed',
            $unset: { otp: 1 }
        });

        console.log('✅ Reservation verified successfully:', reservation._id);

        // Get the updated reservation
        const updatedReservation = await Reservation.findById(reservationId);

        res.status(200).json({
            success: true,
            message: 'Reservation confirmed successfully!',
            data: {
                reservationId: updatedReservation._id,
                name: updatedReservation.name,
                phone: updatedReservation.phone,
                date: updatedReservation.date,
                time: updatedReservation.time,
                partySize: updatedReservation.partySize,
                status: updatedReservation.status
            }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during verification'
        });
    }
};

// Resend OTP for reservation
export const resendReservationOTP = async (req, res) => {
    try {
        console.log('🔄 Resend OTP request:', req.body);

        const { reservationId } = req.body;

        if (!reservationId) {
            return res.status(400).json({
                success: false,
                message: 'Reservation ID is required'
            });
        }

        const reservation = await Reservation.findOne({
            _id: reservationId,
            isVerified: false
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found or already verified'
            });
        }

        // Check if OTP was sent recently (within 1 minute)
        const timeSinceLastOtp = Date.now() - new Date(reservation.lastOtpSent).getTime();
        if (timeSinceLastOtp < 60000) { // 1 minute
            return res.status(400).json({
                success: false,
                message: 'Please wait before requesting another OTP'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Update reservation with new OTP
        reservation.otp = {
            code: otp,
            expiresAt: otpExpiry,
            verified: false
        };
        reservation.lastOtpSent = new Date();
        await reservation.save();

        console.log(`🔐 New OTP generated for reservation ${reservationId}: ${otp}`);

        // In production, send SMS here
        console.log(`📱 SMS would be sent to ${reservation.phone} with OTP: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully',
            data: {
                reservationId: reservation._id,
                phone: reservation.phone,
                testOtp: otp, // Remove this in production!
                otpExpiry: otpExpiry
            }
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during OTP resend'
        });
    }
};

// Get all reservations (Admin only)
export const getAllReservations = async (req, res) => {
    try {
        console.log('📋 Get all reservations request from:', req.user?.name);

        const { status, date, page = 1, limit = 10 } = req.query;

        // Build filter object
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (date) {
            filter.date = date;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reservations = await Reservation.find(filter)
            .select('-otp') // Exclude OTP data
            .sort({ createdAt: -1 }) // Most recent first
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Reservation.countDocuments(filter);

        console.log(`✅ Found ${reservations.length} reservations`);

        res.status(200).json({
            success: true,
            message: `Found ${reservations.length} reservations`,
            data: {
                reservations,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('❌ Get reservations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching reservations',
            data: {
                reservations: [],
                total: 0
            }
        });
    }
};

// Get reservation by ID
export const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id).select('-otp');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reservation found',
            data: { reservation }
        });

    } catch (error) {
        console.error('❌ Get reservation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching reservation'
        });
    }
};

// Update reservation status (Admin only)
export const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (pending, confirmed, cancelled, completed)'
            });
        }

        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-otp');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        console.log(`✅ Reservation ${id} status updated to ${status}`);

        res.status(200).json({
            success: true,
            message: 'Reservation status updated successfully',
            data: { reservation }
        });

    } catch (error) {
        console.error('❌ Update reservation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating reservation'
        });
    }
};

// Delete reservation (Admin only)
export const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findByIdAndDelete(id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        console.log(`✅ Reservation ${id} deleted successfully`);

        res.status(200).json({
            success: true,
            message: 'Reservation deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete reservation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting reservation'
        });
    }
};
