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

const root = document.getElementById("rvapp")
    ;
(async function init() {
    try {
        const result = await Services.Users.checkCookie()
        store.User.username = result.username
        store.User.isLogged = true
    } catch (e) {
        
    } finally {
        m.route.prefix = ""
        m.route(root, "/", {
            "/": { render: () => m(Layout, m(Welcome)) },
            "/sign": { render: () => m(Layout, m(Signin)) },
            "/register": { render: () => m(Layout, m(Register)) },
            "/email-verified": { render: () => m(Layout, m(EmailVerified)) },
            "/wrong-email": { render: () => m(Layout, m(WrongEmail)) },
            "/logout": { render: () => m(Layout, m(Logout)) },
        })
    }
})()
