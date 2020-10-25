/**
 * LICENCE
 * This Part is largely inspired from a Workshop by FIDO-Alliance
 * The slide: https://slides.com/fidoalliance/jan-2018-fido-seminar-webauthn-tutorial
 * And the source code: https://github.com/fido-alliance/webauthn-demo
 */
const crypto = require("crypto")

const cbor = require("cbor")

/**
 * U2F Presence constant
 */
const U2F_USER_PRESENTED = 0x01;

/**
 * Convert binary certificate or public key to an OpenSSL-compatible PEM text format.
 * @param  {Buffer} buffer - Cert or PubKey buffer
 * @return {String}             - PEM
 */
const ASN1toPEM = (pkBuffer) => {
    if (!Buffer.isBuffer(pkBuffer))
        throw new Error("ASN1toPEM: pkBuffer must be Buffer.")

    let type;
    if (pkBuffer.length == 65 && pkBuffer[0] == 0x04) {
        /*
            If needed, we encode rawpublic key to ASN structure, adding metadata:
            SEQUENCE {
              SEQUENCE {
                 OBJECTIDENTIFIER 1.2.840.10045.2.1 (ecPublicKey)
                 OBJECTIDENTIFIER 1.2.840.10045.3.1.7 (P-256)
              }
              BITSTRING <raw public key>
            }
            Luckily, to do that, we just need to prefix it with constant 26 bytes (metadata is constant).
        */

        pkBuffer = Buffer.concat([
            new Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"),
            pkBuffer
        ]);

        type = 'PUBLIC KEY';
    } else {
        type = 'CERTIFICATE';
    }

    const b64cert = pkBuffer.toString('base64');

    const PEMKey = '';
    for (let i = 0; i < Math.ceil(b64cert.length / 64); i++) {
        const start = 64 * i;

        PEMKey += b64cert.substr(start, 64) + '\n';
    }

    PEMKey = `-----BEGIN ${type}-----\n` + PEMKey + `-----END ${type}-----\n`;

    return PEMKey
}

/**
 * Takes COSE encoded public key and converts it to RAW PKCS ECDHA key
 * @param  {Buffer} COSEPublicKey - COSE encoded public key
 * @return {Buffer}               - RAW PKCS encoded public key
 */
const COSEECDHAtoPKCS = (COSEPublicKey) => {
    /* 
       +------+-------+-------+---------+----------------------------------+
       | name | key   | label | type    | description                      |
       |      | type  |       |         |                                  |
       +------+-------+-------+---------+----------------------------------+
       | crv  | 2     | -1    | int /   | EC Curve identifier - Taken from |
       |      |       |       | tstr    | the COSE Curves registry         |
       |      |       |       |         |                                  |
       | x    | 2     | -2    | bstr    | X Coordinate                     |
       |      |       |       |         |                                  |
       | y    | 2     | -3    | bstr /  | Y Coordinate                     |
       |      |       |       | bool    |                                  |
       |      |       |       |         |                                  |
       | d    | 2     | -4    | bstr    | Private key                      |
       +------+-------+-------+---------+----------------------------------+
    */

    const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
    const tag = Buffer.from([0x04]);
    const x = coseStruct.get(-2);
    const y = coseStruct.get(-3);

    return Buffer.concat([tag, x, y])
}


const parseMakeCredAuthData = (buffer) => {
    const rpIdHash = buffer.slice(0, 32)
    buffer = buffer.slice(32)

    const flagsBuf = buffer.slice(0, 1)
    buffer = buffer.slice(1)

    const flags = flagsBuf[0]

    const counterBuf = buffer.slice(0, 4)
    buffer = buffer.slice(4)

    const counter = counterBuf.readUInt32BE(0)

    const aaguid = buffer.slice(0, 16)
    buffer = buffer.slice(16)

    const credIDLenBuf = buffer.slice(0, 2)
    buffer = buffer.slice(2)

    const credIDLen = credIDLenBuf.readUInt16BE(0)

    const credID = buffer.slice(0, credIDLen)
    buffer = buffer.slice(credIDLen)

    const COSEPublicKey = buffer

    return {
        rpIdHash,
        flagsBuf,
        flags,
        counter,
        counterBuf,
        aaguid,
        credID,
        COSEPublicKey
    }
}

const verifyAttestation = ({ attestationObject, clientDataJSON }) => {
    if (!attestationObject) throw {
        statusCode: 400,
        error: "Wrong payload: attestation object missing",
    }

    const buffer = Buffer.from(attestationObject, "base64")
    const ctap = cbor.decodeAllSync(buffer)[0]
    console.log(ctap)
    if (ctap.fmt === "fido-u2f") {
        const data = parseMakeCredAuthData(ctap.authData)
        if (!(data.flags & U2F_USER_PRESENTED)) {
            throw {
                statusCode: 400,
                error: "User was NOT presented durring authentication!",
            }
        }

        const clientHash = crypto.createHash("sha256")
            .update(Buffer.from(clientDataJSON, "base64"))
            .digest()

        const reservedByte = Buffer.from([0x00]);
        const publicKey = COSEECDHAtoPKCS(data.COSEPublicKey)
        const signatureBase = Buffer.concat([
            reservedByte,
            data.rpIdHash,
            clientHash,
            data.credID,
            publicKey
        ]);

        const PEMCertificate = ASN1toPEM(ctap.attStmt.x5c[0]);
        const signature = ctap.attStmt.sig;

        console.log("PEM", PEMCertificate)

        if (verifySignature(signature, signatureBase, PEMCertificate)) {
            return {
                fmt: 'fido-u2f',
                publicKey: publicKey,
                counter: data.counter,
                credID: data.credID
            }
        }
    }
}

module.exports = {
    verifyAttestation,
}