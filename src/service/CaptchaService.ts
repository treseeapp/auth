import * as Axios from 'axios';

require('../config/enviroment');

export class CaptchaService {

    async validateToken(token: string) {
        const tokensito = token;
        const secret = process.env.CAPTCHA_SECRET || '';
        const URL = process.env.CAPTCHA_URL_VERIFICATION + `?secret=${secret}&response=${tokensito}` || '';
        const responseCaptchaValidation = await Axios.default.post(URL);
        console.log(responseCaptchaValidation.data);
        return responseCaptchaValidation.data.success == true;
    }
}