import { Db, ObjectID, Cursor, Collection, FindOneOptions } from 'mongodb';
import { toArray } from '@coolgk/array';

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
export interface IFieldSchema {
    type: DataType;
    setter?: (value: any) => any;
    enum?: (string | number | boolean)[];
    default?: any;
    model?: typeof Mongo;
    object?: ISchema;
    array?: boolean;
}

// model fields
export interface ISchema {
    [field: string]: IFieldSchema;
}

// query result
export interface IResult {
    [field: string]: any;
}

// query join definition
export interface IJoin {
    // [index: string]: {
    //     fields?: {
    //         [index: string]: 1 | 0
    //     },
    //     filters?: {
    //         [index: string]: any
    //     },
    //     join?: IJoin,
    //     data?: IResult[]
    // };
    on: string | string[];
    projection?: {
        [field: string]: 1 | 0
    };
    filters?: IQuery;
    join?: IJoin[];
    data?: Cursor;
    model?: typeof Mongo;
}

// reference pointer type for find ref in data
export interface IReferencePointer {
    parent: IResult | IResult[];
    field: string | number;
    path: string[];
    // id?: ObjectID;
}

// object id fields in search result
export interface IObjectIdInData {
    // [collection: string]: {
    //     model: typeof Mongo;
    //     dbRefsById: {
    //         [id: string]: IReferencePointer[]
    //     }
    // };
    [field: string]: IReferencePointer[];
    // {
    //     [id: string]: IReferencePointer[]
    // };
}

// join.data indexed by collection and field
// export interface IJoinCollectionData {
//     [collection: string]: {
//         [field: string]: {
//             [id: string]: IResult
//         }
//     };
// }

// all object id fields found in field config
// export interface IObjectIdFields {
//     [index: string]: any;
// }

// mongo query object
export interface IQuery {
    [index: string]: any;
}

// data found in referenced collections
// export interface IFilteredObjectIdData {
//     [index: string]: any[];
// }

// model mapping for collections in join
// export interface ICollectionModel {
//     [index: string]: typeof Mongo;
// }

export interface IFindOptions extends FindOneOptions {
    join?: IJoin[];
    cursor?: boolean;
}

export interface IConfig {
    db: Db;
}

export class Mongo {

    public static getCollectionName (): string {
        throw Error('undefined static method "getCollectionName" in child class');
    }

    public static getSchema (): ISchema {
        throw new Error('undefined static method "getSchema" in child class');
    }

    private _schema: ISchema = {};
    private _collection: Collection;
    private _db: Db;

