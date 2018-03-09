'use strict';

// export $(cat .env | xargs) && command...
// .env file
// AMQP_HOST=
// REDIS_HOST=
// REDIS_PASSWORD=
// REDIS_PORT=
// MONGO_URL=
// MONGO_DB_NAME=

module.exports = {
    sourceFolder: 'dist',
    amqp: {
        url: process.env.AMQP_URL
    },
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        secret: process.env.FACEBOOK_SECRET
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID
    }
    // ,
    // mongo: {
    //     url: process.env.MONGO_URL,
    //     dbName: process.env.MONGO_DB_NAME
    // }
};
