
const mongoose = require('mongoose');
const Admin = require('../models/admin');
const Permissions = require('../models/permissions');
const config = require(`${__dirname}/../config/config.js`);
const passport = require('../config/passportConfig')
const { createHmac } = require('node:crypto');
const tsscmp = require("tsscmp")

const authenticateMiddleware = passport.authenticate('local', {
    failureMessage: 'Invalid username or password',
    failureRedirect: '/authenticate/login',
})

const googleAuthenticateMiddleware = passport.authenticate('google', {
    scope: ['profile', 'email']
});

const googleCallbackAuthenticateMiddleware = passport.authenticate('google', {
    failureRedirect: '/authenticate/login',

});

const githubAuthenticateMiddleware = passport.authenticate('github', {
    scope: ['read:user', 'user:email', "user:follow"],
    successFlash: 'Welcome!',
});

const githubCallbackAuthenticateMiddleware = passport.authenticate('github', {
    failureRedirect: 'auth/failed',
    successFlash: 'Welcome dev!',

});

module.exports = {
    authenticateMiddleware,
    googleCallbackAuthenticateMiddleware,
    googleAuthenticateMiddleware,
    githubAuthenticateMiddleware,
    githubCallbackAuthenticateMiddleware,
    isAuthenticated(req, res, next) {
        try {
            const token = req.headers["authorization"]?.split(' ')[1];
            if (req.isAuthenticated()) {
                return next();
            } else if(token){
                passport.authenticate('authenticate', { session: false }, (err, user) => {
                    if (err || !user) {
                        throw new Error("Unauthorized access");
                    }

                    req.user = user;
                    return next();
                })(req, res, next);
            } else {
                throw new Error("Unauthorized access")
            }
        } catch (err) {
            res.isAuthenticated = false;
            return res.status(401).json({
                status: 'fail',
                message: 'Unauthorized access'
            })
        }
    },

    isAdmin(req, res, next) {
        if ( req.user?.role === 'admin') {
            return next();
        }
        return res.status(401).json({
            status: 'fail',
            message: 'Unauthorized access'
        })
    },
    hasPermission(perm) {
        return async (req, res, next) => {
            try {
                const permission = await Permissions.findOne({ permission: perm });
                const permissionId = permission ? new mongoose.Types.ObjectId(permission._id) : null;
                if (!permissionId) {
                    throw new Error('Permission not found')
                }
                const admin = await Admin.findOne({ user_id: req.user?._id, permissions: { $in: [permissionId] } });

                if (!admin || !admin.isActive) {
                    return res.status(401).json({
                        status: 'fail',
                        message: 'You do not have permission to access this resource'
                    })
                }

                next();
            } catch (err) {
                console.log(err)
                return res.status(401).json({
                    status: 'fail',
                    message: 'You do not have permission to access this resource'
                })
            }
        };
    },

    loggerAuth(req, res, next) {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized - Missing or invalid Bearer token' });
        }
        const token = authHeader.split(' ')[1];
        const authKey = config.HONEYBADGER_KEY;

        if (token !== authKey) {
            return res.status(401).json({ error: 'Unauthorized - Invalid Bearer token' });
        }

        next();
    },

    slackAuth(req, res, next) {
        try {
            const timestamp = req.headers['X-Slack-Request-Timestamp'] || req.headers["x-slack-request-timestamp"];
            if (Number.isNaN(timestamp)) {
                throw new Error(`Failed to verify authenticity`)
            };
            const body = req.body?.payload;
            const currentTimestamp = Math.floor(Date.now() / 1000);

            if (Math.abs(currentTimestamp - timestamp) > 60 * 5) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Invalid/Unauthorized Request'
                });
            }
            const slackSignature = req.headers['x-slack-signature'] || req.headers['X-slack-signature'];
            const [signatureVersion, signatureHash] = slackSignature.split('=');
  
            if (signatureVersion !== 'v0') {
                throw new Error(`Unknown signature version`);
            }
            const concated = `${signatureVersion}:${timestamp}:${body}`
            const slackSigningSecret = config.SLACK.SIGNING_SECRET; 

            const hmac = createHmac('sha256', slackSigningSecret);
            const mySignature = 'v0=' + hmac.update(concated).digest('hex');

            if (!signatureHash || !tsscmp(signatureHash, mySignature)) {
                throw new Error(`Signature mismatch`);
            } else {
                next();
            }

        } catch (err) {
            console.log(err)
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid/Unauthorized Request'
            })
        }
    }

};