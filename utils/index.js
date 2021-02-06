const isAdmin = (req) => {
    const { role } = req.user
    if (role !== 'admin') {
        return false
    }
    return true
}

module.exports = {
    isAdmin
}