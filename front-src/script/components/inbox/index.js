import Services from "../../services"
import store from "../../store"


const messagesPanel = {
    message: null,
    oninit: function ({ attrs }) {
        this.onsent = attrs.onsent
    },
    send: async function (contact) {
        if (!this.message) {
            return
        }
        if (!contact) {
            console.error("missing contact ?!")
            return
        }
        await Services.Messages.send(this.message, contact)
        this.onsent(contact, {
            recipient: contact,
            sender: store.User.username,
            message: this.message,
        })
    },
    view: function ({ attrs }) {
        const { contact, contents } = attrs
        return m(".messages-panel", [
            ...(contact ? [m("h3", [
                m("i.far.fa-envelope-open"),
                " ",
                contact,
            ]),
            m(".chat", [
                ...(!contents.length ? [m("i", `Start a new conversation with ${contact}`)] :
                    [...contents.sort((a, b) => a.content.date > b.content.date)
                        .map((c, idx) => m(".message", {
                            key: `${contact}-${idx}`,
                            className: contact === c.recipient_login ? "as-sender" : "as-recipient"
                        }, [
                            ...c.content.message.split("\n").map(cm => m("p", cm)),
                            m("p.date", [
                                new Date(c.content.date).toLocaleDateString(),
                                " - ",
                                new Date(c.content.date).toLocaleTimeString(),
                            ])
                        ]))
                    ]
                )
            ]),
            m(".write-message", [
                m("textarea", {
                    value: this.message,
                    onchange: (e) => this.message = e.target.value,
                }),
                m("button[type=button].button.is-primary", { onclick: () => this.send(contact) }, "Send")
            ])] : [
                    m("p", "Please select a contact")
                ])
        ])
    }
}

const contactsPanel = {
    oninit: function (vnode) {
        this.onselect = vnode.attrs.onselect
        this.onadd = vnode.attrs.onadd
    },
    select: function (c) {
        this.onselect(c)
    },
    addContact: async function (contacts) {
        if (!this.newContact) return
        this.newContact = this.newContact.trim()
        if (this.contacts.includes(this.newContact)) {
            this.select(this.newContact)
            this.newContact = null
            return
        }
        const {
            loginExists,
            emailExists,
        } = await Services.Users.exists(this.newContact, this.newContact)
        if (!(loginExists || emailExists)) {
            this.error = "This user doesn't exist"
            return
        }
        this.contacts.push(this.newContact)
        this.onadd(this.newContact)
        this.newContact = null
    },
    view: function ({ attrs }) {
        this.contacts = attrs.contacts.sort()

        return m(".contacts-panel", [
            m("h4", [
                m("i.fas.fa-users"),
                " Contacts"
            ]),
            m("ul", this.contacts.map(c => m("li", { key: c },
                m("a", { onclick: () => this.select(c) }, c),
            ))),
            m("form.new-contact", { onsubmit: () => { this.addContact(); return false; } }, [
                m("input[type=text][placeholder=search contact]", {
                    value: this.newContact,
                    onchange: (e) => this.newContact = e.target.value,
                }),
                m("button[type=submit]", "Add contact"),
                ...(this.error ? [m("p.error", this.error)] : [])
            ])
        ])
    }
}

const Inbox = {
    selectedContact: null,
    contacts: [],
    loading: false,
    select: function (c) {
        if (this.selectedContact === c) {
            this.selectedContact = null
        } else {
            this.selectedContact = c
        }
        m.redraw()
    },
    add: function (c) {
        this.contacts[c] = []
        this.select(c)
        console.log(this.contacts)
    },
    messageSent: function (contact, message) {
        this.contacts[contact].push(message)
    },
    retrieve: async function () {
        this.loading = true
        const list = (await Services.Messages.list() || [])
        this.contacts = list.reduce((acc, cur) => {
            const current = cur.sender_login === store.User.username ?
                cur.recipient_login :
                cur.sender_login
            return {
                ...acc,
                [current]: [
                    ...(acc[current] || []),
                    cur
                ]
            }
        }, {})
        this.loading = false
        console.log(this.contacts)
    },
    oninit: function () {
        this.retrieve()
    },
    view: function () {
        return m(".inbox", [
            m(contactsPanel, { contacts: Object.keys(this.contacts || {}), onselect: (c) => this.select(c), onadd: (c) => this.select(c) }),
            m(messagesPanel, { contact: this.selectedContact, contents: (this.contacts[this.selectedContact] || []), onsent: (message, contact) => this.messageSent(message, contact) })
        ])
    }
}

export { Inbox }