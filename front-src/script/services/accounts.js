import securedRequest from "./secured"

export default {
    getLoginInfo: () => {
        return securedRequest({
            url: "/api/accounts/login",
            method: "get",
        })
    },
    getAuthModes: () => {
        return securedRequest({
            url: "/api/accounts/auth-modes",
            method: "get",
        })
    },
    updateEmail: (email) => {
        return securedRequest({
            url: "/api/accounts/update/email",
            method: "post",
            body: {
                email,
            }
        })
    },
    updateDevices: (authenticators) => {
        return securedRequest({
            url: "/api/accounts/devices/update",
            method: "post",
            body: {
                authenticators,
            }
        })
    },
    updatePassword: (body) => {
        return securedRequest({
            url: "/api/users/password-change",
            method: "post",
            body,
        })
    },
    deleteAuthr: (credID) => {
        return securedRequest({
            url: "/api/accounts/devices/delete",
            method: "delete",
            body: {
                credID,
            },
        })
    },
    getNew2FA: () => {
        return securedRequest({
            url: "/api/accounts/2fa/new",
            method: "get",
        })
    },
    sendTopt: (totp, name) => {
        return securedRequest({
            url: "/api/accounts/2fa/save",
            method: "post",
            body: {
                totp,
                name,
            }
        })
    },
    get2FA: () => {
        return securedRequest({
            url: "/api/accounts/2fa",
            method: "get",
        })
    },
    delete2FA: (id) => {
        return securedRequest({
            url: "/api/accounts/2fa",
            method: "delete",
            body: {
                id,
            },
        })
    },
    update2FA: (twoFAs) => {
        return securedRequest({
            url: "/api/accounts/2fa/update",
            method: "post",
            body: twoFAs
        })
    }
}