'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Formdata Module', function () {

    const { formData, express, getFormData, FormDataError } = require(`../${config.sourceFolder}/formdata`);

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

        it('should parse post data without uploaded files', async () => {
            const data = await getFormData(
                getRequest(
                    getFileUploadConent(getFields()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                )
            );

            expect(data).to.have.deep.property('a', [ '1', '2' ]);
            expect(data).to.have.property('d', '32323');
        });

        it('should parse post data as arrays without uploaded files', async () => {
            const dataArray = await getFormData(
                getRequest(
                    getFileUploadConent(getFields()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                {array: true}
            );

            expect(dataArray).to.have.deep.property('a', [ '1', '2' ]);
            expect(dataArray).to.have.deep.property('d', ['32323']);
        })

        it('should get a single uploaded file', async () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getTXT()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir }
            );
            const data = await formdata.getData('d');

            expect(data).to.have.nested.property('d.error').and.to.be.not.ok;
            expect(data).to.have.nested.property('d.fieldname', 'd');
            expect(data).to.have.nested.property('d.filename', 'test.txt');
            expect(data).to.have.nested.property('d.encoding');
            expect(data).to.have.nested.property('d.mimetype', 'text/plain');
            expect(data).to.have.nested.property('d.size').and.above(10);
            expect(data).to.have.nested.property('d.path');
            expect(data).to.have.nested.property('d.remove');
        });

        it('should get a single uploaded file as array', async () => {
            // get array data
            const arrayData = await getFormData(
                getRequest(
                    getFileUploadConent(getTXT()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, fileFieldNames: 'd', array: true }
            );

            expect(arrayData).to.have.property('d').and.is.an('array');
            expect(arrayData.d[0]).to.have.property('error').and.be.not.ok;
            expect(arrayData.d[0]).to.have.property('fieldname', 'd');
            expect(arrayData.d[0]).to.have.property('filename', 'test.txt');
            expect(arrayData.d[0]).to.have.property('encoding');
            expect(arrayData.d[0]).to.have.property('mimetype', 'text/plain');
            expect(arrayData.d[0]).to.have.property('size').and.above(10);
            expect(arrayData.d[0]).to.have.property('path');
            expect(arrayData.d[0]).to.have.property('remove');
        });

        it('should get multiple uploaded files', async () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getTXT() + getSVG() + getCSV()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir }
            );
            const data = await formdata.getData(['d', 'b']);

            expect(data).to.have.property('b').and.is.an('array').and.have.lengthOf(2);

            expect(data.b[0]).to.have.property('error').and.be.not.ok;
            expect(data.b[0]).to.have.property('fieldname', 'b');
            // expect(data.b[0]).to.have.property('filename', 'test.svg');
            expect(data.b[0]).to.have.property('encoding');
            // expect(data.b[0]).to.have.property('mimetype', 'image/svg+xml');
            expect(data.b[0]).to.have.property('size').and.above(10);
            expect(data.b[0]).to.have.property('path');
            expect(data.b[0]).to.have.property('remove');

            expect(data.b[1]).to.have.property('error').and.be.not.ok;
            expect(data.b[1]).to.have.property('fieldname', 'b');
            // expect(data.b[1]).to.have.property('filename', 'test.csv');
            expect(data.b[1]).to.have.property('encoding');
            // expect(data.b[1]).to.have.property('mimetype');
            expect(data.b[1]).to.have.property('size').and.above(10);
            expect(data.b[1]).to.have.property('path');
            expect(data.b[1]).to.have.property('remove');

            expect(
                data.b.map(
                    (file) => ({name: file.filename, type: file.mimetype})
                )
            ).to.have.deep.members([
                {name: 'test.svg', type: 'image/svg+xml'},
                {name: 'test.csv', type: 'application/octet-stream'}
            ]);
            expect(data.b).to.have.lengthOf(2);

            expect(data).to.have.property('d');
            expect(data.d).to.have.property('error').and.be.not.ok;
            expect(data.d).to.have.property('fieldname', 'd');
            expect(data.d).to.have.property('filename', 'test.txt');
            expect(data.d).to.have.property('encoding');
            expect(data.d).to.have.property('mimetype', 'text/plain');
            expect(data.d).to.have.property('size').and.above(10);
            expect(data.d).to.have.property('path');
            expect(data.d).to.have.property('remove');
        });

        it('should get mixed field data and file data', async () => {
            const data = await getFormData(
                getRequest(
                    getFileUploadConent(getFields () + getTXT() + getSVG() + getCSV()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, fileFieldNames: ['d', 'b'] }
            );

            expect(data).to.have.deep.property('a', [ '1', '2' ]);

            expect(data).to.have.property('b').and.is.an('array').and.have.lengthOf(2);

            expect(data.b[0]).to.have.property('error').and.be.not.ok;
            expect(data.b[0]).to.have.property('fieldname', 'b');
            // expect(data.b[0]).to.have.property('filename', 'test.svg');
            expect(data.b[0]).to.have.property('encoding');
            // expect(data.b[0]).to.have.property('mimetype', 'image/svg+xml');
            expect(data.b[0]).to.have.property('size').and.above(10);
            expect(data.b[0]).to.have.property('path');
            expect(data.b[0]).to.have.property('remove');

            expect(data.b[1]).to.have.property('error').and.be.not.ok;
            expect(data.b[1]).to.have.property('fieldname', 'b');
            // expect(data.b[1]).to.have.property('filename', 'test.csv');
            expect(data.b[1]).to.have.property('encoding');
            expect(data.b[1]).to.have.property('mimetype');
            expect(data.b[1]).to.have.property('size').and.above(10);
            expect(data.b[1]).to.have.property('path');
            expect(data.b[1]).to.have.property('remove');

            expect(
                data.b.map(
                    (file) => ({name: file.filename, type: file.mimetype})
                )
            ).to.have.deep.members([
                {name: 'test.svg', type: 'image/svg+xml'},
                {name: 'test.csv', type: 'application/octet-stream'}
            ]);
            expect(data.b).to.have.lengthOf(2);

            expect(data).to.have.property('d').and.is.an('array').and.have.lengthOf(2);
            expect(data.d[0]).to.equal('32323');
            expect(data.d[1]).to.have.property('error').and.be.not.ok;
            expect(data.d[1]).to.have.property('fieldname', 'd');
            expect(data.d[1]).to.have.property('filename', 'test.txt');
            expect(data.d[1]).to.have.property('encoding');
            expect(data.d[1]).to.have.property('mimetype', 'text/plain');
            expect(data.d[1]).to.have.property('size').and.above(10);
            expect(data.d[1]).to.have.property('path');
            expect(data.d[1]).to.have.property('remove');
        });

        // it('should have correct prefix and postfix'); // this should be the job of the tmp module
    });

    describe('express', () => {
        it('should apply express middleware', async () => {
            const next = sinon.spy();
            const request = getRequest('a=312312&a=3&x=4fsdfsd', 'application/x-www-form-urlencoded');
            express()(request, '', next);
            expect(next.calledOnce).to.be.true;
            expect(request).to.have.property('formdata');
            expect(request.formdata).to.have.property('getData');

            const data = await request.formdata.getData();
            expect(data).to.deep.equal({ a: [ '312312', '3' ], x: '4fsdfsd' });
        });
    });

    describe('errors', () => {
        // FormDataError
        // FILE_SIZE_EXCEEDED_LIMIT = 'FILE_SIZE_EXCEEDED_LIMIT',

        it('should reject invalid JSON', async () => {
            expect(
                getFormData(getRequest('{a:["4","3"],"x":"4fsdfsd"}', 'application/json'))
            ).to.eventually.be.rejectedWith(FormDataError.INVALID_JSON);
        });

        it('should reject when # of fields exceeded limit', () => {
            return Promise.all([
                expect(
                    getFormData(
                        getRequest('a=312312&a=3&x=4fsdfsd', 'application/x-www-form-urlencoded'),
                        {
                            limits: { fields: 1 }
                        }
                    )
                ).to.eventually.be.rejectedWith(FormDataError.NUM_OF_FIELDS_EXCEEDED_LIMIT),
                expect(
                    getFormData(
                        getRequest(
                            getFileUploadConent(getFields() + getTXT()),
                            `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                        ),
                        { dir: tmpDir, limits: { parts: 2 }, fileFieldNames: ['b', 'd'] }
                    )
                ).to.eventually.be.rejectedWith(FormDataError.NUM_OF_FIELDS_EXCEEDED_LIMIT)
            ]);
        });

        it('should reject when # of uploaded files exceeded limit', () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getTXT() + getSVG() + getCSV()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, limits: { files: 1 } }
            );

            return expect(
                formdata.getData(['d', 'b'])
            ).to.eventually.be.rejectedWith(FormDataError.NUM_OF_FILES_EXCEEDED_LIMIT);
        });

        it('should reject when # of non file fields exceeded limit', () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getFields() + getTXT()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, limits: { fields: 1 } }
            );

            return expect(
                formdata.getData(['d', 'b'])
            ).to.eventually.be.rejectedWith(FormDataError.NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT);
        });

        it('should reject when field value or post size exceeded limit', () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getBiggerFields() + getCSV() + getTXT()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, limits: { fieldSize: 1 }, alwaysReject: true }
            );

            return Promise.all([
                expect(
                    formdata.getData(['b'])
                ).to.eventually.be.rejectedWith(FormDataError.FIELD_SIZE_EXCEEDED_LIMIT),
                expect(
                    getFormData(
                        getRequest('a=312312&a=3&x=4fsdfsd', 'application/x-www-form-urlencoded'),
                        {
                            limits: { postSize: 5 }
                        }
                    )
                ).to.eventually.be.rejectedWith(FormDataError.POST_SIZE_EXCEEDED_LIMIT)
            ]);
        });

        it('should assign error value when the size of the uploaded files exceeded limit', async () => {
            const formdata = formData(
                getRequest(
                    getFileUploadConent(getTXT() + getSVG() + getCSV()),
                    `multipart/form-data; boundary=----WebKitFormBoundarytzSKGCp9aZzs2Oz6`
                ),
                { dir: tmpDir, limits: { fileSize: 1000 } }
            );

            const data = await formdata.getData(['d', 'b']);

            expect(data).to.have.property('d');
            expect(data.d).to.have.property('error').and.be.not.ok;
            expect(data.d).to.have.property('fieldname', 'd');
            expect(data.d).to.have.property('filename', 'test.txt');
            expect(data.d).to.have.property('encoding');
            expect(data.d).to.have.property('mimetype', 'text/plain');
            expect(data.d).to.have.property('size').and.above(10);
            expect(data.d).to.have.property('path');
            expect(data.d).to.have.property('remove');

            expect(data).to.have.property('b').and.is.an('array').and.have.lengthOf(2);

            expect(data.b[0]).to.have.property('error', FormDataError.FILE_SIZE_EXCEEDED_LIMIT);
            expect(data.b[0]).to.have.property('fieldname', 'b');
            // expect(data.b[0]).to.have.property('filename', 'test.svg');
            expect(data.b[0]).to.have.property('encoding');
            // expect(data.b[0]).to.have.property('mimetype', 'image/svg+xml');
            expect(data.b[0]).to.have.property('size');
            expect(data.b[0]).to.have.property('path');
            expect(data.b[0]).to.have.property('remove');
            expect(fs.existsSync(data.b[0].path)).to.be.false;

            expect(data.b[1]).to.have.property('error', FormDataError.FILE_SIZE_EXCEEDED_LIMIT);
            expect(data.b[1]).to.have.property('fieldname', 'b');
            // expect(data.b[1]).to.have.property('filename', 'test.csv');
            expect(data.b[1]).to.have.property('encoding');
            expect(data.b[1]).to.have.property('mimetype');
            expect(data.b[1]).to.have.property('size');
            expect(data.b[1]).to.have.property('path');
            expect(data.b[1]).to.have.property('remove');
            expect(fs.existsSync(data.b[1].path)).to.be.false;

            expect(
                data.b.map(
                    (file) => ({name: file.filename, type: file.mimetype})
                )
            ).to.have.deep.members([
                {name: 'test.svg', type: 'image/svg+xml'},
                {name: 'test.csv', type: 'application/octet-stream'}
            ]);
            expect(data.b).to.have.lengthOf(2);

        });
    });

    function getSVG () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="b"; filename="test.svg"\r
Content-Type: image/svg+xml\r
\r
<?xml version="1.0" encoding="UTF-8" standalone="no"?>\r
<svg width="36px" height="36px" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">\r
    <!-- Generator: Sketch 3.4.4 (17249) - http://www.bohemiancoding.com/sketch -->\r
    <title>business</title>\r
    <desc>Created with Sketch.</desc>\r
    <defs>\r
        <path id="path-1" d="M0,0.0975483871 L21,0.0975483871 L21,18 L0,18 L0,0.0975483871 Z"></path>\r
    </defs>\r
    <g id="-Assets" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">\r
        <g id="Desktop-HD" sketch:type="MSArtboardGroup" transform="translate(-568.000000, -784.000000)">\r
            <g id="CATEGORY-ICONS" sketch:type="MSLayerGroup" transform="translate(206.000000, 711.000000)">\r
                <g id="business" transform="translate(362.000000, 73.000000)">\r
                    <g id="Oval-175-+-Icon/Code-Copy-4" fill="#F48A45" sketch:type="MSShapeGroup">\r
                        <circle id="Oval-175" cx="18" cy="18" r="18"></circle>\r
                    </g>\r
                    <g id="Page-1" transform="translate(8.000000, 8.000000)">\r
                        <path d="M1.40784,4.45732258 L0,4.45732258 L0,6.0506129 L0,7.6436129 L0,16.4064194 C0,17.2863871 0.63028,17.9997097 1.40784,17.9997097 L2.40072,17.9997097 L2.40072,4.45732258 L1.40784,4.45732258 Z" id="Fill-1" fill="#FFFFFF" sketch:type="MSShapeGroup"></path>\r
                        <path d="M19.59244,4.45732258 L18.65276,4.45732258 L18.65276,18 L19.59244,18 C20.36944,18 21,17.2866774 21,16.4067097 L21,7.64390323 L21,6.05090323 L21,4.4576129 L19.59244,4.4576129 L19.59244,4.45732258 Z" id="Fill-3" fill="#FFFFFF" sketch:type="MSShapeGroup"></path>\r
                        <mask id="mask-2" sketch:name="Clip 6" fill="white">\r
                            <use xlink:href="#path-1"></use>\r
                        </mask>\r
                        <g id="Clip-6"></g>\r
                        <path d="M6.77376,1.55845161 L14.26908,1.55845161 L14.26908,4.45732258 L6.77376,4.45732258 L6.77376,1.55845161 Z M15.67748,4.45732258 L15.67748,0.0975483871 L5.36508,0.0975483871 L5.36508,4.45732258 L3.80912,4.45732258 L3.80912,18 L17.2438,18 L17.2438,4.45732258 L15.67748,4.45732258 Z" id="Fill-5" fill="#FFFFFF" sketch:type="MSShapeGroup" mask="url(#mask-2)"></path>\r
                    </g>\r
                </g>\r
            </g>\r
        </g>\r
    </g>\r
</svg>\r
`;
    }

    function getCSV () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="b"; filename="test.csv"\r
Content-Type: application/octet-stream\r
\r
1,"Eldon Base for stackable storage shelf, platinum",Muhammed MacIntyre,3,-213.25,38.94,35,Nunavut,Storage & Organization,0.8\r
2,"1.7 Cubic Foot Compact ""Cube"" Office Refrigerators",Barry French,293,457.81,208.16,68.02,Nunavut,Appliances,0.58\r
3,"Cardinal Slant-D� Ring Binder, Heavy Gauge Vinyl",Barry French,293,46.71,8.69,2.99,Nunavut,Binders and Binder Accessories,0.39\r
4,R380,Clay Rozendal,483,1198.97,195.99,3.99,Nunavut,Telephones and Communication,0.58\r
5,Holmes HEPA Air Purifier,Carlos Soltero,515,30.94,21.78,5.94,Nunavut,Appliances,0.5\r
6,G.E. Longer-Life Indoor Recessed Floodlight Bulbs,Carlos Soltero,515,4.43,6.64,4.95,Nunavut,Office Furnishings,0.37\r
7,"Angle-D Binders with Locking Rings, Label Holders",Carl Jackson,613,-54.04,7.3,7.72,Nunavut,Binders and Binder Accessories,0.38\r
8,"SAFCO Mobile Desk Side File, Wire Frame",Carl Jackson,613,127.70,42.76,6.22,Nunavut,Storage & Organization,\r
9,"SAFCO Commercial Wire Shelving, Black",Monica Federle,643,-695.26,138.14,35,Nunavut,Storage & Organization,\r
10,Xerox 198,Dorothy Badders,678,-226.36,4.98,8.33,Nunavut,Paper,0.38\r
\r
`;
    }

    function getTXT () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="d"; filename="test.txt"\r
Content-Type: text/plain\r
\r
test file txt\r
`;
    }

    function getFields () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="a"\r
\r
1\r
------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="d"\r
\r
32323\r
------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="a"\r
\r
2\r
`;
    }

    function getBiggerFields () {
        return `------WebKitFormBoundarytzSKGCp9aZzs2Oz6\r
Content-Disposition: form-data; name="xxlonglonglonglongnamex"\r
\r
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\r
`;
    }

    function getFileUploadConent (contents = '') {
        return `${contents}------WebKitFormBoundarytzSKGCp9aZzs2Oz6--\r
`;
    }

});
