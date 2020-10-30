import store from "../../store"
import Services from "../../services"
import { Loader } from "../global"

const Logout = {
    oninit: async () => {
        if (store.User.isLogged) {
            await Services.Users.logout()
            delete store.User.username
            store.User.isLogged = false
            sessionStorage.removeItem("token")
        }
        m.route.set("/")
    },
    view: () => {
        return m("div", [
            m("p", [
                m("i.fas.fa-clock"),
                " Please wait, you'll be redirected..."
            ]),
            m(Loader),
        ])
    }
}

export { Logout }