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
    }
    // ,
    // mongo: {
    //     url: process.env.MONGO_URL,
    //     dbName: process.env.MONGO_DB_NAME
    // }
};
