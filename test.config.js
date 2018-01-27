'use strict';

// source .env
// .env file
// export AMQP_HOST=
// export REDIS_HOST=
// export REDIS_PASSWORD=
// export REDIS_PORT=

module.exports = {
    sourceFolder: 'dist',
    amqp: {
        host: process.env.AMQP_HOST
    },
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT
    }
};

// module.exports = Object.assign(
    // {
        // sourceFolder: 'dist',
        // amqp: {
            // url: ''
        // }
    // },
    // require('./test.config.local.js')
// );
