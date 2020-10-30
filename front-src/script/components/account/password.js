import { Loader } from "../global"
import Services from "../../services"

const Password = {
    passwordUpdate: async function () {
        if (this.hasPassword && !this.oldPassword) {
            this.errors = {
                ...this.errors,
                oldPassword: "Required!"
            }
        }

        if (!this.newPassword) {
            this.errors = {
                ...this.errors,
                newPassword: "Required!"
            }
        }
        if (!this.confirmPwd) {
            this.errors = {
                ...this.errors,
                confirmPwd: "Required!"
            }
        }
        if (this.errors) throw this.errors

        if (this.newPassword.length < 8) {
            this.errors = {
                ...this.errors,
                newPassword: "Password length must be more or equal than 8."
            }
            throw this.errors
        }

        if (
            !/[a-z]+/.test(this.newPassword) ||
            !/[A-Z]+/.test(this.newPassword) ||
            !/[0-9]+/.test(this.newPassword) ||
            !/[^a-zA-Z0-9]+/.test(this.newPassword)
        ) {
            console.log(this,newPassword)
            this.errors = {
                ...this.errors,
                newPassword: "Password should contains at least a lowercase char, an uppercase one, a number and a symbol."
            }
            throw this.errors
        }

        if (this.newPassword !== this.confirmPwd) {
            this.errors = {
                ...this.errors,
                confirmPwd: "Password and confirmation are different."
            }
            throw this.errors
        }

        try {
            this.loading = true
            await Services.Accounts.updatePassword({
                ...(this.hasPassword && { oldPassword: this.oldPassword }),
                newPassword: this.newPassword,
                confirmPwd: this.confirmPwd,
            })
            this.success = true
            this.passwordEdit = false
            this.hasPassword = true
        } catch (e) {
            console.error(e)
            this.errors = {
                ...this.errors,
                general: "An error occured. Please verify your inputs and retry."
            }
        } finally {
            this.loading = false
        }

    },
    passwordEdit: false,
    oninit: function ({ attrs }) {
        const { loading, hasPassword } = attrs
        this.loading = loading
        this.hasPassword = hasPassword
    },
    view: function ({ attrs }) {
        return m("section.auth-info", [
            m("h5", "Password"),
            ...(this.loading ? [m(Loader)] : [
                ...(!this.passwordEdit ? [
                    m("p", [
                        ...(this.hasPassword ? ["A password has been set"] : ["There is no password set"]),
                        m("i.fas.fa-pen", { onclick: () => this.passwordEdit = true })
                    ])
                ] : [
                        ...(this.hasPassword ? [
                            m("div.form-row", [
                                m("label[for=re-old-password].required", [
                                    "Password:",
                                ]),
                                m("input#re-old-password[type=password][placeholder=your current password]", {
                                    value: this.oldPassword,
                                    onchange: (e) => this.oldPassword = e.target.value,
                                }),
                                ...(this.errors && this.errors.oldPassword ? [m("span.error", this.errors.oldPassword)] : [])
                            ]),
                        ] : []),
                        m("div.form-row", [
                            m("label[for=re-password].required", [
                                "Password:",
                            ]),
                            m("input#re-password[type=password][placeholder=your password]", {
                                value: this.newPassword,
                                onchange: (e) => this.newPassword = e.target.value,
                            }),
                            ...(this.errors && this.errors.newPassword ? [m("span.error", this.errors.newPassword)] : [])
                        ]),
                        m("div.form-row", [
                            m("label[for=re-confirm-password].required", [
                                "Confirm your password:",
                            ]),
                            m("input#re-confirm-password[type=password][placeholder=confirmation]", {
                                value: this.confirmPwd,
                                onchange: (e) => this.confirmPwd = e.target.value,
                            }),
                            ...(this.errors && this.errors.confirmPwd ? [m("span.error", this.errors.confirmPwd)] : [])
                        ]),
                        m("div", [
                            m("button[type=button].button.is-danger.is-small", {
                                onclick: () => this.passwordUpdate()
                            }, "Update password"),
                        ]),
                    ])
            ])
        ])
    }
}

export { Password }