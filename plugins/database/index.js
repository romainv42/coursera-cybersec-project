const fastifyPlugin = require("fastify-plugin")
const { Client, Pool } = require("pg")

/**
 * Creating a Plugin to provide a database helper in each other plugin and routes
 * @param {*} fastify Fastify instance
 * @param {*} options Options containing db connection information
 */
async function databaseHelper (fastify, options) {
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

    require("./queries/config")(pool).configure()

    const helper = {
        dump: require("./queries/dump")(pool),
        users: require("./queries/user")(pool),
        emails: require("./queries/emails")(pool),
        session: require("./queries/session")(pool),
        messages: require("./queries/message")(pool),
    }

    fastify.decorate("dbHelper", helper)
}

module.exports = fastifyPlugin(databaseHelper)