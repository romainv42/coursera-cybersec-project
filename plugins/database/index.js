const fastifyPlugin = require("fastify-plugin")
const { Client, Pool } = require("pg")

/**
 * Creating a Plugin to provide a database helper in each other plugin and routes
 * @param {*} fastify Fastify instance
 * @param {*} options Options containing db connection information
 */
const databaseHelper = function (fastify, options, done) {
    const {
        connectionString,
        user,
        password,
        database,
        server,
        port,
    } = options
    const pool = new Pool({
        ...(connectionString ? { connectionString } : {
            user,
            host: server,
            database,
            password,
            port: port || 5432,
        })
    })

    fastify.onClose(() => {
        fastify.log.info("Disconnecting from DB")
        pool.end()
    })

    const helper = {
        users: require("./queries/user")(pool),
    }

    fastify.decorate("dbHelper", helper)
    done()
}

module.exports = fastifyPlugin(databaseHelper)