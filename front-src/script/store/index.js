function generateStore() {
    return {
        User: {
            isLogged: false
        }
    }
}

const store = generateStore()

export default store