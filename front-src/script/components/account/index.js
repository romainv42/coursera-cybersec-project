import { Password } from "./password"
import { Authenticators } from "./authenticators"
import { Login } from "./login"
import { Loader } from "../global"
import Services from "../../services"


const MyAccount = {
    load: async function () {
        this.loading = true
        try {
            const { login, email } = await Services.Accounts.getLoginInfo()
            this.login = login
            this.email = email

            const result = await Services.Accounts.getAuthModes()
            this.hasPassword = result["has-password"]
            this.authenticators = result.authenticators
        } finally {
            this.loading = false
        }
    },
    oninit: function () {
        this.load()
    },
    view: function () {
        return m("article.my-account", [
            m("h3", "Account settings"),
            ...(this.loading ? [m(Loader)] : [
                m("p", m("i", "To edit something, click on corresponding pen")),
                m(Login, { login: this.login, email: this.email, loading: this.loading }),
                m(Password, { hasPassword: this.hasPassword, loading: this.loading }),
                m(Authenticators, { login: this.login, authenticators: this.authenticators, loading: this.loading, onrefresh: () => this.load() }),
            ]),
        ])
    }
}

export { MyAccount }