'use strict';

exports = {
	github: {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET
	},
	sessionSecret: process.env.CLIENT_SECRET, // TODO: This should probably be a different secret
	userAgent: 'Bower registry server',
	port: process.env.PORT,
	databaseUrl: process.env.DATABASE_URL
};
