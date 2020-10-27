module.exports = function (pool) {
    const co = pool

    return {
        dumpAll: async () => {
            return co.query(`SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name DESC`)
        },
        dumpOne: (tableName) => {
            return co.query(`SELECT * FROM ${tableName}`)
        }
    }
}