const WrongEmail = {
    view: () => m("div.center", [
        m("h1", [
            m("i.fas fa-bug"),
            "Something bad happened with this email!"
        ]),
        m("p",
            m(m.route.Link, { href: "/sign" }, "Sign In"),
        )
    ])
}

export { WrongEmail }