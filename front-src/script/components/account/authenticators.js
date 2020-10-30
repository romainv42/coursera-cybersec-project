import { Loader } from "../global"
import Services from "../../services"

const Authenticators = {
    addAuthr: async function () {
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


        try {
            this.loading = true
            await Services.Accounts.updatePassword({
                authenticator: {
                    id: credentialInfo.id,
                    rawId: toBase64(credentialInfo.rawId),
                    response: {
                        clientDataJSON: toBase64(credentialInfo.response.clientDataJSON),
                        attestationObject: toBase64(credentialInfo.response.attestationObject)
                    },
                    type: credentialInfo.type,
                },
            })
            this.onrefresh()
            this.success = true
        } catch (e) {
            console.error(e)
            this.errors = {
                ...this.errors,
                general: "An error occured. Please verify your inputs and retry."
            }
        } finally {
            this.loading = false
        }


        return
    },
    updateAuthr: async function () {
        this.errors = null
        this.authenticators.forEach((a, idx) => {
            if (!a.name) {
                this.errors = {
                    ...this.errors,
                    [idx]: "A name is required!"
                }
                return
            }

            if (a.name.length > 32) {
                this.errors = {
                    ...this.errors,
                    [idx]: "The name is too long (32 char max)!"
                }
                return
            }

            const byName = this.authenticators.find(({ name }) => name === a.name)
            if (byName.length > 1) {
                this.errors = {
                    ...this.errors,
                    [idx]: "The name must be unique"
                }
                return
            }
        })

        if (this.errors) {
            return
        }

        try {
            this.loading = true
            await Services.Accounts.updateDevices(this.authenticators)
            this.success = true
            this.editMode = false
        } catch (e) {
            console.error(e)
            this.errors = {
                ...this.errors,
                general: "An error occured. Please verify your inputs and retry."
            }
        }
        finally {
            this.loading = false
        }
    },
    deleteAuthr: async function (idx) {
        if (confirm(`Are you sure to want to delete the device "${this.authenticators[idx].name}"`)) {
            this.loading = true
            try {
                await Services.Accounts.deleteAuthr(this.authenticators[idx].credID)
                this.onrefresh()
            } finally {
                this.loading = false
            }
        }
    },
    editMode: false,
    oninit: function ({ attrs }) {
        const { loading, authenticators, login, onrefresh } = attrs
        this.loading = loading
        this.authenticators = authenticators
        this.login = login
        this.onrefresh = onrefresh
    },
    view: function ({ attrs }) {

        return m("section.auth-info", [
            m("h5", "Authenticator devices"),
            ...(this.loading ? [m(Loader)] : [
                ...(this.authenticators && this.authenticators.length ? [
                    ...(this.errors && this.errors.general ? [m("p.error", this.errors.general)] : []),
                    m("p", [
                        "You can change the name of authenticators or add a new one.",
                        ...(!this.editMode ? [m("i.fas.fa-pen", { onclick: () => this.editMode = true })] : [])
                    ]),
                    ...this.authenticators.map((_, idx) => [
                        m("input[type=text][placeholder=Device name][maxLength=32]", {
                            readonly: !this.editMode,
                            value: this.authenticators[idx].name,
                            onchange: (e) => this.authenticators[idx].name = e.target.value,
                        }),
                        ...(this.editMode ? [m("a.error", { onclick: () => this.deleteAuthr(idx)}, [
                            m("i.fas.fa-trash-alt"),
                            "Delete the device above"
                        ])]: []),
                        ...(this.errors && this.errors[idx] ? [m("span.error", this.errors[idx])] : [])
                    ])
                ] : [
                        m("p", [
                            "There is no device configured. You can add one now.",
                            m("i.fas.fa-pen", { onclick: () => this.editMode = true })
                        ])
                    ]
                ),
                ...(this.editMode ? [
                    m("div", [
                        m("button[type=button].button.is-primary.is-small", { onclick: () => this.addAuthr() }, "Add an authenticator"),
                        m("button[type=button].button.is-danger.is-small", {onclick: () => this.updateAuthr() } ,"Update authenticator names"),
                    ]),
                ] : [])
            ])
        ])
    }
}

export { Authenticators }