'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('PDF Module', function () {
    this.timeout(5000);

    const { Pdf, Format, Orientation } = require(`../${config.sourceFolder}/pdf`);

    const tmpDir = '/tmp/test-pdf-' + Math.random();

    const pdf = new Pdf({
        tmpConfig: { dir: tmpDir } // optional
    });

    const fs = require('fs');
    const mimeTypes = require('mime-types');

    let htmlString = '';
    const htmlFile = `${tmpDir}/html${Math.random()}.html`;

    before((done) => {
        htmlString = `<!DOCTYPE html><html><head>
            <title>CCES</title>
            <style>
                .pagebreak { page-break-after: always; }
                h2, h1 { color: red }
            </style>
        </head>
        <body>
            <div>
                <h1>page 1</h1>
                <p>some text <img src='https://dummyimage.com/600x400/3bbda9/f516ae.jpg'></p>
            </div>
            <div class="pagebreak"></div>
            <div>
                <h2>page 2</h2>
                <table>
                    <tr>
                        <td>texgt</td>
                        <td>text</td>
                    </tr>
                </table>
            </div>
        </body>
    </html>`;

        fs.mkdir(tmpDir, (error) => {
            if (error && error.code !== 'EEXIST') return done(error);
            fs.writeFile(htmlFile, htmlString, 'utf8', (error) => {
                if (error) return done(data);
                done();
            });
        });
    });

    after(() => {
        require('del')([ tmpDir ], { force: true });
    });

    it('should create PDF from file', (done) => {
        pdf.createFromHtmlFile(
            htmlFile,
            {
                header: {
                    height: '1cm',
                    contents: "<strong style='color: red'>Page ${pageNumber} of ${numberOfPages} - ${pageNumber}</strong>"
                },
                footer: {
                    // height: '1cm',
                    contents: 'footer <strong>Page ${pageNumber} of ${numberOfPages}</strong>'
                },
                margin: '0.5cm'
            }
        ).then((pdfFile) => {
            expect(pdfFile).to.match(new RegExp(`${tmpDir}\.+?\.pdf`));
            fs.stat(pdfFile, (error, stats) => {
                if (error) return done(error);
                expect(stats.isFile()).to.be.true;
                expect(mimeTypes.lookup(pdfFile)).to.equal('application/pdf');
                done();
            });
        }).catch(done);
    });

    it('should create PDF from string', (done) => {
        pdf.createFromHtmlString(
            htmlString
        ).then((pdfFile) => {
            expect(pdfFile).to.match(new RegExp(`${tmpDir}\.+?\.pdf`));
            fs.stat(pdfFile, (error, stats) => {
                if (error) return done(error);
                expect(stats.isFile()).to.be.true;
                expect(mimeTypes.lookup(pdfFile)).to.equal('application/pdf');
                done();
            });
        }).catch(done);
    });

});
