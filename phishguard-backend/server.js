const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_phishguard_key_xyz987";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access Denied ❌" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token ❌" });
        req.user = user;
        next();
    });
};

const User = require("./models/User");
const Campaign = require("./models/campaign");
const Quiz = require("./models/quiz");
const Simulation = require("./models/simulation");


mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
    .then(() => console.log("MongoDB Connected ✅"))
    .catch(err => console.log(err));

// 🔥 FETCH QUIZZES BY CATEGORY
app.get("/quiz/:category", verifyToken, async (req, res) => {
    try {
        const categoryMap = {
            "email_phishing": "email",
            "social_media": "social",
            "financial": "financial"
        };
        const mappedCat = categoryMap[req.params.category] || req.params.category;

        // Use an aggregation to pull 5 random quizzes
        const quizzes = await Quiz.aggregate([
            { $match: { category: mappedCat } },
            { $sample: { size: 5 } }
        ]);

        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("PhishGuard Backend Running 🚀");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // Strict Form Validation
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ error: "Name must contain only letters and spaces ❌" });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|in|io)$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email domain. Please use a valid top-level domain like .com or .org ❌" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name, email, role, department, password: hashedPassword
        });
        await newUser.save();
        res.json({ message: "User Registered Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.json({ message: "Invalid Email or Password ❌" });

        let validPassword = false;
        // Graceful legacy fallback for plaintext passwords already in DB
        if (user.password && user.password.startsWith("$2")) {
            validPassword = await bcrypt.compare(req.body.password, user.password);
        } else {
            validPassword = (user.password === req.body.password);
        }

        if (validPassword) {
            const token = jwt.sign({ email: user.email, role: user.role, id: user._id }, JWT_SECRET, { expiresIn: "24h" });
            res.json({
                message: "Login Successful ✅",
                user: user,
                token: token
            });
        } else {
            res.json({ message: "Invalid Email or Password ❌" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/campaign", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied: Admin Only ❌" });
        const { campaignName, template, category, department, createdBy, moduleCategory } = req.body;

        let filter = { role: "employee" };
        if (department !== "All" && department) filter.department = department;

        const targetedUsers = await User.find(filter);
        const targetedEmployees = targetedUsers.length;

        const newCampaign = new Campaign({
            campaignName,
            template,
            category: category || "General",
            department: department || "All",
            createdBy,
            targetedEmployees
        });
        await newCampaign.save();

        const categoryMapping = {
            "Email Scrutiny Phishing": "email_phishing",
            "Financial Phishing": "financial",
            "Social Frauds": "social_media"
        };
        const activeModId = categoryMapping[moduleCategory];

        if (activeModId) {
            await User.updateMany(
                filter,
                { $set: { "modules.$[elem].enabled": true } },
                { arrayFilters: [{ "elem.moduleId": activeModId }] }
            );
        }

        res.json({ message: "Campaign Created Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/campaigns", verifyToken, async (req, res) => {
    try {
        const campaigns = await Campaign.find();
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/quiz/:category", async (req, res) => {
    try {
        const data = await Quiz.find({ category: req.params.category });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/simulation/:category", verifyToken, async (req, res) => {
    try {
        const categoryMap = {
            "email_phishing": "email",
            "social_media": "social",
            "financial": "financial"
        };
        const mappedCat = categoryMap[req.params.category] || req.params.category;

        const data = await Simulation.aggregate([
            { $match: { category: mappedCat } },
            { $sample: { size: 3 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑 DELETE CAMPAIGN
app.delete("/campaign/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied: Admin Only ❌" });

        const campaign = await Campaign.findById(req.params.id);
        if (campaign) {
            // Reverse targeting: Lock modules for targeted users
            const query = { role: "employee" };
            if (campaign.department !== "All" && campaign.department) query.department = campaign.department;

            const categoryMapping = {
                "Email Scrutiny Phishing": "email_phishing",
                "Financial Phishing": "financial",
                "Social Frauds": "social_media"
            };
            const activeModId = categoryMapping[campaign.template] || campaign.template;

            if (activeModId) {
                await User.updateMany(
                    query,
                    { $set: { "modules.$[elem].enabled": false } },
                    { arrayFilters: [{ "elem.moduleId": activeModId }] }
                );
            }

            await Campaign.findByIdAndDelete(req.params.id);
            return res.json({ message: "Campaign Terminated and Modules Locked ✅" });
        }
        res.status(404).json({ error: "Campaign not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  REAL TIME STATS API
app.get("/stats", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied: Admin Only ❌" });
        const totalEmployees = await User.countDocuments({ role: "employee" });
        const campaigns = await Campaign.find();
        const activeCampaigns = campaigns.length;

        let totalTargeted = 0;
        let totalOpened = 0;
        let totalClicked = 0;

        // Simulate interaction for each campaign
        for (let c of campaigns) {
            // Randomly simulate an open with small probability if not everyone opened
            if (c.opened < c.targetedEmployees && Math.random() > 0.6) {
                const newOpens = Math.floor(Math.random() * 3) + 1; // 1 to 3
                c.opened = Math.min(c.targetedEmployees, c.opened + newOpens);
            }
            // Randomly simulate a click if not everyone who opened has clicked
            if (c.clicked < c.opened && Math.random() > 0.7) {
                const newClicks = Math.floor(Math.random() * 2) + 1; // 1 to 2
                c.clicked = Math.min(c.opened, c.clicked + newClicks);
            }
            await c.save();

            totalTargeted += c.targetedEmployees;
            totalOpened += c.opened;
            totalClicked += c.clicked;
        }

        let clickRate = 0;
        if (totalTargeted > 0) {
            clickRate = ((totalClicked / totalTargeted) * 100).toFixed(1);
        } else {
            clickRate = (0).toFixed(1);
        }

        let riskLevel = "Low";
        if (clickRate > 40) riskLevel = "High";
        else if (clickRate > 15) riskLevel = "Medium";

        // Provide a 6-point history for chart. For realism, just append small variances around clickRate
        const baseRate = parseFloat(clickRate);
        const chartData = [
            Math.max(0, baseRate - 1.2).toFixed(1),
            Math.max(0, baseRate - 0.5).toFixed(1),
            Math.max(0, baseRate + 0.3).toFixed(1),
            Math.max(0, baseRate - 0.8).toFixed(1),
            Math.max(0, baseRate + 0.4).toFixed(1),
            baseRate.toFixed(1)
        ];

        const topCampaigns = campaigns.slice(0, 3).map(c => {
            const openRate = c.targetedEmployees > 0 ? ((c.opened / c.targetedEmployees) * 100).toFixed(1) : 0;
            let risk = "Low";
            if (openRate > 65) risk = "High";
            else if (openRate > 50) risk = "Moderate";
            return { name: c.campaignName, openRate: openRate + "%", risk };
        });

        // Fill if fewer than 3 campaigns
        while (topCampaigns.length < 3) {
            topCampaigns.push({ name: "Pending Deployment", openRate: "0%", risk: "Low" });
        }

        // Calculate risk breakdown based on actual User DB scores
        let lowCount = 0;
        let medCount = 0;
        let highCount = 0;
        const employees = await User.find({ role: "employee" });

        for (let emp of employees) {
            // Need to handle if riskScore is uninitialized for some reason, default 0 -> Low
            if (emp.riskScore > 60) highCount++;
            else if (emp.riskScore > 30) medCount++;
            else lowCount++;
        }

        const totalEmpStats = employees.length > 0 ? employees.length : 1; // avoid division by zero

        const riskBreakdown = {
            low: Math.round((lowCount / totalEmpStats) * 100),
            med: Math.round((medCount / totalEmpStats) * 100),
            high: Math.round((highCount / totalEmpStats) * 100)
        };

        res.json({
            totalEmployees,
            activeCampaigns,
            clickRate,
            riskLevel,
            chartData,
            topCampaigns,
            riskBreakdown
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FETCH EMPLOYEES
app.get("/employees", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied: Admin Only ❌" });
        const employees = await User.find({ role: "employee" }, "-password");


        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  FETCH SINGLE EMPLOYEE BY EMAIL
app.get("/employee/:email", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.email !== req.params.email) return res.status(403).json({ error: "Access Denied ❌" });
        const employee = await User.findOne({ email: req.params.email }, "-password");
        if (employee) {
            // Hydrate legacy users who don't have trainings or phishingStats arrays yet
            let modified = false;
            if (!employee.trainings || employee.trainings.length === 0) {
                const tempUser = new User();
                employee.trainings = tempUser.trainings;
                modified = true;
            }
            if (!employee.phishingStats) {
                employee.phishingStats = { emailsReceived: 0, linksClicked: 0, reportsSubmitted: 0 };
                modified = true;
            }
            if (modified) await employee.save();
        }
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// COMPLETE TRAINING & CALC RISK REDUCTION
app.post("/employee/:email/complete-training", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.email !== req.params.email) return res.status(403).json({ error: "Access Denied ❌" });
        let { moduleId, performanceScore } = req.body;
        // Clamp parameter payload
        performanceScore = Math.max(0, Math.min(100, Number(performanceScore) || 0));

        const employee = await User.findOne({ email: req.params.email, role: "employee" });
        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });

        // Ensure trainings exist for legacy docs
        if (!employee.trainings) employee.trainings = [];

        const tIndex = employee.trainings.findIndex(t => t.id === moduleId);
        if (tIndex === -1) return res.status(404).json({ error: "Training module not found ❌" });

        let training = employee.trainings[tIndex];
        training.score = performanceScore;
        training.attempts += 1;
        training.status = "completed";
        training.completedAt = new Date().toISOString();

        // Calculate riskReduction = base(5) * difficultyWeight * performanceFactor
        let difficultyWeight = 1;
        if (training.difficulty === "medium") difficultyWeight = 1.5;
        if (training.difficulty === "hard") difficultyWeight = 2;

        let performanceFactor = 0.4;
        if (performanceScore >= 80) performanceFactor = 1;
        else if (performanceScore >= 50) performanceFactor = 0.7;

        const riskReduction = Math.round(5 * difficultyWeight * performanceFactor);

        employee.trainings[tIndex] = training;
        employee.markModified("trainings");

        employee.riskScore = Math.max(0, employee.riskScore - riskReduction);
        await employee.save();

        res.json({ message: "Training Completed ✅", riskReduction, newScore: employee.riskScore });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  GAMIFIED TRAINING COMPLETE (XP & STREAK)
app.post("/employee/:email/gamified-complete", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.email !== req.params.email) return res.status(403).json({ error: "Access Denied ❌" });
        const { moduleId, xpEarned, passed } = req.body;

        const employee = await User.findOne({ email: req.params.email, role: "employee" });
        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });

        // Update XP
        employee.xp = (employee.xp || 0) + (xpEarned || 0);

        // Update Streak
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let lastDate = 0;
        if (employee.lastTrainingDate) {
            const ld = new Date(employee.lastTrainingDate);
            lastDate = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate()).getTime();
        }

        const msInDay = 86400000;
        const diffDays = Math.round((today - lastDate) / msInDay);

        if (diffDays === 1) {
            employee.streak = (employee.streak || 0) + 1;
        } else if (diffDays > 1) {
            employee.streak = 1; // Streak broken, restart
        } else if (diffDays === 0 && !employee.streak) {
            employee.streak = 1; // First training ever for the day
        }

        employee.lastTrainingDate = now;

        // Reduce risk score slightly based on XP
        if (passed) {
            const riskReduction = Math.floor((xpEarned || 0) / 50);
            employee.riskScore = Math.max(0, employee.riskScore - riskReduction);

            if (!employee.trainings) employee.trainings = [];
            const tIndex = employee.trainings.findIndex(t => t.id === moduleId);
            if (tIndex >= 0) {
                employee.trainings[tIndex].status = "completed";
                employee.trainings[tIndex].completedAt = now.toISOString();
                employee.markModified("trainings");
            }
        }

        await employee.save();

        res.json({
            message: "Module Completed ✅",
            xp: employee.xp,
            streak: employee.streak,
            riskScore: employee.riskScore
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// SIMULATION INBOX ACTIONS
app.post("/employee/:email/simulation", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.email !== req.params.email) return res.status(403).json({ error: "Access Denied ❌" });
        const { reported, campaignId } = req.body;
        const employee = await User.findOne({ email: req.params.email, role: "employee" });
        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });

        let targetCategory = "General";
        if (campaignId) {
            const campaign = await Campaign.findById(campaignId);
            if (campaign && campaign.category) {
                targetCategory = campaign.category;
            }
        }

        if (!employee.phishingStats) employee.phishingStats = { emailsReceived: 0, linksClicked: 0, reportsSubmitted: 0 };
        if (!employee.categoryFails) employee.categoryFails = {};

        employee.phishingStats.emailsReceived += 1;
        let scoreChange = 0;
        let assignedModule = null;

        if (reported) {
            employee.phishingStats.reportsSubmitted += 1;
            scoreChange = -10;
        } else {
            employee.phishingStats.linksClicked += 1;
            scoreChange = 5;

            // Track Category Fail
            employee.categoryFails[targetCategory] = (employee.categoryFails[targetCategory] || 0) + 1;
            employee.markModified('categoryFails');

            // Re-assign training module dynamically based on campaign category group
            const categoryMapping = {
                "Email Scrutiny Phishing": "email_phishing",
                "Financial Phishing": "financial",
                "Social Frauds": "social_media"
            };

            const moduleId = categoryMapping[targetCategory] || "email_phishing";

            if (employee.modules && employee.modules.length > 0) {
                const tIndex = employee.modules.findIndex(t => t.moduleId === moduleId);
                if (tIndex >= 0) {
                    employee.modules[tIndex].enabled = true; // Unlock the module!

                    employee.markModified('modules');
                    assignedModule = employee.modules[tIndex].title;
                }
            }
        }

        // Apply risk score, capped between 0 and 100
        employee.riskScore = Math.max(0, Math.min(100, (employee.riskScore || 0) + scoreChange));
        await employee.save();
        res.json({
            message: "Simulation logged ✅",
            newScore: employee.riskScore,
            stats: employee.phishingStats,
            assignedTraining: assignedModule
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ASSIGN TRAINING MODULE TO EMPLOYEE
app.post("/admin/assign-training", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied: Admin Only ❌" });
        const { targetEmail, trainingModule } = req.body;
        const employee = await User.findOne({ email: targetEmail, role: "employee" });
        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });
        if (!employee.trainings) employee.trainings = [];

        // Prevent exact duplicate ID assignment unless intentional, but for now just push
        const existingIndex = employee.trainings.findIndex(t => t.id === trainingModule.id);
        if (existingIndex >= 0) {
            // overwrite or ignore? let's overwrite to re-assign
            employee.trainings[existingIndex] = trainingModule;
        } else {
            employee.trainings.push(trainingModule);
        }

        employee.markModified("trainings");
        await employee.save();
        res.json({ message: "Training Assigned ✅", trainings: employee.trainings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FETCH LEADERBOARD
app.get("/leaderboard", verifyToken, async (req, res) => {
    try {
        const users = await User.find({ role: "employee" })
            .select("name department xp streak badges riskScore")
            .sort({ xp: -1 })
            .limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FETCH DYNAMIC TRAINING MODULES
app.get("/employee/:email/modules", verifyToken, async (req, res) => {
    try {
        const employee = await User.findOne({ email: req.params.email });
        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });
        res.json({ modules: employee.modules });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  COMPLETE TASK IN MODULE
app.post("/employee/:email/complete-task", verifyToken, async (req, res) => {
    try {
        const { moduleId, taskType, earnedXp } = req.body;
        const employee = await User.findOne({ email: req.params.email });

        if (!employee) return res.status(404).json({ error: "Employee not found ❌" });

        let xpEarned = 0;
        let taskFound = false;

        // Iterate modules to update the specific task completion
        if (employee.modules && employee.modules.length > 0) {
            employee.modules.forEach(mod => {
                if (mod.moduleId === moduleId) {
                    mod.tasks.forEach(task => {
                        if (task.type === taskType && !task.completed) {
                            task.completed = true;
                            xpEarned = earnedXp !== undefined ? earnedXp : task.xp;
                            taskFound = true;
                        }
                    });
                }
            });
        }

        if (taskFound) {
            employee.xp += xpEarned;

            // Streak Logic Calculation
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            let lastDate = 0;
            if (employee.lastTrainingDate) {
                const ld = new Date(employee.lastTrainingDate);
                lastDate = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate()).getTime();
            }

            const msInDay = 86400000;
            const diffDays = Math.round((today - lastDate) / msInDay);

            if (diffDays === 1) {
                employee.streak = (employee.streak || 0) + 1;
            } else if (diffDays > 1) {
                employee.streak = 1; // Streak broken, restart
            } else if (diffDays === 0 && !employee.streak) {
                employee.streak = 1; // First training ever for the day
            }
            employee.lastTrainingDate = now;

            // Dynamic Risk Tracking
            let riskMod = 0;
            if (taskType === 'simulation' && xpEarned === 0) {
                riskMod = 5; // Penalty for failing a simulation completely
            } else if (xpEarned > 0) {
                riskMod = -Math.floor(xpEarned / 20); // Minor reduction for successfully completing tasks
            }

            // Check if entire module is completed to subtract 15 Risk
            let riskReduction = 0;
            const targetMod = employee.modules.find(m => m.moduleId === moduleId);
            if (targetMod) {
                const allCompleted = targetMod.tasks.every(t => t.completed);
                if (allCompleted) {
                    riskReduction = 15;
                }
            }

            employee.riskScore = Math.max(0, Math.min(100, (employee.riskScore || 0) + riskMod - riskReduction));

            // Re-save (mongoose mixed array element update triggers modified path)
            employee.markModified('modules');
            await employee.save();

            res.json({
                message: "Task completed ✅",
                xp: employee.xp,
                xpEarned: xpEarned,
                modules: employee.modules,
                riskScore: employee.riskScore
            });
        } else {
            res.json({ message: "Task already completed or not found.", xp: employee.xp });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: ADD EMPLOYEE MANUALLY
app.post("/admin/employee", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied ❌" });
        const { name, email, password, department } = req.body;

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) return res.status(400).json({ error: "Name must contain only letters and spaces ❌" });

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|in|io)$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email domain. Please use a valid top-level domain ❌" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name, email, role: "employee", department, password: hashedPassword
        });
        await newUser.save();
        res.json({ message: "Employee Created Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: DELETE EMPLOYEE MANUALLY
app.delete("/admin/employee/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Access Denied ❌" });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Employee Deleted Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
