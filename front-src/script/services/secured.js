let csrfToken

const CSRF_H_KEY = "x-csrf-token"
    ;

const securedRequest = async (options) => {
    const jwtToken = sessionStorage.getItem("token")
    let currentXhr
    try {
        const result = await m.request({
            ...options,
            headers: {
                ...(options.headers || {}),
                [CSRF_H_KEY]: csrfToken,
                ...(!jwtToken || { authorization: `Bearer ${jwtToken}`})
            },
            config: (xhr) => currentXhr = xhr,
        })

        return result
    } catch (error) {
        if (error.code === 412) {
            location.reload()
        }
        if (error.code === 401) {
            if (jwtToken) {
                sessionStorage.removeItem("token")
            }
            m.route.set("/disconnect")
        }
    } finally {
        const token = currentXhr.getResponseHeader(CSRF_H_KEY)
        csrfToken = token
    }
}

export default securedRequest
export function crsfInit() {
    return securedRequest({
        url: "/api/csrf",
        method: "get",
    })
}