    constructor (options: IConfig) {
        if (!(this.constructor as typeof Mongo).getCollectionName) {
            throw new Error('undefined static method "getCollectionName" in child class');
        }

        if (!(this.constructor as typeof Mongo).getSchema) {
            throw new Error('undefined static method "getSchema" in child class');
        }

        this._db = options.db;
        this._schema = (this.constructor as typeof Mongo).getSchema();
        this._collection = this._db.collection((this.constructor as typeof Mongo).getCollectionName());
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

    public async find (query: IQuery, options: IFindOptions = {}): Promise<Cursor | IResult[]> {
        // if (typeof(query._id) === 'string') {
        //     query._id = this.getObjectID(query._id);
        // }
        // const join = options.join || {};
        // const filteredObjectIdData = await this._getFilteredObjectIdData(join);
        // const cursor = this._collection.find(
        //     this._getQuery(query, this._fields, filteredObjectIdData),
        //     options
        // );
        // return await this.attachObjectIdData(options.cursor ? cursor : await cursor.toArray(), join, filteredObjectIdData);

        const cursor = this._collection.find(
            this._getJoinQuery(this.constructor as typeof Mongo, query, options.join),
            options
        );
        const data = options.cursor ? cursor : await cursor.toArray();
        return options.join ? await this.attachObjectIdData(data, options.join) : data;
    }

    public async attachObjectIdData (data: Cursor | IResult[], joins: IJoin[]): Promise<Cursor | IResult[]> {
        if (data.constructor.name === 'Cursor') {
            return (data as Cursor).map(
                async (row: IResult) => {
                    await this._attachDataToReferencePointer(
                        row,
                        joins,
                        {
                            type: DataType.OBJECT,
                            object: this._schema
                        }
                    );
                    return row;
                }
            );
        } else {
            await this._attachDataToReferencePointer(
                data,
                joins,
                {
                    type: DataType.OBJECT,
                    object: this._schema,
                    array: data.constructor.name === 'Array'
                }
            );
        }
        return data;
    }

    private async _attachDataToReferencePointer (
        data: IResult[] | IResult,
        joins: IJoin[],
        fieldSchema: IFieldSchema,
        model: typeof Mongo = this.constructor as typeof Mongo
    ): Promise<void> {
        const fieldPathsInJoin = joins.reduce((fieldPaths, join) => {
            return fieldPaths.concat(toArray(join.on));
        }, [] as string[]);

        const objectIdInData: IObjectIdInData = {};
        this._findObjectIdInData(data, fieldSchema, fieldPathsInJoin, objectIdInData);

        if (Object.keys(objectIdInData).length === 0) {
            return;
        }

        for (const join of joins) {
            const fields = toArray(join.on);
            const joinModel = join.model || this._findObjectIdFieldModel(fields[0], model);

            const referencePointers: IObjectIdInData = {};
            const ids: ObjectID[] = [];
            // find all ids and create an object of reference pointers indexed by id
            fields.forEach((field) => {
                objectIdInData[field].forEach((referencePointer) => {
                    const id = (referencePointer.parent as any)[referencePointer.field]._id;
                    if (!referencePointers[id]) {
                        referencePointers[id] = [];
                    }
                    referencePointers[id].push(referencePointer);
                    ids.push(id);
                });
            });

            if (!join.data) {
                const projection = join.projection;
                if (projection && projection._id === 0) {
                    projection._id = 1;
                }

                join.data = this._db.collection(joinModel.getCollectionName()).find(
                    {
                        _id: {
                            $in: ids
                        }
                    },
                    { projection }
                );
            }

            // if else here is for looping cursor only once to attach data
            if (join.join) {
                await this._attachDataToReferencePointer(
                    await (join.data as Cursor).map((row: IResult) => {
                        referencePointers[row._id].forEach((referencePointer) => {
                            (referencePointer.parent as any)[referencePointer.field] = row;
                        });
                        return row;
                    }).toArray(),
                    join.join,
                    {
                        type: DataType.OBJECT,
                        object: joinModel.getSchema(),
                        array: true
                    },
                    joinModel
                );
            } else {
                await new Promise((resolve) => {
                    (join.data as Cursor).forEach(
                        (row) => {
                            referencePointers[row._id].forEach((referencePointer) => {
                                (referencePointer.parent as any)[referencePointer.field] = row;
                            });
                        },
                        () => resolve()
                    );
                });
            }
        }
    }

    private _findObjectIdInData (
        data: any,
        fieldConfig: IFieldSchema,
        fieldPathsInJoin: string[],
        objectIdInData: IObjectIdInData,
        referencePointer?: IReferencePointer
    ): void {
        if (fieldConfig) { // _id field and auto generated fields (e.g.dateCreated etc) do not have fieldConfig values.
            if (fieldConfig.array) {
                toArray(data).forEach((row, index) => {
                    this._findObjectIdInData(
                        row,
                        {
                            ...fieldConfig,
                            array: false
                        },
                        fieldPathsInJoin,
                        objectIdInData,
                        {
                            parent: data,
                            field: index,
                            path: referencePointer && referencePointer.path || []
                        }
                    );
                });
            } else {
                switch (fieldConfig.type) {
                    case DataType.OBJECT:
                        if (!fieldConfig.object) {
                            throw new Error(
                                `Undefined "object" property on "${fieldConfig.type}" type in ${JSON.stringify(fieldConfig)}`
                            );
                        }
                        for (const field in data) {
                            this._findObjectIdInData(
                                data[field],
                                fieldConfig.object[field],
                                fieldPathsInJoin,
                                objectIdInData,
                                {
                                    parent: data,
                                    field,
                                    path: toArray(referencePointer && referencePointer.path).concat(field)
                                }
                            );
                        }
                        break;
                    case DataType.OBJECTID:
                        if (data && referencePointer) {
                            if (!fieldConfig.model) {
                                throw new Error(
                                    `Undefined "model" property on "${fieldConfig.type}" type in ${JSON.stringify(fieldConfig)}`
                                );
                            }

                            const fieldPath = referencePointer.path.join('.');
                            if (fieldPathsInJoin.includes(fieldPath)) {
                                const collection = fieldConfig.model.getCollectionName();

                                if (!objectIdInData[fieldPath]) {
                                    objectIdInData[fieldPath] = [];
                                }
                                // data.oid = DbRef type in mongo
                                // const id = data.constructor.name === 'ObjectID' ? data : data.oid;
                                // if (!objectIdInData[fieldPath][id]) {
                                //     objectIdInData[fieldPath][id] = [];
                                // }

                                // clear object id data, if refereced data is not found,
                                // the result will be { _id: ObjectId(...) } instead of the origin ObjectID or DBRef
                                (referencePointer.parent as any)[referencePointer.field] = {
                                    _id: data.constructor.name === 'ObjectID' ? data : data.oid
                                };
                                objectIdInData[fieldPath].push(referencePointer);

                                // if (!objectIdInData[collection]) {
                                //     objectIdInData[collection] = {
                                //         model: fieldConfig.model,
                                //         dbRefsById: {}
                                //     };
                                // }

                                // // data.oid = DbRef type in mongo
                                // const id = data.constructor.name === 'ObjectID' ? data : data.oid;
                                // if (!objectIdInData[collection].dbRefsById[id]) {
                                //     objectIdInData[collection].dbRefsById[id] = [];
                                // }
                                // objectIdInData[collection].dbRefsById[id].push(referencePointer);
                            }
                        }
                        break;
                }
            }
        }
    }

    /* private _findObjectIdInData (
        data: any,
        fieldConfig: IField | undefined,
        objectIdInData: IObjectIdInData = {},
        referencePointer?: IReferencePointer
    ): void {
        if (!fieldConfig) {
            return;
        }

        if (fieldConfig.array) {
            for (let index = (data as IResult[]).length - 1; index >= 0; index--) {
                this._findObjectIdInData(
                    (data as IResult[])[index],
                    {
                        ...fieldConfig,
                        array: false
                    },
                    objectIdInData,
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
                        throw new Error(`Undefined "object" property for "${fieldConfig.type}" type in ${JSON.stringify(fieldConfig)}`);
                    }
                    for (const field in data) {
                        if (field !== '_id') {
                            this._findObjectIdInData(
                                data[field],
                                fieldConfig.object[field],
                                objectIdInData,
                                {
                                    parent: data,
                                    field
                                }
                            );
                        }
                    }
                    break;
                case DataType.OBJECTID:
                    if (data && referencePointer) {
                        if (!fieldConfig.model) {
                            throw new Error(`undefined "model" property for "${fieldConfig.type}" type in ${JSON.stringify(fieldConfig)}`);
                        }

                        const collection = fieldConfig.model.getCollectionName();

                        if (!objectIdInData[collection]) {
                            objectIdInData[collection] = {
                                model: fieldConfig.model,
                                dbRefsById: {}
                            };
                        }

                        // data.oid = DbRef type in mongo
                        const id = data.constructor.name === 'ObjectID' ? data : data.oid;
                        if (!objectIdInData[collection].dbRefsById[id]) {
                            objectIdInData[collection].dbRefsById[id] = [];
                        }
                        objectIdInData[collection].dbRefsById[id].push(referencePointer);
                    }
                    break;
            }
        }
    } */
/*
const j = [
    {
        on: ['model2Ref'],
        projection: {
            model3Ref: 1
        },
        join: [
            {
                on: 'xy.z',
                filters: {
                    boolean: true
                }
            }
        ]
    },
    {
        on: 'model4Ref',
        filters: {
            m4str: 's1'
        },
        join: {
            model6: {}
        }
    },
    {
        on: 'model5Ref',
        join: {
            model6: {}
        }
    },
    {
        on: 'model3Ref',
        filters: {
            m4str: 's1'
        }
    }
];
 */
    private async _getJoinQuery (model: typeof Mongo, query?: IQuery, joins?: IJoin[]): Promise<IQuery | undefined> {
        if (query && typeof(query._id) === 'string') {
            query._id = this.getObjectID(query._id);
        }

        if (joins) {
            for (const join of joins) {
                const fields = toArray(join.on);
                join.model = this._findObjectIdFieldModel(fields[0], model);
                const filters = await this._getJoinQuery(join.model, join.filters, join.join);

                if (filters) {
                    const projection = join.projection || {};
                    if (projection._id === 0) {
                        projection._id = 1;
                    }

                    const cursor = this._db.collection((join.model as typeof Mongo).getCollectionName() as string).find(
                        filters,
                        {
                            projection
                        }
                    );

                    const joinQuery: IQuery = {
                        $and: fields.map(async (field) => {
                            return {
                                [field]: {
                                    $in: await cursor.map((row: IResult) => row._id).toArray()
                                }
                            };
                        })
                    };

                    cursor.rewind();
                    join.data = cursor;

                    if (joinQuery.$and.length) {
                        if (query && Object.keys(query).length) {
                            joinQuery.$and.push(query);
                        }
                        return joinQuery;
                    }
                }
            }
        }

        return query;
    }

    private _findObjectIdFieldModel (fieldPath: string, model: typeof Mongo): typeof Mongo {
        const fields = fieldPath.split('.');
        let schema: ISchema = model.getSchema();
        while (fields.length > 1) {
            if (schema[fields.unshift()].object) {
                schema = schema[fields.unshift()].object as ISchema;
            } else {
                throw new Error(`Undefined "object" property in ${JSON.stringify(model.getSchema())}
                    or Invalid Object ID field in join: "${fieldPath}".
                    Collection: ${model.getCollectionName()}`);
            }
        }
        const fieldModel = schema && schema[fields.unshift()].model;
        if (fieldModel) {
            return fieldModel;
        }
        throw new Error(`Undefined "model" property in ${JSON.stringify(model.getSchema())}
            or Invalid Object ID field in join: "${fieldPath}".
            Collection: ${model.getCollectionName()}`);
    }

    /**
     * attach object id data to query result
     * @param {(Cursor | object[])} data - query result from find() either array or Cursor
     * @param {object} join - join definition. format: { collectionName: { fields: { fieldName: 1 or 0 } } }
     * @returns {Promise<Cursor | object[]>}
     * @memberof Mongo
     */
    /* public async attachObjectIdData (
        data: Cursor | IResult[], join: IJoin, filteredObjectIdData: IFilteredObjectIdData = {}
    ): Promise<Cursor | IResult[]> {
        if (data.constructor.name === 'Cursor') {
            return (data as Cursor).map(
                async (row: IResult) => {
                    // await this._findAndAttachObjectIdData(row, dbRefs, false, filteredObjectIdData);
                    await this._attachDataToReferencePointer(
                        row,
                        join,
                        {
                            type: DataType.OBJECT,
                            object: this._fields
                        },
                        filteredObjectIdData
                    );
                    return row;
                }
            );
        } else {
            // await this._findAndAttachObjectIdData(data, dbRefs, data.constructor.name === 'Array', filteredObjectIdData);
            await this._attachDataToReferencePointer(
                data,
                join,
                {
                    type: DataType.OBJECT,
                    object: this._fields,
                    array: data.constructor.name === 'Array'
                },
                filteredObjectIdData
            );
        }
        return data;
    } */

    /**
     * attach object id data to reference pointers found in _findDbRefs()
     * @ignore
     * @param {object} dbRefsInData - all object id fields from mongo query result
     * @param {object} join - joins defined in query
     * @memberof Mongo
     */
   /*  private async _attachDataToReferencePointer (
        data: IResult[] | IResult,
        join: IJoin,
        fieldConfig: IField,
        filteredObjectIdData: IFilteredObjectIdData
    ) {
        const dbRefsInData: IObjectIdInData = {};
        this._findObjectIdInData(data, join, fieldConfig, dbRefsInData);

        if (Object.keys(dbRefsInData).length === 0) {
            return;
        }

        let collectionData = [];
        for (const collection in dbRefsInData) {
            if (filteredObjectIdData[collection]) {
                // filteredObjectIdData[collection].forEach((row) => {
                //     dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
                //         (referencePointer.parent as any)[referencePointer.field] = row;
                //     });
                // });
                collectionData = filteredObjectIdData[collection];
            } else {
                const fields = join[collection].fields;
                if (fields && fields._id === 0) {
                    fields._id = 1;
                }
                collectionData = await this._db.collection(collection).find(
                    {
                        _id: {
                            $in: Object.keys(dbRefsInData[collection].dbRefsById).map((stringId) => new ObjectID(stringId))
                        }
                    },
                    {
                        projection: join[collection].fields
                    }
                ).toArray();
            }

            collectionData.forEach((row) => {
                dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
                    (referencePointer.parent as any)[referencePointer.field] = row;
                });
            });

            await this._attachDataToReferencePointer(
                collectionData,
                join,
                {
                    type: DataType.OBJECT,
                    array: true,
                    object: dbRefsInData[collection].model.getSchema()
                },
                filteredObjectIdData
            );
            // await new Promise((resolve) => {
            //     const collectionDbRefsInData: IObjectIdInData = {};
            //     const collectionFieldConfig = dbRefsInData[collection].model.getSchema();
            //     cursor.forEach(
            //         (row) => {
            //             dbRefsInData[collection].dbRefsById[row._id].forEach((referencePointer) => {
            //                 (referencePointer.parent as any)[referencePointer.field] = row;
            //             });
            //             this._findObjectIdInData(
            //                 [row],
            //                 queryDbRefs,
            //                 {
            //                     type: DataType.OBJECT,
            //                     array: true,
            //                     object: collectionFieldConfig
            //                 },
            //                 collectionDbRefsInData
            //             );
            //         },
            //         () => {
            //             // attach object ids found in referenced collections
            //             resolve(this._attachDataToReferencePointer(collectionDbRefsInData, queryDbRefs, filteredObjectIdData));
            //         }
            //     );
            // });
        }
    } */

    /**
     * find all object id data from mongo query result
     * @ignore
     * @private
     * @param {*} data - query result or a row/value of query result
     * @param {object} join - dbRefs defined in query
     * @param {(object | undefined)} fieldConfig - field config of the model, defined in getSchema()
     * @param {object} [dbRefsInData={}] - dbRefs data found in data param in format { collectionName: { objectID: [referecePointers] } }
     * @param {object} [dataByReference] - internal param, a reference pointer to the data param
     * @memberof Mongo
     */
    /* private _findObjectIdInData (
        data: any,
        join: IJoin,
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
                    join,
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
                                join,
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

                        // if object id is defined in query
                        if (join[collection]) {
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
    } */

// const j = {
//     model2: {
//         fields: {
//             model3Ref: 1
//         },
//         join: {
//             model3: {
//                 filters: {
//                     boolean: true
//                 }
//             },
//         },
//         on: ['field.ab.a']
//     },
//     model4: {
//         filters: {
//             m4str: 's1'
//         },
//         join: {
//             model6: {}
//         }
//     },
//     model5: {
//         join: {
//             model6: {}
//         }
//     }
// };

/*
    private async _getJoinQuery (fieldConfig: IFields, query?: IQuery, join?: IJoin): Promise<IQuery | undefined> {
        if (join) {
            const joinQuery: IQuery = {
                $and: []
            };

            if (query) {
                if (Object.keys(query).length) {
                    joinQuery.$and.push(query);
                }
                if (typeof(query._id) === 'string') {
                    query._id = this.getObjectID(query._id);
                }
            }

            const collectionModel = this._getCollectionModel(Object.keys(join), fieldConfig);
            // find filters in join
            for (const collection in join) {
                const filters = await this._getJoinQuery(
                    collectionModel[collection].getSchema(),
                    join[collection].filters,
                    join[collection].join
                );

                if (filters) {
                    const fields = join[collection].fields;
                    if (fields && fields._id === 0) {
                        fields._id = 1;
                    }

                    join[collection].data = await this._db.collection(collection).find(
                        filters,
                        {
                            projection: join[collection].fields
                        }
                    ).toArray();

                    // joinQuery.$and.push(query)
                }
            }
        }

        return query;
    }

    private _getCollectionModel (collections: string[], fieldConfig: IFields): ICollectionModel {
        const collectionModel: ICollectionModel = {};
        for (const field in fieldConfig) {
            switch (fieldConfig[field].type) {
                case DataType.OBJECTID:
                    const collectionName = (fieldConfig[field].model as typeof Mongo).getCollectionName();
                    if (collections.includes(collectionName)) {
                        collectionModel[collectionName] = fieldConfig[field].model as typeof Mongo;
                    }
                    break;
                case DataType.OBJECT:
                    Object.assign(
                        collectionModel,
                        this._getCollectionModel(collections, fieldConfig[field].object as IFields)
                    );
                    break;
            }
        }
        return collectionModel;
    }

    private _getQuery (query: IQuery, fieldConfig: IFields, filteredObjectIdData: IFilteredObjectIdData): IQuery {
        if (Object.keys(filteredObjectIdData).length) {
            const newQUery = {
                $and: Object.keys(query).length ? [ query ] : []
            };
            const objectIdFields = this._getObjectIdFieldsInConfig(fieldConfig);

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
            return newQUery;
        }
        console.log(newQUery)
        return query;
    }

    private async _getFilteredObjectIdData (join: IJoin): Promise<IFilteredObjectIdData> {
        const filteredObjectIdData: IFilteredObjectIdData = {};
        for (const collection in join) {
            const collectionJoin = join[collection].join;
            if (collectionJoin) {
                this._getQuery(
                    {},
                    collectionJoin.,
                    this._getFilteredObjectIdData(collectionJoin)
                );
            }

            const filters = join[collection].filters;
            if (filters) {
                const fields = join[collection].fields;
                if (fields && fields._id === 0) {
                    fields._id = 1;
                }
                if (typeof(filters._id) === 'string') {
                    filters._id = this.getObjectID(filters._id);
                }
                filteredObjectIdData[collection] = [];
                await new Promise((resolve) => {
                    this._db.collection(collection).find(
                        filters,
                        {
                            projection: join[collection].fields
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
    } */

/*
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
*/

    /**
     * find object id fields from field config
     * @private
     * @param {IFields} [fieldConfig=this._fields]
     * @returns {object} - { [field]: [collection], ... }
     * @memberof Mongo
     */
/*     private _getObjectIdFieldsInConfig (fieldConfig: IFields): IObjectIdFields {
        const objectIdFields: IObjectIdFields = {};
        for (const field in fieldConfig) {
            switch (fieldConfig[field].type) {
                case DataType.OBJECTID:
                    objectIdFields[field] = (fieldConfig[field].model as typeof Mongo).getCollectionName();
                    break;
                case DataType.OBJECT:
                    const subFields = this._getObjectIdFieldsInConfig(fieldConfig[field].object as IFields);
                    for (const subField in subFields) {
                        objectIdFields[`${field}.${subField}`] = subFields[subField];
                    }
                    break;
            }
        }
        return objectIdFields;
    } */
}

export default Mongo;
