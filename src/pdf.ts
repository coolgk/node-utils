/* tslint:disable */
/*
import { Pdf } from './pdf';
// OR
// const Pdf = require('./pdf');

const pdf = new Pdf({
    tmpConfig: { // optional
        dir: '/tmp/pdf'
    }
});

pdf.createFromHtmlFile(
    '/tmp/test.html',
    {
        header: {
            height: '1cm',
            contents: "header <strong style='color: red'>Page ${pageNumber} of ${numberOfPages} - ${pageNumber}</strong>"
        },
        footer: {
            height: '1cm',
            contents: 'footer <strong>Page ${pageNumber} of ${numberOfPages}</strong>'
        },
        margin: '0.5cm'
    }
).then((pdfFile) => {
    console.log(pdfFile);
});

const htmlCode = `<!DOCTYPE html><html><head>
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

pdf.createFromHtmlString(htmlCode).then((pdfFile) => {
    console.log(pdfFile);
});

*/
/* tslint:enable */

// npm i -S phantom @types/phantom

// callback is missing in @types/phantom
declare module 'phantom' {
    interface PhantomJS { // tslint:disable-line
        callback: (data: any) => any;
    }
}

import { createWriteStream } from 'fs';
import * as phantom from 'phantom';
import * as tmp from './tmp';

export interface IPdfConfig {
    readonly phantom?: typeof phantom;
    readonly tmp?: typeof tmp;
    readonly tmpConfig?: tmp.ITmpConfig;
}

export enum Orientation {
    Portrait = 'portrait',
    Landscape = 'landscape'
}

export enum Format {
    A3 = 'A3',
    A4 = 'A4',
    A5 = 'A5',
    Legal = 'Legal',
    Letter = 'Letter',
    Tabloid = 'Tabloid'
}

export interface ICreateConfig {
    readonly pdfFilePath?: string;
    readonly delay?: number;
    readonly orientation?: Orientation;
    readonly format?: Format;
    readonly margin?: number | string | {
        top: number | string,
        left: number | string,
        bottom: number | string,
        right: number | string
    };
    readonly header?: string | { height: string, contents: string };
    readonly footer?: string | { height: string, contents: string };
    readonly dpi?: number;
}

export class Pdf {

    private _phantom: typeof phantom;
    private _tmp: typeof tmp;
    private _tmpConfig: tmp.ITmpConfig;

    public constructor (options: IPdfConfig = {}) {
        this._phantom = options.phantom || phantom;
        this._tmp = options.tmp || tmp;
        this._tmpConfig = options.tmpConfig || {};
    }

    /**
     * @see http://phantomjs.org/api/webpage/property/paper-size.html
     * A4 page height: 842px
     * for full page in PDF, set height of a page in html to 842px
     *
     * @param {string} htmlFilePath - file path of an html
     * @param {string} [options.pdfFilePath] - file path is automatically generated if empty
     * @param {number} [options.delay=1] - delay in seconds before generating pdf. wait for js generated contents.
     * @param {(string|number)} [options.margin=0] - e.g. 1cm or {top: '50px', left: '20px'}
     * @param {string} [options.orientation='portrait'] - e.g. portrait or landscape
     * @param {string} [options.format='A4'] - e.g. A4
     * @param {string|object} [options.header] - html code e.g. Page ${pageNumber} of ${numberOfPages}
     * @param {(string|number)} [options.header.height] - e.g. 1cm or 100px
     * @param {string} [options.header.contents] - html code e.g. Page ${pageNumber} of ${numberOfPages}
     * @param {string|object} [options.footer] - html code e.g. Page ${pageNumber} of ${numberOfPages}
     * @param {(string|number)} [options.footer.height] - e.g. 1cm or 100px
     * @param {(string|number)} [options.footer.contents] - e.g. html code e.g. Page ${pageNumber} of ${numberOfPages}
     * @param {number} [options.dpi=96] - e.g. 96
     * @return {promise}
     */
    public async createFromHtmlFile (
        htmlFilePath: string,
        {
            pdfFilePath = '',
            delay = 0,
            margin = 0,
            orientation = Orientation.Portrait,
            format = Format.A4,
            header = '',
            footer = '',
            dpi = 96
        }: ICreateConfig = {}
    ): Promise<string> {
        if (!pdfFilePath) {
            pdfFilePath = (await this._tmp.generateFile({...this._tmpConfig, keep: true, postfix: '.pdf'})).path;
        }

        const phantomInstance = await this._phantom.create();
        const page = await phantomInstance.createPage();

        await page.open(htmlFilePath).then(
            () => page.property('dpi', dpi)
        );

        await page.property('paperSize', {
            format,
            orientation,
            margin,
            header: {
                height: typeof header === 'string' ? 0 : header.height || 0,
                contents: phantomInstance.callback(
                    this._getHeaderFooter(typeof header === 'string' ? header : header.contents + '')
                )
            },
            footer: {
                height: typeof footer === 'string' ? 0 : footer.height || 0,
                contents: phantomInstance.callback(
                    this._getHeaderFooter(typeof footer === 'string' ? footer : footer.contents + '')
                )
            }
        });

        return new Promise<string>(async (resolve) => {
            await page.render(pdfFilePath, {format: 'pdf'});
            phantomInstance.exit();
            resolve(pdfFilePath);
        });
    }

    /**
     * @param {string} htmlString - html code e.g. <h1>header 1</h1>
     * @see createFromHtmlFile()
     */
    public async createFromHtmlString (
        htmlString: string,
        options: ICreateConfig = {}
    ): Promise<string> {
        const {path, cleanupCallback} = await this._tmp.generateFile({
            ...this._tmpConfig,
            keep: true,
            postfix: '.html'
        });
        const fileStream = createWriteStream(path);
        return new Promise(
            (resolve, reject) => fileStream.write(htmlString) ? resolve() : fileStream.once('drain', resolve)
        ).then(
            async () => {
                const pdfFilePath = await this.createFromHtmlFile(path, options);
                cleanupCallback(); // remove tmp html file
                return pdfFilePath;
            }
        );
    }

    /**
     * @param {string} html - html code for footer or header
     * @return {function} - a callback function for phantom.callback
     * @see http://phantomjs.org/api/webpage/property/paper-size.html Headers and Footers section
     */
    private _getHeaderFooter (html: string = ''): () => string {
        return new Function(
            'pageNumber',
            'numberOfPages',
            "return '"
            + (html.replace(/'/g, "\\'") || '')
            + "'.replace(/\\${pageNumber}/g, pageNumber).replace(/\\${numberOfPages}/g, numberOfPages)" // tslint:disable-line
        ) as () => string;
    }
}
