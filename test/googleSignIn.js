'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

describe('GoogleSignIn Module', () => {

    const { GoogleSignIn } = require(`../${config.sourceFolder}/googleSignIn`);

    let googleSignIn;
    let oAuth2Client;
    let ticket;
    let clientId;
    let token;

    beforeEach(() => {
        ticket = {
            getPayload: sinon.stub()
        };
        oAuth2Client = {
            verifyIdToken: sinon.stub() // .returns(Promise.resolve(ticket))
        };
        clientId = config.google.clientId || `clientId${Math.random()}`;
        token = `token${Math.random()}`;

        googleSignIn = new GoogleSignIn({
            clientId,
            oAuth2Client
        });
    });

    it('should return false is token is not valid (use real request)', async () => {
        googleSignIn = new GoogleSignIn({
            clientId
        });
        const account = await googleSignIn.verify('invalidToken');
        expect(account).to.be.false;
    });

    it('should return false is token is not valid', async () => {
        oAuth2Client.verifyIdToken.returns(Promise.resolve(false));
        const account = await googleSignIn.verify(token);
        expect(account).to.be.false;
        expect(oAuth2Client.verifyIdToken.calledOnce).to.be.true;
        expect(ticket.getPayload.notCalled).to.be.true;
    });

    it('should return false is payload is empty', async () => {
        oAuth2Client.verifyIdToken.returns(Promise.resolve(ticket));
        ticket.getPayload.returns(false);
        const account = await googleSignIn.verify(token);
        expect(account).to.be.false;
        expect(oAuth2Client.verifyIdToken.calledOnce).to.be.true;
        expect(ticket.getPayload.calledOnce).to.be.true;
    });

    it('should return false is token rejects', async () => {
        oAuth2Client.verifyIdToken.returns(Promise.reject());
        const account = await googleSignIn.verify(token);
        expect(account).to.be.false;
        expect(oAuth2Client.verifyIdToken.calledOnce).to.be.true;
        expect(ticket.getPayload.notCalled).to.be.true;
    });

    it('should return accoutn data', async () => {
        oAuth2Client.verifyIdToken.returns(Promise.resolve(ticket));

        const accountData = {
            email_verified: true,
            email: 'asdf@afsd.com'
        };
        ticket.getPayload.returns(accountData);

        const account = await googleSignIn.verify(token);

        expect(account).to.deep.equal(accountData);

        expect(oAuth2Client.verifyIdToken.calledOnce).to.be.true;
        expect(ticket.getPayload.calledOnce).to.be.true;
    });

});
