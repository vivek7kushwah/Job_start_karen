const isAuthenticated = (req, res, next) => {
    console.log('Checking authentication...');
    console.log('Session ID:', req.sessionID);
    console.log('Session Cookie:', req.session.cookie);
    console.log('Session User:', req.session.user);
    console.log('Headers:', req.headers);

    if (req.session && req.session.user) {
        // Set the user object with all necessary properties
        req.user = {
            ...req.session.user,
            _id: req.session.user._id // Ensure _id is available
        };
        console.log('User is authenticated:', req.user);
        next();
    } else {
        console.log('Authentication failed. No session or user in session.');
        res.status(401).json({ 
            message: 'Authentication required',
            debug: {
                hasSession: !!req.session,
                hasUser: !!(req.session && req.session.user),
                sessionID: req.sessionID
            }
        });
    }
};

module.exports = {
    isAuthenticated
}; 