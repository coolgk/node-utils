'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Tmp Module', function () {

    const { generateFile, generateDir, generateTmpName } = require(`../${config.sourceFolder}/tmp`);

    let tmpDir = '/tmp/test-tmp' + Math.random();

    const fs = require('fs');

    before((done) => {
        fs.mkdir(tmpDir, (error) => {
            if (error && error.code !== 'EEXIST') return done(error);
            done();
        });
    });

    after(() => {
        require('del')([ tmpDir ], { force: true });
    });

    it('should create a file', (done) => {
        generateFile({dir: tmpDir}).then(({ path }) => {
            expect(path).to.match(new RegExp(tmpDir));
            fs.stat(path, (error, stats) => {
                if (error) return done(error);
                expect(stats.isFile()).to.be.true;
                done();
            });
        }).catch(done);
    });

    it('should create a dir', (done) => {
        generateDir({dir: tmpDir}).then(({ path }) => {
            expect(path).to.match(new RegExp(tmpDir));
            fs.stat(path, (error, stats) => {
                if (error) return done(error);
                expect(stats.isDirectory()).to.be.true;
                done();
            });
        }).catch(done);
    });

    it('should create a tmp name', (done) => {
        generateTmpName({dir: tmpDir}).then(({ path }) => {
            expect(path).to.match(new RegExp(tmpDir));
            fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (error) => {
                expect(error).to.be.ok;
                done();
            });
        }).catch(done);
    });

    it('should reject on error', () => {
        return expect(generateDir({dir: '/tmp' + Math.random()})).to.eventually.be.rejected;
    });

    it('should generage without options', (done) => {
        generateFile().then(({ path, cleanupCallback }) => {
            fs.stat(path, (error, stats) => {
                if (error) return done(error);
                expect(stats.isFile()).to.be.true;
                cleanupCallback();
                done();
            });
        }).catch(done);
    });

});
