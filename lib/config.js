'use strict';

module.exports = {
	github: {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET
	},
	sessionSecret: +(new Date()) + 'foo', // TODO: This should probably be a different secret
	userAgent: 'Bower registry server',
	port: process.env.PORT,
	databaseUrl: process.env.DATABASE_URL
};
