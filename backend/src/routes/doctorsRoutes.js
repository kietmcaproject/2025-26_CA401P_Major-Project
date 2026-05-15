const express = require("express");
const { listDoctorsController } = require("../controllers/doctorsController");

const router = express.Router();

router.get("/", listDoctorsController);

module.exports = router;
