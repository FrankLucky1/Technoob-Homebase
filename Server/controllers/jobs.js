const services = require('../services/index');
const jobs = services.jobs;

module.exports = {
     async get_all (req, res) {
        const query = req.query
        try {
            const job = await jobs.get_all(query)
            res.status(200).json({
                status: "success",
                message: `${job.count} Job(s) retrieved`,
                data: job
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async get(req, res, next) {
        const id = req.params.id
        const user = req.user?._id || 0
        try {
            const job = await jobs.get(id,user)
            res.status(200).json({
                status: "success",
                message: `Job retrieved`,
                data: job
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async getMetrics(req, res, next) {
        try {
            const jobsMetrics = await jobs.getMetrics()
            res.status(200).json({
                status: "success",
                message: `Job metrics retrieved`,
                data: jobsMetrics
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async create (req, res, next) {
        const payload = req.body

        payload.uploader_id = req.user?._id

        if (!payload.uploader_id) {
            throw new Error("Invalid user")
        }
        try {
            const job = await jobs.create(payload)
            res.status(200).json({
                status: "success",
                message: `Job created`,
                data: job
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async count(req, res, next) {
        try {
            const count = await jobs.count()
            res.status(200).json({
                status: "success",
                message: `job count`,
                data: count
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async remove(req, res, next) {
        const id = req.params.id
        try {
            await jobs.remove(id, req.user?._id )
            res.status(200).json({
                status: "success",
                message: `Job deleted`
            })
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message
            })
        }
    },

    async getActivity(req, res, next) {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10

        try {
            const activity = await jobs.activity(page,limit)
            res.status(200).json({
                status: "success",
                data: activity
            })
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            })
        }
    },

    async scrape(req, res) {

        const { searchTag, q, posted, expires } = req.body;

        try {
            const jobScraped = await jobs.createScrapedJobs({ searchTag, q, posted, expires })
            res.status(201).json({
                status: "success",
                data: jobScraped
            })
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            })
        }
    },


}