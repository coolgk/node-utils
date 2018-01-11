'use strict';

module.exports = Object.assign(
    {
        sourceFolder: 'dist',
        amqp: {
            url: ''
        }
    },
    require('./test.config.local.js')
);
