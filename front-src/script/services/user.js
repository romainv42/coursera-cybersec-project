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
        return securedRequest({
            url: "/api/cookie/check",
            method: "get",
        })
    },
    logout: () => {
        return securedRequest({
            url: "/api/users/logout",
            method: "get",
        })
    },
    forgotPassword: (login) => {
        return securedRequest({
            url: "/api/users/forgot-password",
            method: "post",
            body: {
                login,
            }
        })
    },
    passwordReset: (body) => {
        return securedRequest({
            url: "/api/users/password-reset",
            method: "post",
            body,
        })
    }
}

