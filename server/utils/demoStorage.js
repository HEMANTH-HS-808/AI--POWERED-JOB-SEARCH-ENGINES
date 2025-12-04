// Simple in-memory storage for demo mode
const bcrypt = require('bcryptjs');

class DemoStorage {
  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.nextUserId = 1;
    
    // Add a demo user
    this.addDemoUser();
  }

  async addDemoUser() {
    const hashedPassword = await bcrypt.hash('demo123', 12);
    this.users.set('demo@skillsync.com', {
      _id: 'demo_user_1',
      username: 'demo_user',
      email: 'demo@skillsync.com',
      passwordHash: hashedPassword,
      university: 'Demo University',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      savedCompanies: [
        {
          name: 'Google',
          jobTitle: 'Software Engineer',
          savedAt: new Date()
        }
      ],
      profile: {
        firstName: 'Demo',
        lastName: 'User',
        bio: 'This is a demo user account for testing Job Search Engine features.',
        graduationYear: 2024
      },
      role: 'user',
      createdAt: new Date()
    });

    // Add demo admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    this.users.set('admin@skillsync.com', {
      _id: 'admin_user_1',
      username: 'admin',
      email: 'admin@skillsync.com',
      passwordHash: adminPassword,
      university: 'Admin University',
      skills: ['Administration', 'Management'],
      savedCompanies: [],
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        bio: 'System Administrator',
        graduationYear: 2020
      },
      role: 'admin',
      createdAt: new Date()
    });
  }

  async findUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id) {
    for (const user of this.users.values()) {
      if (user._id === id) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData) {
    const userId = `demo_user_${this.nextUserId++}`;
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = {
      _id: userId,
      username: userData.username,
      email: userData.email,
      passwordHash: hashedPassword,
      university: userData.university || '',
      skills: [],
      savedCompanies: [],
      profile: {
        firstName: '',
        lastName: '',
        bio: '',
        graduationYear: null
      },
      role: 'user',
      createdAt: new Date()
    };

    this.users.set(userData.email, user);
    return user;
  }

  async updateUser(userId, updateData) {
    for (const [email, user] of this.users.entries()) {
      if (user._id === userId) {
        // Handle nested updates properly
        if (updateData.profile) {
          user.profile = { ...user.profile, ...updateData.profile };
          delete updateData.profile;
        }
        
        if (updateData.resume) {
          user.resume = { ...user.resume, ...updateData.resume };
          delete updateData.resume;
        }
        
        // Handle array updates
        if (updateData.skills) {
          user.skills = [...updateData.skills];
        }
        if (updateData.savedCompanies) {
          user.savedCompanies = [...updateData.savedCompanies];
        }
        
        // Apply other updates
        Object.assign(user, updateData);
        this.users.set(email, user);
        return user;
      }
    }
    return null;
  }

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Company methods
  getCompany(name) {
    return this.companies.get(name.toLowerCase()) || null;
  }

  setCompany(name, data) {
    this.companies.set(name.toLowerCase(), data);
  }

  // Admin methods
  async getAllUsers() {
    return Array.from(this.users.values());
  }
}

// Export singleton instance
module.exports = new DemoStorage();