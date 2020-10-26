const EmailVerified = {
    view: () => m("div.center", [
        m("h1", "Email address verified!"),
        m("p", "Thank you for verifying your email address. You can now sign in to use the application."),
        m("p",
            m(m.route.Link, { href: "/sign" }, "Sign In"),
        )
    ])
}

export { EmailVerified }