/**
 * Sign In component
 */
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


export { Signin }