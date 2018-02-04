import { Db, ObjectID, Cursor, Collection } from 'mongodb';

export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    OBJECT = 'object',
    ENUM = 'enum',
    BOOLEAN = 'boolean',
    DATE = 'date',
    DBREF = 'dbRef'
}

export interface IField {
    type: DataType;
    setter?: (value: any) => any;
    enum?: (string | number | boolean)[];
    default?: any;
    model?: typeof Mongo;
    object?: {
        [index: string]: IField
    };
    array?: boolean;
}

export interface IFields {
    [index: string]: IField;
}

export interface IResult {
    [index: string]: any;
}

export interface IFindConfig {
    filters?: {
        [index: string]: any
    };
    fields?: {
        [index: string]: 1 | 0;
    };
    sort?: {
        [index: string]: 1 | -1;
    };
    limit?: number;
    skip?: number;
    dbRefs?: {
        [index: string]: {
            fields: {
                [index: string]: 1 | 0
            },
            filters: {
                [index: string]: any
            }
        }
    };
}

export interface IConfig {
    connection: Db;
}

export class Mongo {

    public static getCollectionName (): string {
        throw Error();
    }

    public ['constructor']: typeof Mongo;

    private _fields: IFields = {};
    private _collection: Collection;
    private _connection: Db;

    constructor (options: IConfig) {
        if (!this.constructor.getCollectionName) {
            throw new Error('missing static method "getCollectionName" in child class');
        }

        this._fields = this.getFields();
        this._connection = options.connection;
        this._collection = this._connection.collection(this.constructor.getCollectionName());
    }

    public getFields (): IFields {
        throw new Error('missing method "setFields" in child class');
    }

    public getObjectID (id: ObjectID | string): ObjectID | undefined {
        return ObjectID.isValid(id) ? new ObjectID(id) : undefined;
    }

    public getObjectId (id: ObjectID | string): ObjectID | undefined {
        return this.getObjectID(id);
    }

    public getConnection (): Db {
        return this._connection;
    }

    public getCollection (): Collection {
        return this._collection;
    }

    public async find (options: IFindConfig): Cursor | IResult[] {
        const result = this._collection.find(options.filters)

        return this.query('find', options.filters || {}).then((cursor) => {
            let result = {
                count: undefined,
                data: []
            };

            return (options.count ? cursor.count() : Promise.resolve()).then((count) => {
                result.count = count;
                options.sort && cursor.sort(options.sort);
                options.fields && cursor.project(options.fields);
                options.skip && cursor.skip(+options.skip);
                options.limit && cursor.limit(+options.limit);
            }).then(() => {
                if (options.cursor) {
                    cursor.map(
                        (row) => options.dbRefs ? this.attachDbRefs([row], options.dbRefs).then(
                            (data) => data[0]
                        ) : Promise.resolve(row)
                    );
                    return cursor;
                }
                return cursor.toArray().then(
                    (data) => options.dbRefs ? this.attachDbRefs(data, options.dbRefs) : data
                );
            }).then((data) => {
                result.data = data;
                return result;
            });
        });
    }

}

export default Mongo;
