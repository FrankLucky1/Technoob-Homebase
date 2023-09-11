const queue = require('../../Server/azure_Queue/init');
const honeybadger = require('../../Server/utils/honeybadger');

module.exports = {

    async deleteExpiredJobs(context) {
        try {
         await queue.sendMessage({
                name: "deleteExpiredJobs",
                import: "../services",
                service: "jobs",
                method: "deleteExpiredJobs"
           })
            honeybadger.notify({
                name: "deleteExpiredJobs",
                message: "Initiated Delete Expired Jobs"
           })
        } catch (err) {
            context.log(err)
            throw err
        }
},
};