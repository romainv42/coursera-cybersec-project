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
        .update(pwd)
}


module.exports = {
    base64url,
    randomBase64,
    hmac,
} 

