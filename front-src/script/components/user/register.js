import Services from "../../services"
import { Loader } from "../global"

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i

/**
 * Register stage one: fill basic information
 */
const registerGlobalInfo = {
    oninit: function (vnode) {
        const { user, onnext } = vnode.attrs
        this.user = user || {}
        this.onnext = onnext
    },
    validate: async function () {
        this.errors = null
        if (!this.user.login) {
            this.errors = {
                ...this.errors,
                login: "Required!"
            }
        }

        if (!this.user.email) {
            this.errors = {
                ...this.errors,
                email: "Required!"
            }
        } else if (!emailRegex.test(this.user.email)) {
            this.errors = {
                ...this.errors,
                email: "Invalid email address!",
            }
        }


        if (!this.errors) {
            const { loginExists, emailExists } = await Services.Users.exists(this.user.login, this.user.email)
            if (loginExists) {
                this.errors = {
                    ...this.errors,
                    login: "This login already exists!"
                }
            }

            if (emailExists) {
                this.errors = {
                    ...this.errors,
                    email: "This email already exists!"
                }
            }
        }
        if (this.errors) {
            throw this.errors
        }

        return this.onnext(this.user)
    },
    view: function () {
        return m("form", { onsubmit: () => { this.validate(); return false; } }, [
            m("div.form-row", [
                m("label[for=re-login].required", [
                    "Login:",
                ]),
                m("input#re-login[type=text][placeholder=your login][maxlength=16]", {
                    value: this.user.login,
                    onchange: (e) => {
                        this.user.login = e.target.value
                    },
                }),
                ...(this.errors && this.errors.login ? [m("span.error", this.errors.login)] : [])
            ]),
            m("div.form-row", [
                m("label[for=re-email].required", [
                    "Email address:",
                ]),
                m("input#re-email[type=text][placeholder=your email address][maxlength=255]", {
                    value: this.user.email,
                    onchange: (e) => this.user.email = e.target.value,
                }),
                ...(this.errors && this.errors.email ? [m("span.error", this.errors.email)] : [])
            ]),
            m("div.form-row", [
                m("label[for=re-tell-me-more]", [
                    "Tell me more about you:",
                ]),
                m("textarea#re-tell-me-more", {
                    value: this.user.moreInfo,
                    onchange: (e) => this.user.moreInfo = e.target.value,
                }),
            ]),
            m("button[type=submit].button.is-primary", "Next"),
        ])
    }
}

/**
 * Allowing users to choose between Password authentication or WebAuthn
 */
