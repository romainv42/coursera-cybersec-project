const crypto = require("crypto")

const base64url = (base64) => {
    return base64.replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

const randomBase64 = (length) => {
    return crypto.randomBytes(length).toString("base64")
}

const key = Buffer.from(process.env.HMAC, "base64")
const hmac = (pwd) => {
    return crypto.createHmac("sha256", key)
        .update(pwd).digest("base64")
}

const checkAndConvert = (data, encoding) => {
    if (!Buffer.isBuffer(data)) {
        if (!encoding) {
            throw "Data must be a Buffer or a string with encoding option set!"
        }
        return Buffer.from(data, encoding)
    }
    return data
}


module.exports = {
    base64url,
    randomBase64,
    hmac,
    checkAndConvert,
} 

