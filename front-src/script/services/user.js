import securedRequest from "./secured"

export default {
    exists: (login, email) => {
        return securedRequest({
            url: "/api/users/exists",
            method: "get",
            params: {
                login,
                email,
            }
        })
    },
    register: (user) => {
        return securedRequest({
            url: "/api/users/register",
            method: "post",
            body: user
        })
    },
    webauthnChallenge: (login) => {
        return securedRequest({
            url: "/api/users/webauthn-challenge",
            method: "post",
            body: {
                login,
            }
        })
    },
    signIn: (login) => {
        return securedRequest({
            url: "/api/users/sign-in",
            method: "post",
            body: {
                login,
            }
        })
    },
    identify: (credentials) => {
        return securedRequest({
            url: "/api/users/identify",
            method: "post",
            body: credentials,
        })
    },
    checkCookie: () => {
        return m.request({
            url: "/api/cookie/check",
            method: "get",
        })
    },
    logout: () => {
        return securedRequest({
            url: "/api/users/logout",
            method: "get",
        })
    }
}

