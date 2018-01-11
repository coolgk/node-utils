'use strict';

// env variables
// AMQP_URL=''

module.exports = {
    sourceFolder: 'dist',
    amqp: {
        url: process.env.AMQP_URL
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
