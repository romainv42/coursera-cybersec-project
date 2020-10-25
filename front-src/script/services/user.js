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
    }
}