const chooseSecurityOption = {
    authenticationMode: null,
    switchToPwd: function () {
        this.authenticationMode = "PWD"
    },
    switchToWAN: function () {
        this.authenticationMode = "WAN"
    },
    oninit: function (vnode) {
        const { user, onnext, onprevious } = vnode.attrs
        this.user = user || {}
        this.auth = this.user.auth || {}
        this.onnext = onnext
        this.previous = onprevious
    },
    validate: async function () {
        this.errors = null
        if (!this.authenticationMode) {
            this.errors = {
                ...this.errors,
                auth: "Please select an authentication mode !"
            }

            return
        }
        const validMethod = this.authenticationMode === "PWD" ? "validatePwd" : "initiateWebAuthN"
        try {

            const user = await this[validMethod]()

            this.onnext(user)
        } catch (e) {
            console.error("Some input error detected", e)
        }
    },
    validatePwd: async function () {
        if (!this.auth.password) {
            this.errors = {
                ...this.errors,
                password: "Required!"
            }
        }
        if (!this.auth.confirmPwd) {
            this.errors = {
                ...this.errors,
                confirmPwd: "Required!"
            }
        }
        if (this.errors) throw this.errors

        if (this.auth.password.length < 8) {
            this.errors = {
                ...this.errors,
                password: "Password length must be more or equal than 8."
            }
            throw this.errors
        }

        if (
            !/[a-z]+/.test(this.auth.password) ||
            !/[A-Z]+/.test(this.auth.password) ||
            !/[0-9]+/.test(this.auth.password) ||
            !/[^a-zA-Z0-9]+/.test(this.auth.password)
        ) {
            this.errors = {
                ...this.errors,
                password: "Password should contains at least a lowercase char, an uppercase one, a number and a symbol."
            }
            throw this.errors
        }

        if (this.auth.password !== this.auth.confirmPwd) {
            this.errors = {
                ...this.errors,
                confirmPwd: "Password and confirmation are different."
            }
            throw this.errors
        }

        return {
            ...this.user,
            authenticationMode: this.authenticationMode,
            auth: {
                password: this.auth.password,
                confirmPwd: this.auth.confirmPwd,
            }
        }
    },
    initiateWebAuthN: async function () {
        const pubkeyOpts = await Services.Users.webauthnChallenge(this.user.login)
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
            ...this.user,
            authenticationMode: this.authenticationMode,
            auth: {
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
        return m("p", "Please select your prefered authenticating system:", [
            m("form.sec-option", { onsubmit: () => { this.validate(); return false; } }, [
                m("ul.choose-option", [
                    m("li", { className: this.authenticationMode === "PWD" ? "selected" : "", onclick: () => this.switchToPwd() }, [
                        `Password, the old school one, secured with a least one uppercase
                    character, one lowercase character, one number and one symbol and 8 characters length.`,
                        ...(this.authenticationMode === "PWD" ? [
                            m("div.form-row", [
                                m("label[for=re-password].required", [
                                    "Password:",
                                ]),
                                m("input#re-password[type=password][placeholder=your password]", {
                                    value: this.auth.password,
                                    onchange: (e) => this.auth.password = e.target.value,
                                }),
                                ...(this.errors && this.errors.password ? [m("span.error", this.errors.password)] : [])
                            ]),
                            m("div.form-row", [
                                m("label[for=re-confirm-password].required", [
                                    "Confirm your password:",
                                ]),
                                m("input#re-confirm-password[type=password][placeholder=confirmation]", {
                                    value: this.auth.confirmPwd,
                                    onchange: (e) => this.auth.confirmPwd = e.target.value,
                                }),
                                ...(this.errors && this.errors.confirmPwd ? [m("span.error", this.errors.confirmPwd)] : [])
                            ]),
                        ] : [])
                    ]),
                    m("li", { className: this.authenticationMode === "WAN" ? "selected" : "", onclick: () => this.switchToWAN() }, [
                        `WebAuthN, a new passwordless way to authenticate yourself using a FIDO2 device.
                    You can use a dongle or your compatible smartphone. Try it.`,
                    ]),
                    ...(this.authenticationMode === "WAN" ? [
                        m("p", "For the moment, only Chrome and Firefox browser on a computer have been tested successfully."),
                        m("p", "I hope to have the time later to implement other platform."),
                        m(".center", [
                            ...(this.errors && this.errors.webauthn ?
                                [
                                    m("p.errors", this.errors.webauthn),
                                ] :
                                [
                                    m("button.button.is-primary", "Let's Go"),
                                ]),
                        ]),
                    ] : [])

                ]),
                ...(this.errors && this.errors.auth ? [m("span.error", this.errors.auth, m("br"))] : []),
                m("button[type=button].button.is-small", { onclick: () => this.previous() }, "Previous"),
                m("button[type=submit].button.is-primary", "Next"),
            ]),
        ])
    }
}

const registeringProcess = {
    oninit: function (vnode) {
        const { user, onprevious } = vnode.attrs
        this.user = user || {}
        this.previous = onprevious

        const that = this
        Services.Users.register(this.user)
            .then(() => that.result = "SUCCESS")
            .catch(() => that.result = "ERROR")
    },
    view: function () {
        if (!this.result) {
            return m("div", [
                m("p", "Registration in progress... Please wait."),
                m(".center", m(Loader))
            ])
        }

        if (this.result === "ERROR") {
            return m("div", [
                m("p", "An error occured. Please use previous button to check your inputs and retry."),
                m("button[type=button].button.is-small", { onclick: () => this.previous() }, "Previous"),
            ])
        }

        if (this.result === "SUCCESS") {
            return m("div", [
                m("p", "Success! You'll receive an email soon to validate your address."),
            ])
        }
    }
}

/**
 * Register page component, multi-steps
 */
const Register = {
    currentStageNum: 0,
    _setStage: function () {
        switch (this.currentStageNum) {
            case 1:
                this.currentStage = chooseSecurityOption
                break
            case 2:
                this.currentStage = registeringProcess
                break
            default:
                this.currentStage = registerGlobalInfo
        }
        m.redraw()
    },
    currentUser: {},
    next: function (user) {
        this.currentUser = user
        this.currentStageNum++
        this._setStage()
    },
    previous: function () {
        this.currentStageNum--
        this._setStage()
    },
    oninit: function () {
        this._setStage()
    },
    view: function () {
        return m("article", [
            m("section.register", [
                m("h3", "Register"),
                m("p", "Create your account by simply fill the following form."),
                m(this.currentStage, { user: this.currentUser, onnext: (user) => this.next(user), onprevious: () => this.previous() }),
                m("p",
                    m(m.route.Link, { href: "/sign" }, "Already have an account? Go to sign in instead"),
                ),
            ]),
        ])
    }
}

export { Register }