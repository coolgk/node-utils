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

export interface IDbRefs {
    [index: string]: {
        fields: {
            [index: string]: 1 | 0
        },
        filters: {
            [index: string]: any
        }
    }
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
    dbRefs?: IDbRefs;
    cursor: boolean;
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

        const cursor = this._collection.find(options.filters as object, {
            sort: options.sort,
            limit: options.limit,
            skip: options.skip,
            projection: options.fields
        });

        if (options.cursor) {
            cursor.map(
                (row) => options.dbRefs ? this.attachDbRefs([row], options.dbRefs).then(
                    (data) => data[0]
                ) : Promise.resolve(row)
            );
            return cursor;
        }

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


    public attachDbRefs (data, dbRefs, fieldConfig = this._fields) {
        let dbRefValues = {};
        this._findDbRefs(
            data,
            dbRefs,
            dbRefValues,
            {
                dataType: 'object',
                multiple: data instanceof Array || data.constructor.name === 'Cursor',
                object: fieldConfig
            }
        );

        if (Object.keys(dbRefValues).length === 0) {
            return Promise.resolve(data);
        }

        let promises = [];
        for (let collection in dbRefValues) {
            promises.push(
                this.query(
                    {
                        method: 'find',
                        collection: collection
                    },
                    {
                        _id: {
                            // $in: ids
                            $in: dbRefValues[collection].ids
                        }
                    },
                    dbRefs[collection]
                ).then((cursor) => {
                    return cursor.toArray().then(
                        (rows) => {
                            rows.forEach((item) => {
                                // refById[item._id].forEach((ref) => {
                                dbRefValues[collection].refs[item._id].forEach((ref) => {
                                    ref.parent[ref.field] = item;
                                });
                            });
                            return this.attachDbRefs(rows, dbRefs, dbRefValues[collection].model.getFields());
                        }
                    );
                })
            );
        }

        return Promise.all(promises).then(() => data);
    }

    // find all dbRef fields from the data array
    private _findDbRefs (data, dbRefs = {}, dbRefValues = {}, fieldConfig = {}, parentRef = {}) {
        if (!fieldConfig) {
            return;
        }

        if (fieldConfig.array) {
            for (let index = data.length - 1; index >= 0; index--) {
                for (const row of data) {
                    this._findDbRefs(
                        row,
                        dbRefs,
                        dbRefValues,
                        {
                            ...fieldConfig,
                            array: false
                        },
                        {
                            parent: data,
                            field: index
                        }
                    );
                }
            }
        } else {
            switch (fieldConfig.type.toLowerCase()) {
                case 'object':
                    for (const field in data) {
                        if (field !== '_id') {
                            this._findDbRefs(
                                data[field],
                                dbRefs,
                                dbRefValues,
                                fieldConfig.object[field],
                                {
                                    parent: data,
                                    field
                                }
                            );
                        }
                    }
                    break;
                case 'dbref':
                    if (data) {
                        if (!fieldConfig.model) {
                            throw new Error(`undefined "model" property for dbRef type: ${JSON.stringify(fieldConfig)}`);
                        }

                        const collection = fieldConfig.model.getCollectionName();

                        // dbRefs is defined in query
                        if (dbRefs[collection]) {
                            if (!dbRefValues[collection]) {
                                // dbRefValues[collection] = [];
                                dbRefValues[collection] = {
                                    model: new (fieldConfig.model)(),
                                    refs: {},
                                    ids: []
                                };
                            }

                            // clear db ref data, if cannot find refereced data, result will be {} instead of the origin ObjectID or DBRef
                            parentRef.parent[parentRef.field] = {};
                            const id = data.constructor.name === 'ObjectID' ? data : data.oid;
                            if (!dbRefValues[collection].refs[id]) {
                                dbRefValues[collection].refs[id] = [];
                                dbRefValues[collection].ids.push(id);
                            }
                            dbRefValues[collection].refs[id].push(parentRef);
                        }

                    }
                    break;
            }
        }
    }


}

export default Mongo;
