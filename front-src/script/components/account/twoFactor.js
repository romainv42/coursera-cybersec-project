import { Loader } from "../global"
import Services from "../../services"

const TwoFactor = {
    add2FA: async function () {
        const { otpauth_url } = await Services.Accounts.getNew2FA()
        this.qrCode = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(otpauth_url)}&chs=300x300`
    },
    sendTotp: async function () {
        this.errors = null
        if (!this.toptValue) {
            return this.errors = {
                ...this.errors,
                totp: "Please enter the code!"
            }
        }

        try {
            this.loading = true
            await Services.Accounts.sendTopt(this.toptValue, this.newName)
            this.success = true
            this.qrCode = null
            this.onrefresh()
        } catch (e) {
            console.error(e)
            this.errors.general = "An error occured. Please try again."
        } finally {
            this.loading = false
        }
    },
    delete2FA: async function (idx) {
        if (confirm(`Are you sure to want to delete the app "${this.twoFactorApps[idx].name}"`)) {
            this.loading = true
            try {
                await Services.Accounts.delete2FA(this.twoFactorApps[idx].twofa_id)
                this.onrefresh()
            } finally {
                this.loading = false
            }
        }

    },
    update2FA: async function () {
        this.errors = null
        this.twoFactorApps.forEach(({ name }, idx) => {
            if (!name) {
                return this.errors = {
                    ...this.errors,
                    [idx]: "2 FA app name required!"
                }
            }

            const tfa = this.twoFactorApps.find(({ name: n }) => name === n)
            if (tfa.length > 1) {
                return this.errors = {
                    ...this.errors,
                    [idx]: "2 FA app name should be unique!"
                }
            }
        })

        if (this.errors) return

        try {
            this.loading = true
            await Services.Accounts.update2FA(this.twoFactorApps)
            this.success = true
        } finally {
            this.editMode = false
            this.loading = false
        }
    },
    editMode: false,
    oninit: function ({ attrs }) {
        const { loading, onrefresh, twoFactorApps } = attrs
        this.loading = loading
        this.onrefresh = onrefresh
        this.twoFactorApps = twoFactorApps
        console.log(this.twoFactorApps)
    },
    view: function ({ attrs }) {
        return m("section.auth-info", [
            m("h5", "Two Factor Apps"),
            ...(this.loading ? [m(Loader)] : [
                ...(!this.qrCode ? [
                    ...(this.twoFactorApps && this.twoFactorApps.length ? [
                        ...(this.errors && this.errors.general ? [m("p.error", this.errors.general)] : []),
                        m("p", [
                            "You can change the name of TwoFactor or add a new one.",
                            ...(!this.editMode ? [m("i.fas.fa-pen", { onclick: () => this.editMode = true })] : [])
                        ]),
                        ...this.twoFactorApps.map((_, idx) => [
                            m("input[type=text][placeholder=Device name][maxLength=32]", {
                                readonly: !this.editMode,
                                value: this.twoFactorApps[idx].name,
                                onchange: (e) => this.twoFactorApps[idx].name = e.target.value,
                            }),
                            ...(this.editMode ? [m("a.error", { onclick: () => this.delete2FA(idx) }, [
                                m("i.fas.fa-trash-alt"),
                                "Delete the device above"
                            ])] : []),
                            ...(this.errors && this.errors[idx] ? [m("span.error", this.errors[idx])] : [])
                        ])
                    ] : [
                            m("p", [
                                "There is no two-factor app configured. You can add one now.",
                                m("i.fas.fa-pen", { onclick: () => this.editMode = true })
                            ])
                        ]
                    ),
                    m("div", [
                        m("button[type=button].button.is-primary.is-small", { onclick: () => this.add2FA() }, "Add an Two Factor App"),
                        ...(this.editMode ? [
                            m("button[type=button].button.is-danger.is-small", { onclick: () => this.update2FA() }, "Update Two Factor app names"),
                        ] : [])
                    ]),
                ] : [
                        m("div", [
                            m("img", { src: this.qrCode }),
                            m("p", "Scan the QR Code above with you two-factor authentication app (like Google Auth) and enter the provided code below"),
                            m("input[type=text][placeholer=code]", {
                                value: this.toptValue,
                                onchange: (e) => this.toptValue = e.target.value,
                            }),
                            ...(this.errors && this.errors.totp ? [m("span.error", this.errors.toptp)] : []),
                            m("div.form-row", [
                                m("label[for=totp-name]", [
                                    "Give it a name:",
                                ]),
                                m("input#totp-name[type=text][placeholder=Authentication App name]", {
                                    value: this.newName,
                                    onchange: (e) => {
                                        this.newName = e.target.value
                                    },
                                }),
                            ]),

                            m("button[type=button].button.is-primary", { onclick: () => this.sendTotp() }, "Send")
                        ])
                    ]),
            ]),
        ])
    }
}

export { TwoFactor }