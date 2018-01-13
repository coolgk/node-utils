'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('CSV Module', function () {

    const { Csv } = require(`../${config.sourceFolder}/csv`);

    const tmpDir = '/tmp/test-csv-' + Math.random();
    const csv = new Csv({
        tmpConfig: { dir: tmpDir } // optional
    });

    const fs = require('fs');

    let csvString = '';

    before((done) => {
        fs.mkdir(tmpDir, (error) => {
            if (error && error.code !== 'EEXIST') return done(error);
            done();
        });

        csvString = `1,"Eldon Base for stackable storage shelf, platinum",Muhammed MacIntyre,3,-213.25,38.94,35,Nunavut,Storage & Organization,0.8
2,"1.7 Cubic Foot Compact ""Cube"" Office Refrigerators",Barry French,293,457.81,208.16,68.02,Nunavut,Appliances,0.58
3,"Cardinal Slant-D® Ring Binder, Heavy Gauge Vinyl",Barry French,293,46.71,8.69,2.99,Nunavut,Binders and Binder Accessories,0.39
4,R380,Clay Rozendal,483,1198.97,195.99,3.99,Nunavut,Telephones and Communication,0.58
5,Holmes HEPA Air Purifier,Carlos Soltero,515,30.94,21.78,5.94,Nunavut,Appliances,0.5
6,G.E. Longer-Life Indoor Recessed Floodlight Bulbs,Carlos Soltero,515,4.43,6.64,4.95,Nunavut,Office Furnishings,0.37
7,"Angle-D Binders with Locking Rings, Label Holders",Carl Jackson,613,-54.04,7.3,7.72,Nunavut,Binders and Binder Accessories,0.38
8,"SAFCO Mobile Desk Side File, Wire Frame",Carl Jackson,613,127.70,42.76,6.22,Nunavut,Storage & Organization,
9,"SAFCO Commercial Wire Shelving, Black",Monica Federle,643,-695.26,138.14,35,Nunavut,Storage & Organization,
10,Xerox 198,Dorothy Badders,678,-226.36,4.98,8.33,Nunavut,Paper,0.38
`;
    });

    after(() => {
        require('del')([ tmpDir ], { force: true });
    });

    it('should create csv from array', (done) => {

        const arrayData = [
            [1,2,3,4,5],
            [6,7,7,8,9],
            [0,5,8,90,65]
        ];

        const columns = ['column 1', 'column 2', 'column 3', 'h4', 'h5'];

        csv.createFile(
            arrayData,
            {
                columns,
                formatter: (row) => {
                    return row.map((value) => 'formatted-' + value);
                }
            }
        ).then((csvFilePath) => {
            expect(csvFilePath).to.match(new RegExp(`${tmpDir}\.+?\.csv`));

            fs.readFile(csvFilePath, 'utf8', (error, data) => {
                if (error) return done(data);
                expect(data).to.match(new RegExp(columns.join(',')));
                expect(data).to.match(new RegExp(arrayData[0].map((value) => 'formatted-' + value).join(',')));
                done();
            });

        }).catch(done);

    });

    it('should create csv from object', (done) => {
        const objectData = [
            {col1: 'ab', col2: 'cd', col3: 'ef'},
            {col1: '2ab', col2: '2cd', col3: '2ef'},
            {col1: '3ab', col2: '3cd', col3: '3ef'}
        ];

        const columns = ['col1', 'col2', 'col3'];
        const filepath = `${tmpDir}/${Math.random}.csv`;
        csv.createFile(
            objectData,
            {
                columns,
                formatter: (row) => {
                    return [row.col1 + '+format', row.col2 + '+format', row.col3];
                },
                filepath
            }
        ).then((csvFilePath) => {
            expect(csvFilePath).to.equal(filepath);

            expect(csvFilePath).to.match(new RegExp(`${tmpDir}\.+?\.csv`));

            fs.readFile(csvFilePath, 'utf8', (error, data) => {
                if (error) return done(data);
                expect(data).to.match(new RegExp(columns.join(',')));
                expect(data.includes('ab+format,cd+format,ef')).to.be.true;
                done();
            });
        }).catch(done);
    });

    it('should read csv file as array', (done) => {
        const filename = `${tmpDir}/${Math.random}.csv`;

        fs.writeFile(filename, csvString, 'utf8', (error) => {
            if (error) return done(data);

            let doneCalled = false;

            const lines = csv.readFile(filename);
            lines.forEach(
                (lineArray, index) => {
                    try {
                        if (index === 0) {
                            expect(lineArray[2]).to.equal('Muhammed MacIntyre');
                        }
                        expect(lineArray.length).to.equal(10);
                    } catch (e) {
                        done(e);
                        doneCalled = true;
                    }
                },
                (total) => {
                    expect(total).to.equal(10);
                    if (!doneCalled) done();
                }
            );

        });
    });

    it('should read csv file as object', (done) => {
        const filename = `${tmpDir}/${Math.random}.csv`;
        const columns = ['id', 'prod', 'name', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9', 'col10'];
        const limit = 5;

        fs.writeFile(filename, csvString, 'utf8', (error) => {
            if (error) return done(data);

            let doneCalled = false;

            const lines = csv.readFile(filename, {columns, limit});
            lines.forEach(
                (lineArray, index) => {
                    try {
                        if (index === 1) {
                            expect(lineArray.prod).to.equal('1.7 Cubic Foot Compact "Cube" Office Refrigerators');
                            expect(lineArray.col4).to.equal('293');
                        }
                        expect(Object.keys(lineArray).length).to.equal(10);
                    } catch (e) {
                        done(e);
                        doneCalled = true;
                    }
                },
                (total) => {
                    expect(total).to.equal(limit);
                    if (!doneCalled) done();
                }
            );

        });
    });

});
