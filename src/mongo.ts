import { Db, ObjectID, Cursor, Collection, FindOneOptions } from 'mongodb';

// model field data types
export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    OBJECT = 'object',
    ENUM = 'enum',
    BOOLEAN = 'boolean',
    DATE = 'date',
    DBREF = 'dbref'
}

// model field definition
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

// model fields
export interface IFields {
    [index: string]: IField;
}

// query result
export interface IResult {
    [index: string]: any;
}

// query dbRef definition
export interface IDbRefs {
    [index: string]: {
        fields: {
            [index: string]: 1 | 0
        },
        filters: {
            [index: string]: any
        }
    };
}

// query definition
export interface IFindConfig extends FindOneOptions {
    dbRefs?: IDbRefs;
    cursor?: boolean;
}

export interface IDataByReference {
    parent: IResult | IResult[];
    field: string | number;
}

export interface IDbRefsInData {
    [index: string]: {
        model: typeof Mongo;
        dbRefsById: {
            [index: string]: IDataByReference[]
        }
    };
}

export interface IConfig {
    connection: Db;
}

export class Mongo {

    public static getCollectionName (): string {
        throw Error('undefined static method "getCollectionName" in child class');
    }

    public static getFields (): IFields {
        throw new Error('undefined static method "getFields" in child class');
    }

    public ['constructor']: typeof Mongo;

    private _fields: IFields = {};
    private _collection: Collection;
    private _connection: Db;

    constructor (options: IConfig) {
        if (!this.constructor.getCollectionName) {
            throw new Error('undefined static method "getCollectionName" in child class');
        }

        if (!this.constructor.getFields) {
            throw new Error('undefined static method "getFields" in child class');
        }

        this._connection = options.connection;
        this._fields = this.constructor.getFields();
        this._collection = this._connection.collection(this.constructor.getCollectionName());
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

    public async find (query: { [index: string]: any }, options: IFindConfig): Cursor | IResult[] {

        const cursor = this._collection.find(query, options);

        if (options.dbRefs) {
            const dbRefsInData: IDbRefsInData = {};
            this._findDbRefs(
                cursor,
                options.dbRefs,
                {
                    type: DataType.OBJECT,
                    array: true,
                    object: this._fields
                },
                dbRefsInData
            );
            this.attachDbRefs(dbRefsInData, options.dbRefs);
        }


        // const cursor = this._collection.find(options.filters as object, {
        //     sort: options.sort,
        //     limit: options.limit,
        //     skip: options.skip,
        //     projection: options.fields
        // });

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

    /**
     * attach dbRefs data to the original query result
     * @param {object} dbRefsInData - all dbRef fields from mongo query result
     * @param {object} queryDbRefs - dbRefs defined in query
     * @memberof Mongo
     */
    public async attachDbRefs (dbRefsInData: IDbRefsInData, queryDbRefs: IDbRefs) {
        if (Object.keys(dbRefsInData).length === 0) {
            return;
        }

        for (const collection in dbRefsInData) {
            const cursor = this._connection.collection(collection).find(
                {
                    _id: {
                        $in: Object.keys(dbRefsInData[collection])
                    }
                },
                {
                    projection: queryDbRefs[collection].fields
                }
            );

            await new Promise((resolve) => {
                const collectionDbRefsInData: IDbRefsInData = {};
                const collectionFieldConfig = dbRefsInData[collection].model.getFields();
                cursor.forEach(
                    (row) => {
                        dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
                            (referencePointer.parent as any)[referencePointer.field] = row;
                        });
                        this._findDbRefs(
                            [row],
                            queryDbRefs,
                            {
                                type: DataType.OBJECT,
                                array: true,
                                object: collectionFieldConfig
                            },
                            collectionDbRefsInData
                        );
                    },
                    () => {
                        // attach dbRefs found in referenced collections
                        resolve(this.attachDbRefs(collectionDbRefsInData, queryDbRefs));
                    }
                );
            });
        }
    }

    /**
     * find all dbRef fields from mongo query result
     * @ignore
     * @private
     * @param {*} data - query result or a row/value of query result
     * @param {object} queryDbRefs - dbRefs defined in query
     * @param {(object | undefined)} fieldConfig - field config of the model, defined in getFields()
     * @param {object} [dbRefsInData={}] - dbRefs data found in data param in format { collectionName: { objectID: [referecePointers] } }
     * @param {object} [dataByReference] - internal param, a reference pointer to the data param
     * @memberof Mongo
     */
    private _findDbRefs (
        data: any,
        queryDbRefs: IDbRefs,
        fieldConfig: IField | undefined,
        dbRefsInData: IDbRefsInData = {},
        dataByReference?: IDataByReference
    ) {
        if (!fieldConfig) {
            return;
        }

        if (fieldConfig.array) {
            for (let index = (data as IResult[]).length - 1; index >= 0; index--) {
                this._findDbRefs(
                    (data as IResult[])[index],
                    queryDbRefs,
                    {
                        ...fieldConfig,
                        array: false
                    },
                    dbRefsInData,
                    {
                        parent: data,
                        field: index
                    }
                );
            }
        } else {
            switch (fieldConfig.type.toLowerCase()) {
                case DataType.OBJECT:
                    if (!fieldConfig.object) {
                        throw new Error(`undefined "object" property for "${fieldConfig.type}" type: ${JSON.stringify(fieldConfig)}`);
                    }
                    for (const field in data) {
                        if (field !== '_id') {
                            this._findDbRefs(
                                data[field],
                                queryDbRefs,
                                fieldConfig.object[field],
                                dbRefsInData,
                                {
                                    parent: data,
                                    field
                                }
                            );
                        }
                    }
                    break;
                case DataType.DBREF:
                    if (data) {
                        if (!fieldConfig.model) {
                            throw new Error(`undefined "model" property for "${fieldConfig.type}" type: ${JSON.stringify(fieldConfig)}`);
                        }

                        const collection = fieldConfig.model.getCollectionName();

                        // if dbRef is defined in query
                        if (queryDbRefs[collection]) {
                            if (!dbRefsInData[collection]) {
                                dbRefsInData[collection] = {
                                    model: fieldConfig.model,
                                    dbRefsById: {}
                                };
                            }

                            if (dataByReference) {
                                // clear db ref data, if refereced data is not found, the result will be {} instead of the origin ObjectID or DBRef
                                (dataByReference.parent as any)[dataByReference.field] = {};
                                // data.oid = DbRef() type in mongo
                                const id = data.constructor.name === 'ObjectID' ? data : data.oid;
                                if (!dbRefsInData[collection].dbRefsById[id]) {
                                    dbRefsInData[collection].dbRefsById[id] = [];
                                }
                                dbRefsInData[collection].dbRefsById[id].push(dataByReference);
                            }
                        }
                    }
                    break;
            }
        }
    }

}

export default Mongo;
