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
        },
        dataById?: {
            [index: string]: any
        }
    };
}

// query definition
// export interface IFindConfig extends FindOneOptions {
//     dbRefs?: IDbRefs;
//     cursor?: boolean;
// }

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
    db: Db;
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
    private _db: Db;

    constructor (options: IConfig) {
        if (!this.constructor.getCollectionName) {
            throw new Error('undefined static method "getCollectionName" in child class');
        }

        if (!this.constructor.getFields) {
            throw new Error('undefined static method "getFields" in child class');
        }

        this._db = options.db;
        this._fields = this.constructor.getFields();
        this._collection = this._db.collection(this.constructor.getCollectionName());
    }

    public getObjectID (id: ObjectID | string): ObjectID | undefined {
        return ObjectID.isValid(id) ? new ObjectID(id) : undefined;
    }

    public getObjectId (id: ObjectID | string): ObjectID | undefined {
        return this.getObjectID(id);
    }

    public getDb (): Db {
        return this._db;
    }

    public getCollection (): Collection {
        return this._collection;
    }

    public find (...params: any[]) {
        return this._collection.find(...params);
    }

    /**
     * attach dbRefs to query result
     * @param {(Cursor | object[])} data - query result from find() either array or Cursor
     * @param {object} dbRefs - dbRefs definition. format: { collectionName: { fields: { fieldName: 1 or 0 } } }
     * @returns {Promise<Cursor | object[]>}
     * @memberof Mongo
     */
    public async attachDbRefs (data: Cursor | IResult[], dbRefs: IDbRefs): Promise<Cursor | IResult[]> {

        for (const collection in dbRefs) {
            if (dbRefs[collection].filters) {
                if (dbRefs[collection].fields._id === 0) {
                    dbRefs[collection].fields._id = 1;
                }
                dbRefs[collection].dataById = {};
                await new Promise((resolve) => {
                    this._db.collection(collection).find(
                        dbRefs[collection].filters,
                        {
                            projection: dbRefs[collection].fields
                        }
                    ).forEach(
                        (row) => {
                            (dbRefs[collection] as any).dataById[row._id] = row;
                        },
                        () => resolve()
                    );
                });
            }
        }

        if (data.constructor.name === 'Cursor') {
            return (data as Cursor).map(
                async (row: IResult) => {
                    const dbRefsInRow: IDbRefsInData = {};
                    this._findDbRefs(
                        row,
                        dbRefs as IDbRefs,
                        {
                            type: DataType.OBJECT,
                            object: this._fields
                        },
                        dbRefsInRow
                    );
                    await this._attachDataToReferencePointer(dbRefsInRow, dbRefs as IDbRefs);
                    return row;
                }
            );
        } else {
            const dbRefsInData: IDbRefsInData = {};
            this._findDbRefs(
                data,
                dbRefs,
                {
                    type: DataType.OBJECT,
                    array: data.constructor.name === 'Array',
                    object: this._fields
                },
                dbRefsInData
            );
            await this._attachDataToReferencePointer(dbRefsInData, dbRefs);
        }
        return data;
    }

    /**
     * attach dbRefs data to reference pointers found in _findDbRefs()
     * @ignore
     * @param {object} dbRefsInData - all dbRef fields from mongo query result
     * @param {object} queryDbRefs - dbRefs defined in query
     * @memberof Mongo
     */
    private async _attachDataToReferencePointer (dbRefsInData: IDbRefsInData, queryDbRefs: IDbRefs) {
        if (Object.keys(dbRefsInData).length === 0) {
            return;
        }

        for (const collection in dbRefsInData) {
            if (queryDbRefs[collection].fields._id === 0) {
                queryDbRefs[collection].fields._id = 1;
            }
            const cursor = this._db.collection(collection).find(
                {
                    _id: {
                        $in: Object.keys(dbRefsInData[collection].dbRefsById).map((stringId) => new ObjectID(stringId))
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
                        resolve(this._attachDataToReferencePointer(collectionDbRefsInData, queryDbRefs));
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
