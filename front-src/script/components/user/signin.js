import Services from "../../services"
import store from "../../store"
/**
 * Sign In component
 */
const Signin = {
    passwordMode: false,
    remember: false,
    login: null,
    password: null,
    resetSent: false,
    deviceError: false,
    passwordEnabled: false,
    switchToPwdMode: function () {
        this.passwordMode = true
    },
    forgot: async function () {
        if (!this.login) return this.error = "Please enter anyway your username or your email address"

        try {
            await Services.Users.forgotPassword(this.login)
            this.resetSent = true
        } catch (e) {
            this.error = "An error occured. Please check your inputs and retry."
        }
    },
    sendCredentials: async function () {
        if (!this.credentials) return;
        try {
            const { token, username } = await Services.Users.identify(this.credentials)
            if (token) {
                sessionStorage.setItem("token", token)
            }
            store.User = { username, isLogged: true }
            m.route.set("/")
        } catch (e) {
            console.error(e)
            this.error = "Wrong authentication, please try again"
        } finally {
            this.totp = null
            this.askFor2FA = false
            this.credentials = null
        }
    },
    signin: async function () {
        this.error = null

        if (!this.login) return this.error = "Please enter a username or an email address"

        if (!this.askFor2FA) {
            if (!this.password && !this.passwordMode) {
                const result = await Services.Users.signIn(this.login)
                if (!result.login) {
                    this.error = "User doesn't exist. Check your username or your email address."
                    return
                }
                this.username = result.login

                this.passwordEnabled = result.passwordEnabled
                this.has2FA = result.has2FA

                if (!result.assertion) {
                    this.passwordMode = true
                    return
                }

                const { assertion } = result
                assertion.challenge = Uint8Array.from(window.atob(result.assertion.challenge), c => c.charCodeAt(0))
                assertion.allowCredentials = result.assertion.allowCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Uint8Array.from(window.atob(id), c => c.charCodeAt(0)),
                })
                )
                try {
                    const authr = await navigator.credentials.get({ publicKey: assertion })
                    const toBase64 = (arrayBuffer) => btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)))

                    this.credentials = {
                        remember: this.remember,
                        username: this.username,
                        authenticator: {
                            id: authr.id,
                            type: authr.type,
                            rawId: toBase64(authr.rawId),
                            response: {
                                authenticatorData: toBase64(authr.response.authenticatorData),
                                clientDataJSON: toBase64(authr.response.clientDataJSON),
                                signature: toBase64(authr.response.signature),
                            }
                        }
                    }
                } catch (e) {
                    console.error(e)
                    this.error = "Unable to authenticate the device!"
                    this.deviceError = true
                    return
                }

            } else if (this.password && this.passwordMode) {
                this.credentials = {
                    remember: this.remember,
                    username: this.username,
                    password: this.password,
                }
            } else if (this.passwordMode && !this.password) {
                this.error = "Please enter your password"
            }
        } else if (this.totp) {
            this.credentials = {
                ...this.credentials,
                totp: this.totp,
            }
        }

        if ((!this.has2FA || (this.totp && this.askFor2FA)) && this.credentials) {
            await this.sendCredentials()
        } else if (this.has2FA && !this.totp && this.credentials) {
            this.askFor2FA = true
            m.redraw()
        }
    },
    view: function () {
        return m("article", [
            m("section.sign-in", [
                m("h3", "Sign In"),
                ...(this.resetSent ? [
                    m("h5", "An email has been sent to indicate the procedure to reset your password or to register a new device."),
                    m("p", m(m.route.Link, { href: "/welcome" }, "Return to the Home"))
                ] : [
                        m("form", { onsubmit: () => { this.signin(); return false; } }, [
                            ...(!this.askFor2FA ? [
                                m("label[for=si-login]", [
                                    "Login:",
                                    m("input#si-login[type=text][placeholder=your username or email address]", {
                                        readonly: this.passwordMode,
                                        value: this.login,
                                        onchange: (e) => {
                                            this.login = e.target.value
                                            this.password = null
                                            this.passwordMode = false
                                        }
                                    })
                                ]),
                                ...(this.passwordMode ? [
                                    m("input[type=password][placeholder=your password]", {
                                        value: this.password,
                                        onchange: (e) => this.password = e.target.value
                                    })
                                ] : []),
                                m("p",
                                    m("label[for=remember", [
                                        m("input#remember[type=checkbox][value=1]", {
                                            style: "display: inline;",
                                            checked: this.remember,
                                            onchange: (e) => this.remember = e.target.checked,
                                        }),
                                        " Remember me? (Check it only if it is your personal device)"
                                    ]),
                                ),
                                ...(this.error ? [m("p.error", [
                                    this.error,
                                    ...(this.passwordEnabled && this.deviceError ? [
                                        m("a", { onclick: () => this.switchToPwdMode() }, "Click here to switch to password mode"),
                                    ] : [])
                                ])] : []),
                            ] : [
                                    m("h5", "Two Factor Authentication enabled!"),
                                    m("p", "Open your two factor application and enter the code provide below:"),
                                    m("input[type=text][placeholder=2FA code]", {
                                        value: this.totp,
                                        onchange: (e) => this.totp = e.target.value,
                                    })
                                ]),
                            m("button[type=submit].button.is-primary", "Next"),
                            m("br"),
                            m("button[type=button].button", { onclick: () => this.forgot() }, "Forgot password or lost device"),
                            m("p", ""),
                            m("p",
                                m(m.route.Link, { href: "/register" }, "Don't have an account yet? Register!"),
                            ),
                        ])
                    ]),
            ]),
        ])
    }
}

export { Signin }