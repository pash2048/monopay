"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Saman = void 0;
const axios_1 = require("axios");
const soap = require("soap");
const driver_1 = require("../../driver");
const exceptions_1 = require("../../exceptions");
const API = require("./api");
class Saman extends driver_1.Driver {
    constructor(config) {
        super(config, API.tConfig);
        this.links = API.links;
        this.requestPayment = async (options) => {
            options = this.getParsedData(options, API.tRequestOptions);
            const { amount, callbackUrl, mobile, wage } = options;
            const { merchantId } = this.config;
            const response = await axios_1.default.post(this.getLinks().REQUEST, {
                Amount: amount,
                RedirectURL: callbackUrl,
                CellNumber: mobile,
                TerminalId: merchantId,
                Action: 'token',
                Wage: wage,
            });
            if (response.data.status !== 1 && response.data.errorCode !== undefined) {
                throw new exceptions_1.RequestException(API.purchaseErrors[response.data.errorCode.toString()]);
            }
            if (!response.data.token) {
                throw new exceptions_1.RequestException();
            }
            return this.makeRequestInfo(response.data.token, 'POST', this.getLinks().PAYMENT, {
                Token: response.data.token,
                GetMethod: true,
            });
        };
        this.verifyPayment = async (_options, params) => {
            const { RefNum: referenceId, TraceNo: transactionId, Status: status } = params;
            const { merchantId } = this.config;
            if (!referenceId) {
                throw new exceptions_1.PaymentException(API.purchaseErrors[status.toString()]);
            }
            const soapClient = await soap.createClientAsync(this.getLinks().VERIFICATION);
            const responseStatus = +(await soapClient.verifyTransaction(referenceId, merchantId));
            if (responseStatus < 0) {
                throw new exceptions_1.VerificationException(API.purchaseErrors[responseStatus]);
            }
            return {
                transactionId: +transactionId,
                cardPan: params.SecurePan,
                raw: params,
            };
        };
    }
}
exports.Saman = Saman;
//# sourceMappingURL=index.js.map