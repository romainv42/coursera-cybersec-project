let csrfToken

const CSRF_H_KEY = "x-csrf-token"
    ;

const securedRequest = async (options) => {
    let currentXhr
    try {
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
    } catch (_) {
        location.reload()
    }
}

(() => securedRequest({
    url: "/api/csrf",
    method: "get",
}))()

export default securedRequest