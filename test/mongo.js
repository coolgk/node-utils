'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const config = require('../test.config.js');

describe.only('Mongo Module', function () {
    // this.timeout(4000);

    const { Mongo } = require(`../${config.sourceFolder}/mongo`);
    const { MongoClient, ObjectID, Cursor } = require('mongodb');

    let model;
    let db;
    let mongoClient;
    let model1Documents;
    let model2Documents;
    let model3Documents;
    const model1Name = 'model1';
    const model2Name = 'model2';
    const model3Name = 'model3';

    before((done) => {

        class Model1 extends Mongo {
            static getFields () {
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
                    dbRef: {
                        type: 'dbRef',
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
                            dbRef: {
                                type: 'dbRef',
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

        class Model2 extends Mongo {
            static getFields () {
                return {
                    ref: {
                        type: 'dbRef',
                        model: Model3
                    },
                    string: {
                        type: 'string'
                    },
                    number: {
                        type: 'number'
                    }
                };
            }
            static getCollectionName () {
                return model2Name;
            }
        }

        class Model3 extends Mongo {
            static getFields () {
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

        model = new Model1({
            url: ''
        });

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
            await new Promise((resolve) => {
                collection3.insertMany(model3Documents, (error, result) => resolve(result));
            });

            model2Documents = [
                {
                    _id: new ObjectID(),
                    string: 'm2111111',
                    number: 1234,
                    ref: model3Documents[1]._id
                },
                {
                    _id: new ObjectID(),
                    string: 'm2222222',
                    number: 2345,
                    ref: model3Documents[2]._id
                },
                {
                    _id: new ObjectID(),
                    string: 'm2333333',
                    number: 3456,
                    ref: model3Documents[0]._id
                }
            ];
            await new Promise((resolve) => {
                collection2.insertMany(model2Documents, (error, result) => resolve(result));
            });

            model1Documents = [
                {
                    _id: new ObjectID(),
                    string: 'string value',
                    number: 11,
                    boolean: true,
                    date: new Date('2018-02-03'),
                    dbRef: model2Documents[1]._id,
                    enum: 'abc',
                    object: {
                        string: 'abc',
                        number: 1111
                    },
                    stringArray: ['aaa', 'bbb', 'ccc'],
                    objectArray: [
                        {
                            date: new Date('2018-02-02'),
                            dbRef: model3Documents[2]._id
                        },
                        {
                            date: new Date('2018-02-01'),
                            dbRef: model3Documents[1]._id
                        }
                    ]
                },
                {
                    _id: new ObjectID(),
                    string: 'string1111',
                    number: 12,
                    boolean: false,
                    date: new Date('2018-02-01'),
                    dbRef: model2Documents[0]._id,
                    enum: 'd22222',
                    object: {
                        string: 't2222',
                        number: 2222
                    },
                    stringArray: ['eee', 'ddd'],
                    objectArray: [
                        {
                            date: new Date('2018-01-02'),
                            dbRef: model3Documents[0]._id
                        },
                        {
                            date: new Date('2018-01-31'),
                            dbRef: model3Documents[2]._id
                        }
                    ]
                },
                {
                    _id: new ObjectID(),
                    string: 'string3333',
                    number: 13,
                    boolean: false,
                    date: new Date('2018-01-21'),
                    dbRef: model2Documents[2]._id,
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
                    dbRef: model2Documents[1]._id,
                    enum: 'd443',
                    object: {
                        string: 't444',
                        number: 4444
                    },
                    stringArray: [],
                    objectArray: [
                        {
                            date: new Date('2018-01-19'),
                            dbRef: model3Documents[0]._id
                        }
                    ]
                }
            ];
            await new Promise((resolve) => {
                collection1.insertMany(model1Documents, (error, result) => resolve(result));
            });

            mongoClient = client;
            done();
        });

    });

    after(async () => {
        // await db.dropDatabase();
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

        it('should return data as cursor and show total count', async () => {
            const result = await model.find({
                limit: 2,
                cursor: true,
                count: true
            });

            expect(result).is.a(Cursor);
            expect(result.count()).to.equal(model1Documents.length);

            return new Promise((resolve) => {
                result.forEach(
                    async (row) => {
                        const item = await row;
                        for (const property in model1Documents[0]) {
                            expect(item).to.have.property(property);
                        }
                    },
                    () => resolve()
                );
            });
        });

        it('should filter ObjectIds by string', async () => {
            const result = await model.find({
                filters: {
                    _id: model1Documents[0]._id.toHexString(),
                    dbref: model1Documents[0].dbRef.toHexString()
                }
            });
            expect(result).to.deep.equal([model1Documents[0]]);
        });

    */
    });

    describe('find', () => {
        it('should find all', async () => {
            const result = await model.find();
            expect(result).to.deep.equal(model1Documents);
        });

        it('should select dbref fields', async () => {
            const result = await model.find({
                dbRefs: {
                    model2: {
                        fields: {
                            string: 1,
                            ref: 1
                        }
                    }
                }
            });

            const documents = model1Documents.slice();

            for (const row of documents) {
                row.dbRef = model2Documents.filter((row) => {
                    return row._id.toHexString() === row.dbRef.toHexString();
                }).pop();
            }

            expect(result).to.deep.equal(documents);
        });

        it('should recursively select dbref fields', async () => {
            const result = await model.find({
                dbRefs: {
                    model2: {
                        fields: {
                            string: 1,
                            ref: 1
                        }
                    },
                    model3: {
                        fields: {
                            enum: 1
                        }
                    }
                }
            });

            const documents = model1Documents.slice();

            for (const row of documents) {
                row.dbRef = model2Documents.filter((row) => {
                    return row._id.toHexString() === row.dbRef.toHexString();
                }).pop();
                for (const item of row.objectArray) {
                    item.dbRef = model3Documents.filter((row) => {
                        return row._id.toHexString() === item.dbRef.toHexString();
                    }).pop();
                }
            }

            expect(result).to.deep.equal(documents);
        });

        it('should filter dbref fields', async () => {
            const result = await model.find({
                dbRefs: {
                    model2: {
                        fields: {
                            string: 1,
                            ref: 1
                        },
                        filters: {
                            string: 'm2222222'
                        }
                    }
                }
            });

            const model2Row = model2Documents.filter((row) => {
                return row.string === 'm2222222';
            }).pop();

            expect(result).to.deep.equal(
                model1Documents.filter((row) => {
                    return row.dbRef.toHexString() === model2Row._id.toHexString();
                }).map((row) => {
                    row.dbRef = model2Row;
                    return row;
                })
            );
        });

        it('should be able to query other collection', async () => {
            const result = await model.getConnection().collection(model2Name).find();
            expect(result).to.deep.equal(model2Documents);
        });

        it('should not cause dbRef infinite loops');
        // it('should call getter functions?');
    });

    describe('save & update', () => {

    });

    describe('general functions', () => {
        it('should be able to use call mongodb native functions');
    });

});
