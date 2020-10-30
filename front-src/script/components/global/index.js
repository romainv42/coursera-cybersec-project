import { Menu } from "../menu"
/**
 * Simple CSS loader
 */
const Loader = {
    view: () => m(".lds-roller", [
        m("div"),
        m("div"),
        m("div"),
        m("div"),
        m("div"),
        m("div"),
        m("div"),
        m("div"),
    ])
}

const header = {
    view: () => m("header", [
        m(".title", [
            m("h1", [
                m("i.far.fa-comments"),
                "Capstone project",
            ]),
            m("h5", "Cybersecurity Specialization - University of Maryland - Coursera"),
        ]),
        m(Menu),
    ])
}

const Layout = {
    view: ({ children }) => {
        return [m(header), m("main", children)]
    }
}

export {
    Loader,
    Layout,
}