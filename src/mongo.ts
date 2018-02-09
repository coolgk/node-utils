import { Db, ObjectID, Cursor, Collection, FindOneOptions } from 'mongodb';

// model field data types
export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    OBJECT = 'object',
    ENUM = 'enum',
    BOOLEAN = 'boolean',
    DATE = 'date',
    OBJECTID = 'objectid'
}

// model field definition
export interface IField {
    type: DataType;
    setter?: (value: any) => any;
    enum?: (string | number | boolean)[];
    default?: any;
    model?: typeof Mongo;
    object?: IFields;
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
        fields?: {
            [index: string]: 1 | 0
        },
        filters?: {
            [index: string]: any
        }
    };
}

// reference pointer type for find ref in data
export interface IDataByReference {
    parent: IResult | IResult[];
    field: string | number;
}

// object id fields in search result
export interface IObjectIdInData {
    [index: string]: {
        model: typeof Mongo;
        dbRefsById: {
            [index: string]: IDataByReference[]
        }
    };
}

// all object id fields found in field config
export interface IObjectIdFields {
    [index: string]: any;
}

// mongo query object
export interface IQuery {
    [index: string]: any;
}

// data found in referenced collections
export interface IFilteredObjectIdData {
    [index: string]: any[];
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

    public async find (query: IQuery, options = {}, dbRefs: IDbRefs) {
        const filteredObjectIdData = await this._getFilteredObjectIdData(dbRefs);
        const cursor = this._collection.find(
            this._getQuery(query, filteredObjectIdData),
            options
        );
        await this.attachDbRefs(cursor, dbRefs, filteredObjectIdData);
    }

    /**
     * attach dbRefs to query result
     * @param {(Cursor | object[])} data - query result from find() either array or Cursor
     * @param {object} dbRefs - dbRefs definition. format: { collectionName: { fields: { fieldName: 1 or 0 } } }
     * @returns {Promise<Cursor | object[]>}
     * @memberof Mongo
     */
    public async attachDbRefs (
        data: Cursor | IResult[], dbRefs: IDbRefs, filteredObjectIdData: IFilteredObjectIdData
    ): Promise<Cursor | IResult[]> {
        if (data.constructor.name === 'Cursor') {
            return (data as Cursor).map(
                async (row: IResult) => {
                    await this._findAndAttachObjectIdData(row, dbRefs, false, filteredObjectIdData);
                    return row;
                }
            );
        } else {
            await this._findAndAttachObjectIdData(data, dbRefs, data.constructor.name === 'Array', filteredObjectIdData);
        }
        return data;
    }

    private _getQuery (query: IQuery, filteredObjectIdData: IFilteredObjectIdData): IQuery {
        let newQUery = query;
        if (Object.keys(filteredObjectIdData).length) {
            newQUery = {
                $and: [ query ]
            };
            const objectIdFields = this._getObjectIdFields();

            for (const field in objectIdFields) {
                const collection = objectIdFields[field];
                const data = filteredObjectIdData[collection];
                if (data) {
                    newQUery.$and.push({
                        [field]: {
                            $in: data.map((row) => row._id)
                        }
                    });
                }
            }
        }
        return newQUery;
    }

    private async _getFilteredObjectIdData (dbRefs: IDbRefs): Promise<IFilteredObjectIdData> {
        const filteredObjectIdData: IFilteredObjectIdData = {};
        for (const collection in dbRefs) {
            const filters = dbRefs[collection].filters;
            if (filters) {
                const fields = dbRefs[collection].fields;
                if (fields && fields._id === 0) {
                    fields._id = 1;
                }
                filteredObjectIdData[collection] = [];
                await new Promise((resolve) => {
                    this._db.collection(collection).find(
                        filters,
                        {
                            projection: dbRefs[collection].fields
                        }
                    ).forEach(
                        (row) => {
                            filteredObjectIdData[collection].push(row);
                        },
                        () => resolve()
                    );
                });
            }
        }
        return filteredObjectIdData;
    }

