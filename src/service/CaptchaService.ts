import * as Axios from 'axios';

require('../config/enviroment');

export class CaptchaService {

    async validateToken(token: string) {
        const secret = process.env.CAPTCHA_SECRET || '';
        const URL = process.env.CAPTCHA_URL_VERIFICATION + `?secret=${secret}&response=${token}` || '';
        const responseCaptchaValidation = await Axios.default.post(URL);
        return responseCaptchaValidation.data.success == true && responseCaptchaValidation.data.score >= 0.5;
    }
}