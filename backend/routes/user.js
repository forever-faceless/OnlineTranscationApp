const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRETS } = require("../config")
const { User, Account } = require("../db");
const router = express.Router();
const { auth } = require("./middleware");

const signupSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
    phoneNumber: zod.string().length(10)
})

router.post("/signup", async (req, res) => {
    const body = req.body;
    const { success } = signupSchema.safeParse(body);
    if (!success) {
        return res.status(411).json({
            message: "Incorrect Inputs"
        })
    }

    let user = await User.findOne({
        username: body.username
    })

    if (user) {
        return res.status(411).json({
            message: "you are already signed up! go ahead and signin "
        })
    }

    user = await User.create(body);
    const token = jwt.sign({
        userId: user._id
    }, JWT_SECRETS);

    const userId = user._id

    await Account.create({
        userId,
        balance: 1000 + Math.random()*10000
    })

    res.status(200).set("authorization", `Bearer ${token}`).json({
        message: "you are all signed up continue signing in",
        token: token
    })
})

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
})

router.post("/signin", async (req, res) => {
    const body = req.body
    const { success } = signinSchema.safeParse(body);

    if (!success) {
        return res.status(411).json({
            message: "invalid input"
        })
    }

    const user = await User.findOne({
        username: body.username,
        password: body.password
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRETS);

        return res.status(200).set("authorization", `Bearer ${token}`).json({
            message: "signin successful",
            token: token
        })
    }

    res.status(411).json({
        message: "signin attempt failed!"
    })

})

const updateUser = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    phoneNumber: zod.string().length(10).optional()
})

router.put("/", auth, async (req, res) => {
    const { success } = updateUser.safeParse(req.body);
    if (!success) {
        res.status(403).json({
            message: "error updating account infro (check your password length)"
        })
    }
    await User.updateOne({ _id: req.userId }, req.body);

    res.status(200).json({
        message: "Accoutn information updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";
    const users = await User.find({
        $or: [{
            firstName: {
                $regex: filter, $options: "i"
            }
        }, {
            lastName: {
                $regex: filter, $options: "i"
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            _id: user._id
        }))
    })
})

module.exports = router;