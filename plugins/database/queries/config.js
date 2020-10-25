const queries = [
    `CREATE SEQUENCE IF NOT EXISTS  "Users_user_id_seq"  START 1`,
    `CREATE TABLE IF NOT EXISTS  "public"."users" (
        "user_id" integer DEFAULT nextval('"Users_user_id_seq"') NOT NULL,
        "login" character varying(16) NOT NULL,
        "email" character varying(255) NOT NULL,
        "moreInfo" text,
        "changePassword" boolean DEFAULT false NOT NULL,
        "validated" boolean DEFAULT false NOT NULL,
        CONSTRAINT "Users_email" UNIQUE ("email"),
        CONSTRAINT "Users_login" UNIQUE ("login"),
        CONSTRAINT "Users_user_id" PRIMARY KEY ("user_id")
        ) WITH (oids = false);`,
    `CREATE TABLE IF NOT EXISTS "public"."password" (
        "user_id" integer NOT NULL,
        "hashed" bytea NOT NULL,
        CONSTRAINT "password_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE
    ) WITH (oids = false);`,
]

/**
 * This module will create tables and other items in the database at the startup.
 * It will not erase any data already saved.
 * @param {*} pool Db Connection pool
 */
module.exports = function (pool) {
    const co = pool

    return {
        configure: async () => {
            for (q of queries) {
                await co.query(q)
            }
        }
    }
}