import Services from "../../services"

const ResetPassword = {
    authenticationMode: null,
    switchToPwd: function () {
        this.authenticationMode = "PWD"
    },
    switchToWAN: function () {
        this.authenticationMode = "WAN"
    },
    oninit: function (vnode) {
        this.token = vnode.attrs.token
    },
    validate: async function () {
        this.errors = null
        if (!this.login) {
            this.errors = {
                ...this.errors,
                login: "Please enter your login!"
            }
        }

        if (!this.authenticationMode) {
            this.errors = {
                ...this.errors,
                auth: "Please select an authentication mode !"
            }
        }
        if (this.errors) return;

        const validMethod = this.authenticationMode === "PWD" ? "validatePwd" : "initiateWebAuthN"
        try {

            const data = {
                ...(await this[validMethod]()),
                token: this.token,
                login: this.login,
            }

            await Services.Users.passwordReset(data)
            this.success = true
        } catch (e) {
            console.error(e)
            this.errors = {
                ...this.errors,
                general: "An error occured. Please verify your inputs and retry."
            }
        }
    },
    validatePwd: async function () {
        if (!this.newPassword) {
            this.errors = {
                ...this.errors,
                password: "Required!"
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
                password: "Password length must be more or equal than 8."
            }
            throw this.errors
        }

        if (
            !/[a-z]+/.test(this.newPassword) ||
            !/[A-Z]+/.test(this.newPassword) ||
            !/[0-9]+/.test(this.newPassword) ||
            !/[^a-zA-Z0-9]+/.test(this.newPassword)
        ) {
            this.errors = {
                ...this.errors,
                password: "Password should contains at least a lowercase char, an uppercase one, a number and a symbol."
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

        return {
            newPassword: this.newPassword,
            confirmPwd: this.confirmPwd,
        }
    },
    initiateWebAuthN: async function () {
        const pubkeyOpts = await Services.Users.webauthnChallenge(this.login)
        pubkeyOpts.challenge = Uint8Array.from(window.atob(pubkeyOpts.challenge), c => c.charCodeAt(0))
        pubkeyOpts.user.id = Uint8Array.from(window.atob(pubkeyOpts.user.id), c => c.charCodeAt(0))

        const credentialInfo = await navigator.credentials.create({ publicKey: pubkeyOpts })
        if (!credentialInfo) {
            this.errors = {
                ...this.errors,
                webauthn: "Your browser seems to be incompatible. Sorry."
            }
        }

        const toBase64 = (arrayBuffer) => btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)))

        return {
            authenticator: {
                id: credentialInfo.id,
                rawId: toBase64(credentialInfo.rawId),
                response: {
                    clientDataJSON: toBase64(credentialInfo.response.clientDataJSON),
                    attestationObject: toBase64(credentialInfo.response.attestationObject)
                },
                type: credentialInfo.type,
            },
        }
    },
    view: function () {
        return m("article.forgot-password", [
            m("h3", "Reset your password or set an authenticator"),
            ...(this.success ? [
                m("h5", "Your credential has been successfully reset. Try it now"),
                m("p", m(m.route.Link, { href: "/signin" }, "Sign In"))
            ] : [
                m("form", { onsubmit: () => { this.signin(); return false; } }, [
                    m("h5", "1. Re-enter your username or email address"),
                    m("label[for=si-login]", [
                        "Login:",
                        m("input#si-login[type=text][placeholder=your username or email address]", {
                            value: this.login,
                            onchange: (e) => {
                                this.login = e.target.value
                            }
                        })
                    ]),
                    m("h5", "2. Please select your prefered authenticating system:", [
                        m("ul.choose-option", [
                            m("li", { className: this.authenticationMode === "PWD" ? "selected" : "", onclick: () => this.switchToPwd() }, [
                                `Password, the old school one, secured with a least one uppercase
                    character, one lowercase character, one number and one symbol and 8 characters length.`,
                                m(".form-row.center", [
                                    m("button[type=button].button.is-info.center", { onclick: () => this.switchToPwd() }, "Select")
                                ]),
                            ]),
                            m("li", { className: this.authenticationMode === "WAN" ? "selected" : "", onclick: () => this.switchToWAN() }, [
                                `WebAuthN, a new passwordless way to authenticate yourself using a FIDO2 device.
                    You can use a dongle or your compatible smartphone. Try it.`,
                                m(".form-row.center", [
                                    m("button[type=button].button.is-info", { onclick: () => this.switchToWAN() }, "Select")
                                ]),
                            ]),

                        ]),
                        m("form.sec-option", { onsubmit: () => { this.validate(); return false; } }, [
                            ...(this.authenticationMode === "WAN" ? [
                                m("p", "For the moment, only Chrome and Firefox browser on a computer have been tested successfully."),
                                m("p", "I hope to have the time later to implement other platform."),
                                m("div", [
                                    ...(this.errors && this.errors.webauthn ?
                                        [
                                            m("p.errors", this.errors.webauthn),
                                        ] :
                                        [

                                            m("button.button.is-primary", "Let's Go"),
                                        ]),
                                ]),
                            ] : []),
                            ...(this.authenticationMode === "PWD" ? [
                                m("div.form-row", [
                                    m("label[for=re-password].required", [
                                        "Password:",
                                    ]),
                                    m("input#re-password[type=password][placeholder=your password]", {
                                        value: this.newPassword,
                                        onchange: (e) => this.newPassword = e.target.value,
                                    }),
                                    ...(this.errors && this.errors.password ? [m("span.error", this.errors.password)] : [])
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
                                    m("button[type=submit].button.is-primary", "Next"),
                                ]),
                            ] : []),
                            ...(this.errors && this.errors.auth ? [m("span.error", this.errors.auth, m("br"))] : []),
                        ]),
                    ])
                ]),
            ])
        ])
    }
}

export { ResetPassword }