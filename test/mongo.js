'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const config = require('../test.config.js');

describe.only('Mongo Module', function () {
    // this.timeout(4000);

    const { Mongo, DataType } = require(`../${config.sourceFolder}/mongo`);
    const { MongoClient, ObjectID } = require('mongodb');

    let model;
    let db;
    let mongoClient;
    let model1Documents;
    let model2Documents;
    let model3Documents;
    let model4Documents;
    let Model1;
    let Model2;
    let Model3;
    let Model4;
    const model1Name = 'model1';
    const model2Name = 'model2';
    const model3Name = 'model3';
    const model4Name = 'model4';

    before((done) => {

        class M1 extends Mongo {
            static getSchema () {
                return {
                    string: {
                        type: 'string',
                        default: 'xyz',
                        setter: (value) => {
                            return value + '-setter';
                        }
                    },
                    number: {
                        type: 'number'
                    },
                    boolean: {
                        type: 'boolean'
                    },
                    date: {
                        type: 'date'
                    },
                    model2DbRef: {
                        type: DataType.OBJECTID,
                        model: Model2
                    },
                    enum: {
                        type: 'enum',
                        enum: ['abc', 'xyz']
                    },
                    object: {
                        type: 'object',
                        object: {
                            string: {
                                type: 'string'
                            },
                            number: {
                                type: 'number'
                            }
                        }
                    },
                    stringArray: {
                        type: 'string',
                        array: true
                    },
                    objectArray: {
                        type: 'object',
                        array: true,
                        object: {
                            date: {
                                type: 'date'
                            },
                            model3DbRef: {
                                type: DataType.OBJECTID,
                                model: Model3
                            }
                        }
                    }
                };
            }
            static getCollectionName () {
                return model1Name;
            }
        }
        Model1 = M1;

        class M2 extends Mongo {
            static getSchema () {
                return {
                    model3Ref: {
                        type: DataType.OBJECTID,
                        model: Model3
                    },
                    string: {
                        type: 'string'
                    },
                    number: {
                        type: 'number'
                    },
                    model4Ref: {
                        type: DataType.OBJECTID,
                        model: Model4
                    }
                };
            }
            static getCollectionName () {
                return model2Name;
            }
        }
        Model2 = M2;

        class M3 extends Mongo {
            static getSchema () {
                return {
                    enum: {
                        type: 'enum',
                        array: true,
                        enum: ['aaa', 222, false]
                    },
                    boolean: {
                        type: 'boolean'
                    }
                };
            }
            static getCollectionName () {
                return model3Name;
            }
        }
        Model3 = M3;

        class M4 extends Mongo {
            static getSchema () {
                return {
                    m4str: DataType.STRING
                };
            }
            static getCollectionName () {
                return model4Name;
            }
        }
        Model4 = M4;

        model4Documents = [
            {
                _id: new ObjectID(),
                m4str: 's1'
            },
            {
                _id: new ObjectID(),
                m4str: 's1'
            },
            {
                _id: new ObjectID(),
                m4str: 's2'
            }
        ];

        model3Documents = [
            {
                _id: new ObjectID(),
                enum: ['aaa'],
                boolean: true
            },
            {
                _id: new ObjectID(),
                enum: [false, 222],
                boolean: true
            },
            {
                _id: new ObjectID(),
                enum: [false],
                boolean: false
            }
        ];

        model2Documents = [
            {
                _id: new ObjectID(),
                string: 'm2111111',
                number: 1234,
                model3Ref: model3Documents[1]._id,
                model4Ref: model4Documents[1]._id
            },
            {
                _id: new ObjectID(),
                string: 'm2222222',
                number: 2345,
                model3Ref: model3Documents[2]._id,
                model4Ref: model4Documents[2]._id
            },
            {
                _id: new ObjectID(),
                string: 'm2333333',
                number: 3456,
                model3Ref: model3Documents[0]._id,
                model4Ref: model4Documents[0]._id
            }
        ];

        model1Documents = [
            {
                _id: new ObjectID(),
                string: 'string value',
                number: 11,
                boolean: true,
                date: new Date('2018-02-03'),
                model2DbRef: model2Documents[1]._id,
                enum: 'abc',
                object: {
                    string: 'abc',
                    number: 1111
                },
                stringArray: ['aaa', 'bbb', 'ccc'],
                objectArray: [
                    {
                        date: new Date('2018-02-02'),
                        model3DbRef: model3Documents[2]._id
                    },
                    {
                        date: new Date('2018-02-01'),
                        model3DbRef: model3Documents[1]._id
                    }
                ]
            },
            {
                _id: new ObjectID(),
                string: 'string1111',
                number: 12,
                boolean: false,
                date: new Date('2018-02-01'),
                model2DbRef: model2Documents[0]._id,
                enum: 'd22222',
                object: {
                    string: 't2222',
                    number: 2222
                },
                stringArray: ['eee', 'ddd'],
                objectArray: [
                    {
                        date: new Date('2018-01-02'),
                        model3DbRef: model3Documents[0]._id
                    },
                    {
                        date: new Date('2018-01-31'),
                        model3DbRef: model3Documents[2]._id
                    }
                ]
            },
            {
                _id: new ObjectID(),
                string: 'string3333',
                number: 13,
                boolean: false,
                date: new Date('2018-01-21'),
                model2DbRef: model2Documents[2]._id,
                enum: 'd333',
                object: {
                    string: 't333',
                    number: 333
                },
                stringArray: ['ddd'],
                objectArray: []
            },
            {
                _id: new ObjectID(),
                string: 'string444',
                number: 14,
                boolean: true,
                date: new Date('2018-01-08'),
                model2DbRef: model2Documents[1]._id,
                enum: 'd443',
                object: {
                    string: 't444',
                    number: 4444
                },
                stringArray: [],
                objectArray: [
                    {
                        date: new Date('2018-01-19'),
                        model3DbRef: model3Documents[0]._id
                    }
                ]
            }
        ];

        MongoClient.connect(config.mongo.url, async (error, client) => {
            if (error) {
                throw error;
            }

            db = client.db(config.mongo.dbName);

            const collection1 = db.collection(
                Model1.getCollectionName()
            );
            const collection2 = db.collection(
                Model2.getCollectionName()
            );
            const collection3 = db.collection(
                Model3.getCollectionName()
            );
            const collection4 = db.collection(
                Model4.getCollectionName()
            );

            await new Promise((resolve) => {
                collection4.insertMany(model4Documents, (error, result) => resolve(result));
            });

            await new Promise((resolve) => {
                collection3.insertMany(model3Documents, (error, result) => resolve(result));
            });

            await new Promise((resolve) => {
                collection2.insertMany(model2Documents, (error, result) => resolve(result));
            });

            await new Promise((resolve) => {
                collection1.insertMany(model1Documents, (error, result) => resolve(result));
            });

            mongoClient = client;
            done();
        });

    });

    beforeEach(() => {
        model = new Model1({ db });
    });

    after(async () => {
        await db.dropDatabase();
        await mongoClient.close();
        // await model.disconnect();
    });

    describe.skip('deprecated tests', () => {
        /*
        it('should do basic filtering', async () => {
            const result = await model.find({
                filters: {
                    number: 11
                }
            });
            expect(result).to.deep.equal(model1Documents.filter((row) => row.number === 11));
        });

        it('should select and deselect fields', async () => {
            const result = await model.find({
                filters: {
                    _id: model1Documents[0]._id
                },
                fields: {
                    enum: 1,
                    string: 1
                }
            });
            expect(result).to.deep.equal(
                model1Documents
                    .filter((row) => row._id.toHexString() === model1Documents[0]._id.toHexString())
                    .map((row) => ({ enum: row.enum, string: row.string }))
            );

            const result2 = await model.find({
                fields: {
                    object: 0,
                    stringArray: 0,
                    objectArray: 0
                }
            });
            expect(result2).to.deep.equal(
                model1Documents
                    .map((row) => {
                        delete row.object;
                        delete row.stringArray;
                        delete row.objectArray;
                        return row;
                    })
            );
        });

        it('should sort limit skip and count', async () => {
            const result = await model.find({
                sort: {
                    number: -1
                },
                limit: 2,
                skip: 1,
                count: true
            });

            const documents = model1Documents.slice();

            documents.sort((a, b) => {
                return b.number - a.number;
            });

            expect(result).to.deep.equal(
                documents.slice(1)
            );

            expect(result.count()).to.equal(model1Documents.length);
        });

        it('should filter ObjectIds by string', async () => {
            const result = await model.find({
                filters: {
                    _id: model1Documents[0]._id.toHexString(),
                    // model2Dbref: model1Documents[0].model2DbRef.toHexString()
                }
            });
            expect(result).to.deep.equal([model1Documents[0]]);
        });

    */
    });

    describe('find', () => {
        it('should find all', async () => {
            const result = await model.find();
            expect(await result).to.deep.equal(model1Documents);
        });

        it('should select object id fields', async () => {
            const result = await model.find({}, {
                join: [{
                    on: 'model2DbRef',
                    projection: {
                        string: 1,
                        model3Ref: 1
                    }
                }]
            });
            const documents = model1Documents.map((row) => {
                return Object.assign({}, row, {
                    model2DbRef: model2Documents.filter((model2Row) => {
                        return model2Row._id.toHexString() === row.model2DbRef.toHexString();
                    }).map((row) => ({ _id: row._id, string: row.string, model3Ref: row.model3Ref })).pop()
                });
            });

            expect(result).to.deep.equal(documents);
        });

        it('should recursively select object id fields', async () => {
            const result = await model.find({}, {
                join: [
                    {
                        on: ['model2DbRef'],
                        projection: {
                            string: 1,
                            model3Ref: 1
                        },
                        join: [{
                            on: 'model3Ref',
                            projection: {
                                enum: 1
                            }
                        }]
                    }
                ]
            });

            const documents = model1Documents.map((row) => {
                return Object.assign({}, row, {
                    model2DbRef: model2Documents.filter((model2Row) => {
                        return model2Row._id.toHexString() === row.model2DbRef.toHexString();
                    }).map((row) => ({
                        _id: row._id,
                        string: row.string,
                        model3Ref: model3Documents.filter((model3Row) => {
                            return model3Row._id.toHexString() === row.model3Ref.toHexString();
                        }).map((row) => ({ _id: row._id, enum: row.enum })).pop()
                    })).pop()
                });
            });

            expect(result).to.deep.equal(documents);

            const result2 = await model.find({}, {
                join: [
                    {
                        on: ['model2DbRef'],
                        projection: {
                            string: 1,
                            model3Ref: 1
                        },
                        join: [{
                            on: 'model3Ref',
                            projection: {
                                enum: 1
                            }
                        }]
                    },
                    {
                        on: 'objectArray.model3DbRef',
                        projection: {
                            enum: 1
                        }
                    }
                ]
            });

            const documents2 = model1Documents.map((row) => {
                return Object.assign({}, row, {
                    model2DbRef: model2Documents.filter((model2Row) => {
                        return model2Row._id.toHexString() === row.model2DbRef.toHexString();
                    }).map((row) => ({
                        _id: row._id,
                        string: row.string,
                        model3Ref: model3Documents.filter((model3Row) => {
                            return model3Row._id.toHexString() === row.model3Ref.toHexString();
                        }).map((row) => ({ _id: row._id, enum: row.enum })).pop()
                    })).pop(),
                    objectArray: row.objectArray.map((item) => {
                        return Object.assign(item, {
                            model3DbRef: model3Documents.filter((model3Row) => {
                                return model3Row._id.toHexString() === item.model3DbRef.toHexString();
                            }).map((row) => ({ _id: row._id, enum: row.enum })).pop()
                        });
                    })
                });
            });

            expect(result2).to.deep.equal(documents2);
        });

        it('should be able to query other collection', async () => {
            const result = await model.getDb().collection(model2Name).find().toArray();
            expect(result).to.deep.equal(model2Documents);
        });

        it('should attach dbRefs to cursor', async () => {
            const result = await model.find({}, {
                join: [
                    {
                        on: 'model2DbRef',
                        projection: {
                            string: 1,
                            model3Ref: 1
                        }
                    }
                ],
                cursor: 1
            });

            return new Promise((resolve, reject) => {
                const promises = [];
                result.forEach(
                    (row) => {
                        promises.push(
                            row.then((item) => {
                                expect(item.model2DbRef).to.deep.equal(
                                    model2Documents.filter((model2Row) => {
                                        return model2Row._id.toHexString() === item.model2DbRef._id.toHexString();
                                    }).map((row) => ({ _id: row._id, string: row.string, model3Ref: row.model3Ref })).pop()
                                );
                            })
                        );
                    },
                    () => resolve(Promise.all(promises))
                );
            });
        });

        it('should filter object id referenced fields', async () => {
            const result = await model.find({}, {
                join: [{
                    on: ['model2DbRef'],
                    projection: {
                        string: 1,
                        model3Ref: 1
                    },
                    filters: {
                        number: 2345
                    }
                }]
            });

            const model2Data = model2Documents.filter((m2row) => {
                return m2row.number === 2345;
            });

            const docs = model1Documents.filter((row) => {
                const m2row = model2Data.find((m2row) => {
                    return m2row._id.toHexString() === row.model2DbRef.toHexString();
                });
                if (m2row) {
                    row.model2DbRef = { _id: m2row._id, string: m2row.string, model3Ref: m2row.model3Ref };
                    return true;
                }
                return false;
            });

            expect(result).to.deep.equal(docs);
        });

        it.only('should filter resursive object id referenced fields when there are multiple matches', async () => {

            const result = await model.find({}, {
                join: [
                    {
                        on: 'model2DbRef',
                        fields: {
                            model3Ref: 1
                        },
                        join: [
                            {
                                on: 'model3Ref'
                            },
                            {
                                on: 'model4Ref',
                                filters: {
                                    m4str: 's1'
                                }
                            }
                        ]
                    }
                ]
            });
console.log( require('util').inspect(result, false, null, true) );
            const model2Data = model2Documents.filter((m2row) => {
                return m2row.number === 2345;
            });

            const docs = model1Documents.filter((row) => {
                const m2row = model2Data.find((m2row) => {
                    return m2row._id.toHexString() === row.model2DbRef.toHexString();
                });
                if (m2row) {
                    row.model2DbRef = { _id: m2row._id, string: m2row.string, model3Ref: m2row.model3Ref };
                    return true;
                }
                return false;
            });

            // expect(result).to.deep.equal(docs);
        });

        it('should filter object id references in array');

        it('should attach object id data when foreign collections fields are not defined');

        it('should not cause object id infinite loops');
        // it('should call getter functions?');
    });

    describe('save & update', () => {

    });

    describe('general functions', () => {
        it('should be able to use call mongodb native functions');
    });

});
