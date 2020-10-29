import services from "../../services"
import { Loader } from "../global"
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i

const Login = {
    updateEmail: async function () {
        this.errors = null
        if (!this.email) {
            return this.errors.email = "Please enter an email address"
        }

        if (!emailRegex.test(this.email)) {
            return this.errors.email = "This seems not to be a valid address"
        }

        if (confirm(`By changing your email address, you will be disconnected and 
        you will not be able to reconnect until you have validated your new address.
        
        Do you confirm you want to change your email address?`)) {
            try {
                this.loading = true
                await services.Accounts.updateEmail(this.email)
                m.route.set("/logout")
            } catch (e) {
                console.error(e)
                this.errors.email = "An error occured"
            } finally {
                this.loading = false
            }
        }
    },
    loading: false,
    mailEdit: false,
    oninit: function ({ attrs }) {
        const { login, email, loading } = attrs
        this.login = login
        this.email = email
        this.loading = loading
    },
    view: function ({ attrs }) {
        return m("section.login-info", [
            m("h5", "Connection info"),
            ...(this.loading ? [m(Loader)] : [
                m("div.form-row", [
                    m("label[for=ac-login]", [
                        "Login:",
                    ]),
                    m("input#ac-login[type=text][placeholder=your login][maxlength=16][readonly=1]", {
                        value: this.login,
                        onchange: (e) => {
                            this.login = e.target.value
                        },
                    }),
                ]),
                m("div.form-row", [
                    m("label[for=ac-email]", [
                        "Email: ",
                        ...(!this.mailEdit ? [m("i.fas.fa-pen", { onclick: () => this.mailEdit = true })] : [])
                    ]),
                    m("input#ac-email[type=text][placeholder=your email][maxlength=255]", {
                        readonly: !this.mailEdit,
                        value: this.email,
                        onchange: (e) => {
                            this.email = e.target.value
                        },
                    }),
                    ...(this.errors && this.errors.email ? [m("span.error", this.errors.email)] : []),
                    ...(this.mailEdit ? [
                        m("button[type=button].button.is-danger.is-small", { onclick: () => this.updateEmail() }, "Update email")
                    ] : [])
                ]),
            ])
        ])
    }
}

export { Login }