    private async _findAndAttachObjectIdData (
        data: IResult[] | IResult,
        dbRefs: IDbRefs,
        isArray: boolean,
        filteredObjectIdData: IFilteredObjectIdData
    ): Promise<void> {
        const dbRefsInData: IObjectIdInData = {};
        this._findObjectIdInData(
            data,
            dbRefs,
            {
                type: DataType.OBJECT,
                object: this._fields,
                array: isArray
            },
            dbRefsInData
        );
        await this._attachDataToReferencePointer(dbRefsInData, dbRefs, filteredObjectIdData);
    }

    /**
     * attach dbRefs data to reference pointers found in _findDbRefs()
     * @ignore
     * @param {object} dbRefsInData - all dbRef fields from mongo query result
     * @param {object} queryDbRefs - dbRefs defined in query
     * @memberof Mongo
     */
    private async _attachDataToReferencePointer (
        dbRefsInData: IObjectIdInData, queryDbRefs: IDbRefs, filteredObjectIdData: IFilteredObjectIdData
    ) {
        if (Object.keys(dbRefsInData).length === 0) {
            return;
        }

        for (const collection in dbRefsInData) {
            if (filteredObjectIdData[collection]) {
                filteredObjectIdData[collection].forEach((row) => {
                    dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
                        (referencePointer.parent as any)[referencePointer.field] = row;
                    });
                });
            } else {

            }

            const fields = queryDbRefs[collection].fields;
            if (fields && fields._id === 0) {
                fields._id = 1;
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
                const collectionDbRefsInData: IObjectIdInData = {};
                const collectionFieldConfig = dbRefsInData[collection].model.getFields();
                cursor.forEach(
                    (row) => {
                        dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
                            (referencePointer.parent as any)[referencePointer.field] = row;
                        });
                        this._findObjectIdInData(
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
                        // attach object ids found in referenced collections
                        resolve(this._attachDataToReferencePointer(collectionDbRefsInData, queryDbRefs, filteredObjectIdData));
                    }
                );
            });
        }
    }

    /**
     * find all object id data from mongo query result
     * @ignore
     * @private
     * @param {*} data - query result or a row/value of query result
     * @param {object} queryDbRefs - dbRefs defined in query
     * @param {(object | undefined)} fieldConfig - field config of the model, defined in getFields()
     * @param {object} [dbRefsInData={}] - dbRefs data found in data param in format { collectionName: { objectID: [referecePointers] } }
     * @param {object} [dataByReference] - internal param, a reference pointer to the data param
     * @memberof Mongo
     */
    private _findObjectIdInData (
        data: any,
        queryDbRefs: IDbRefs,
        fieldConfig: IField | undefined,
        dbRefsInData: IObjectIdInData = {},
        dataByReference?: IDataByReference
    ) {
        if (!fieldConfig) {
            return;
        }

        if (fieldConfig.array) {
            for (let index = (data as IResult[]).length - 1; index >= 0; index--) {
                this._findObjectIdInData(
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
            switch (fieldConfig.type) {
                case DataType.OBJECT:
                    if (!fieldConfig.object) {
                        throw new Error(`undefined "object" property for "${fieldConfig.type}" type: ${JSON.stringify(fieldConfig)}`);
                    }
                    for (const field in data) {
                        if (field !== '_id') {
                            this._findObjectIdInData(
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
                case DataType.OBJECTID:
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

    /**
     * find object id fields from field config
     * @private
     * @param {IFields} [fieldConfig=this._fields]
     * @returns {IObjectIdFields}
     * @memberof Mongo
     */
    private _getObjectIdFields (fieldConfig: IFields = this._fields): IObjectIdFields {
        const objectIdFields: IObjectIdFields = {};
        for (const field in fieldConfig) {
            switch (fieldConfig[field].type) {
                case DataType.OBJECTID:
                    objectIdFields[field] = (fieldConfig[field].model as typeof Mongo).getCollectionName();
                    break;
                case DataType.OBJECT:
                    const subFields = this._getObjectIdFields(fieldConfig[field].object as IFields);
                    for (const subField in subFields) {
                        objectIdFields[`${field}.${subField}`] = subFields[subField];
                    }
                    break;
            }
        }
        return objectIdFields;
    }
}

export default Mongo;
