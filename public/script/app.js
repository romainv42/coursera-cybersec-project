const root = document.getElementById("rvapp")

const Signin = {
    signin: async function () {

    },
    view: function () {
        return m("article", [
            m("section.sign-in", [
                m("h3", "Sign In"),
                m("form", { onsubmit: () => { this.signin(); return false; } }, [
                    m("label[for=si-login]", [
                        "Login:",
                        m("input#si-login[type=text][placeholder=your login]")
                    ]),
                    m(m.route.Link, { href: "/register", className: "button" }, "Create account"),
                    m("button[type=submit].button.is-primary", "Next"),
                ])
            ]),
        ])
    }
}

const Register = {
    view: function () {
        return m("article", [
            m("section.register", [
                m("h3", "Register"),
                m("form", { onsubmit: () => { this.signin(); return false; } }, [
                    m("label[for=si-login]", [
                        "Login:",
                        m("input#si-login[type=text][placeholder=your login]")
                    ]),
                    m(m.route.Link, { href: "/register", className: "button" }, "Create account"),
                    m("button[type=submit].button.is-primary", "Next"),
                ])
            ]),
        ])
    }
}

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
            m(m.route.Link, { href: "/sign", }, "Sign in"),
            m("span", " | "),
            m(m.route.Link, { href: "/register" }, "Create account"),
        ])
    ])
}

m.route(root, "/", {
    "/": Welcome,
    "/sign": Signin,
    "/register": Register,
})