import store from "../../store"

/**
 * Welcome page
 */
const Welcome = {
    view: () => m(".welcome", [
        m("h2", "Welcome to my Capstone Project"),
        m("p", "This project is develop as part of the ",
            m("a", { href: "https://www.coursera.org/specializations/cyber-security" }, "Coursera Cybersecurity specialization of the University of the Maryland."),
        ),
        m("p", "To validate the specialization, the Capstone project consists on a simple messaging system."),
        m("p", "This is my implementation of this project and you can find the source code on ",
            m("a", { href: "https://github.com/romainv42/coursera-cybersec-project" }, "Github")
        ),
        m("p", [
            ...(store.User.isLogged ?
                [
                    m(m.route.Link, { href: "/inbox" }, "My Inbox")
                ] : [
                    m(m.route.Link, { href: "/sign", }, "Sign in"),
                    m("span", " | "),
                    m(m.route.Link, { href: "/register" }, "Create account"),
                ]),
        ]),
    ])
}

export { Welcome }