'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

describe.skip('FacebookSignIn Module', () => {

    const { FacebookSignIn } = require(`../${config.sourceFolder}/facebook-sign-in`);

    let facebookSignIn;
    let getRequest;
    let clientId;
    let secret;
    let token;
    let userId;

    beforeEach(() => {
        getRequest = sinon.stub();
        clientId = config.facebook.clientId || `clientId${Math.random()}`;
        secret = config.facebook.secret || `secret${Math.random()}`;
        token = `token${Math.random()}`;
        userId = `userId${Math.random()}`;

        facebookSignIn = new FacebookSignIn({
            clientId,
            secret,
            get: getRequest
        });
    });

    it('should return false is token is not valid (use real request)', async () => {
        facebookSignIn = new FacebookSignIn({
            clientId,
            secret
        });
        const account = await facebookSignIn.verify('invalidToken');
        expect(account).to.be.false;
    });

    it('should return false is token is not valid', async () => {
        getRequest.returns(JSON.stringify({
            data: {
                is_valid: false,
                app_id: clientId
            }
        }));
        const account = await facebookSignIn.verify(token);
        expect(account).to.be.false;
        expect(getRequest.calledOnceWith(
            `${FacebookSignIn._RECAPTCHA_URL}/debug_token?input_token=${token}&access_token=${clientId}|${secret}`
        )).to.be.true;
    });

    it('should return false is app id does not match', async () => {
        getRequest.returns(JSON.stringify({
            data: {
                is_valid: true,
                app_id: 'abc' + clientId,
                user_id: userId
            }
        }));
        const account = await facebookSignIn.verify(token);
        expect(account).to.be.false;
        expect(getRequest.calledOnceWith(
            `${FacebookSignIn._RECAPTCHA_URL}/debug_token?input_token=${token}&access_token=${clientId}|${secret}`
        )).to.be.true;
    });

    it('should return accoutn data', async () => {
        getRequest.onFirstCall().returns(JSON.stringify({
            data: {
                is_valid: true,
                user_id: userId,
                app_id: clientId
            }
        }));

        const accountData = {
            id: userId,
            email: 'asdf@afsd.com'
        };

        getRequest.onSecondCall().returns(JSON.stringify(accountData));

        const account = await facebookSignIn.verify(token);

        expect(account).to.deep.equal(accountData);

        expect(getRequest.calledWith(
            `${FacebookSignIn._RECAPTCHA_URL}/debug_token?input_token=${token}&access_token=${clientId}|${secret}`
        )).to.be.true;

        expect(getRequest.calledWith(
            `${FacebookSignIn._RECAPTCHA_URL}/${userId}?access_token=${token}&fields=email`
        )).to.be.true;

        expect(getRequest.calledTwice).to.be.true;
    });

    it('should return accoutn data with custom fields', async () => {
        getRequest.onFirstCall().returns(JSON.stringify({
            data: {
                is_valid: true,
                user_id: userId,
                app_id: clientId
            }
        }));

        const accountData = {
            id: userId,
            email: 'asdf@afsd.com'
        };

        getRequest.onSecondCall().returns(JSON.stringify(accountData));

        const fields = 'email,id,name';
        const account = await facebookSignIn.verify(token, fields);

        expect(account).to.deep.equal(accountData);

        expect(getRequest.calledWith(
            `${FacebookSignIn._RECAPTCHA_URL}/debug_token?input_token=${token}&access_token=${clientId}|${secret}`
        )).to.be.true;

        expect(getRequest.calledWith(
            `${FacebookSignIn._RECAPTCHA_URL}/${userId}?access_token=${token}&fields=${fields}`
        )).to.be.true;

        expect(getRequest.calledTwice).to.be.true;
    });

});
