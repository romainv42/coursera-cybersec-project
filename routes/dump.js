const { table } = require("console")
const fs = require("fs")
const { Duplex } = require("stream")

class DumpableStream extends Duplex {
    constructor() {
        super()
        this.data = []

        this.on("finish", () => this.emit("end"))
    }
    write(chunk) {
        this.data.push(...chunk.split(""))
    }

    _read(n) {
        this.push(this.data.splice(0, n).join(""))
    }
}

module.exports = async function (fastify) {
    const { dbHelper } = fastify
    fastify.get("/dbdump", async (req, res) => {
        const { rows: tables } = await dbHelper.dump.dumpAll()
        const duplex = new DumpableStream()

        for (let { table_name } of tables) {
            const data = await dbHelper.dump.dumpOne(table_name)
            duplex.write(`
-----------------------------------------
             ${table_name}                
-----------------------------------------
`)

            const fields = []
            for (let f of data.fields) {
                fields.push(f.name)
                duplex.write(`${f.name}\t`)
            }
            duplex.write("\n")
            for (let row of data.rows) {
                duplex.write(`${fields.map(f => row[f]).join("\t")}\n`)
            }

            duplex.write(`
-----------------------------------------
        END OF ${table_name}                
-----------------------------------------

`)

        }

        res.header("Content-Type", "text/tsv")
            .header("Content-Disposition", "attachment; filename=dump.tsv")
            .send(duplex)
        duplex.end()
    })
}
