
import { existsSync } from 'fs';

export const Utils: {[key: string]: any;} = new Proxy({}, {
    get: function (target: {[key: string]: any;}, name: string) {
        const filepath = `${__dirname}/${name}.js`;
        if (existsSync(filepath)) {
            return require(filepath);
        }
        return undefined;
    }
});
