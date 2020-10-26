import { Register, Signin } from "./components/user"
import { Welcome } from "./components/global"
import {
    EmailVerified,
    WrongEmail,
} from "./components/emails"

const root = document.getElementById("rvapp")

m.route.prefix = ""
m.route(root, "/", {
    "/": Welcome,
    "/sign": Signin,
    "/register": Register,
    "/email-verified": EmailVerified,
    "/wrong-email": WrongEmail,
})