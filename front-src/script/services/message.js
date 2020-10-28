import securedRequest from "./secured"

export default {
    list: () => {
        return securedRequest({
            url: "/api/messages/list",
            method: "get",
        })
    },
    send: (message, recipient) => {
        return securedRequest({
            url: "/api/messages/send",
            method: "post",
            body: {
                message,
                recipient,
            }
        })
    }
}