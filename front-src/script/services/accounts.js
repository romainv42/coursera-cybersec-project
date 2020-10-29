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
            method: "post",
            body: {
                credID,
            },
        })
    }
}