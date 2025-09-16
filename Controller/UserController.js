// Controller/UserController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Modal/UserSchema.js';

// Generate random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Start Registration - Send OTP
export const startRegistration = async (req, res) => {
    try {
        console.log('📝 Registration request received:', req.body);
        
        const { name, phone, password } = req.body;

        // Validation
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, and password are required'
            });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        console.log(`🔐 Generated OTP for ${phone}: ${otp}`);

        // Create or update user
        let user;
        if (existingUser) {
            // Update existing unverified user
            user = await User.findOneAndUpdate(
                { phone },
                {
                    name,
                    password: hashedPassword,
                    otp: {
                        code: otp,
                        expiresAt: otpExpiry,
                        verified: false
                    },
                    isVerified: false
                },
                { new: true }
            );
        } else {
            // Create new user
            user = new User({
                name,
                phone,
                password: hashedPassword,
                otp: {
                    code: otp,
                    expiresAt: otpExpiry,
                    verified: false
                },
                isVerified: false
            });
            await user.save();
        }

        console.log('✅ User created/updated successfully:', user._id);

        // In production, send SMS here
        // For now, we'll just log it
        console.log(`📱 SMS would be sent to ${phone} with OTP: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your mobile number',
            data: {
                phone,
                testOtp: otp // Remove this in production!
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

// Verify OTP and complete registration
export const verifyOTP = async (req, res) => {
    try {
        console.log('🔍 OTP verification request:', req.body);
        
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        // Find user with pending verification
        const user = await User.findOne({ 
            phone, 
            isVerified: false,
            'otp.code': otp,
            'otp.expiresAt': { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined; // Remove OTP data
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        console.log('✅ User verified successfully:', user._id);

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Registration completed successfully!',
            data: {
                user: userResponse,
                token
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

// Login User
export const loginUser = async (req, res) => {
    try {
        console.log('🔐 Login request received:', { phone: req.body.phone });
        
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }

        // Find verified user
        const user = await User.findOne({ phone, isVerified: true });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or account not verified'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        console.log('✅ User logged in successfully:', user._id);

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        console.log('👥 Get all users request from:', req.user?.name);

        const users = await User.find({ isVerified: true })
            .select('-password -otp') // Exclude sensitive data
            .sort({ createdAt: -1 }); // Most recent first

        console.log(`✅ Found ${users.length} verified users`);

        res.status(200).json({
            success: true,
            message: `Found ${users.length} registered users`,
            users,
            total: users.length
        });

    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching users',
            users: [],
            total: 0
        });
    }
};