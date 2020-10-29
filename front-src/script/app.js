import { crsfInit } from "./services/secured"
import Services from "./services"
import store from "./store"
import { Register, Signin } from "./components/user"
import { Welcome } from "./components/welcome"
import { Layout } from "./components/global"
import {
    EmailVerified,
    WrongEmail,
} from "./components/emails"
import { Logout } from "./components/logout"
import { Inbox } from "./components/inbox"
import { Disconnected } from "./components/disconnected"
import { ResetPassword } from "./components/changePassword/reset"

const root = document.getElementById("rvapp")
    ;

const cookieParser = () => document.cookie.split(';')
    .map(c => {
        const name = c.splice(0, c.indexOf("="))
        return {
            [name.trim()]: c
        }
    })
    .reduce((a, c) => ({ ...a, ...c }), {})
    ;

(async function init() {
    m.route.prefix = ""
    try {
        await crsfInit()
        if (sessionStorage.getItem("token") || cookieParser()["capstone-token"]) {
            const result = await Services.Users.checkCookie()
            store.User.username = result.username
            store.User.isLogged = true
        }
    } catch (e) {
    } finally {
        m.route(root, "/", {
            "/": { render: () => m(Layout, m(Welcome)) },
            "/sign": { render: () => m(Layout, m(Signin)) },
            "/register": { render: () => m(Layout, m(Register)) },
            "/email-verified": { render: () => m(Layout, m(EmailVerified)) },
            "/wrong-email": { render: () => m(Layout, m(WrongEmail)) },
            "/logout": { render: () => m(Layout, m(Logout)) },
            "/inbox": { render: () => m(Layout, m(Inbox)) },
            "/disconnected": { render: () => m(Layout, m(Disconnected)) },
            "/forgot-password": { render: ({ attrs }) => m(Layout, m(ResetPassword, attrs)) },
        })
    }
})()
