const express = require("express");
const mongoose = require("mongoose");
const { Account } = require("../db");
const { auth } = require("./middleware");

const router = express.Router();

router.get("/balance", auth, async (req, res) => {
    const userId = req.userId
    const account = await Account.findOne({
        userId: userId
    });
    res.status(200).json({
        balance: account.balance
    })
});

router.post("/transfer", auth, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;
    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(403).json({
            message: "insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "invalid recivers account"
        });
    }

    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount }}).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: +amount } }).session(session);

    await session.commitTransaction();
    res.status(200).json({
        message: "transaction successful"
    });
});

module.exports = router;