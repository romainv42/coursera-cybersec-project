import { Register, Signin } from "./components/user"
import { Welcome } from "./components/global"

const root = document.getElementById("rvapp")

m.route.prefix = ""
m.route(root, "/", {
    "/": Welcome,
    "/sign": Signin,
    "/register": Register,
})