import store from "../../store"

const Menu = {
    oninit: function () {
        this.show = false
    },
    view: function () {
        return m("nav#top-right-menu", [
            m("span", [
                m("a", { onclick: () => this.show = !this.show }, [
                    m("i.fas.fa-user"),
                    ` ${store.User.isLogged ? store.User.username : "Unknown"}`,
                ])
            ]),
            ...(this.show ? [m("ul", [
                ...(store.User.isLogged ?
                    [
                        m("li", m(m.route.Link, { href: "/inbox", onclick: () => { this.show = false; return true } }, "My Inbox")),
                        m("li", m(m.route.Link, { href: "/account", onclick: () => { this.show = false; return true } }, "My account")),
                        m("li", m(m.route.Link, { href: "/logout", onclick: () => { this.show = false; return true } }, "Logout")),
                    ] : [
                        m("li", m(m.route.Link, { href: "/sign", onclick: () => { this.show = false; return true } }, "Sign In")),
                        m("li", m(m.route.Link, { href: "/register", onclick: () => { this.show = false; return true } }, "Register")),
                    ])
            ])
            ] : [])
        ])
    }
}

export { Menu }