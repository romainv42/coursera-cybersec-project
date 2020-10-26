import Services from "../../services"
/**
 * Sign In component
 */
const Signin = {
    passwordMode: false,
    remember: false,
    login: null,
    password: null,
    signin: async function () {
        this.error = null
        let credentials

        if (!this.login) return this.error = "Please enter a username or an email address"

        if (!this.password && !this.passwordMode) {
            const result = await Services.Users.signIn(this.login)
            if (!result.login) {
                this.error = "User doesn't exist. Check your username or your email address."
                return
            }
            this.username = result.login
            if (!result.assertion) {
                this.passwordMode = true
                return
            }
            console.log(result)
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

                credentials = {
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
                this.error = "Invalid device!"
                return
            }

        } else if (this.password && this.passwordMode) {
            credentials = {
                remember: this.remember,
                username: this.username,
                password: this.password,
            }
        } else if (this.passwordMode && !this.password) {
            this.error = "Please enter your password"
        }

        if (credentials) {
            try {
                await Services.Users.identify(credentials)
            } catch (e) {
                this.error = "Wrong authentication, please try again"
            }
        }
    },
    view: function () {
        return m("article", [
            m("section.sign-in", [
                m("h3", "Sign In"),
                m("form", { onsubmit: () => { this.signin(); return false; } }, [
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
                    ...(this.error ? [m("p.error", this.error)] : []),
                    m("button[type=submit].button.is-primary", "Next"),
                    m("p",
                        m(m.route.Link, { href: "/register" }, "Don't have an account yet? Register!"),
                    ),
                ])
            ]),
        ])
    }
}

export { Signin }