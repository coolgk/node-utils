'use strict';

// module.exports = Object.assign(
    // {
        // sourceFolder: 'dist',
        // amqp: {
            // url: ''
        // }
    // },
    // require('./test.config.local.js')
// );

module.exports = {
    sourceFolder: 'dist',
    amqp: {
        url: process.env.AMQP_URL
    }
};
