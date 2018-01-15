'use strict';

// const sinon = require('sinon');
const chai = require('chai');
// chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');
/*
describe.only('Formdata Module', function () {

    const { formData, express, getFormData } = require(`../${config.sourceFolder}/formdata`);

    const fs = require('fs');
    const stream = require('stream');
    const querystring = require('querystring');

    function getRequest (string, contentType) {
        const request = new stream.Readable();
        request._read = function noop() {};
        request.push(string);
        request.push(null);
        request.headers = {
            'content-type': contentType,
            'content-length': string.length
        };
        return request;
    }

    const tmpDir = '/tmp/test-formdata' + Math.random();

    before((done) => {
        fs.mkdir(tmpDir, (error) => {
            if (error && error.code !== 'EEXIST') return done(error);
            done();
        });
    });

    after(() => {
        require('del')([ tmpDir ], { force: true });
    });

    describe('application/x-www-form-urlencoded', () => {

        it('should get single value as string and multiple values as array', async () => {
            const formdata = formData(
                getRequest('a=312312&a=3&x=4fsdfsd', 'application/x-www-form-urlencoded')
            );
            const data = await formdata.getData();
            expect(data).to.deep.equal({ a: [ '312312', '3' ], x: '4fsdfsd' });
        });

        it('should always get values as array when array option is true', async () => {
            const formdata = formData(
                getRequest('a=312312&a=3&x=4fsdfsd', 'application/x-www-form-urlencoded'),
                {array: true}
            );
            const data = await formdata.getData();
            expect(data).to.deep.equal({ a: [ '312312', '3' ], x: ['4fsdfsd'] });
        });

    });

    describe('application/json', () => {

        it('should get single value as string and multiple values as array', async () => {
            const formdata = formData(
                getRequest('{"a":["4","3"],"x":"4fsdfsd"}', 'application/json')
            );
            const data = await formdata.getData();
            expect(data).to.deep.equal({ a: [ '4', '3' ], x: '4fsdfsd' });
        });

        it('should always get values as array when array option is true', async () => {
            const formdata = formData(
                getRequest('{"a":["4","3"],"x":"4fsdfsd"}', 'application/json'),
                {array: true}
            );
            const data = await formdata.getData();
            expect(data).to.deep.equal({ a: [ '4', '3' ], x: ['4fsdfsd'] });
        });

    });

    describe('application/form-data', () => {

        it.only('should get single value as string and multiple values as array', async () => {
            const formdata = formData(
                getRequest(getFileUploadConent(), `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6\r\n`),
                { dir: tmpDir }
            );
            const data = await formdata.getData();

            //expect(data).to.have.deep.property('a', [ '1', '2' ]);

            // expect(data).to.have.nested.property('b.error', '');
            // expect(data).to.have.nested.property('b.fieldname', 'b');
            // expect(data).to.have.nested.property('b.filename', 'test.csv');
            // expect(data).to.have.nested.property('b.encoding');
            // expect(data).to.have.nested.property('b.mimetype', 'text/csv');
            // expect(data).to.have.nested.property('b.size').and.above(100);
            // expect(data).to.have.nested.property('b.path');
            // expect(data).to.have.property('remove');

            //expect(data).to.have.deep.property('d', '32323');
        });

        // it('should always get values as array when array option is true', async () => {
            // const formdata = formData(
                // getRequest('{"a":["4","3"],"x":"4fsdfsd"}', 'multipart/form-data'),
                // {array: true, dir: tmpDir}
            // );
            // const data = await formdata.getData();
            // expect(data).to.deep.equal({ a: [ '4', '3' ], x: ['4fsdfsd'] });
        // });

    });

    function getSVG () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6
Content-Disposition: form-data; name="b"; filename="test.svg"
Content-Type: image/svg+xml

<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">
    <!-- Generator: Sketch 3.4.4 (17249) - http://www.bohemiancoding.com/sketch -->
    <title>business</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <path id="path-1" d="M0,0.0975483871 L21,0.0975483871 L21,18 L0,18 L0,0.0975483871 Z"></path>
    </defs>
    <g id="-Assets" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
        <g id="Desktop-HD" sketch:type="MSArtboardGroup" transform="translate(-568.000000, -784.000000)">
            <g id="CATEGORY-ICONS" sketch:type="MSLayerGroup" transform="translate(206.000000, 711.000000)">
                <g id="business" transform="translate(362.000000, 73.000000)">
                    <g id="Oval-175-+-Icon/Code-Copy-4" fill="#F48A45" sketch:type="MSShapeGroup">
                        <circle id="Oval-175" cx="18" cy="18" r="18"></circle>
                    </g>
                    <g id="Page-1" transform="translate(8.000000, 8.000000)">
                        <path d="M1.40784,4.45732258 L0,4.45732258 L0,6.0506129 L0,7.6436129 L0,16.4064194 C0,17.2863871 0.63028,17.9997097 1.40784,17.9997097 L2.40072,17.9997097 L2.40072,4.45732258 L1.40784,4.45732258 Z" id="Fill-1" fill="#FFFFFF" sketch:type="MSShapeGroup"></path>
                        <path d="M19.59244,4.45732258 L18.65276,4.45732258 L18.65276,18 L19.59244,18 C20.36944,18 21,17.2866774 21,16.4067097 L21,7.64390323 L21,6.05090323 L21,4.4576129 L19.59244,4.4576129 L19.59244,4.45732258 Z" id="Fill-3" fill="#FFFFFF" sketch:type="MSShapeGroup"></path>
                        <mask id="mask-2" sketch:name="Clip 6" fill="white">
                            <use xlink:href="#path-1"></use>
                        </mask>
                        <g id="Clip-6"></g>
                        <path d="M6.77376,1.55845161 L14.26908,1.55845161 L14.26908,4.45732258 L6.77376,4.45732258 L6.77376,1.55845161 Z M15.67748,4.45732258 L15.67748,0.0975483871 L5.36508,0.0975483871 L5.36508,4.45732258 L3.80912,4.45732258 L3.80912,18 L17.2438,18 L17.2438,4.45732258 L15.67748,4.45732258 Z" id="Fill-5" fill="#FFFFFF" sketch:type="MSShapeGroup" mask="url(#mask-2)"></path>
                    </g>
                </g>
            </g>
        </g>
    </g>
</svg>
`;
    }

    function getCSV () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6
Content-Disposition: form-data; name="b"; filename="test.csv"
Content-Type: application/octet-stream

1,"Eldon Base for stackable storage shelf, platinum",Muhammed MacIntyre,3,-213.25,38.94,35,Nunavut,Storage & Organization,0.8
2,"1.7 Cubic Foot Compact ""Cube"" Office Refrigerators",Barry French,293,457.81,208.16,68.02,Nunavut,Appliances,0.58
3,"Cardinal Slant-D� Ring Binder, Heavy Gauge Vinyl",Barry French,293,46.71,8.69,2.99,Nunavut,Binders and Binder Accessories,0.39
4,R380,Clay Rozendal,483,1198.97,195.99,3.99,Nunavut,Telephones and Communication,0.58
5,Holmes HEPA Air Purifier,Carlos Soltero,515,30.94,21.78,5.94,Nunavut,Appliances,0.5
6,G.E. Longer-Life Indoor Recessed Floodlight Bulbs,Carlos Soltero,515,4.43,6.64,4.95,Nunavut,Office Furnishings,0.37
7,"Angle-D Binders with Locking Rings, Label Holders",Carl Jackson,613,-54.04,7.3,7.72,Nunavut,Binders and Binder Accessories,0.38
8,"SAFCO Mobile Desk Side File, Wire Frame",Carl Jackson,613,127.70,42.76,6.22,Nunavut,Storage & Organization,
9,"SAFCO Commercial Wire Shelving, Black",Monica Federle,643,-695.26,138.14,35,Nunavut,Storage & Organization,
10,Xerox 198,Dorothy Badders,678,-226.36,4.98,8.33,Nunavut,Paper,0.38

`;
    }

    function getTXT () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6
Content-Disposition: form-data; name="d"; filename="test.txt"
Content-Type: text/plain

test file txt
`;
    }

    function getFileUploadConent () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6
Content-Disposition: form-data; name="a"

1
------WebKitFormBoundarytzSKGCp9aZzs2Oz6--\r\n`;
    }

});
*/