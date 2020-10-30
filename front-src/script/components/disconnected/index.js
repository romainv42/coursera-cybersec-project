const Disconnected = {
    view: () => m("div.center", [
        m("h1", [
            m("i.fas fa-bug"),
            "You have been disconnect!"
        ]),
        m("p",
            m(m.route.Link, { href: "/sign" }, "Sign In"),
            " | ",
            m(m.route.Link, { href: "/" }, "Home"),
        )
    ])
}

export { Disconnected }