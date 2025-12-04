const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true,
        minlength: 6
    },
    university: {
        type: String,
        trim: true,
        maxlength: 100
    },
    skills: [{
        type: String,
        trim: true
    }],
    savedCompanies: [{
        name: String,
        jobTitle: String,
        savedAt: {
            type: Date,
            default: Date.now
        }
    }],
    profile: {
        firstName: String,
        lastName: String,
        bio: String,
        graduationYear: Number
    },
    resume: {
        imageUrl: String,
        analysis: {
            summary: {
                name: String,
                skills: [String],
                experience: [{
                    title: String,
                    company: String,
                    duration: String,
                    description: String
                }],
                education: [{
                    degree: String,
                    institution: String,
                    year: String
                }],
                projects: [{
                    name: String,
                    description: String,
                    technologies: [String]
                }]
            },
            score: Number,
            recommendations: {
                companies: [{
                    name: String,
                    role: String,
                    matchReason: String
                }],
                tips: [String]
            },
            analyzedAt: Date
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.passwordHash;
    return user;
};

module.exports = mongoose.model('User', userSchema);