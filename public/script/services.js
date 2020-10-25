let csrfToken

const CSRF_H_KEY = "x-csrf-token"
;

const securedRequest = async (options) => {
    let currentXhr
    const result = await m.request({
        ...options,
        headers: {
            ...(options.headers || {}),
            [CSRF_H_KEY]: csrfToken,
        },
        config: (xhr) => currentXhr = xhr,
    })
    const token = currentXhr.getResponseHeader(CSRF_H_KEY)
    csrfToken = token
    return result
}

(() => securedRequest({
    url: "/api/csrf",
    method: "get",
}))()


const Services = {
    Users: {
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
        }
    },
}